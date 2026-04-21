
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(50) NOT NULL DEFAULT 'employer',
  description TEXT NOT NULL,
  opportunities TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  duration_weeks INTEGER DEFAULT 8,
  category VARCHAR(100) NOT NULL DEFAULT 'development',
  level VARCHAR(50) DEFAULT 'beginner',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_applications (
  id SERIAL PRIMARY KEY,
  provider_name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(50) NOT NULL DEFAULT 'employer',
  contact_email VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  opportunities TEXT NOT NULL,
  skills TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url VARCHAR(500) DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  course_id INTEGER REFERENCES courses(id),
  status VARCHAR(50) DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

INSERT INTO courses (title, provider_name, provider_type, description, opportunities, skills, duration_weeks, category, level) VALUES
('Frontend на React с реальными задачами', 'Яндекс', 'employer', 'Изучишь React, TypeScript и современный фронтенд на задачах от команды Яндекса. Менторы — практикующие инженеры.', 'Стажировка в Яндексе, приоритетный отбор на позицию Junior Frontend, портфолио из 3 реальных фичей.', ARRAY['React','TypeScript','CSS','Git'], 12, 'development', 'beginner'),
('Python Backend & API', 'Сбер', 'employer', 'Курс по разработке серверной части: FastAPI, PostgreSQL, Docker. Задачи из реальных сервисов Сбера.', 'Оффер на стажировку, рекомендательное письмо, участие во внутреннем хакатоне.', ARRAY['Python','FastAPI','PostgreSQL','Docker'], 10, 'development', 'intermediate'),
('UX/UI дизайн интерфейсов', 'Школа дизайна НИУ ВШЭ', 'university', 'Курс по проектированию цифровых продуктов: исследования, прототипирование, дизайн-системы в Figma.', 'Зачётные единицы ВШЭ, портфолио, участие в Design Week.', ARRAY['Figma','UX Research','Прототипирование','Design Systems'], 8, 'design', 'beginner'),
('Data Science: анализ и ML', 'МГУ им. Ломоносова', 'university', 'Фундаментальный курс по анализу данных, машинному обучению и визуализации на Python.', 'Академические кредиты, доступ к научным вычислительным ресурсам МГУ, диплом о повышении квалификации.', ARRAY['Python','Pandas','scikit-learn','Matplotlib'], 14, 'data', 'intermediate'),
('Продуктовый менеджмент', 'VK', 'employer', 'Практический курс по управлению продуктом: от идеи до релиза. Работаешь с реальными метриками VK.', 'Трёхмесячная оплачиваемая стажировка в VK, доступ к внутренней аналитике продуктов.', ARRAY['Roadmap','A/B тесты','Метрики','Figma'], 8, 'management', 'beginner');

INSERT INTO students (name, email, skills) VALUES
('Алексей Петров', 'alex@example.com', ARRAY['React','JavaScript','CSS']);
