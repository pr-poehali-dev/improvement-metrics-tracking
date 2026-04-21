"""API для каталога курсов SkillOrbit: получение списка, запись студента, заявка от провайдера"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}

    # GET /  - список курсов
    if method == 'GET' and not path.endswith('/apply') and not path.endswith('/enroll'):
        conn = get_conn()
        cur = conn.cursor()
        category = params.get('category')
        level = params.get('level')
        sql = "SELECT id, title, provider_name, provider_type, description, opportunities, skills, duration_weeks, category, level, status, created_at FROM courses WHERE status = 'active'"
        args = []
        if category and category != 'all':
            sql += ' AND category = %s'
            args.append(category)
        if level and level != 'all':
            sql += ' AND level = %s'
            args.append(level)
        sql += ' ORDER BY created_at DESC'
        cur.execute(sql, args)
        rows = cur.fetchall()
        cols = ['id','title','provider_name','provider_type','description','opportunities','skills','duration_weeks','category','level','status','created_at']
        courses = []
        for row in rows:
            c = dict(zip(cols, row))
            c['created_at'] = str(c['created_at'])
            courses.append(c)
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'courses': courses})}

    # POST /apply - заявка от провайдера
    if method == 'POST' and path.endswith('/apply'):
        body = json.loads(event.get('body') or '{}')
        required = ['provider_name', 'provider_type', 'contact_email', 'contact_name', 'course_title', 'description', 'opportunities']
        for f in required:
            if not body.get(f):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': f'Поле {f} обязательно'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO course_applications (provider_name, provider_type, contact_email, contact_name, course_title, description, opportunities, skills) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (body['provider_name'], body['provider_type'], body['contact_email'], body['contact_name'],
             body['course_title'], body['description'], body['opportunities'], body.get('skills', ''))
        )
        app_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'id': app_id, 'message': 'Заявка принята! Свяжемся в течение 2 рабочих дней.'})}

    # POST /enroll - запись студента на курс
    if method == 'POST' and path.endswith('/enroll'):
        body = json.loads(event.get('body') or '{}')
        course_id = body.get('course_id')
        student_id = body.get('student_id')
        if not course_id or not student_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'course_id и student_id обязательны'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s", (student_id, course_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Уже записан на этот курс'})}
        cur.execute("INSERT INTO enrollments (student_id, course_id) VALUES (%s, %s) RETURNING id", (student_id, course_id))
        eid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'enrollment_id': eid, 'message': 'Успешно записан на курс!'})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
