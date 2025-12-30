// Глобальные переменные
let lettersData = []; // Обычные письма (без специальных)
let allLettersData = []; // Все письма включая специальные (для серых меток)
let currentTime = null;
let minTime = null;
let maxTime = null;
let totalMinutes = 0;
let currentSliderValue = 0;
let selectedTime = null;
let inspectionMode = false;
let originalLetterPositions = []; // Сохраняем исходные позиции писем
let isUserDraggingSlider = false; // Флаг, что пользователь перемещает ползунок
let letterCenterTimes = []; // Массив центров писем для привязки
let originalSurfaceHeight = null; // Исходная высота поверхности для ограничения скролла

// Константы для позиционирования
const PIXELS_PER_MINUTE = 10; // Пикселей на минуту для временной шкалы
const MIN_LETTER_HEIGHT = 120; // Минимальная высота письма
const LETTER_WIDTH_SINGLE = 400;
const LETTER_WIDTH_DOUBLE = 180;
const RANDOM_ROTATION_MAX = 7; // Максимальный угол наклона в градусах
const LETTER_SCALE = 2.5; // Масштаб писем (250%)
const INSPECTION_SCALE = 0.4; // Масштаб в режиме осмотра

// Функция для определения масштаба контейнера на мобильных устройствах
function getTableSurfaceScale() {
    const width = window.innerWidth;
    if (width <= 480) {
        return 0.5; // Для маленьких телефонов
    } else if (width <= 768) {
        return 0.6; // Для мобильных устройств
    }
    return 1.0; // Для десктопа (без масштаба)
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
            updateCurrentTime();
            loadLetters();
            setupTimeSlider();
            setupScrollTracking();
    
    // Обновляем текущее время каждую минуту
    setInterval(updateCurrentTime, 60000);
});

// Отслеживание скролла контейнера для обновления ползунка
function setupScrollTracking() {
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) return;
    
    let lastScrollTime = Date.now();
    
    tableContainer.addEventListener('scroll', function() {
        // Обновляем только если пользователь не перемещает ползунок
        if (isUserDraggingSlider || isDragging) return;
        
        // Ограничиваем прокрутку до середины исходной области
        if (originalSurfaceHeight !== null) {
            const maxScrollTop = (originalSurfaceHeight / 2) - tableContainer.clientHeight;
            if (tableContainer.scrollTop > maxScrollTop) {
                tableContainer.scrollTop = Math.max(0, maxScrollTop);
                return;
            }
        }
        
        // Обновляем при каждом событии scroll (без ограничения по времени для плавности)
        updateSliderFromScroll();
    });
}

// Обновление ползунка на основе текущего скролла
function updateSliderFromScroll() {
    if (!minTime || !maxTime) return;
    
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) return;
    
    // Получаем масштаб для определения мобильного устройства
    const surfaceScale = getTableSurfaceScale();
    const isMobile = surfaceScale < 1.0;
    
    // Вычисляем текущую позицию скролла
    const scrollTop = tableContainer.scrollTop;
    const containerHeight = tableContainer.clientHeight;
    const centerPosition = scrollTop + (containerHeight / 2);
    
    let percent;
    let centerTime;
    
    if (isMobile && originalSurfaceHeight !== null) {
        // На мобильных устройствах используем новую логику:
        // Максимальная позиция прокрутки = половина исходной высоты минус высота контейнера
        // Когда scrollTop = 0, процент = 0% (начало времени)
        // Когда scrollTop = maxScrollTop, процент = 100% (конец времени - 03:45)
        const maxScrollTop = (originalSurfaceHeight / 2) - containerHeight;
        
        if (maxScrollTop > 0) {
            percent = (scrollTop / maxScrollTop) * 100;
        } else {
            percent = 0;
        }
        percent = Math.max(0, Math.min(100, percent));
        
        // Вычисляем время на основе процента от временного диапазона
        const value = percent / 100;
        const timeOffset = (maxTime - minTime) * value;
        centerTime = new Date(minTime.getTime() + timeOffset);
    } else {
        // На десктопе используем стандартную логику
        // Преобразуем позицию в пикселях в время
        const minutesFromStart = centerPosition / (PIXELS_PER_MINUTE * LETTER_SCALE);
        centerTime = new Date(minTime.getTime() + minutesFromStart * 60 * 1000);
        
        // Вычисляем процент для ползунка
        percent = ((centerTime - minTime) / (maxTime - minTime)) * 100;
        percent = Math.max(0, Math.min(100, percent));
    }
    
    // Обновляем ползунок
    currentSliderValue = percent;
    const slider = document.getElementById('time-scale-slider');
    if (slider) {
        slider.style.top = `${percent}%`;
    }
    
    // Показываем точное время на циферблате
    updateClockDisplay(centerTime);
    selectedTime = centerTime;
}

