# Структура данных для новогоднего расписания
# Каждый вариант имеет свое время начала и окончания с учетом дат
# События до 00:00 - 31 декабря, после 00:00 - 1 января

from datetime import datetime, timedelta

def parse_datetime(date_str, time_str):
    """Парсит дату и время и возвращает datetime объект"""
    # date_str в формате "31.12" или "01.01"
    # time_str в формате "HH:MM"
    day, month = date_str.split('.')
    hour, minute = time_str.split(':')
    
    # Определяем год - для декабря 2024, для января 2025
    if month == "12":
        year = 2024  # 31 декабря 2024
    else:
        year = 2025  # 1 января 2025
    
    return datetime(year, int(month), int(day), int(hour), int(minute))

def format_datetime(dt):
    """Форматирует datetime в строку даты и времени"""
    return dt.strftime("%d.%m %H:%M")

def parse_time(time_str):
    """Парсит время в формате 'HH:MM' и возвращает минуты с начала дня"""
    parts = time_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])

def format_time(minutes):
    """Форматирует минуты в формат 'HH:MM'"""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

def add_duration_to_datetime(start_dt, duration_str):
    """Добавляет продолжительность к datetime"""
    # Парсим продолжительность
    duration_minutes = 0
    if 'час' in duration_str.lower():
        if '+' in duration_str:
            duration_minutes = 60
        else:
            import re
            hours_match = re.search(r'(\d+(?:\.\d+)?)', duration_str)
            if hours_match:
                hours = float(hours_match.group(1))
                duration_minutes = int(hours * 60)
    elif 'минут' in duration_str.lower():
        import re
        mins_match = re.search(r'(\d+)', duration_str)
        if mins_match:
            duration_minutes = int(mins_match.group(1))
    
    return start_dt + timedelta(minutes=duration_minutes)

