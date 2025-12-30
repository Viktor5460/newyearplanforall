from flask import Flask, render_template, request, jsonify
from datetime import datetime
from schedule_data import (
    schedule, 
    get_variant_by_id,
    get_current_date_time,
    get_variant_datetime,
    get_variant_end_datetime,
    format_datetime,
    get_duration_minutes
)

app = Flask(__name__)

@app.route('/')
def mailbox():
    """Почтовый ящик"""
    return render_template('mailbox.html')

@app.route('/letters')
def letters():
    """Страница с письмами"""
    return render_template('letters.html')

@app.route('/api/letters')
def api_letters():
    """API для получения всех писем (вариантов)"""
    # Получаем все варианты из обеих колонок (исключаем специальные письма)
    all_variants = []
    for variant in schedule["variants"]:
        variant_id = variant["id"]
        # Пропускаем специальные письма
        if variant.get("special", False):
            continue
        if not (variant_id.endswith('a') or variant_id.endswith('b')):
            continue
        
        start_dt = get_variant_datetime(variant)
        end_dt = get_variant_end_datetime(variant)
        
        if not end_dt:
            continue
        
        variant_data = {
            "id": variant_id,
            "title": variant["title"],
            "date": variant["date"],
            "start_time": variant["start_time"],
            "duration": variant.get("duration", ""),
            "end_time": variant.get("end_time", ""),
            "description": variant.get("description", ""),
            "image": variant.get("image", "📄"),
            "start_datetime_str": format_datetime(start_dt),
            "end_datetime_str": format_datetime(end_dt),
            "duration_minutes": get_duration_minutes(variant.get("duration", ""))
        }
        all_variants.append(variant_data)
    
    # Сортируем по времени начала
    all_variants.sort(key=lambda v: v["start_datetime_str"])
    
    return jsonify({
        "letters": all_variants
    })

@app.route('/api/letter/<variant_id>')
def api_letter(variant_id):
    """API для получения деталей одного письма"""
    variant = get_variant_by_id(variant_id)
    if not variant:
        return jsonify({"error": "Письмо не найдено"}), 404
    
    start_dt = get_variant_datetime(variant)
    end_dt = get_variant_end_datetime(variant)
    
    letter_data = {
        "id": variant["id"],
        "title": variant["title"],
        "date": variant["date"],
        "start_time": variant["start_time"],
        "duration": variant.get("duration", ""),
        "end_time": variant.get("end_time", ""),
        "description": variant.get("description", ""),
        "image": variant.get("image", "📄"),
        "start_datetime_str": format_datetime(start_dt),
        "end_datetime_str": format_datetime(end_dt) if end_dt else None,
        "duration_minutes": get_duration_minutes(variant.get("duration", ""))
    }
    
    return jsonify(letter_data)

@app.route('/api/current_time')
def api_current_time():
    """API для получения текущего времени"""
    now = datetime.now()
    date_str, time_str = get_current_date_time()
    return jsonify({
        "time": time_str,
        "date": date_str,
        "full_date": now.strftime("%d.%m.%Y")
    })

@app.route('/api/all_letters_with_special')
def api_all_letters_with_special():
    """API для получения всех писем включая специальные (для серых меток)"""
    all_variants = []
    for variant in schedule["variants"]:
        variant_id = variant["id"]
        
        start_dt = get_variant_datetime(variant)
        end_dt = get_variant_end_datetime(variant)
        
        if not end_dt:
            continue
        
        variant_data = {
            "id": variant_id,
            "title": variant["title"],
            "date": variant["date"],
            "start_time": variant["start_time"],
            "duration": variant.get("duration", ""),
            "end_time": variant.get("end_time", ""),
            "description": variant.get("description", ""),
            "image": variant.get("image", "📄"),
            "start_datetime_str": format_datetime(start_dt),
            "end_datetime_str": format_datetime(end_dt),
            "duration_minutes": get_duration_minutes(variant.get("duration", "")),
            "special": variant.get("special", False),
            "type": variant.get("type", "")
        }
        all_variants.append(variant_data)
    
    all_variants.sort(key=lambda v: v["start_datetime_str"])
    
    return jsonify({
        "letters": all_variants
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
