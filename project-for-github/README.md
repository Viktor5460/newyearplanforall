# Новогодние Планы

Интерактивное расписание новогодних событий в виде писем в почтовом ящике.

## Установка

```bash
pip install -r requirements.txt
```

## Запуск локально

```bash
python app.py
```

Сайт будет доступен по адресу: http://localhost:5000

## Деплой на Render

1. Создайте репозиторий на GitHub и загрузите код
2. Зайдите на [Render.com](https://render.com) и создайте аккаунт
3. Нажмите "New +" → "Web Service"
4. Подключите ваш GitHub репозиторий
5. Настройки:
   - **Name**: новогодние-планы (или любое другое)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Нажмите "Create Web Service"

Через несколько минут ваш сайт будет доступен по адресу типа: `https://новогодние-планы.onrender.com`

## Структура проекта

- `app.py` - основное Flask приложение
- `schedule_data.py` - данные о событиях
- `templates/` - HTML шаблоны
- `static/` - CSS и JavaScript файлы