schedule = {
    "cover": {
        "title": "Новогодняя Программа",
        "year": "2025"
    },
    "variants": [
        # Специальные письма (не отображаются в обычном списке)
        {
            "id": "special_waiting",
            "date": "31.12",
            "start_time": "15:00",
            "duration": "30 минут",
            "end_time": "15:30",
            "title": "",
            "description": "Пока что еще писем нет, загляните 31 декабря",
            "location": "",
            "tv": "-",
            "image": "📮",
            "special": True,
            "type": "mailbox"
        },
        {
            "id": "special_gift",
            "date": "01.01",
            "start_time": "03:30",
            "duration": "30 минут",
            "end_time": "04:00",
            "title": "",
            "description": "Беги открывай свой!!!",
            "location": "",
            "tv": "-",
            "image": "🎁",
            "special": True,
            "type": "gift"
        },
        # 31 декабря
        {
            "id": "1a",
            "date": "31.12",
            "start_time": "15:30",
            "duration": "5 часов",
            "end_time": "20:30",
            "title": "Дачная Суета!",
            "description": "Приготовление к празднику и другие дела и развлечения, для тех кто живет или оказался на даче и не обращает внимание на какой-то там сбор в 20:30! https://newyearplan.onrender.com/ - ссылка с расписанием этой части.",
            "location": "",
            "tv": "-",
            "image": "🏡"
        },
        {
            "id": "2b",
            "date": "31.12",
            "start_time": "19:30",
            "duration": "1.5 часа",
            "end_time": "21:00",
            "title": "Карнавальная Ночь!",
            "description": "И вот настало время создать в своей душе настоящее настроение праздника! Смотрим, веселимся и радуемся!",
            "location": "",
            "tv": "-",
            "image": "🎬"
        },
        {
            "id": "8a",
            "date": "31.12",
            "start_time": "20:30",
            "duration": "15 минут",
            "end_time": "20:45",
            "title": "Начало Вечера!",
            "description": "И вот гости начинают собираться, все нарядные, кружат возле елки, едят ягоды, выпивают шампанское, а Вы без ума от новогоднего волшебства!",
            "location": "",
            "tv": "-",
            "image": "🎄"
        },
        {
            "id": "9a",
            "date": "31.12",
            "start_time": "20:45",
            "duration": "15 минут",
            "end_time": "21:00",
            "title": "Первое Застолье!",
            "description": "И вот вы напрыгались от новогоднего волшебства и пора бы присесть, прежде чем успеть упасть от головокружения! Закусите ка холодными закусками, пирогами, салатами и другими вкусностями! Не забывайте запивать!",
            "location": "",
            "tv": "-",
            "image": "🍽️"
        },
        {
            "id": "10a",
            "date": "31.12",
            "start_time": "21:00",
            "duration": "30 минут",
            "end_time": "21:30",
            "title": "Родина Зовет!",
            "description": "И вот пора пришла вспомнить, о значимом месте для нас всех! Пора встретить Новый Год по Омски!",
            "location": "",
            "tv": "-",
            "image": "🌍"
        },
        {
            "id": "11a",
            "date": "31.12",
            "start_time": "21:30",
            "duration": "45 минут",
            "end_time": "22:15",
            "title": "Дедушка!",
            "description": "А ну ка закричим да как позовем Дедушку Мороза! Но не забудте рассказать ему, почему Вы заслуживаете награды за этот год! И Выучите Наконец Елочку!!!",
            "location": "",
            "tv": "-",
            "image": "🎅"
        },
        {
            "id": "11b",
            "date": "31.12",
            "start_time": "22:15",
            "duration": "1.58 часа",
            "end_time": "23:50",
            "title": "Фильм на выбор!",
            "description": "Успейте выбрать фильм до ИВ, хотя это нетрудно, главное перехватить пульт!!!",
            "location": "",
            "tv": "-",
            "image": "🎬"
        },
        {
            "id": "12a",
            "date": "31.12",
            "start_time": "22:15",
            "duration": "1 час",
            "end_time": "23:15",
            "title": "Мастерим Сами!",
            "description": "Всегда приятно глядеть на елку и вспоминать близких! Ну так пора взять и сделать свою игрушку, чтобы глядя на нее близкие вспоминали о Вас! Необязательно красиво, но главное видно, чтобы Вас чаще вспоминали, чем кого-то там еще! Главное часто не икайте после этого!",
            "location": "",
            "tv": "-",
            "image": "🎨"
        },
        {
            "id": "13a",
            "date": "31.12",
            "start_time": "23:15",
            "duration": "40 минут",
            "end_time": "23:55",
            "title": "И снова еда..!",
            "description": "Садимся есть горячее, пока Новый Год не остудил его! У Вас как раз есть время доесть вон ту штучку...",
            "location": "",
            "tv": "-",
            "image": "🍲"
        },
        {
            "id": "14a",
            "date": "31.12",
            "start_time": "23:55",
            "duration": "25 минут",
            "end_time": "00:20",
            "end_date": "01.01",
            "title": "Куранты! 2026!",
            "description": "Пора вставать, чтобы послушать резюмирующую речь президента и встретить Новый 2026 Год!",
            "location": "",
            "tv": "-",
            "image": "🔔"
        },
        {
            "id": "4b",
            "date": "01.01",
            "start_time": "00:10",
            "duration": "1.5 часа",
            "end_time": "01:40",
            "title": "Больше Каналов!",
            "description": "Мотаем все каналы, в надежде найти интересные и хорошие выступления!",
            "location": "",
            "tv": "-",
            "image": "📺"
        },
        {
            "id": "15a",
            "date": "01.01",
            "start_time": "00:20",
            "duration": "20 минут",
            "end_time": "00:40",
            "title": "Ждем веселья!",
            "description": "Вы не смотрели Промо Ролик? Обращайтесь к команде Витя-Митя, они плохо справились с задачей его распространения! Но они его покажут только при условии, что Вы готовы к отрыву!",
            "location": "",
            "tv": "-",
            "image": "🎬"
        },
        {
            "id": "16a",
            "date": "01.01",
            "start_time": "00:40",
            "duration": "1 час",
            "end_time": "01:40",
            "title": "Готовы, Тогда Поехали!",
            "description": "Начинаем Алко-Квиз по командам. Если вы не успели присоединится или создать свою команду заранее, то просто присоединяйтесь к чужой, и веселитесь с Вашей Новой Командой! Я не вижу в Ваших Глазах стремления побеждать!!!! А ну ка НАСТРОЙ, а ну ка ТАКТИКА! Нам нужна ПОБЕДА!",
            "location": "",
            "tv": "-",
            "image": "🎯"
        },
        {
            "id": "17a",
            "date": "01.01",
            "start_time": "01:40",
            "duration": "1.33 часа",
            "end_time": "03:00",
            "title": "Свободное Плавание!",
            "description": "И что, Вы думали на этом все? Нет, тут еще столько всего неопробованного, наконец ведущий квеста перестал Вас мучать, теперь Вы будете мучать бармена и веселить друзей в таких играх как бильярд, пин-понг, вышибалы, колечки, а также Караоке и Кино-Квиз!",
            "location": "",
            "tv": "-",
            "image": "🎮"
        },
        {
            "id": "18a",
            "date": "01.01",
            "start_time": "03:00",
            "duration": "-",
            "end_time": "-",
            "title": "Полный Расколбас!",
            "description": "Официальная программа окончена, но это не значит что Вы не можете создавать свою!",
            "location": "",
            "tv": "-",
            "image": "🎉"
        }
    ]
}

