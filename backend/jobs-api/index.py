"""HR-матчинг вакансий SkillOrbit: подбор по навыкам студента с процентом совпадения"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    # GET /?student_id=X  — вакансии с матчингом по навыкам студента
    # GET /               — все вакансии без матчинга
    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()

        student_skills = []
        student_id = params.get('student_id')

        if student_id:
            # Собираем навыки из профиля + всех активных/завершённых курсов
            cur.execute("""
                SELECT COALESCE(s.skills, '{}') ||
                       COALESCE(array_agg(DISTINCT unnested) FILTER (WHERE unnested IS NOT NULL), '{}')
                FROM students s
                LEFT JOIN enrollments e ON e.student_id = s.id
                LEFT JOIN courses c ON c.id = e.course_id
                LEFT JOIN LATERAL unnest(c.skills) AS unnested ON true
                WHERE s.id = %s
                GROUP BY s.skills
            """, (student_id,))
            row = cur.fetchone()
            if row and row[0]:
                student_skills = list(set(row[0]))

        level_filter = params.get('level')
        format_filter = params.get('format')

        sql = """
            SELECT id, company_name, company_type, title, description,
                   required_skills, salary_from, salary_to, format, level, city, created_at
            FROM vacancies
            WHERE status = 'active'
        """
        args = []
        if level_filter and level_filter != 'all':
            sql += ' AND level = %s'
            args.append(level_filter)
        if format_filter and format_filter != 'all':
            sql += ' AND format = %s'
            args.append(format_filter)
        sql += ' ORDER BY created_at DESC'

        cur.execute(sql, args)
        cols = ['id','company_name','company_type','title','description','required_skills','salary_from','salary_to','format','level','city','created_at']
        vacancies = []

        for row in cur.fetchall():
            v = dict(zip(cols, row))
            v['created_at'] = str(v['created_at'])
            req = v.get('required_skills') or []

            if student_skills and req:
                matched = [s for s in req if s in student_skills]
                v['match_score'] = round(len(matched) / len(req) * 100)
                v['matched_skills'] = matched
                v['missing_skills'] = [s for s in req if s not in student_skills]
            else:
                v['match_score'] = 0
                v['matched_skills'] = []
                v['missing_skills'] = req

            vacancies.append(v)

        # Сортируем: сначала высокий матчинг
        if student_skills:
            vacancies.sort(key=lambda x: x['match_score'], reverse=True)

        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({
                'vacancies': vacancies,
                'student_skills': student_skills,
                'total': len(vacancies)
            })
        }

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
