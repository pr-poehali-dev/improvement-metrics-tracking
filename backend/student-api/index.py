"""API личного кабинета студента SkillOrbit: профиль, курсы, прогресс"""
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

    # POST / - создать/найти студента по email
    if method == 'POST' and (path == '/' or path == ''):
        body = json.loads(event.get('body') or '{}')
        email = body.get('email', '').strip().lower()
        name = body.get('name', '').strip()
        if not email:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'email обязателен'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, skills, created_at FROM students WHERE email = %s", (email,))
        row = cur.fetchone()
        if row:
            student = {'id': row[0], 'name': row[1], 'email': row[2], 'skills': row[3] or [], 'created_at': str(row[4])}
        else:
            if not name:
                cur.close()
                conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Студент не найден'})}
            cur.execute("INSERT INTO students (name, email) VALUES (%s, %s) RETURNING id, name, email, skills, created_at", (name, email))
            row = cur.fetchone()
            conn.commit()
            student = {'id': row[0], 'name': row[1], 'email': row[2], 'skills': row[3] or [], 'created_at': str(row[4])}
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'student': student})}

    # GET /?student_id=X - профиль + курсы студента
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        student_id = params.get('student_id')
        if not student_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'student_id обязателен'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, skills, created_at FROM students WHERE id = %s", (student_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Студент не найден'})}
        student = {'id': row[0], 'name': row[1], 'email': row[2], 'skills': row[3] or [], 'created_at': str(row[4])}
        cur.execute("""
            SELECT e.id, e.status, e.progress, e.enrolled_at,
                   c.id as course_id, c.title, c.provider_name, c.provider_type, c.category, c.level, c.duration_weeks, c.skills
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            WHERE e.student_id = %s
            ORDER BY e.enrolled_at DESC
        """, (student_id,))
        enrollments = []
        for r in cur.fetchall():
            enrollments.append({
                'enrollment_id': r[0], 'status': r[1], 'progress': r[2], 'enrolled_at': str(r[3]),
                'course_id': r[4], 'title': r[5], 'provider_name': r[6], 'provider_type': r[7],
                'category': r[8], 'level': r[9], 'duration_weeks': r[10], 'skills': r[11] or []
            })
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'student': student, 'enrollments': enrollments})}

    # PUT /progress - обновить прогресс
    if method == 'PUT' and path.endswith('/progress'):
        body = json.loads(event.get('body') or '{}')
        enrollment_id = body.get('enrollment_id')
        progress = body.get('progress', 0)
        if not enrollment_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'enrollment_id обязателен'})}
        status = 'completed' if progress >= 100 else 'active'
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE enrollments SET progress = %s, status = %s WHERE id = %s", (progress, status, enrollment_id))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'message': 'Прогресс обновлён'})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