def get_variant_by_id(variant_id):
    """Получить вариант по ID"""
    for variant in schedule["variants"]:
        if variant["id"] == variant_id:
            return variant
    return None

def get_variant_datetime(variant):
    """Получить datetime начала варианта"""
    return parse_datetime(variant["date"], variant["start_time"])

def get_variant_end_datetime(variant):
    """Получить datetime окончания варианта"""
    if variant.get("end_date"):
        return parse_datetime(variant["end_date"], variant["end_time"])
    elif variant["end_time"] != "-" and variant["end_time"]:
        start_dt = get_variant_datetime(variant)
        return add_duration_to_datetime(start_dt, variant["duration"])
    else:
        # Если нет времени окончания, ищем следующий вариант, который начинается после этого
        start_dt = get_variant_datetime(variant)
        next_variants = get_next_variants_after_datetime(variant["date"], variant["start_time"])
        if next_variants:
            # Берем время начала следующего варианта как время окончания текущего
            next_variant = next_variants[0]
            return get_variant_datetime(next_variant)
        return None

def get_variants_by_datetime(date_str, time_str):
    """Получить все варианты, которые начинаются в указанную дату и время"""
    return [v for v in schedule["variants"] if v["date"] == date_str and v["start_time"] == time_str]

def get_variants_available_at_datetime(date_str, time_str):
    """Получить все варианты, доступные в указанную дату и время"""
    target_dt = parse_datetime(date_str, time_str)
    available = []
    
    for variant in schedule["variants"]:
        start_dt = get_variant_datetime(variant)
        end_dt = get_variant_end_datetime(variant)
        
        if end_dt is None:
            # Если нет времени окончания, проверяем только начало
            if start_dt <= target_dt:
                available.append(variant)
        else:
            # Проверяем, попадает ли время в интервал (время окончания исключительно)
            # start_dt <= target_dt < end_dt (не включая end_dt)
            if start_dt <= target_dt < end_dt:
                available.append(variant)
    
    return available

def get_next_variants_after_datetime(date_str, time_str):
    """Получить варианты, которые начинаются после указанной даты и времени"""
    target_dt = parse_datetime(date_str, time_str)
    next_variants = []
    
    for variant in schedule["variants"]:
        start_dt = get_variant_datetime(variant)
        if start_dt > target_dt:
            next_variants.append(variant)
    
    # Сортируем по datetime
    next_variants.sort(key=lambda v: get_variant_datetime(v))
    return next_variants

def get_current_date_time():
    """Получить текущую дату и время в формате приложения"""
    now = datetime.now()
    # Определяем, какая дата должна быть использована
    # Если сейчас 31 декабря или 1 января в новогодний период
    if now.month == 12 and now.day == 31:
        return "31.12", now.strftime("%H:%M")
    elif now.month == 1 and now.day == 1:
        return "01.01", now.strftime("%H:%M")
    else:
        # Для тестирования или других дат - используем ближайшую подходящую дату
        if now.month == 12:
            return "31.12", now.strftime("%H:%M")
        else:
            return "01.01", now.strftime("%H:%M")

def get_duration_minutes(duration_str):
    """Получить продолжительность в минутах из строки"""
    if not duration_str:
        return 0
    duration_minutes = 0
    if 'час' in duration_str.lower():
        if '+' in duration_str:
            duration_minutes = 60
        else:
            import re
            hours_match = re.search(r'(\d+(?:\.\d+)?)', duration_str)
            if hours_match:
                hours = float(hours_match.group(1))
                duration_minutes = int(hours * 60)
    elif 'минут' in duration_str.lower():
        import re
        mins_match = re.search(r'(\d+)', duration_str)
        if mins_match:
            duration_minutes = int(mins_match.group(1))
    return duration_minutes

def get_toc():
    """Получить оглавление - список всех уникальных дат и времен начала"""
    times_dict = {}
    
    for variant in schedule["variants"]:
        key = f"{variant['date']} {variant['start_time']}"
        if key not in times_dict:
            times_dict[key] = {
                "date": variant["date"],
                "time": variant["start_time"],
                "variants": []
            }
        times_dict[key]["variants"].append({
            "id": variant["id"],
            "title": variant["title"]
        })
    
    # Сортируем по дате и времени с учетом года
    # 31.12 идет перед 01.01, так как это 31.12.2024, а 01.01.2025
    def sort_key(x):
        date_str = x["date"]
        time_str = x["time"]
        # Парсим дату для правильной сортировки
        day, month = date_str.split('.')
        hour, minute = time_str.split(':')
        # Определяем год: 12 = 2024, 01 = 2025
        if month == "12":
            year = 2024
        else:
            year = 2025
        # Возвращаем кортеж для сортировки: (год, месяц, день, час, минута)
        return (year, int(month), int(day), int(hour), int(minute))
    
    toc = sorted(times_dict.values(), key=sort_key)
    return toc

