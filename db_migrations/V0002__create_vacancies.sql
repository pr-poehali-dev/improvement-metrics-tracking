
CREATE TABLE vacancies (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  company_type VARCHAR(50) DEFAULT 'employer',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  salary_from INTEGER DEFAULT 0,
  salary_to INTEGER DEFAULT 0,
  format VARCHAR(50) DEFAULT 'hybrid',
  level VARCHAR(50) DEFAULT 'junior',
  city VARCHAR(100) DEFAULT 'Москва',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO vacancies (company_name, title, description, required_skills, salary_from, salary_to, format, level, city) VALUES
('Яндекс', 'Junior Frontend Developer', 'Разработка интерфейсов в команде Яндекс.Поиска. Работа с высоконагруженными React-компонентами, A/B тестирование.', ARRAY['React','TypeScript','CSS','Git'], 80000, 130000, 'hybrid', 'junior', 'Москва'),
('Сбер', 'Python Backend Developer', 'Разработка API для финтех-сервисов. PostgreSQL, микросервисная архитектура, Docker.', ARRAY['Python','FastAPI','PostgreSQL','Docker'], 100000, 160000, 'remote', 'middle', 'Москва'),
('VK', 'Product Manager', 'Управление продуктовым направлением. Работа с метриками, roadmap, координация команды дизайна и разработки.', ARRAY['Roadmap','A/B тесты','Метрики','Figma'], 130000, 200000, 'hybrid', 'middle', 'Москва'),
('Avito', 'Junior Data Analyst', 'Анализ поведения пользователей, дашборды, SQL-запросы, работа с Pandas и визуализация данных.', ARRAY['SQL','Pandas','Matplotlib','Python'], 70000, 110000, 'office', 'junior', 'Москва'),
('Тинькофф', 'UI/UX Designer', 'Проектирование интерфейсов мобильного приложения. Работа в дизайн-системе, UX-исследования.', ARRAY['Figma','UX Research','Прототипирование','Design Systems'], 90000, 150000, 'hybrid', 'middle', 'Москва'),
('МТС', 'Frontend Developer', 'Разработка корпоративного портала на React. TypeScript, storybook, unit-тесты.', ARRAY['React','TypeScript','JavaScript','Git'], 110000, 170000, 'remote', 'middle', 'Москва'),
('Ozon', 'Data Scientist', 'Разработка ML-моделей для рекомендательной системы. scikit-learn, feature engineering, A/B.', ARRAY['Python','scikit-learn','Pandas','SQL'], 150000, 220000, 'hybrid', 'middle', 'Москва'),
('Lamoda', 'Junior Python Developer', 'Разработка внутренних сервисов на FastAPI. Интеграции с внешними API, PostgreSQL.', ARRAY['Python','FastAPI','PostgreSQL','Git'], 75000, 120000, 'office', 'junior', 'Москва');
