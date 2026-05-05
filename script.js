// ============================================================
// BEKTUWOE - Main Application Script (Enhanced)
// ============================================================

// ---------- STORAGE KEYS ----------
const STORAGE_USERS = 'bektuwoe_users';
const STORAGE_TASKS = 'bektuwoe_tasks';
const STORAGE_SESSION = 'bektuwoe_session';
const STORAGE_MATAKULIAH = 'bektuwoe_matkul';

// Emoji untuk mata kuliah
const matkulEmojis = {
    'default': '📚',
    'Pemrograman Web': '🌐',
    'Basis Data': '🗄️',
    'Jaringan Komputer': '🌍',
    'Kecerdasan Buatan': '🤖',
    'Pemrograman Mobile': '📱',
    'HCI': '🎨',
    'Data Mining': '📊',
    'Statistika': '📈',
    'Jaringan Komputer': '🔒'
};

// Default mata kuliah
const defaultMatkul = [
    { name: 'Pemrograman Web', emoji: '🌐' },
    { name: 'Basis Data', emoji: '🗄️' },
    { name: 'Jaringan Komputer', emoji: '🌍' },
    { name: 'Artificial Inteligence', emoji: '🤖' },
    { name: 'Pemrograman Mobile', emoji: '📱' }
];

// ---------- GLOBAL VARIABLES ----------
let currentUser = null;
let tasks = [];
let currentFilter = 'all';
let mataKuliahList = [];
let notificationInterval = null;
let timePicker = null;

// ---------- HELPER FUNCTIONS ----------

// Show/hide error message
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 3000);
    }
}

function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove('hidden');
        setTimeout(() => {
            successEl.classList.add('hidden');
        }, 3000);
    }
}

// Toggle password visibility
function setupPasswordToggle(toggleId, inputId) {
    const toggleBtn = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (toggleBtn && input) {
        toggleBtn.addEventListener('click', () => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

// Get emoji for mata kuliah
function getMatkulEmoji(matkulName) {
    const found = mataKuliahList.find(m => m.name === matkulName);
    if (found && found.emoji) return found.emoji;
    return matkulEmojis[matkulName] || '📚';
}

// Load mata kuliah from localStorage
function loadMataKuliah() {
    const stored = localStorage.getItem(`${STORAGE_MATAKULIAH}_${currentUser?.id}`);
    if (stored) {
        mataKuliahList = JSON.parse(stored);
    } else {
        mataKuliahList = [...defaultMatkul];
        saveMataKuliah();
    }
    renderMataKuliahSelect();
}

// Save mata kuliah
function saveMataKuliah() {
    if (currentUser) {
        localStorage.setItem(`${STORAGE_MATAKULIAH}_${currentUser.id}`, JSON.stringify(mataKuliahList));
    }
}

// Add new mata kuliah
function addMataKuliah() {
    const newMatkul = prompt('Masukkan nama mata kuliah baru:', '');
    if (!newMatkul || !newMatkul.trim()) return;

    const emoji = prompt('Masukkan emoji untuk mata kuliah ini (contoh: 📚, 💻, 🎨):', '📚');

    mataKuliahList.push({
        name: newMatkul.trim(),
        emoji: emoji || '📚'
    });

    saveMataKuliah();
    renderMataKuliahSelect();

    // Auto-select the new mata kuliah
    const select = document.getElementById('todo-matkul');
    if (select) {
        select.value = newMatkul.trim();
    }
}

// Render mata kuliah select dropdown
function renderMataKuliahSelect() {
    const select = document.getElementById('todo-matkul');
    if (!select) return;

    select.innerHTML = '<option value="">Pilih Mata Kuliah...</option>';
    mataKuliahList.forEach(mk => {
        const option = document.createElement('option');
        option.value = mk.name;
        option.textContent = `${mk.emoji} ${mk.name}`;
        select.appendChild(option);
    });
}

// ---------- AUTH FUNCTIONS ----------

// Switch between login and register tabs
function switchTab(tab) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('tab-active');
        loginTab.classList.remove('tab-inactive');
        registerTab.classList.add('tab-inactive');
        registerTab.classList.remove('tab-active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerTab.classList.add('tab-active');
        registerTab.classList.remove('tab-inactive');
        loginTab.classList.add('tab-inactive');
        loginTab.classList.remove('tab-active');
    }
}

// Handle login
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showError('login-error', 'Email dan password harus diisi!');
        return;
    }

    const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showError('login-error', 'Email atau password salah!');
        return;
    }

    // Save session
    currentUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(currentUser));

    // Load user's data
    loadMataKuliah();
    loadTasksForUser(user.id);

    // Start notification checker
    startNotificationChecker();

    // Show app page
    showAppPage();
}

