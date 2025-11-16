/* =========================================================
   SMARTSCORES APP v3.0 - CLEAN EDITION
   by Kariuki (2025)
   Focus: Data management, rendering, calculations, and central control
========================================================= */

// NOTE: Using a single TEACHER key for simplicity and consistency with auth.js
const STORAGE_KEYS = {
    RECORDS: 'smartScoresRecords',
    TARGETS: 'smartScoresTargets', 
    TEACHER_FULL_NAME: 'teacherFullName', // Retain for consistency with auth.js
    TEACHER_FIRST_NAME: 'teacherFirstName', // Retain for consistency with auth.js
    TEACHER_LAST_NAME: 'teacherLastName', // Retain for consistency with auth.js
    TEACHER: 'teacherFullName', // CRITICAL FIX: The key used by the init block
    THEME: 'themeMode'
};

// DOM Helper
const el = id => document.getElementById(id);

// Alert Helper - Replaced alert() with a console log or custom UI
// NOTE: Since we cannot implement a custom UI here, using console for error reporting.
const showAlert = (message, type = 'info') => {
    // In a production environment, this would show a Toast or Modal UI.
    console.error(`APP ALERT (${type.toUpperCase()}): ${message}`);
};

// ==================== STORAGE MANAGEMENT ====================
const loadData = (key, defaultValue = []) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading data:', error);
        return defaultValue;
    }
};

const saveData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showAlert('Error saving data', 'error');
        return false;
    }
};

const loadRecords = () => loadData(STORAGE_KEYS.RECORDS);
const saveRecords = (records) => saveData(STORAGE_KEYS.RECORDS, records);
const loadTargets = () => loadData(STORAGE_KEYS.TARGETS);
const saveTargets = (targets) => saveData(STORAGE_KEYS.TARGETS, targets);

// ==================== TEACHER NAME UTILITY ====================
// CRITICAL FIX: Simplified and fixed the teacher name retrieval logic
const getTeacherName = () => {
    // This relies on the core key defined in AUTH_KEYS (via auth.js) and STORAGE_KEYS
    return localStorage.getItem(STORAGE_KEYS.TEACHER) || 'Guest Teacher';
};

// ==================== UI HELPERS ====================

// NEW: Handles the dark/light theme loading
const loadTheme = () => {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', theme);
};
window.toggleDarkMode = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
};

// NEW: Auto-fills the current year on data entry page
const autoFillYear = () => {
    const yearInput = el('year');
    if (yearInput && !yearInput.value.trim()) {
      yearInput.value = new Date().getFullYear();
    }
};

// NEW: Setup mobile sidebar closing on link click
const setupMobileSidebarAutoClose = () => {
    const mobileSidebar = el('mobileSidebar');
    const mobileMenuToggle = el('mobileMenuToggle');
    if (mobileSidebar && mobileMenuToggle) {
        const mobileLinks = mobileSidebar.querySelectorAll('a, button');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (!mobileSidebar.classList.contains('closed')) {
                    mobileSidebar.classList.add('closed');
                    mobileMenuToggle.textContent = '☰';
                }
            });
        });
    }
};
window.toggleMobileMenu = () => {
    const mobileSidebar = el('mobileSidebar');
    const mobileMenuToggle = el('mobileMenuToggle');
    if (mobileSidebar) {
        mobileSidebar.classList.toggle('closed');
        mobileMenuToggle.textContent = mobileSidebar.classList.contains('closed') ? '☰' : '✕';
    }
};


// ==================== HANDLERS (CRITICAL ADDITIONS) ====================

// Placeholder for data entry saving
const handleSaveRecord = (event) => {
    event.preventDefault();
    const form = event.target;
    
    // Simple form validation
    const studentId = form.studentId.value.trim();
    const score = parseInt(form.score.value);
    
    if (!studentId || isNaN(score) || score < 0 || score > 100) {
        showAlert('Please enter a valid Student ID and Score (0-100).', 'error');
        return;
    }

    const newRecord = {
        id: Date.now(),
        studentId: studentId,
        score: score,
        subject: form.subject.value,
        term: form.term.value,
        year: form.year.value,
        teacher: getTeacherName(), // Use the centralized function
        date: new Date().toISOString().split('T')[0]
    };

    const records = loadRecords();
    records.push(newRecord);

    if (saveRecords(records)) {
        showAlert('Record saved successfully.', 'success');
        form.reset();
        autoFillYear(); // Re-fill year after reset
        renderAll();
    }
};

