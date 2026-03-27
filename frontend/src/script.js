// ==================== DATA MODELS ====================
let profile = {
    name: '',
    email: '',
    goal: '',
    joinDate: new Date().toISOString()
};

let notes = [];
let habits = [];
let currentNoteId = null;
let habitsChart = null;

// Дополнительные привычки по умолчанию
const defaultHabits = [
    { id: Date.now(), name: '💧 Пить воду', color: '#6366f1', completed: [true, false, true, false, true, false, false] },
    { id: Date.now() + 1, name: '🧘 Зарядка', color: '#10b981', completed: [true, true, false, true, false, true, false] },
    { id: Date.now() + 2, name: '😴 Сон 8 часов', color: '#8b5cf6', completed: [true, true, true, false, false, true, false] },
    { id: Date.now() + 3, name: '🚶 Прогулка', color: '#f59e0b', completed: [false, true, false, true, false, false, true] }
];

// ==================== INITIALIZATION ====================
function loadData() {
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) profile = JSON.parse(savedProfile);
    
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) notes = JSON.parse(savedNotes);
    
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    } else {
        habits = defaultHabits;
    }
    
    // Загрузка темы
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    renderAll();
}

function saveData() {
    localStorage.setItem('profile', JSON.stringify(profile));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('habits', JSON.stringify(habits));
}

function getTodayIndex() {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
}

function getDayIndexForDate(date) {
    const day = new Date(date).getDay();
    return day === 0 ? 6 : day - 1;
}

function renderAll() {
    renderProfile();
    renderNotes();
    renderHabits();
    renderStats();
}

function renderProfile() {
    document.getElementById('userName').value = profile.name || '';
    document.getElementById('userEmail').value = profile.email || '';
    document.getElementById('userGoal').value = profile.goal || '';
    
    const daysSinceJoin = Math.floor((new Date() - new Date(profile.joinDate)) / (1000 * 60 * 60 * 24));
    document.getElementById('totalDays').textContent = daysSinceJoin || 0;
    document.getElementById('totalHabits').textContent = habits.length;
    
    document.getElementById('userName').onchange = (e) => { profile.name = e.target.value; saveData(); };
    document.getElementById('userEmail').onchange = (e) => { profile.email = e.target.value; saveData(); };
    document.getElementById('userGoal').onchange = (e) => { profile.goal = e.target.value; saveData(); };
}

function renderNotes() {
    const container = document.getElementById('notesList');
    if (notes.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;">Нет заметок. Создайте первую!</div>';
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div class="note-card" data-id="${note.id}">
            <div class="note-info">
                <div class="note-title">${escapeHtml(note.title) || 'Без заголовка'}</div>
                <div class="note-preview">${escapeHtml(note.content?.substring(0, 60) || '')}${note.content?.length > 60 ? '...' : ''}</div>
            </div>
            <button class="delete-note-btn" data-id="${note.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-note-btn')) {
                const id = parseInt(card.dataset.id);
                openNoteModal(id);
            }
        });
    });
    
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteNote(id);
        });
    });
}