// Handle register
function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!name || !email || !password || !confirm) {
        showError('register-error', 'Semua field harus diisi!');
        return;
    }

    if (password.length < 6) {
        showError('register-error', 'Password minimal 6 karakter!');
        return;
    }

    if (password !== confirm) {
        showError('register-error', 'Password dan konfirmasi tidak cocok!');
        return;
    }

    const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');

    if (users.some(u => u.email === email)) {
        showError('register-error', 'Email sudah terdaftar!');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

    showSuccess('register-success', 'Pendaftaran berhasil! Silakan login.');

    setTimeout(() => {
        switchTab('login');
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = '';
    }, 1500);
}

// Handle logout
function handleLogout() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
    localStorage.removeItem(STORAGE_SESSION);
    currentUser = null;
    tasks = [];
    showAuthPage();
}

// Check if user is already logged in
function checkSession() {
    const session = localStorage.getItem(STORAGE_SESSION);
    if (session) {
        currentUser = JSON.parse(session);
        loadMataKuliah();
        loadTasksForUser(currentUser.id);
        startNotificationChecker();
        showAppPage();
    } else {
        showAuthPage();
    }
}

// Show auth page, hide app page
function showAuthPage() {
    document.getElementById('auth-page').classList.remove('hidden');
    document.getElementById('app-page').classList.add('hidden');

    // Clear forms
    const inputs = ['login-email', 'login-password', 'reg-name', 'reg-email', 'reg-password', 'reg-confirm'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// Show app page, hide auth page
function showAppPage() {
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('app-page').classList.remove('hidden');

    // Update greeting
    document.getElementById('user-greeting').textContent = `Halo, ${currentUser.name}!`;

    // Initialize time picker with default today
    initTimePicker();

    // Render tasks
    renderTasks();
}

// Initialize time picker with today as default
function initTimePicker() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}T09:00`;

    timePicker = flatpickr("#todo-time", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        defaultDate: defaultDate,
        minDate: "today",
        locale: {
            firstDayOfWeek: 1,
            weekdays: {
                shorthand: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
                longhand: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
            },
            months: {
                shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
                longhand: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
            }
        }
    });
}

// ---------- TASK FUNCTIONS ----------

// Load tasks for specific user
function loadTasksForUser(userId) {
    const allTasks = JSON.parse(localStorage.getItem(STORAGE_TASKS) || '{}');
    tasks = allTasks[userId] || [];
    renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
    if (!currentUser) return;
    const allTasks = JSON.parse(localStorage.getItem(STORAGE_TASKS) || '{}');
    allTasks[currentUser.id] = tasks;
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(allTasks));
}

// Parse checklist from description text
function parseChecklist(descText) {
    if (!descText) return { text: '', checklist: [] };

    const lines = descText.split('\n');
    const checklist = [];
    const otherLines = [];

    lines.forEach(line => {
        if (line.trim().startsWith('-')) {
            checklist.push({
                text: line.trim().substring(1).trim(),
                completed: false
            });
        } else if (line.trim()) {
            otherLines.push(line);
        }
    });

    return {
        text: otherLines.join('\n'),
        checklist: checklist
    };
}

// Add new task
function addTask() {
    const matkulSelect = document.getElementById('todo-matkul');
    const matkul = matkulSelect.value;
    const taskName = document.getElementById('todo-task').value.trim();
    const timeValue = document.getElementById('todo-time').value;
    const description = document.getElementById('todo-desc').value;

    if (!matkul) {
        showError('form-error', 'Pilih mata kuliah terlebih dahulu!');
        return;
    }

    if (!taskName) {
        showError('form-error', 'Nama tugas harus diisi!');
        return;
    }

    if (!timeValue) {
        showError('form-error', 'Pilih waktu pengerjaan!');
        return;
    }

    const parsedChecklist = parseChecklist(description);

    const newTask = {
        id: Date.now().toString(),
        matkul: matkul,
        name: taskName,
        scheduledTime: timeValue,
        description: parsedChecklist.text,
        checklist: parsedChecklist.checklist,
        completed: false,
        createdAt: new Date().toISOString(),
        notified: false
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Clear inputs, keep mata kuliah selected
    document.getElementById('todo-task').value = '';
    document.getElementById('todo-desc').value = '';
    // Reset time picker to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    if (timePicker) {
        timePicker.setDate(nextHour);
    }
}

// Toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Toggle checklist item
function toggleChecklist(taskId, checklistIndex) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.checklist && task.checklist[checklistIndex]) {
        task.checklist[checklistIndex].completed = !task.checklist[checklistIndex].completed;
        saveTasks();
        renderTasks();
    }
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Hapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

// Edit task
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newMatkul = prompt('Edit Mata Kuliah:', task.matkul);
    if (newMatkul === null) return;

    const newName = prompt('Edit Nama Tugas:', task.name);
    if (newName === null) return;

    const newTime = prompt('Edit Waktu (YYYY-MM-DD HH:MM):', task.scheduledTime);
    if (newTime === null) return;

    if (newMatkul.trim()) task.matkul = newMatkul.trim();
    if (newName.trim()) task.name = newName.trim();
    if (newTime.trim()) task.scheduledTime = newTime;

    saveTasks();
    renderTasks();
}

// Clear all completed tasks
function clearDone() {
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length === tasks.length) return;

    if (confirm('Hapus semua tugas yang sudah selesai?')) {
        tasks = incompleteTasks;
        saveTasks();
        renderTasks();
    }
}

// Check if task time has arrived and send notification
function checkTaskNotifications() {
    const now = new Date();
    const currentTime = now.toISOString().slice(0, 16).replace('T', ' ');

    tasks.forEach(task => {
        if (!task.completed && !task.notified && task.scheduledTime) {
            const taskTime = task.scheduledTime.replace('T', ' ');
            const taskDate = new Date(task.scheduledTime);

            // Check if task time is within last minute
            const timeDiff = Math.abs(taskDate - now);

            if (timeDiff <= 60000) { // Within 1 minute
                // Show notification
                if (Notification.permission === 'granted') {
                    new Notification('BekTuWoe - Pengingat Tugas', {
                        body: `📚 ${task.matkul}\n📝 ${task.name}\n⏰ Waktunya mengerjakan!`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png'
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(perm => {
                        if (perm === 'granted') {
                            new Notification('BekTuWoe - Pengingat Tugas', {
                                body: `📚 ${task.matkul}\n📝 ${task.name}\n⏰ Waktunya mengerjakan!`,
                                icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png'
                            });
                        }
                    });
                }

                // Also show alert
                alert(`🔔 PENGINGAT TUGAS!\n\nMata Kuliah: ${task.matkul}\nTugas: ${task.name}\n\nWaktunya mengerjakan tugas ini!`);

                // Play sound if available
                const audio = document.getElementById('notification-sound');
                if (audio) {
                    audio.play().catch(e => console.log('Audio play failed:', e));
                }

                task.notified = true;
                saveTasks();

                // Highlight task with animation
                const taskElement = document.querySelector(`.todo-item[data-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.classList.add('todo-notification');
                    setTimeout(() => {
                        taskElement.classList.remove('todo-notification');
                    }, 3000);
                }
            }
        }
    });
}