def intervals_overlap(start1, end1, start2, end2):
    """Проверяет, накладываются ли два временных интервала (хотя бы на миг)"""
    # Интервалы накладываются, если start1 < end2 и start2 < end1
    return start1 < end2 and start2 < end1

def get_toc_columns():
    """Получить оглавление в виде двух колонок с правильными размерами элементов"""
    # Разделяем варианты на две колонки (a и b)
    column_a = []
    column_b = []
    
    # Получаем все варианты и сортируем их
    all_variants = sorted(schedule["variants"], key=lambda v: (
        parse_datetime(v["date"], v["start_time"])
    ))
    
    # Разделяем на колонки по ID (a или b в конце)
    for variant in all_variants:
        variant_id = variant["id"]
        start_dt = get_variant_datetime(variant)
        end_dt = get_variant_end_datetime(variant)
        
        # Если нет времени окончания, используем максимальное время из всех вариантов
        if not end_dt:
            # Ищем максимальное время окончания среди всех вариантов
            max_end = None
            for v in all_variants:
                v_end = get_variant_end_datetime(v)
                if v_end and (not max_end or v_end > max_end):
                    max_end = v_end
            if max_end:
                end_dt = max_end
            else:
                continue  # Пропускаем только если вообще нет времени окончания
        
        variant_data = {
            "id": variant_id,
            "title": variant["title"],
            "date": variant["date"],
            "start_time": variant["start_time"],
            "start_datetime": start_dt,
            "end_datetime": end_dt,
            "duration_minutes": get_duration_minutes(variant.get("duration", ""))
        }
        
        # Добавляем только варианты с ID, заканчивающимися на 'a' или 'b'
        # Это варианты из двух колонок таблицы (событие и телевизор)
        if variant_id.endswith('a'):
            column_a.append(variant_data)
        elif variant_id.endswith('b'):
            column_b.append(variant_data)
        # Все остальные варианты игнорируем
    
    # Для каждого элемента колонки A проверяем, есть ли наложение с колонкой B
    # Если есть наложение, то колонка A должна быть узкой
    for item_a in column_a:
        has_overlap = False
        for item_b in column_b:
            if intervals_overlap(
                item_a["start_datetime"], item_a["end_datetime"],
                item_b["start_datetime"], item_b["end_datetime"]
            ):
                has_overlap = True
                break
        # Добавляем флаг, указывающий, узкая ли колонка для этого элемента
        item_a["is_narrow"] = has_overlap
    
    # Колонка B всегда узкая
    for item_b in column_b:
        item_b["is_narrow"] = True
    
    # Находим общее время начала и конца для масштабирования
    all_start_times = [v["start_datetime"] for v in column_a + column_b]
    all_end_times = [v["end_datetime"] for v in column_a + column_b]
    
    if not all_start_times:
        return {"column_a": [], "column_b": [], "min_time": None, "max_time": None, "total_minutes": 0}
    
    min_time = min(all_start_times)
    max_time = max(all_end_times)
    
    # Вычисляем общую продолжительность в минутах
    total_minutes = (max_time - min_time).total_seconds() / 60
    
    # Добавляем пустые промежутки между элементами
    def add_gaps(column):
        """Добавляет пустые промежутки между элементами колонки"""
        if not column:
            return []
        
        result = []
        for i, item in enumerate(column):
            # Если это не первый элемент, проверяем есть ли промежуток
            if i > 0:
                prev_item = column[i-1]
                gap_start = prev_item["end_datetime"]
                gap_end = item["start_datetime"]
                
                if gap_start < gap_end:
                    # Есть промежуток - добавляем пустой элемент
                    gap_minutes = (gap_end - gap_start).total_seconds() / 60
                    result.append({
                        "type": "gap",
                        "start_datetime": gap_start,
                        "end_datetime": gap_end,
                        "duration_minutes": gap_minutes
                    })
            
            result.append(item)
        
        return result
    
    column_a_with_gaps = add_gaps(column_a)
    column_b_with_gaps = add_gaps(column_b)
    
    return {
        "column_a": column_a_with_gaps,
        "column_b": column_b_with_gaps,
        "min_time": min_time,
        "max_time": max_time,
        "total_minutes": total_minutes
    }

def get_current_time_slot():
    """Получить текущий временной слот на основе текущего времени"""
    date_str, time_str = get_current_date_time()
    return get_variants_available_at_datetime(date_str, time_str)