function renderHabits() {
    const container = document.getElementById('habitsList');
    if (habits.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;">Нет привычек. Добавьте первую!</div>';
        return;
    }
    
    const todayIndex = getTodayIndex();
    
    container.innerHTML = habits.map(habit => `
        <div class="habit-card" style="border-left: 4px solid ${habit.color}">
            <div class="habit-info">
                <div class="habit-name">${escapeHtml(habit.name)}</div>
                <div class="habit-stats">
                    ✅ ${habit.completed.filter(Boolean).length}/7 дней
                </div>
            </div>
            <button class="check-btn ${habit.completed[todayIndex] ? 'completed' : ''}" data-id="${habit.id}">
                ${habit.completed[todayIndex] ? '✓' : '○'}
            </button>
            <button class="delete-habit-btn" data-id="${habit.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.check-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleHabit(id);
        });
    });
    
    document.querySelectorAll('.delete-habit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteHabit(id);
        });
    });
}

function renderStats() {
    document.getElementById('totalNotes').textContent = notes.length;
    
    // Недельная статистика
    const weeklyProgress = new Array(7).fill(0);
    habits.forEach(habit => {
        habit.completed.forEach((completed, index) => {
            if (completed) weeklyProgress[index]++;
        });
    });
    const weeklyData = weeklyProgress.map(count => habits.length > 0 ? count / habits.length : 0);
    
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weeklyContainer = document.getElementById('weeklyStats');
    weeklyContainer.innerHTML = days.map((day, index) => `
        <div class="weekly-day">
            <div class="day-bar">
                <div class="day-fill" style="height: ${weeklyData[index] * 100}%;"></div>
            </div>
            <div class="day-label">${day}</div>
            <small>${Math.round(weeklyData[index] * 100)}%</small>
        </div>
    `).join('');
    
    // График
    const ctx = document.getElementById('habitsChart').getContext('2d');
    const habitNames = habits.map(h => h.name);
    const habitSuccess = habits.map(h => (h.completed.filter(Boolean).length / 7) * 100);
    
    if (habitsChart) habitsChart.destroy();
    habitsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: habitNames,
            datasets: [{
                label: 'Выполнение (%)',
                data: habitSuccess,
                backgroundColor: habits.map(h => h.color),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderSelectedDayStats(date) {
    if (!date) return;
    const dayIndex = getDayIndexForDate(date);
    const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    const container = document.getElementById('selectedDayStats');
    container.innerHTML = `<h4>${dayNames[dayIndex]}, ${date}</h4>`;
    
    habits.forEach(habit => {
        const completed = habit.completed[dayIndex];
        container.innerHTML += `
            <div class="habit-item">
                <span style="color: ${habit.color}">${escapeHtml(habit.name)}</span>
                <span>${completed ? '✅ Выполнено' : '❌ Не выполнено'}</span>
            </div>
        `;
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== NOTES CRUD ====================
function openNoteModal(id = null) {
    currentNoteId = id;
    const modal = document.getElementById('noteModal');
    const deleteBtn = document.getElementById('deleteNoteBtn');
    
    if (id) {
        const note = notes.find(n => n.id === id);
        if (note) {
            document.getElementById('noteModalTitle').textContent = 'Редактировать заметку';
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            deleteBtn.classList.remove('hidden');
        }
    } else {
        document.getElementById('noteModalTitle').textContent = 'Новая заметка';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        deleteBtn.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    
    if (currentNoteId) {
        const index = notes.findIndex(n => n.id === currentNoteId);
        if (index !== -1) {
            notes[index] = { ...notes[index], title, content };
        }
    } else {
        notes.unshift({ id: Date.now(), title, content });
    }
    
    saveData();
    renderNotes();
    closeModals();
}

function deleteNote(id) {
    if (confirm('Удалить заметку?')) {
        notes = notes.filter(n => n.id !== id);
        saveData();
        renderNotes();
        renderStats();
        closeModals();
    }
}

// ==================== HABITS CRUD ====================
function openHabitModal() {
    document.getElementById('habitModal').classList.remove('hidden');
    document.getElementById('habitName').value = '';
}

function saveHabit() {
    const name = document.getElementById('habitName').value;
    const color = document.getElementById('habitColor').value;
    
    if (!name.trim()) {
        alert('Введите название привычки');
        return;
    }
    
    habits.push({
        id: Date.now(),
        name: name.trim(),
        color: color,
        completed: new Array(7).fill(false)
    });
    
    saveData();
    renderHabits();
    renderStats();
    closeModals();
}

function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        const todayIndex = getTodayIndex();
        habit.completed[todayIndex] = !habit.completed[todayIndex];
        saveData();
        renderHabits();
        renderStats();
    }
}

function deleteHabit(id) {
    if (confirm('Удалить привычку?')) {
        habits = habits.filter(h => h.id !== id);
        saveData();
        renderHabits();
        renderStats();
    }
}

// ==================== THEME TOGGLE ====================
function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// ==================== MODAL HANDLERS ====================
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    currentNoteId = null;
}

// ==================== TAB NAVIGATION ====================
function initTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabs = {
        profile: document.getElementById('profileTab'),
        notes: document.getElementById('notesTab'),
        habits: document.getElementById('habitsTab'),
        stats: document.getElementById('statsTab')
    };
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.values(tabs).forEach(tab => tab.classList.remove('active'));
            tabs[tabName].classList.add('active');
            
            const titles = {
                profile: 'Профиль',
                notes: 'Заметки',
                habits: 'Привычки',
                stats: 'Статистика'
            };
            document.getElementById('headerTitle').textContent = titles[tabName];
            
            if (tabName === 'stats') renderStats();
        });
    });
}

// ==================== DATE PICKER ====================
function initDatePicker() {
    const datePicker = document.getElementById('datePicker');
    datePicker.value = new Date().toISOString().split('T')[0];
    renderSelectedDayStats(datePicker.value);
    
    datePicker.addEventListener('change', (e) => {
        renderSelectedDayStats(e.target.value);
    });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTabs();
    initThemeToggle();
    initDatePicker();
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    document.getElementById('addNoteBtn').addEventListener('click', () => openNoteModal(null));
    document.getElementById('addHabitBtn').addEventListener('click', openHabitModal);
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('deleteNoteBtn').addEventListener('click', () => {
        if (currentNoteId) deleteNote(currentNoteId);
    });
    document.getElementById('saveHabitBtn').addEventListener('click', saveHabit);
    document.getElementById('editAvatarBtn').addEventListener('click', () => {
        alert('Функция смены аватара будет доступна в следующей версии!');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModals();
    });
});