// Start periodic notification checking
function startNotificationChecker() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    // Check every 30 seconds
    notificationInterval = setInterval(() => {
        if (currentUser) {
            checkTaskNotifications();
        }
    }, 30000);

    // Check immediately
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Get time status (today, tomorrow, etc)
function getTimeStatus(scheduledTime) {
    if (!scheduledTime) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(scheduledTime);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays < 0) return 'overdue';
    return 'upcoming';
}

// Format time for display
function formatTime(scheduledTime) {
    if (!scheduledTime) return 'Tidak ada waktu';
    const date = new Date(scheduledTime);
    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Render checklist HTML
function renderChecklistHTML(checklist, taskId) {
    if (!checklist || checklist.length === 0) return '';

    return `
        <ul class="task-checklist mt-2">
            ${checklist.map((item, idx) => `
                <li class="${item.completed ? 'completed' : ''}">
                    <input type="checkbox" ${item.completed ? 'checked' : ''} 
                           onclick="window.toggleChecklist('${taskId}', ${idx})" />
                    <span>${escapeHtml(item.text)}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

// Render tasks based on current filter
function renderTasks() {
    if (!currentUser) return;

    let filteredTasks = [...tasks];

    switch (currentFilter) {
        case 'active':
            filteredTasks = tasks.filter(t => !t.completed);
            break;
        case 'done':
            filteredTasks = tasks.filter(t => t.completed);
            break;
        case 'today':
            filteredTasks = tasks.filter(t => getTimeStatus(t.scheduledTime) === 'today');
            break;
        default:
            filteredTasks = [...tasks];
    }

    // Sort by scheduled time (earlier first)
    filteredTasks.sort((a, b) => {
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return new Date(a.scheduledTime) - new Date(b.scheduledTime);
    });

    // Update task count
    const activeCount = tasks.filter(t => !t.completed).length;
    document.getElementById('task-count').textContent = `${activeCount} tugas tersisa`;

    // Show/hide clear done button
    const hasDoneTasks = tasks.some(t => t.completed);
    const clearBtn = document.getElementById('clear-done-btn');
    if (clearBtn) clearBtn.classList.toggle('hidden', !hasDoneTasks);

    // Empty state
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');

    if (filteredTasks.length === 0) {
        todoList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Render tasks
    todoList.innerHTML = filteredTasks.map(task => {
        const timeStatus = getTimeStatus(task.scheduledTime);
        const timeStatusText = {
            'today': 'Hari ini',
            'tomorrow': 'Besok',
            'overdue': 'Terlambat',
            'upcoming': 'Mendatang'
        }[timeStatus] || '';

        const timeStatusClass = timeStatus === 'overdue' ? 'text-red-500' :
            (timeStatus === 'today' ? 'text-accent font-semibold' : '');

        return `
            <li class="todo-item ${task.completed ? 'todo-done' : ''}" data-id="${task.id}">
                <button class="custom-checkbox w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all duration-200 ${task.completed ? 'bg-done border-done' : 'border-gray-300 hover:border-accent'}" onclick="window.toggleTask('${task.id}')">
                    ${task.completed ? '<i class="fa-solid fa-check text-white text-xs flex items-center justify-center h-full"></i>' : ''}
                </button>
                
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="matkul-badge">
                            ${getMatkulEmoji(task.matkul)} ${escapeHtml(task.matkul)}
                        </span>
                        <span class="time-badge ${timeStatusClass}">
                            <i class="fa-regular fa-clock"></i> ${formatTime(task.scheduledTime)}
                            ${timeStatusText ? ` · ${timeStatusText}` : ''}
                        </span>
                    </div>
                    
                    <p class="text-ink font-medium text-sm sm:text-base break-words ${task.completed ? 'line-through text-muted' : ''}">
                        ${escapeHtml(task.name)}
                    </p>
                    
                    ${task.description ? `<p class="text-muted text-xs mt-1">${escapeHtml(task.description)}</p>` : ''}
                    ${renderChecklistHTML(task.checklist, task.id)}
                </div>
                
                <div class="flex gap-1 flex-shrink-0">
                    <button class="edit-btn p-1.5 text-muted hover:text-accent transition-colors duration-200" onclick="window.editTask('${task.id}')">
                        <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button class="delete-btn p-1.5 text-muted hover:text-red-500 transition-colors duration-200" onclick="window.deleteTask('${task.id}')">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            </li>
        `;
    }).join('');
}

// Set filter and re-render
function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('[data-filter]').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active-filter');
        } else {
            btn.classList.remove('active-filter');
        }
    });

    renderTasks();
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
    // Setup tab switching
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));
    document.getElementById('switch-to-register')?.addEventListener('click', () => switchTab('register'));
    document.getElementById('switch-to-login')?.addEventListener('click', () => switchTab('login'));

    // Setup auth buttons
    document.getElementById('login-btn')?.addEventListener('click', handleLogin);
    document.getElementById('register-btn')?.addEventListener('click', handleRegister);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Setup task buttons
    document.getElementById('add-task-btn')?.addEventListener('click', addTask);
    document.getElementById('clear-done-btn')?.addEventListener('click', clearDone);
    document.getElementById('add-matkul-btn')?.addEventListener('click', addMataKuliah);

    // Setup filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.getAttribute('data-filter'));
        });
    });

    // Setup enter key on task inputs
    const taskInput = document.getElementById('todo-task');
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
    }

    // Setup enter key on login
    const loginPassword = document.getElementById('login-password');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // Setup password toggles
    setupPasswordToggle('toggle-login-password', 'login-password');
    setupPasswordToggle('toggle-reg-password', 'reg-password');

    // Make functions available globally
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
    window.editTask = editTask;
    window.clearDone = clearDone;
    window.toggleChecklist = toggleChecklist;

    // Check session on load
    checkSession();
});