// Загрузка писем
function loadLetters() {
    // Загружаем обычные письма
    fetch('/api/letters')
        .then(response => response.json())
        .then(data => {
            lettersData = data.letters;
            // Загружаем все письма включая специальные (для серых меток)
            return fetch('/api/all_letters_with_special');
        })
        .then(response => response.json())
        .then(data => {
            allLettersData = data.letters;
            // Сначала рассчитываем временной диапазон
            calculateTimeRange();
            // Затем рендерим письма (размеры иконок уже учитывают масштаб через CSS)
            renderLetters();
            // После рендеринга писем строим шкалу времени
            // Используем requestAnimationFrame чтобы убедиться, что DOM обновлен
            requestAnimationFrame(() => {
                renderTimeScale();
                // Устанавливаем ползунок после рендеринга шкалы
                setTimeout(() => {
                    setSliderToCurrentTime();
                }, 100);
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки писем:', error);
        });
}

// Вычисление диапазона времени (используем все письма включая специальные)
function calculateTimeRange() {
    if (allLettersData.length === 0) return;
    
    const times = allLettersData.map(letter => parseDateTimeStr(letter.start_datetime_str));
    minTime = new Date(Math.min(...times));
    
    // Устанавливаем maxTime на 03:45 01.01.2025
    // Это растянет временную шкалу так, чтобы конец соответствовал 03:45
    // Определяем год на основе minTime (если minTime в 2024, то 03:45 должно быть 01.01.2025)
    const minTimeYear = minTime.getFullYear();
    maxTime = new Date(minTimeYear, 0, 1, 3, 45, 0, 0); // 01.01 в 03:45
    
    // Если minTime находится после 03:45 01.01, то maxTime должен быть на следующий год
    if (minTime.getTime() >= maxTime.getTime()) {
        maxTime = new Date(minTimeYear + 1, 0, 1, 3, 45, 0, 0);
    }
    
    totalMinutes = (maxTime - minTime) / (1000 * 60);
}

// Парсинг даты из строки
function parseDateTimeStr(dateTimeStr) {
    // Формат: "DD.MM HH:MM"
    if (!dateTimeStr) return null;
    const parts = dateTimeStr.split(' ');
    if (parts.length !== 2) return null;
    const datePart = parts[0].split('.');
    const timePart = parts[1].split(':');
    if (datePart.length !== 2 || timePart.length !== 2) return null;
    const day = parseInt(datePart[0]);
    const month = parseInt(datePart[1]);
    const hour = parseInt(timePart[0]);
    const minute = parseInt(timePart[1]);
    const year = month === 12 ? 2024 : 2025;
    return new Date(year, month - 1, day, hour, minute);
}

// Форматирование времени для отображения
function formatDateTime(dt) {
    if (!dt) return "";
    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const hour = dt.getHours().toString().padStart(2, '0');
    const minute = dt.getMinutes().toString().padStart(2, '0');
    return { date: `${day}.${month}`, time: `${hour}:${minute}` };
}

// Рендеринг специальных писем и лент
function renderSpecialLetters() {
    const tableSurface = document.getElementById('table-surface');
    if (!tableSurface || !allLettersData || allLettersData.length === 0) return;
    
    if (!minTime || !maxTime || totalMinutes <= 0) {
        calculateTimeRange();
    }
    
    // Находим специальные письма
    const waitingLetter = allLettersData.find(l => l.id === 'special_waiting');
    const giftLetter = allLettersData.find(l => l.id === 'special_gift');
    
    // Рендерим письмо ожидания (11:00 31.12)
    if (waitingLetter) {
        const startTime = parseDateTimeStr(waitingLetter.start_datetime_str);
        const endTime = parseDateTimeStr(waitingLetter.end_datetime_str);
        if (startTime && endTime) {
            const minutesFromStart = (startTime - minTime) / (1000 * 60);
            const duration = waitingLetter.duration_minutes || 30;
            const height = Math.max(MIN_LETTER_HEIGHT, duration * PIXELS_PER_MINUTE);
            const top = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
            
            const letterEl = document.createElement('div');
            letterEl.className = 'letter special special-mailbox';
            letterEl.style.top = `${top}px`;
            letterEl.style.height = `${height}px`;
            letterEl.style.width = `${LETTER_WIDTH_SINGLE}px`;
            letterEl.style.left = `calc(50% - ${LETTER_WIDTH_SINGLE / 2}px)`;
            letterEl.style.transform = `scale(${LETTER_SCALE})`;
            letterEl.style.transformOrigin = 'top center';
            letterEl.style.zIndex = '1';
            letterEl.dataset.letterId = 'special_waiting';
            letterEl.innerHTML = '📮';
            letterEl.addEventListener('click', () => openWaitingModal());
            tableSurface.appendChild(letterEl);
        }
    }
    
    // Рендерим письмо подарка (06:00 01.01)
    if (giftLetter) {
        const startTime = parseDateTimeStr(giftLetter.start_datetime_str);
        const endTime = parseDateTimeStr(giftLetter.end_datetime_str);
        if (startTime && endTime) {
            const minutesFromStart = (startTime - minTime) / (1000 * 60);
            const duration = giftLetter.duration_minutes || 30;
            const height = Math.max(MIN_LETTER_HEIGHT, duration * PIXELS_PER_MINUTE);
            const top = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
            
            const letterEl = document.createElement('div');
            letterEl.className = 'letter special special-gift';
            letterEl.style.top = `${top}px`;
            letterEl.style.height = `${height}px`;
            letterEl.style.width = `${LETTER_WIDTH_SINGLE}px`;
            letterEl.style.left = `calc(50% - ${LETTER_WIDTH_SINGLE / 2}px)`;
            letterEl.style.transform = `scale(${LETTER_SCALE})`;
            letterEl.style.transformOrigin = 'top center';
            letterEl.style.zIndex = '1';
            letterEl.dataset.letterId = 'special_gift';
            letterEl.innerHTML = '🎁';
            letterEl.style.fontSize = '80px';
            letterEl.style.display = 'flex';
            letterEl.style.alignItems = 'center';
            letterEl.style.justifyContent = 'center';
            letterEl.addEventListener('click', () => openGiftModal());
            tableSurface.appendChild(letterEl);
        }
    }
}

// Открытие модального окна ожидания
function openWaitingModal() {
    const modal = document.getElementById('waiting-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Закрытие модального окна ожидания
function closeWaitingModal() {
    const modal = document.getElementById('waiting-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Открытие модального окна подарка
function openGiftModal() {
    const modal = document.getElementById('gift-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Закрытие модального окна подарка
function closeGiftModal() {
    const modal = document.getElementById('gift-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Рендеринг писем
function renderLetters() {
    const tableSurface = document.getElementById('table-surface');
    if (!tableSurface) return;
    
    if (!lettersData || lettersData.length === 0) {
        console.error('Нет данных о письмах для отображения');
        return;
    }
    
    if (!minTime || !maxTime || totalMinutes <= 0) {
        calculateTimeRange();
    }
    
    // Рендерим специальные письма (ленты и кнопки не рендерятся)
    const existingSpecial = tableSurface.querySelectorAll('.letter.special');
    existingSpecial.forEach(el => el.remove());
    renderSpecialLetters();
    
    // Группируем письма по времени начала (для одновременных событий)
    const groupedLetters = groupLettersByStartTime();
    
    if (groupedLetters.length === 0) {
        console.error('Не удалось сгруппировать письма');
        return;
    }
    
    // Сортируем все группы по времени начала
    groupedLetters.sort((a, b) => {
        const timeA = parseDateTimeStr(a.letters[0].start_datetime_str);
        const timeB = parseDateTimeStr(b.letters[0].start_datetime_str);
        return timeA - timeB;
    });
    
    let maxBottom = 0; // Максимальная нижняя граница для установки высоты поверхности
    
    groupedLetters.forEach((group) => {
        const letters = group.letters;
        
        // Если в группе несколько писем (наложение), каждое позиционируется независимо по своему времени начала
        // Но показываются они рядом друг с другом
        if (letters.length === 1) {
            // Одно письмо - проверяем, должно ли оно быть узким (из-за наложения)
            const letter = letters[0];
            const letterStartTime = parseDateTimeStr(letter.start_datetime_str);
            const minutesFromStart = (letterStartTime - minTime) / (1000 * 60);
            const letterCenter = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
            
            const duration = letter.duration_minutes || 30;
            const height = Math.max(MIN_LETTER_HEIGHT, duration * PIXELS_PER_MINUTE);
            // Для письма "Дачная Суета!" (id="1a") используем максимальный наклон 1%, для остальных - 7%
            const maxRotation = letter.id === '1a' ? 1 : RANDOM_ROTATION_MAX;
            const rotation = (Math.random() - 0.5) * 2 * maxRotation;
            
            // Верх письма на времени начала
            const top = letterCenter;
            
            // Если у группы есть флаг hasOverlap или письмо из колонки 'b', оно должно быть узким
            const hasOverlap = group.hasOverlap || false;
            const letterColumn = letter.id.endsWith('a') ? 'a' : 'b';
            let className = 'single';
            
            if (hasOverlap || letterColumn === 'b') {
                // Узкое письмо: 'a' слева, 'b' справа
                className = letterColumn === 'a' ? 'double left' : 'double right';
            }
            
            const letterEl = createLetterElement(letter, className, top, height, rotation);
            tableSurface.appendChild(letterEl);
            
            // Обновляем максимальную нижнюю границу
            const endMinutesFromStart = minutesFromStart + duration;
            const endPosition = endMinutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
            maxBottom = Math.max(maxBottom, endPosition);
            
        } else if (letters.length === 2) {
            // Два письма рядом (наложение) - позиционируем каждое по своему времени начала
            letters.forEach((letter, index) => {
                const letterStartTime = parseDateTimeStr(letter.start_datetime_str);
                const minutesFromStart = (letterStartTime - minTime) / (1000 * 60);
                const letterCenter = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
                
                const duration = letter.duration_minutes || 30;
                const height = Math.max(MIN_LETTER_HEIGHT, duration * PIXELS_PER_MINUTE);
                // Для письма "Дачная Суета!" (id="1a") используем максимальный наклон 1%, для остальных - 7%
                const maxRotation = letter.id === '1a' ? 1 : RANDOM_ROTATION_MAX;
                const rotation = (Math.random() - 0.5) * 2 * maxRotation;
                const position = index === 0 ? 'left' : 'right';
                
                // Верх каждого письма на своем времени начала
                let letterTop = letterCenter;
                // Левое письмо делаем немного выше (смещаем вверх на 30px)
                if (position === 'left') {
                    letterTop -= 30;
                }
                
                const letterEl = createLetterElement(letter, `double ${position}`, letterTop, height, rotation);
                tableSurface.appendChild(letterEl);
                
                // Обновляем максимальную нижнюю границу
                const endMinutesFromStart = minutesFromStart + duration;
                const endPosition = endMinutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
                maxBottom = Math.max(maxBottom, endPosition);
            });
        } else {
            // Если больше двух (не должно быть, но на всякий случай)
            letters.forEach((letter, index) => {
                const letterStartTime = parseDateTimeStr(letter.start_datetime_str);
                const minutesFromStart = (letterStartTime - minTime) / (1000 * 60);
                const letterCenter = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
                
                const duration = letter.duration_minutes || 30;
                const height = Math.max(MIN_LETTER_HEIGHT, duration * PIXELS_PER_MINUTE);
                // Для письма "Дачная Суета!" (id="1a") используем максимальный наклон 1%, для остальных - 7%
                const maxRotation = letter.id === '1a' ? 1 : RANDOM_ROTATION_MAX;
                const rotation = (Math.random() - 0.5) * 2 * maxRotation;
                
                const letterTop = letterCenter;
                
                const letterEl = createLetterElement(letter, 'single', letterTop, height, rotation);
                tableSurface.appendChild(letterEl);
                
                const endMinutesFromStart = minutesFromStart + duration;
                const endPosition = endMinutesFromStart * PIXELS_PER_MINUTE * scale;
                maxBottom = Math.max(maxBottom, endPosition);
            });
        }
    });
    
    // Также учитываем специальные письма (подарок) для расчета максимальной нижней границы
    const giftLetter = allLettersData.find(l => l.id === 'special_gift');
    if (giftLetter) {
        const startTime = parseDateTimeStr(giftLetter.start_datetime_str);
        const endTime = parseDateTimeStr(giftLetter.end_datetime_str);
        if (startTime && endTime) {
            const minutesFromStart = (startTime - minTime) / (1000 * 60);
            const duration = giftLetter.duration_minutes || 30;
            // Визуальный конец подарка: top + height * LETTER_SCALE
            // top уже учитывает LETTER_SCALE, поэтому визуальный конец = top + height * LETTER_SCALE
            const giftTop = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
            const giftHeight = Math.max(MIN_LETTER_HEIGHT, duration * PIXELS_PER_MINUTE);
            const giftBottom = giftTop + (giftHeight * LETTER_SCALE);
            maxBottom = Math.max(maxBottom, giftBottom);
        }
    }
    
    // Устанавливаем высоту поверхности стола
    // Высота должна соответствовать полному временному диапазону, но не меньше maxBottom
    const totalHeight = totalMinutes * PIXELS_PER_MINUTE * LETTER_SCALE;
    const calculatedHeight = Math.max(maxBottom, totalHeight) + 200;
    
    // Сохраняем исходную высоту для ограничения скролла
    originalSurfaceHeight = calculatedHeight;
    
    // Устанавливаем половину исходной высоты (убираем нижнюю половину области)
    const halfHeight = calculatedHeight / 2;
    tableSurface.style.minHeight = `${halfHeight}px`;
    tableSurface.style.height = `${halfHeight}px`;
}

// Группировка писем по наложению временных интервалов
// Если письма накладываются (пересекаются по времени), они группируются вместе
// Две колонки (a и b) идут параллельно и независимо
function groupLettersByStartTime() {
    const groups = [];
    const processed = new Set();
    
    // Функция для проверки наложения двух писем
    function lettersOverlap(letter1, letter2) {
        const start1 = parseDateTimeStr(letter1.start_datetime_str);
        const end1 = parseDateTimeStr(letter1.end_datetime_str);
        const start2 = parseDateTimeStr(letter2.start_datetime_str);
        const end2 = parseDateTimeStr(letter2.end_datetime_str);
        
        if (!start1 || !end1 || !start2 || !end2) return false;
        
        // Проверяем пересечение интервалов (даже минимальное наложение)
        // Интервалы пересекаются, если start1 < end2 И start2 < end1
        return start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime();
    }
    
    // Сортируем все письма по времени начала
    const sortedLetters = [...lettersData].sort((a, b) => {
        const timeA = parseDateTimeStr(a.start_datetime_str);
        const timeB = parseDateTimeStr(b.start_datetime_str);
        return timeA - timeB;
    });
    
    // Логика группировки: две колонки (a и b) постоянные
    // Для каждого события из колонки 'a' проверяем весь его временной промежуток (от начала до конца)
    // Если в этом промежутке есть хотя бы одно событие из колонки 'b' - показываем узкими
    // Колонка 'a' слева (узкая, если есть наложение), колонка 'b' справа (всегда узкая)
    // Если событие из колонки 'a' не накладывается ни с одним событием из 'b' - оно широкое по центру
    
    // Сначала определяем, какие письма из 'a' имеют наложение с любым письмом из 'b'
    const aHasOverlap = new Map(); // letter.id -> true/false
    
    sortedLetters.forEach(letter => {
        if (!letter.id.endsWith('a')) return;
        
        const letterStart = parseDateTimeStr(letter.start_datetime_str);
        const letterEnd = parseDateTimeStr(letter.end_datetime_str);
        if (!letterStart || !letterEnd) {
            aHasOverlap.set(letter.id, false);
            return;
        }
        
        // Проверяем наложение с ЛЮБЫМ письмом из 'b' (независимо от порядка обработки)
        const hasOverlap = sortedLetters.some(otherLetter => {
            if (!otherLetter.id.endsWith('b')) return false;
            
            const otherStart = parseDateTimeStr(otherLetter.start_datetime_str);
            const otherEnd = parseDateTimeStr(otherLetter.end_datetime_str);
            if (!otherStart || !otherEnd) return false;
            
            // Пересечение: otherStart < letterEnd И otherEnd > letterStart
            return otherStart.getTime() < letterEnd.getTime() && otherEnd.getTime() > letterStart.getTime();
        });
        
        aHasOverlap.set(letter.id, hasOverlap);
    });
    
    // Теперь группируем письма, учитывая все наложения
    sortedLetters.forEach(letter => {
        if (processed.has(letter.id)) return;
        
        const letterColumn = letter.id.endsWith('a') ? 'a' : 'b';
        const letterStart = parseDateTimeStr(letter.start_datetime_str);
        const letterEnd = parseDateTimeStr(letter.end_datetime_str);
        
        if (!letterStart || !letterEnd) {
            processed.add(letter.id);
            groups.push({
                timeKey: letter.start_datetime_str,
                letters: [letter]
            });
            return;
        }
        
        if (letterColumn === 'a') {
            const hasOverlap = aHasOverlap.get(letter.id) || false;
            
            if (hasOverlap) {
                // Ищем первое непрочитанное письмо из 'b', которое пересекается
                const overlappingB = sortedLetters.find(otherLetter => {
                    if (!otherLetter.id.endsWith('b')) return false;
                    if (processed.has(otherLetter.id)) return false;
                    
                    const otherStart = parseDateTimeStr(otherLetter.start_datetime_str);
                    const otherEnd = parseDateTimeStr(otherLetter.end_datetime_str);
                    if (!otherStart || !otherEnd) return false;
                    
                    return otherStart.getTime() < letterEnd.getTime() && otherEnd.getTime() > letterStart.getTime();
                });
                
                if (overlappingB) {
                    // Группируем вместе
                    const group = [letter, overlappingB];
                    group.sort((a, b) => {
                        const colA = a.id.endsWith('a') ? 'a' : 'b';
                        const colB = b.id.endsWith('a') ? 'a' : 'b';
                        if (colA === colB) return a.id.localeCompare(b.id);
                        return colA === 'a' ? -1 : 1;
                    });
                    
                    processed.add(letter.id);
                    processed.add(overlappingB.id);
                    
                    groups.push({
                        timeKey: group[0].start_datetime_str,
                        letters: group
                    });
                } else {
                    // Нет непрочитанного наложения, но наложение есть - показываем отдельно узким
                    // Добавляем флаг hasOverlap, чтобы при рендеринге оно было узким
                    processed.add(letter.id);
                    groups.push({
                        timeKey: letter.start_datetime_str,
                        letters: [letter],
                        hasOverlap: true // Флаг для узкого отображения
                    });
                }
            } else {
                // Нет наложения - широкое письмо по центру
                processed.add(letter.id);
                groups.push({
                    timeKey: letter.start_datetime_str,
                    letters: [letter]
                });
            }
        } else {
            // Колонка 'b' - ищем непрочитанное письмо из 'a' с наложением
            const overlappingA = sortedLetters.find(otherLetter => {
                if (!otherLetter.id.endsWith('a')) return false;
                if (processed.has(otherLetter.id)) return false;
                
                const hasOverlapForA = aHasOverlap.get(otherLetter.id);
                if (!hasOverlapForA) return false;
                
                const otherStart = parseDateTimeStr(otherLetter.start_datetime_str);
                const otherEnd = parseDateTimeStr(otherLetter.end_datetime_str);
                if (!otherStart || !otherEnd) return false;
                
                return otherStart.getTime() < letterEnd.getTime() && otherEnd.getTime() > letterStart.getTime();
            });
            
            if (overlappingA) {
                // Группируем вместе (обработается в ветке 'a')
                // Но если мы здесь, значит 'a' уже должно быть обработано - показываем отдельно
                processed.add(letter.id);
                groups.push({
                    timeKey: letter.start_datetime_str,
                    letters: [letter]
                });
            } else {
                // Нет наложения - показываем отдельно (узким, так как 'b' всегда узкая)
                processed.add(letter.id);
                groups.push({
                    timeKey: letter.start_datetime_str,
                    letters: [letter]
                });
            }
        }
    });
    
    // Сортируем группы по времени начала первой буквы
    groups.sort((a, b) => {
        const timeA = parseDateTimeStr(a.timeKey);
        const timeB = parseDateTimeStr(b.timeKey);
        return timeA - timeB;
    });
    
    return groups;
}

// Создание элемента письма
function createLetterElement(letter, className, top, height, rotation) {
    const letterEl = document.createElement('div');
    letterEl.className = `letter ${className}`;
    letterEl.style.top = `${top}px`;
    letterEl.style.height = `${height}px`;
    
    // Применяем масштаб и поворот сразу
    // Используем transform-origin='top center', чтобы масштабирование происходило от верха
    // Это позволяет верх письма быть на времени начала, а низ на времени окончания
    letterEl.style.transform = `rotate(${rotation}deg) scale(${LETTER_SCALE})`;
    letterEl.style.transformOrigin = 'top center';
    letterEl.style.zIndex = '1';
    
    letterEl.dataset.letterId = letter.id;
    letterEl.dataset.rotation = rotation; // Сохраняем угол поворота
    letterEl.dataset.scale = LETTER_SCALE; // Сохраняем масштаб
    
    // Случайный выбор пары соседних углов для полосок
    // Пары соседних углов: 0-верхний левый+верхний правый, 1-верхний левый+нижний левый, 
    // 2-нижний левый+нижний правый, 3-верхний правый+нижний правый
    const cornerPair = Math.floor(Math.random() * 4);
    letterEl.dataset.cornerPair = cornerPair;
    
    letterEl.innerHTML = `
        <div class="letter-header">
            <div class="letter-time">${letter.start_time}</div>
            <div class="letter-date">${letter.date}</div>
        </div>
        <div class="letter-title">${letter.title}</div>
        <div class="letter-seal"></div>
    `;
    
    // При наведении сохраняем поворот и масштаб, добавляем подъем (только если не режим осмотра)
    letterEl.addEventListener('mouseenter', function() {
        if (inspectionMode) return; // В режиме осмотра не применяем эффекты наведения
        const savedRotation = this.dataset.rotation || rotation;
        const savedScale = this.dataset.scale || LETTER_SCALE;
        // Добавляем translateY для подъема, сохраняя поворот и масштаб
        this.style.transform = `rotate(${savedRotation}deg) scale(${savedScale}) translateY(-5px)`;
        this.style.zIndex = '10';
    });
    
    letterEl.addEventListener('mouseleave', function() {
        if (inspectionMode) return; // В режиме осмотра не применяем эффекты наведения
        const savedRotation = this.dataset.rotation || rotation;
        const savedScale = this.dataset.scale || LETTER_SCALE;
        // Возвращаем исходную трансформацию без translateY
        this.style.transform = `rotate(${savedRotation}deg) scale(${savedScale})`;
        this.style.zIndex = '1';
    });
    
    letterEl.addEventListener('click', () => openLetterModal(letter));
    
    return letterEl;
}

// Рендеринг шкалы времени (используем все письма включая специальные для меток)
function renderTimeScale() {
    const timeScale = document.getElementById('time-scale');
    if (!timeScale || !minTime || !maxTime) return;
    
    // Сохраняем ползунок, если он существует
    const slider = document.getElementById('time-scale-slider');
    const sliderTop = slider ? slider.style.top : '0%';
    
    // Удаляем только метки, но не ползунок
    const markers = timeScale.querySelectorAll('.time-scale-marker');
    markers.forEach(marker => marker.remove());
    
    // Сохраняем центры писем для привязки ползунка
    letterCenterTimes = [];
    
    // Собираем все центры писем с их временем
    const letterCenters = [];
    allLettersData.forEach(letter => {
        const startTime = parseDateTimeStr(letter.start_datetime_str);
        const endTime = parseDateTimeStr(letter.end_datetime_str);
        
        if (startTime && endTime) {
            // Вычисляем центр письма: используем реальное время начала и окончания
            // Центр = (startTime + endTime) / 2
            const centerTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
            letterCenters.push(centerTime.getTime());
        }
    });
    
    if (letterCenters.length === 0) return;
    
    // Находим самое раннее и самое позднее время центров
    const minCenterTime = Math.min(...letterCenters);
    const maxCenterTime = Math.max(...letterCenters);
    const centerTimeRange = maxCenterTime - minCenterTime;
    
    // Распределяем метки по всей временной шкале от minTime до maxTime
    // Первая метка (самое раннее время центра) = 0%
    // Последняя метка (самое позднее время центра) = 100%
    // Остальные распределяются пропорционально между ними
    const fullTimeRange = maxTime - minTime;
    
    if (centerTimeRange === 0 || fullTimeRange === 0) {
        // Если все центры в одной точке или диапазон времени нулевой
        letterCenters.forEach(() => {
            letterCenterTimes.push(0);
            const marker = document.createElement('div');
            marker.className = 'time-scale-marker';
            marker.style.top = '0%';
            timeScale.appendChild(marker);
        });
    } else {
        // Распределяем метки пропорционально по всей шкале от minTime до maxTime
        // Используем линейное преобразование: от диапазона центров к полному диапазону времени
        letterCenters.forEach(centerTime => {
            // Вычисляем процент от minTime до maxTime
            // Сначала нормализуем центр письма относительно диапазона центров (0-1)
            // Затем растягиваем на полный диапазон времени
            const normalizedPosition = (centerTime - minCenterTime) / centerTimeRange; // 0.0 до 1.0
            const percent = normalizedPosition * 100; // 0% до 100%
            
            // Сохраняем процент для привязки
            letterCenterTimes.push(percent);
            
            const marker = document.createElement('div');
            marker.className = 'time-scale-marker';
            marker.style.top = `${percent}%`;
            timeScale.appendChild(marker);
        });
    }
    
    // Сортируем проценты по возрастанию
    letterCenterTimes.sort((a, b) => a - b);
    
    // Восстанавливаем позицию ползунка
    if (slider) {
        slider.style.top = sliderTop;
    }
}

// Настройка ползунка времени на шкале
function setupTimeSlider() {
    const timeScale = document.getElementById('time-scale');
    const slider = document.getElementById('time-scale-slider');
    if (!timeScale || !slider) return;
    
    // Обработка клика на шкале
    timeScale.addEventListener('click', function(e) {
        if (e.target === slider) return;
        const rect = timeScale.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percent = (clickY / rect.height) * 100;
        isUserDraggingSlider = true;
        moveSliderToPercent(Math.max(0, Math.min(100, percent)), true);
        isUserDraggingSlider = false;
    });
    
    // Обработка перетаскивания ползунка
    slider.addEventListener('mousedown', function(e) {
        isDragging = true;
        isUserDraggingSlider = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const rect = timeScale.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const percent = (mouseY / rect.height) * 100;
        moveSliderToPercent(Math.max(0, Math.min(100, percent)), true);
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
        isUserDraggingSlider = false;
    });
    
    // Обработка тач-событий для мобильных
    slider.addEventListener('touchstart', function(e) {
        isDragging = true;
        isUserDraggingSlider = true;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const rect = timeScale.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        const percent = (touchY / rect.height) * 100;
        moveSliderToPercent(Math.max(0, Math.min(100, percent)), true);
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        isDragging = false;
        isUserDraggingSlider = false;
    });
    
    // Обработка скролла мышью для перемещения ползунка
    timeScale.addEventListener('wheel', function(e) {
        e.preventDefault(); // Предотвращаем прокрутку страницы
        
        // Используем текущее значение ползунка из переменной или вычисляем из стиля
        const currentPercent = currentSliderValue || parseFloat(slider.style.top) || 0;
        
        // Вычисляем изменение позиции на основе скролла
        // deltaY положительное при скролле вниз (ползунок должен двигаться вниз)
        // Скроллим на 1.5% за каждые 100 пикселей скролла для плавности
        const deltaPercent = (e.deltaY / timeScale.offsetHeight) * 100 * 1.5;
        const newPercent = Math.max(0, Math.min(100, currentPercent + deltaPercent));
        
        isUserDraggingSlider = true;
        moveSliderToPercent(newPercent, true);
        isUserDraggingSlider = false;
    }, { passive: false });
}

// Найти ближайшую метку (центр письма)
function findNearestMarker(percent) {
    if (letterCenterTimes.length === 0) return percent;
    
    let nearest = letterCenterTimes[0];
    let minDistance = Math.abs(percent - letterCenterTimes[0]);
    
    for (let i = 1; i < letterCenterTimes.length; i++) {
        const distance = Math.abs(percent - letterCenterTimes[i]);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = letterCenterTimes[i];
        }
    }
    
    return nearest;
}

// Перемещение ползунка на указанный процент
function moveSliderToPercent(percent, snapToMarker = false) {
    const slider = document.getElementById('time-scale-slider');
    const timeScale = document.getElementById('time-scale');
    if (!slider || !timeScale) return;
    
    // Если пользователь перемещает ползунок, привязываем к ближайшей метке
    let finalPercent = percent;
    if (snapToMarker && isUserDraggingSlider && letterCenterTimes.length > 0) {
        finalPercent = findNearestMarker(percent);
    }
    
    currentSliderValue = finalPercent;
    slider.style.top = `${finalPercent}%`;
    // Прокручиваем только когда пользователь перемещает ползунок (snapToMarker = true)
    // Не прокручиваем когда ползунок обновляется из скролла
    updateTimeFromSlider(finalPercent, !snapToMarker);
}

// Обновление времени из ползунка
function updateTimeFromSlider(percent, skipScroll = false) {
    if (!minTime || !maxTime) return;
    
    const value = percent / 100;
    const timeOffset = (maxTime - minTime) * value;
    selectedTime = new Date(minTime.getTime() + timeOffset);
    
    // Показываем точное время на циферблате
    updateClockDisplay(selectedTime);
    
    // Прокручиваем только если пользователь перемещает ползунок (не при автообновлении из скролла)
    if (!skipScroll) {
        const surfaceScale = getTableSurfaceScale();
        const isMobile = surfaceScale < 1.0;
        
        if (isMobile && originalSurfaceHeight !== null) {
            // На мобильных устройствах используем новую логику:
            // scrollTop = (percent / 100) * maxScrollTop
            const tableContainer = document.getElementById('table-container');
            if (tableContainer) {
                const containerHeight = tableContainer.clientHeight;
                const maxScrollTop = (originalSurfaceHeight / 2) - containerHeight;
                
                if (maxScrollTop > 0) {
                    const targetScrollTop = (percent / 100) * maxScrollTop;
                    tableContainer.scrollTop = Math.max(0, Math.min(maxScrollTop, targetScrollTop));
                } else {
                    tableContainer.scrollTop = 0;
                }
            }
        } else {
            // На десктопе используем стандартную логику
            scrollToTime(selectedTime);
        }
    }
}

// Обновление отображения часов
function updateClockDisplay(dt) {
    const clockDate = document.getElementById('clock-date');
    const clockTime = document.getElementById('clock-time');
    
    if (!clockDate || !clockTime) return;
    
    // Показываем точное время из параметра dt
    const formatted = formatDateTime(dt);
    clockDate.textContent = formatted.date;
    clockTime.textContent = formatted.time;
}

// Прокрутка к времени
function scrollToTime(dt) {
    if (!minTime || !maxTime) return;
    
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) return;
    
    // Получаем масштаб для определения мобильного устройства
    const surfaceScale = getTableSurfaceScale();
    const isMobile = surfaceScale < 1.0;
    
    if (isMobile && originalSurfaceHeight !== null) {
        // На мобильных устройствах используем новую логику через процент
        // Вычисляем процент от временного диапазона
        const percent = ((dt - minTime) / (maxTime - minTime)) * 100;
        const clampedPercent = Math.max(0, Math.min(100, percent));
        
        // Вычисляем scrollTop: scrollTop = (percent / 100) * maxScrollTop
        const containerHeight = tableContainer.clientHeight;
        const maxScrollTop = (originalSurfaceHeight / 2) - containerHeight;
        
        if (maxScrollTop > 0) {
            const scrollTop = (clampedPercent / 100) * maxScrollTop;
            tableContainer.scrollTop = Math.max(0, Math.min(maxScrollTop, scrollTop));
        } else {
            tableContainer.scrollTop = 0;
        }
        return;
    }
    
    // На десктопе используем стандартную логику
    // Находим письмо, центр которого ближе всего к выбранному времени
    let closestLetter = null;
    let minDistance = Infinity;
    
    lettersData.forEach(letter => {
        const startTime = parseDateTimeStr(letter.start_datetime_str);
        const endTime = parseDateTimeStr(letter.end_datetime_str);
        
        if (startTime && endTime) {
            // Вычисляем центр письма
            const centerTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
            
            // Вычисляем расстояние от выбранного времени до центра письма
            const distance = Math.abs(centerTime.getTime() - dt.getTime());
            
            if (distance < minDistance) {
                minDistance = distance;
                closestLetter = { centerTime, startTime, endTime };
            }
        }
    });
    
    // Если нашли письмо, центрируем его
    if (closestLetter) {
        // Вычисляем позицию центра письма на странице
        const minutesFromStart = (closestLetter.centerTime - minTime) / (1000 * 60);
        const centerPosition = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
        
        // Центрируем письмо по центру экрана
        // scrollTop = позиция центра письма - половина высоты видимой области
        const containerHeight = tableContainer.clientHeight;
        let scrollTop = centerPosition - (containerHeight / 2);
        
        // Ограничиваем прокрутку до середины исходной области
        if (originalSurfaceHeight !== null) {
            const maxScrollTop = (originalSurfaceHeight / 2) - containerHeight;
            scrollTop = Math.min(scrollTop, Math.max(0, maxScrollTop));
        }
        
        tableContainer.scrollTop = Math.max(0, scrollTop);
    } else {
        // Если не нашли письмо, используем старую логику
        const minutesFromStart = (dt - minTime) / (1000 * 60);
        const top = minutesFromStart * PIXELS_PER_MINUTE * LETTER_SCALE;
        const containerHeight = tableContainer.clientHeight;
        let scrollTop = top - (containerHeight / 2);
        
        // Ограничиваем прокрутку до середины исходной области
        if (originalSurfaceHeight !== null) {
            const maxScrollTop = (originalSurfaceHeight / 2) - containerHeight;
            scrollTop = Math.min(scrollTop, Math.max(0, maxScrollTop));
        }
        
        tableContainer.scrollTop = Math.max(0, scrollTop);
    }
}

// Переход к текущему времени
function goToCurrentTime() {
    updateCurrentTime();
    if (!currentTime || !minTime || !maxTime) return;
    
    // Если текущее время раньше всех писем - переходим к первому письму
    const firstLetter = allLettersData.length > 0 ? allLettersData[0] : null;
    if (firstLetter) {
        const firstStartTime = parseDateTimeStr(firstLetter.start_datetime_str);
        if (firstStartTime && currentTime < firstStartTime) {
            // Переходим к первому письму
            const firstEndTime = parseDateTimeStr(firstLetter.end_datetime_str);
            if (firstEndTime) {
                const centerTime = new Date((firstStartTime.getTime() + firstEndTime.getTime()) / 2);
                const percent = ((centerTime - minTime) / (maxTime - minTime)) * 100;
                moveSliderToPercent(percent);
                setTimeout(() => {
                    scrollToTime(centerTime);
                }, 100);
                return;
            }
        }
    }
    
    // Находим ближайшую серую метку (центр письма) до текущего времени
    let nearestLetter = null;
    let nearestDistance = Infinity;
    let nearestIsBefore = false;
    
    for (const letter of allLettersData) {
        const startTime = parseDateTimeStr(letter.start_datetime_str);
        const endTime = parseDateTimeStr(letter.end_datetime_str);
        
        if (!startTime || !endTime) continue;
        
        const centerTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
        const distance = Math.abs(centerTime - currentTime);
        
        // Предпочитаем метку до текущего времени, но если следующая ближе - используем предыдущую
        if (centerTime <= currentTime) {
            if (distance < nearestDistance || !nearestIsBefore) {
                nearestLetter = letter;
                nearestDistance = distance;
                nearestIsBefore = true;
            }
        } else if (!nearestIsBefore && distance < nearestDistance) {
            // Если не нашли метку до текущего времени, ищем ближайшую после
            nearestLetter = letter;
            nearestDistance = distance;
        }
    }
    
    // Также проверяем письмо из левой колонки, которое происходит сейчас
    let currentLetter = null;
    for (const letter of lettersData) {
        if (!letter.id.endsWith('a')) continue;
        
        const startTime = parseDateTimeStr(letter.start_datetime_str);
        const endTime = parseDateTimeStr(letter.end_datetime_str);
        
        if (!startTime || !endTime) continue;
        
        if (currentTime >= startTime && currentTime <= endTime) {
            currentLetter = letter;
            break;
        }
    }
    
    // Используем текущее письмо, если найдено, иначе ближайшую метку
    const targetLetter = currentLetter || nearestLetter;
    
    if (targetLetter) {
        const startTime = parseDateTimeStr(targetLetter.start_datetime_str);
        const endTime = parseDateTimeStr(targetLetter.end_datetime_str);
        
        if (startTime && endTime) {
            const centerTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
            const percent = ((centerTime - minTime) / (maxTime - minTime)) * 100;
            moveSliderToPercent(percent);
            
            setTimeout(() => {
                scrollToTime(centerTime);
            }, 100);
            return;
        }
    }
    
    // Если ничего не найдено, используем текущее время
    const percent = ((currentTime - minTime) / (maxTime - minTime)) * 100;
    moveSliderToPercent(percent);
    setTimeout(() => {
        scrollToTime(currentTime);
    }, 100);
}

// Обновление текущего времени
function updateCurrentTime() {
    fetch('/api/current_time')
        .then(response => response.json())
        .then(data => {
            // Парсим текущее время из строки "DD.MM HH:MM"
            const parts = data.time.split(' ');
            if (parts.length === 2) {
                const datePart = parts[0].split('.');
                const timePart = parts[1].split(':');
                if (datePart.length === 2 && timePart.length === 2) {
                    const day = parseInt(datePart[0]);
                    const month = parseInt(datePart[1]);
                    const hour = parseInt(timePart[0]);
                    const minute = parseInt(timePart[1]);
                    const year = month === 12 ? 2024 : 2025;
                    currentTime = new Date(year, month - 1, day, hour, minute);
                }
            }
        })
        .catch(error => {
            console.error('Ошибка получения времени:', error);
        });
}

// Установка ползунка на текущее время
function setSliderToCurrentTime() {
    if (currentTime && minTime && maxTime) {
        const percent = ((currentTime - minTime) / (maxTime - minTime)) * 100;
        moveSliderToPercent(percent);
    } else {
        // Если текущее время еще не загружено, ставим в начало
        moveSliderToPercent(0);
    }
}


// Открытие модального окна с деталями письма
function openLetterModal(letter) {
    const modal = document.getElementById('letter-modal');
    if (!modal) return;
    
    // Получаем полную информацию о письме через API
    fetch(`/api/letter/${letter.id}`)
        .then(response => response.json())
        .then(fullLetter => {
            document.getElementById('modal-image').textContent = fullLetter.image || '📄';
            document.getElementById('modal-title').textContent = fullLetter.title;
            document.getElementById('modal-date').textContent = fullLetter.date;
            document.getElementById('modal-start').textContent = fullLetter.start_time;
            
            // Форматируем продолжительность
            const duration = fullLetter.duration || '-';
            document.getElementById('modal-duration').textContent = duration;
            
            // Форматируем время окончания
            let endTime = '-';
            if (fullLetter.end_time && fullLetter.end_time !== '-') {
                endTime = fullLetter.end_time;
            } else if (fullLetter.end_datetime_str) {
                const endDt = parseDateTimeStr(fullLetter.end_datetime_str);
                if (endDt) {
                    const formatted = formatDateTime(endDt);
                    endTime = formatted.time;
                }
            }
            document.getElementById('modal-end').textContent = endTime;
            
            document.getElementById('modal-description').textContent = fullLetter.description || '';
            
            modal.classList.add('active');
        })
        .catch(error => {
            console.error('Ошибка загрузки деталей письма:', error);
            // Используем данные из letter как fallback
            document.getElementById('modal-image').textContent = letter.image || '📄';
            document.getElementById('modal-title').textContent = letter.title;
            document.getElementById('modal-date').textContent = letter.date;
            document.getElementById('modal-start').textContent = letter.start_time;
            document.getElementById('modal-duration').textContent = letter.duration || '-';
            document.getElementById('modal-end').textContent = letter.end_time || '-';
            document.getElementById('modal-description').textContent = letter.description || '';
            modal.classList.add('active');
        });
}

// Закрытие модального окна
function closeLetterModal() {
    const modal = document.getElementById('letter-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(e) {
    const modal = document.getElementById('letter-modal');
    if (modal && e.target === modal) {
        closeLetterModal();
    }
});

// Переключение режима осмотра
function toggleInspectionMode() {
    inspectionMode = !inspectionMode;
    const tableSurface = document.getElementById('table-surface');
    const timeScaleContainer = document.querySelector('.time-scale-container');
    const btnInspect = document.getElementById('btn-inspect');
    
    if (!tableSurface) return;
    
    if (inspectionMode) {
        // Включаем режим осмотра
        // Сохраняем исходные позиции и свойства писем
        originalLetterPositions = [];
        const letters = tableSurface.querySelectorAll('.letter');
        letters.forEach(letterEl => {
            const letterId = letterEl.dataset.letterId;
            const letter = letterId ? lettersData.find(l => l.id === letterId) : null;
            
            // Сохраняем оригинальное содержимое
            const originalHTML = letterEl.innerHTML;
            
            originalLetterPositions.push({
                element: letterEl,
                top: letterEl.style.top,
                left: letterEl.style.left,
                height: letterEl.style.height,
                width: letterEl.style.width,
                transform: letterEl.style.transform,
                transformOrigin: letterEl.style.transformOrigin,
                rotation: letterEl.dataset.rotation,
                className: letterEl.className,
                innerHTML: originalHTML // Сохраняем оригинальное содержимое
            });
        });
        
        // Скрываем временную шкалу
        if (timeScaleContainer) {
            timeScaleContainer.classList.add('hidden');
        }
        
        // Меняем стиль кнопки
        if (btnInspect) {
            btnInspect.classList.add('active');
            btnInspect.textContent = '📋 Сортировка писем';
        }
        
        // Применяем режим осмотра к письмам
        applyInspectionMode();
        
        // Прокручиваем к верху страницы
        const tableContainer = document.getElementById('table-container');
        if (tableContainer) {
            tableContainer.scrollTop = 0;
        }
    } else {
        // Выключаем режим осмотра - возвращаем все обратно
        // Показываем временную шкалу
        if (timeScaleContainer) {
            timeScaleContainer.classList.remove('hidden');
        }
        
        // Меняем стиль кнопки
        if (btnInspect) {
            btnInspect.classList.remove('active');
            btnInspect.textContent = '🔍 Осмотр желаний';
        }
        
        // Показываем обратно специальные письма
        const specialLetters = tableSurface.querySelectorAll('.letter.special');
        specialLetters.forEach(el => el.style.display = '');
        
        // Прокручиваем к верху страницы
        const tableContainer = document.getElementById('table-container');
        if (tableContainer) {
            tableContainer.scrollTop = 0;
        }
        
        // Восстанавливаем исходные позиции и свойства
        originalLetterPositions.forEach(saved => {
            if (saved.element && saved.element.parentNode) {
                saved.element.style.top = saved.top;
                saved.element.style.left = saved.left || '';
                saved.element.style.height = saved.height;
                saved.element.style.width = saved.width || '';
                saved.element.style.transform = saved.transform;
                saved.element.style.transformOrigin = saved.transformOrigin || 'top center';
                saved.element.dataset.rotation = saved.rotation;
                saved.element.className = saved.className;
                
                // Восстанавливаем оригинальное содержимое
                if (saved.innerHTML) {
                    saved.element.innerHTML = saved.innerHTML;
                }
                
                // Убираем класс режима осмотра
                saved.element.classList.remove('inspection-mode', 'inspection-left', 'inspection-right');
            }
        });
        
        originalLetterPositions = [];
    }
}

// Применение режима осмотра к письмам
function applyInspectionMode() {
    const tableSurface = document.getElementById('table-surface');
    if (!tableSurface) return;
    
    // Скрываем специальные письма в режиме осмотра
    const specialLetters = tableSurface.querySelectorAll('.letter.special');
    specialLetters.forEach(el => el.style.display = 'none');
    
    const letters = tableSurface.querySelectorAll('.letter:not(.special)');
    const containerWidth = tableSurface.offsetWidth;
    const centerX = containerWidth / 2;
    
    // Разделяем письма на колонки a и b
    const columnA = [];
    const columnB = [];
    
    letters.forEach(letterEl => {
        const letterId = letterEl.dataset.letterId;
        if (!letterId) return;
        
        // Находим данные письма
        const letter = lettersData.find(l => l.id === letterId);
        if (!letter) return;
        
        // Заменяем содержимое письма на простое (время и название, печатным шрифтом)
        letterEl.innerHTML = `
            <div class="inspection-time">${letter.start_time}</div>
            <div class="inspection-title">${letter.title}</div>
        `;
        
        // Добавляем класс для режима осмотра
        letterEl.classList.add('inspection-mode');
        
        if (letterId.endsWith('a')) {
            columnA.push({ element: letterEl, letter: letter });
        } else if (letterId.endsWith('b')) {
            columnB.push({ element: letterEl, letter: letter });
        }
    });
    
    // Сортируем колонки по времени начала
    columnA.sort((a, b) => {
        const timeA = parseDateTimeStr(a.letter.start_datetime_str);
        const timeB = parseDateTimeStr(b.letter.start_datetime_str);
        return timeA - timeB;
    });
    
    columnB.sort((a, b) => {
        const timeA = parseDateTimeStr(a.letter.start_datetime_str);
        const timeB = parseDateTimeStr(b.letter.start_datetime_str);
        return timeA - timeB;
    });
    
    // Левая колонка A - вертикальный список, высота по содержимому
    // Левая колонка теперь такой же ширины как правая
    const leftColumnWidth = 300; // Такая же ширина как правая колонка
    const rightColumnWidth = 300;
    const spacing = 15;
    const gapBetweenColumns = 50; // Расстояние между колонками
    
    // Вычисляем позицию так, чтобы общий центр колонок был по центру экрана
    // Общая ширина: leftColumnWidth + gapBetweenColumns + rightColumnWidth = 450 + 50 + 300 = 800
    // Центр должен быть на centerX, значит левый край левой колонки на centerX - 400
    const leftColumnStart = centerX - (leftColumnWidth + gapBetweenColumns + rightColumnWidth) / 2;
    const rightColumnStart = leftColumnStart + leftColumnWidth + gapBetweenColumns;
    
    // Сначала позиционируем все элементы левой колонки и сохраняем их позиции
    const columnAPositions = [];
    let topPositionA = 50;
    
    // Применяем стили ко всем элементам левой колонки
    columnA.forEach((itemA) => {
        const letterEl = itemA.element;
        const letter = itemA.letter;
        
        letterEl.style.left = `${leftColumnStart}px`;
        letterEl.style.width = `${leftColumnWidth}px`;
        letterEl.style.height = 'auto';
        letterEl.style.transform = 'none';
        letterEl.style.transformOrigin = 'top left';
        letterEl.style.rotation = '0deg';
        letterEl.classList.remove('single', 'double', 'left', 'right', 'inspection-wide', 'inspection-narrow', 'inspection-left', 'inspection-right');
        letterEl.classList.add('inspection-left');
        
        const startTime = parseDateTimeStr(letter.start_datetime_str);
        const endTime = parseDateTimeStr(letter.end_datetime_str);
        
        columnAPositions.push({
            element: letterEl,
            letter: letter,
            startTime: startTime,
            endTime: endTime
        });
    });
    
    // Используем requestAnimationFrame для получения реальных высот после применения стилей
    requestAnimationFrame(() => {
        // Позиционируем элементы левой колонки с учетом их реальных высот
        columnAPositions.forEach((posA) => {
            posA.top = topPositionA;
            posA.element.style.top = `${topPositionA}px`;
            
            const height = posA.element.offsetHeight;
            topPositionA += height + spacing;
        });
        
        // Теперь позиционируем правую колонку B относительно левой
        columnB.forEach(itemB => {
            const letterEl = itemB.element;
            const letter = itemB.letter;
            const startTimeB = parseDateTimeStr(letter.start_datetime_str);
            
            if (!startTimeB) return;
            
            // Находим соответствующий элемент из левой колонки, который перекрывается по времени
            let matchedA = null;
            for (const posA of columnAPositions) {
                if (posA.startTime && posA.endTime) {
                    // Проверяем, попадает ли начало письма B в диапазон письма A
                    if (startTimeB >= posA.startTime && startTimeB <= posA.endTime) {
                        matchedA = posA;
                        break;
                    }
                }
            }
            
            if (matchedA && matchedA.startTime && matchedA.endTime && matchedA.top !== undefined) {
                // Вычисляем относительную позицию внутри письма A
                const durationA = matchedA.endTime - matchedA.startTime;
                const offsetFromStart = startTimeB - matchedA.startTime;
                const relativePosition = offsetFromStart / durationA; // 0.0 - 1.0
                
                // Получаем реальную высоту письма A
                const heightA = matchedA.element.offsetHeight;
                
                // Вычисляем позицию верха письма B внутри письма A
                const topB = matchedA.top + (relativePosition * heightA);
                
                letterEl.style.top = `${topB}px`;
            } else {
                // Если не найдено соответствующее письмо A, позиционируем в начале
                letterEl.style.top = '50px';
            }
            
            letterEl.style.left = `${rightColumnStart}px`;
            letterEl.style.width = `${rightColumnWidth}px`;
            letterEl.style.height = 'auto';
            letterEl.style.transform = 'none';
            letterEl.style.transformOrigin = 'top left';
            letterEl.style.rotation = '0deg';
            letterEl.classList.remove('single', 'double', 'left', 'right', 'inspection-wide', 'inspection-narrow', 'inspection-left', 'inspection-right');
            letterEl.classList.add('inspection-right');
        });
        
        // Обновляем высоту поверхности после позиционирования всех элементов
        requestAnimationFrame(() => {
            setTimeout(() => {
                const letters = tableSurface.querySelectorAll('.letter');
                let maxBottom = 0;
                letters.forEach(letterEl => {
                    const top = parseFloat(letterEl.style.top) || 0;
                    const height = letterEl.offsetHeight;
                    maxBottom = Math.max(maxBottom, top + height);
                });
                tableSurface.style.minHeight = `${maxBottom + 100}px`;
            }, 100);
        });
    });
}

// Переход на страницу почтового ящика
function goToMailbox() {
    window.location.href = '/';
}

// Экспорт функций для глобального доступа
window.goToCurrentTime = goToCurrentTime;
window.closeLetterModal = closeLetterModal;
window.toggleInspectionMode = toggleInspectionMode;
window.goToMailbox = goToMailbox;
window.openWaitingModal = openWaitingModal;
window.openGiftModal = openGiftModal;