// Placeholder for target saving
const handleSaveTarget = (event) => {
    event.preventDefault();
    const form = event.target;
    
    // Simple validation
    const subject = form.targetSubject.value;
    const target = parseInt(form.targetScore.value);
    
    if (!subject || isNaN(target) || target < 0 || target > 100) {
        showAlert('Please enter a valid Subject and Target Score (0-100).', 'error');
        return;
    }

    const newTarget = {
        id: Date.now(),
        subject: subject,
        target: target,
        teacher: getTeacherName(),
        date: new Date().toISOString().split('T')[0]
    };

    const targets = loadTargets();
    // Prevent duplicates for the same subject/teacher
    const existingIndex = targets.findIndex(t => t.subject === subject);
    if (existingIndex > -1) {
        targets[existingIndex] = newTarget; // Overwrite existing target
        showAlert(`Target for ${subject} updated successfully.`, 'success');
    } else {
        targets.push(newTarget);
        showAlert('New target saved successfully.', 'success');
    }
    
    if (saveTargets(targets)) {
        form.reset();
        renderAll();
    }
};

// Placeholder for filter functions
const filterRecords = () => {
    // Logic to filter records based on searchInput value
    const searchInput = el('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    console.log('Filtering records with:', searchTerm);
    // In a real app: re-render the scores table with filtered data
    // Example: renderRecordsTable(loadRecords().filter(...))
};
const filterTargets = () => {
    // Logic to filter targets based on targetSearch value
    const targetSearch = el('targetSearch');
    const searchTerm = targetSearch ? targetSearch.value.toLowerCase() : '';
    console.log('Filtering targets with:', searchTerm);
    // In a real app: re-render the targets table with filtered data
    // Example: renderTargetsTable(loadTargets().filter(...))
};


// ==================== RENDERING (PLACEHOLDERS) ====================

const updateAnalyticsDashboard = async () => {
    // This would contain logic to draw charts (e.g., Chart.js) or update stats
    console.log('Dashboard analytics update triggered.');
    // Placeholder for actual dashboard updates
    // if (window.drawAveragesChart) window.drawAveragesChart(loadRecords());
    // if (window.updateQuickStats) window.updateQuickStats(loadRecords());
};

const updateRecordCounts = () => {
    const records = loadRecords();
    const totalRecords = el('totalRecords');
    const termRecords = el('termRecords');
    const yearRecords = el('yearRecords');

    if (totalRecords) {
        totalRecords.textContent = records.length;
    }
    
    // These require more complex filtering logic, so they remain placeholders
    if (termRecords) {
        const currentTerm = 'T1'; // Simplified - needs real term logic
        const termCount = records.filter(r => r.term === currentTerm).length;
        termRecords.textContent = termCount;
    }
    
    if (yearRecords) {
        const currentYear = new Date().getFullYear();
        const yearCount = records.filter(r => parseInt(r.year) === currentYear).length;
        yearRecords.textContent = yearCount;
    }
};
window.updateRecordCounts = updateRecordCounts; // Exported for use on scores page

// The main rendering function called on all pages
const renderAll = async () => {
    console.log('Rendering all relevant components...');
    
    // 1. Update the overall record counts and stats
    updateRecordCounts();

    // 2. Render scores table (if on the scores page)
    if (el('scoresTableBody')) {
        // Placeholder for scores table rendering
        // renderRecordsTable(loadRecords());
        console.log('Scores page rendering triggered.');
    }
    
    // 3. Render targets table (if on the targets page)
    if (el('targetsTableBody')) {
        // Placeholder for targets table rendering
        // renderTargetsTable(loadTargets());
        console.log('Targets page rendering triggered.');
    }

    // 4. Update Dashboard (if on the dashboard page - checks for many dashboard cards)
    if (el('classAverageCard')) { 
        await updateAnalyticsDashboard(); 
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
   // NEW: Run the session check on every page load immediately
    if (window.auth && window.auth.checkSessionTimeout) {
        window.auth.checkSessionTimeout();
    }
    loadTheme();
    autoFillYear();
    
    // Setup mobile navigation
    setupMobileSidebarAutoClose();
    
    const dataForm = el('dataEntryForm');
    if (dataForm) {
        dataForm.addEventListener('submit', handleSaveRecord);
    }
    
    const targetForm = el('targetsForm');
    if (targetForm) {
        targetForm.addEventListener('submit', handleSaveTarget);
    }
    
    const searchInput = el('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterRecords);
    }
    
    const targetSearch = el('targetSearch');
    if (targetSearch) {
        targetSearch.addEventListener('input', filterTargets);
    }
    
    await renderAll();
    
    // CRITICAL FIX: Centralized teacher name display logic
    // Now queries for all relevant elements across all pages, making inline scripts redundant.
    const teacherFullName = getTeacherName();

    document.querySelectorAll('#teacherName, #currentTeacher, .teacher-name').forEach(element => {
        element.textContent = teacherFullName;
    });
});
