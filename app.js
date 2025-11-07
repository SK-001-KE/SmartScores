/* =========================================================
   SMARTSCORES APP v3.0 - CLEAN EDITION
   by Kariuki (2025)
   Focus: Data management, rendering, calculations
========================================================= */

// STORAGE KEYS
const STORAGE_KEYS = {
    RECORDS: 'smartScoresRecords',
    TARGETS: 'smartScoresTargets', 
    TEACHER: 'teacherFullName',
    THEME: 'themeMode'
};

// DOM Helper
const el = id => document.getElementById(id);

// Alert Helper
const showAlert = (message, type = 'info') => {
    alert(message);
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

// ==================== RUBRIC SYSTEM (EE1-BE2) ====================
const RUBRIC_MAP = [
    { code: 'EE1', min: 90, max: 100, color: '#0B6623', text: 'EE1 90-100' },
    { code: 'EE2', min: 75, max: 89, color: '#2E8B57', text: 'EE2 75-89' },
    { code: 'ME1', min: 58, max: 74, color: '#1E3A8A', text: 'ME1 58-74' },
    { code: 'ME2', min: 41, max: 57, color: '#3B82F6', text: 'ME2 41-57' },
    { code: 'AE1', min: 31, max: 40, color: '#F97316', text: 'AE1 31-40' },
    { code: 'AE2', min: 21, max: 30, color: '#FDBA74', text: 'AE2 21-30' },
    { code: 'BE1', min: 11, max: 20, color: '#DC2626', text: 'BE1 11-20' },
    { code: 'BE2', min: 0, max: 10, color: '#7F1D1D', text: 'BE2 0-10' }
];

const getRubric = (score) => {
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
        return { code: 'N/A', color: '#6B7280', text: 'N/A', min: 0, max: 0 };
    }
    
    for (const rubric of RUBRIC_MAP) {
        if (numericScore >= rubric.min && numericScore <= rubric.max) {
            return { ...rubric };
        }
    }
    
    if (numericScore > 100) return { ...RUBRIC_MAP[0] };
    if (numericScore < 0) return { ...RUBRIC_MAP[RUBRIC_MAP.length - 1] };
    
    return { ...RUBRIC_MAP[RUBRIC_MAP.length - 1] };
};

const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const formatRubricBadge = (score) => {
    const rubric = getRubric(score);
    const textColor = getContrastColor(rubric.color);
    return `
        <span class="rubric-badge ${rubric.code.toLowerCase()}" 
              style="background:${rubric.color};color:${textColor}">
            ${rubric.code}
        </span>
    `;
};

// ==================== THEME MANAGEMENT ====================
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

// ==================== SIDEBAR MANAGEMENT ====================
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        sidebar.classList.toggle('closed');
    }
};

// ==================== DATA ENTRY ====================
const handleSaveRecord = (event) => {
    if (event) event.preventDefault();
    
    const teacherName = localStorage.getItem(STORAGE_KEYS.TEACHER);
    if (!teacherName) {
        showAlert('Please login first', 'error');
        window.location.href = './login.html';
        return;
    }
    
    const record = {
        teacher: teacherName,
        subject: el('subject')?.value?.trim(),
        grade: el('grade')?.value?.trim(),
        stream: el('stream')?.value?.trim(),
        term: el('term')?.value?.trim(),
        examType: el('examType')?.value?.trim(),
        year: el('year')?.value?.trim(),
        mean: parseFloat(el('meanScore')?.value)
    };
    
    if (!record.subject || !record.grade || !record.stream || !record.term || !record.examType || !record.year || isNaN(record.mean)) {
        showAlert('Please fill all fields with valid data', 'error');
        return;
    }
    
    if (record.mean < 0 || record.mean > 100) {
        showAlert('Mean score must be between 0 and 100', 'error');
        return;
    }
    
    const yearNum = parseInt(record.year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        showAlert('Year must be between 2000 and 2100', 'error');
        return;
    }
    
    const existingRecords = loadRecords();
    const duplicate = existingRecords.find(r => 
        r.teacher === record.teacher &&
        r.subject === record.subject &&
        r.grade === record.grade &&
        r.stream === record.stream &&
        r.term === record.term &&
        r.examType === record.examType &&
        r.year === record.year
    );
    
    if (duplicate) {
        showAlert('A record with these details already exists!', 'error');
        return;
    }
    
    existingRecords.push({
        ...record,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    
    if (saveRecords(existingRecords)) {
        showAlert('Record saved successfully!', 'success');
        if (el('dataEntryForm')) {
            el('dataEntryForm').reset();
            autoFillYear();
        }
        renderAll();
    }
};

const autoFillYear = () => {
    const yearInput = el('year');
    if (yearInput && !yearInput.value.trim()) {
        yearInput.value = new Date().getFullYear();
    }
};

// ==================== TARGET MANAGEMENT ====================
const handleSaveTarget = (event) => {
    if (event) event.preventDefault();
    
    const target = {
        subject: el('targetSubject')?.value?.trim(),
        grade: el('targetGrade')?.value?.trim(),
        stream: el('targetStream')?.value?.trim(),
        term: el('targetTerm')?.value?.trim(),
        examType: el('targetExamType')?.value?.trim(),
        score: parseFloat(el('targetScore')?.value)
    };
    
    const requiredFields = ['subject', 'grade', 'stream', 'term', 'examType'];
    const missingFields = requiredFields.filter(field => !target[field]);
    
    if (missingFields.length > 0 || isNaN(target.score)) {
        showAlert('Please fill all fields with valid data', 'error');
        return;
    }
    
    if (target.score < 0 || target.score > 100) {
        showAlert('Target score must be between 0 and 100', 'error');
        return;
    }
    
    const existingTargets = loadTargets();
    const duplicate = existingTargets.find(t =>
        t.subject === target.subject &&
        t.grade === target.grade &&
        t.stream === target.stream &&
        t.term === target.term &&
        t.examType === target.examType
    );
    
    if (duplicate) {
        showAlert('A target for this subject/grade/stream/term/exam combination already exists!', 'error');
        return;
    }
    
    existingTargets.push({
        ...target,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    
    if (saveTargets(existingTargets)) {
        showAlert('Target saved successfully!', 'success');
        if (el('targetsForm')) {
            el('targetsForm').reset();
        }
        renderTargets();
    }
};

window.deleteTarget = (index) => {
    if (confirm('Are you sure you want to delete this target?')) {
        const targets = loadTargets();
        if (index >= 0 && index < targets.length) {
            targets.splice(index, 1);
            if (saveTargets(targets)) {
                showAlert('Target deleted successfully', 'success');
                renderTargets();
            }
        }
    }
};

// ==================== RECORD MANAGEMENT ====================
window.deleteRecord = (index) => {
    if (confirm('Are you sure you want to delete this record?')) {
        const records = loadRecords();
        if (index >= 0 && index < records.length) {
            records.splice(index, 1);
            if (saveRecords(records)) {
                showAlert('Record deleted successfully', 'success');
                renderAll();
            }
        }
    }
};

// ==================== SEARCH & FILTER ====================
window.filterRecords = () => {
    const searchTerm = (el('searchInput')?.value || '').toLowerCase();
    const tbody = document.querySelector('#recordsTable tbody') || el('recordsBody');
    
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = !searchTerm || text.includes(searchTerm);
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });
    
    const recordsShown = el('recordsShown');
    if (recordsShown) {
        recordsShown.textContent = visibleCount;
    }
    
    const emptyState = el('emptyState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

window.filterTargets = () => {
    const searchTerm = (el('targetSearch')?.value || '').toLowerCase();
    const tbody = document.querySelector('#targetsTable tbody');
    
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = !searchTerm || text.includes(searchTerm);
        row.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });
    
    const emptyTargets = el('emptyTargets');
    if (emptyTargets) {
        emptyTargets.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};
// ==================== AI INSIGHTS RENDERING ====================
const renderAIAnalysis = () => {
    const records = loadRecords();
    const targets = loadTargets();
    
    // Update executive summary
    updateExecutiveSummary(records, targets);
    
    // Generate alerts and recommendations
    generatePriorityAlerts(records, targets);
    generateOutstandingPerformance(records, targets);
    generateOnTrackPerformance(records, targets);
    generateAIRecommendations(records, targets);
};

const updateExecutiveSummary = (records, targets) => {
    if (records.length === 0) return;
    
    // Overall average
    const overallAvg = records.reduce((sum, record) => sum + record.mean, 0) / records.length;
    const overallAvgEl = el('overallAverage');
    if (overallAvgEl) {
        overallAvgEl.textContent = `${overallAvg.toFixed(1)}%`;
    }
    
    // Targets met
    const targetsMetEl = el('targetsMet');
    const targetsCountEl = el('targetsCount');
    if (targetsMetEl && targetsCountEl) {
        let metCount = 0;
        let totalTracked = 0;
        
        records.forEach(record => {
            const target = findMatchingTarget(record, targets);
            if (target) {
                totalTracked++;
                if (record.mean >= target.score) {
                    metCount++;
                }
            }
        });
        
        const percentage = totalTracked > 0 ? Math.round((metCount / totalTracked) * 100) : 0;
        targetsMetEl.textContent = `${percentage}%`;
        targetsCountEl.textContent = `${metCount}/${totalTracked} subjects`;
    }
    
    // Needs attention
    const needsAttentionEl = el('needsAttention');
    const attentionCountEl = el('attentionCount');
    if (needsAttentionEl && attentionCountEl) {
        const criticalCount = countCriticalAlerts(records, targets);
        needsAttentionEl.textContent = criticalCount;
        attentionCountEl.textContent = `${criticalCount} alerts`;
    }
    
    // Outstanding performance
    const outstandingCountEl = el('outstandingCount');
    const outstandingTextEl = el('outstandingText');
    if (outstandingCountEl && outstandingTextEl) {
        const outstandingCount = countOutstandingPerformance(records);
        outstandingCountEl.textContent = outstandingCount;
        outstandingTextEl.textContent = `${outstandingCount} subjects`;
    }
};

const generatePriorityAlerts = (records, targets) => {
    const container = el('criticalAlerts');
    if (!container) return;
    
    const criticalAlerts = [];
    
    records.forEach(record => {
        const target = findMatchingTarget(record, targets);
        
        // Critical alert if performance is very low
        if (record.mean < 40) {
            criticalAlerts.push({
                type: 'critical',
                icon: '⚠️',
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                score: record.mean,
                message: `Very low performance needs immediate intervention`,
                tag: 'Critical'
            });
        }
        // Alert if significantly below target
        else if (target && record.mean < target.score - 15) {
            criticalAlerts.push({
                type: 'critical',
                icon: '🎯',
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                score: record.mean,
                target: target.score,
                message: `Significantly below target (${target.score}%)`,
                tag: 'Below Target'
            });
        }
        // Alert if declining trend (you'd need historical data for this)
    });
    
    const badge = el('criticalBadge');
    if (badge) {
        badge.textContent = `${criticalAlerts.length} critical`;
    }
    
    if (criticalAlerts.length === 0) {
        container.innerHTML = `
            <div class="empty-alert">
                <div class="empty-icon">✅</div>
                <p>No critical alerts! All subjects are performing well.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = criticalAlerts.map(alert => `
        <div class="alert-item critical">
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h4>${alert.subject} - Grade ${alert.grade} (${alert.stream})</h4>
                <p>${alert.message} - Current: <strong>${alert.score.toFixed(1)}%</strong></p>
            </div>
            <span class="alert-tag">${alert.tag}</span>
        </div>
    `).join('');
};

const generateOutstandingPerformance = (records, targets) => {
    const container = el('positiveAlerts');
    if (!container) return;
    
    const outstandingAlerts = [];
    
    records.forEach(record => {
        const target = findMatchingTarget(record, targets);
        
        // Outstanding if score is very high
        if (record.mean >= 85) {
            outstandingAlerts.push({
                type: 'outstanding',
                icon: '⭐',
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                score: record.mean,
                message: `Exceptional performance!`,
                tag: 'Outstanding'
            });
        }
        // Outstanding if significantly above target
        else if (target && record.mean > target.score + 10) {
            outstandingAlerts.push({
                type: 'outstanding',
                icon: '🚀',
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                score: record.mean,
                target: target.score,
                message: `Exceeding target by ${(record.mean - target.score).toFixed(1)}%`,
                tag: 'Above Target'
            });
        }
    });
    
    const badge = el('positiveBadge');
    if (badge) {
        badge.textContent = `${outstandingAlerts.length} outstanding`;
    }
    
    if (outstandingAlerts.length === 0) {
        container.innerHTML = `
            <div class="empty-alert">
                <div class="empty-icon">📊</div>
                <p>No outstanding performance alerts yet.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = outstandingAlerts.map(alert => `
        <div class="alert-item positive">
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h4>${alert.subject} - Grade ${alert.grade} (${alert.stream})</h4>
                <p>${alert.message}</p>
            </div>
            <span class="alert-tag">${alert.tag}</span>
        </div>
    `).join('');
};

const generateOnTrackPerformance = (records, targets) => {
    const container = el('onTrackAlerts');
    if (!container) return;
    
    const onTrackAlerts = [];
    
    records.forEach(record => {
        const target = findMatchingTarget(record, targets);
        
        // On track if within 5% of target
        if (target && Math.abs(record.mean - target.score) <= 5) {
            onTrackAlerts.push({
                type: 'on-track',
                icon: '✅',
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                score: record.mean,
                target: target.score,
                message: `Performing as expected`,
                tag: 'On Track'
            });
        }
    });
    
    const badge = el('onTrackBadge');
    if (badge) {
        badge.textContent = `${onTrackAlerts.length} on track`;
    }
    
    if (onTrackAlerts.length === 0) {
        container.innerHTML = `
            <div class="empty-alert">
                <div class="empty-icon">🎯</div>
                <p>No subjects currently tracked against targets.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = onTrackAlerts.map(alert => `
        <div class="alert-item info">
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h4>${alert.subject} - Grade ${alert.grade} (${alert.stream})</h4>
                <p>${alert.message} - Target: ${alert.target}%</p>
            </div>
            <span class="alert-tag">${alert.tag}</span>
        </div>
    `).join('');
};

const generateAIRecommendations = (records, targets) => {
    const container = el('aiRecommendations');
    if (!container) return;
    
    const recommendations = [];
    
    // Analyze patterns and generate recommendations
    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-recommendation">
                <div class="empty-icon">🤖</div>
                <p>Add more data and set targets to get AI recommendations.</p>
            </div>
        `;
        return;
    }
    
    // Recommendation 1: Based on overall performance
    const overallAvg = records.reduce((sum, record) => sum + record.mean, 0) / records.length;
    if (overallAvg < 50) {
        recommendations.push({
            icon: '📚',
            title: 'Focus on Foundation Skills',
            description: 'Overall performance suggests students may need additional support in fundamental concepts. Consider review sessions.',
            priority: 'High'
        });
    }
    
    // Recommendation 2: Based on target achievement
    const targetAchievement = calculateTargetAchievement(records, targets);
    if (targetAchievement.rate < 60) {
        recommendations.push({
            icon: '🎯',
            title: 'Review Target Settings',
            description: `Only ${targetAchievement.rate}% of targets are being met. Consider adjusting targets or implementing additional support strategies.`,
            priority: 'Medium'
        });
    }
    
    // Recommendation 3: Based on subject variation
    const subjectVariation = calculateSubjectVariation(records);
    if (subjectVariation > 20) {
        recommendations.push({
            icon: '📊',
            title: 'Address Performance Gaps',
            description: 'Significant variation between subjects detected. Consider cross-subject support strategies.',
            priority: 'Medium'
        });
    }
    
    // Recommendation 4: General best practice
    if (records.length < 10) {
        recommendations.push({
            icon: '📝',
            title: 'Collect More Data',
            description: 'More data points will improve the accuracy of insights and recommendations.',
            priority: 'Low'
        });
    }
    
    const badge = el('recommendationBadge');
    if (badge) {
        badge.textContent = `${recommendations.length} recommendations`;
    }
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-recommendation">
                <div class="empty-icon">✅</div>
                <p>Great job! All systems are performing well. Keep up the good work!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-icon">${rec.icon}</div>
            <div class="recommendation-content">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <span class="recommendation-priority ${rec.priority.toLowerCase()}">${rec.priority} Priority</span>
            </div>
        </div>
    `).join('');
};

// ==================== AVERAGES PAGE RENDERING ====================
const renderAveragesAnalysis = () => {
    const records = loadRecords();
    
    // Update quick stats
    updateAveragesQuickStats(records);
    
    // Render averages table
    renderAveragesTable(records);
    
    // Render charts
    renderAveragesCharts(records);
};

const updateAveragesQuickStats = (records) => {
    if (records.length === 0) return;
    
    // Total subjects
    const uniqueSubjects = new Set(records.map(r => r.subject));
    const totalSubjectsEl = el('totalSubjects');
    if (totalSubjectsEl) {
        totalSubjectsEl.textContent = uniqueSubjects.size;
    }
    
    // Best subject
    const bestSubjectEl = el('bestSubjectScore');
    const bestSubjectNameEl = el('bestSubjectName');
    if (bestSubjectEl && bestSubjectNameEl) {
        const subjectAverages = calculateSubjectAverages(records);
        if (subjectAverages.length > 0) {
            const best = subjectAverages[0]; // Assuming sorted
            bestSubjectEl.textContent = `${best.average.toFixed(1)}%`;
            bestSubjectNameEl.textContent = best.subject;
        }
    }
    
    // Improved subjects (placeholder - would need historical data)
    const improvedSubjectsEl = el('improvedSubjects');
    if (improvedSubjectsEl) {
        improvedSubjectsEl.textContent = '--';
    }
};

const renderAveragesTable = (records) => {
    const tbody = document.querySelector('#averagesTable tbody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center loading-cell">No data available for averages analysis.</td>
            </tr>
        `;
        return;
    }
    
    // Group records by subject, grade, stream, term
    const groups = {};
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}`;
        if (!groups[key]) {
            groups[key] = {
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                term: record.term,
                exams: {
                    'Opener Exam': [],
                    'Mid Term Exam': [],
                    'End Term Exam': []
                }
            };
        }
        
        const examType = record.examType || '';
        if (examType.includes('Opener')) {
            groups[key].exams['Opener Exam'].push(record.mean);
        } else if (examType.includes('Mid')) {
            groups[key].exams['Mid Term Exam'].push(record.mean);
        } else if (examType.includes('End')) {
            groups[key].exams['End Term Exam'].push(record.mean);
        }
    });
    
    // Calculate averages
    const averages = Object.values(groups).map(group => {
        const openerAvg = group.exams['Opener Exam'].length > 0 ? 
            group.exams['Opener Exam'].reduce((a, b) => a + b, 0) / group.exams['Opener Exam'].length : null;
        const midAvg = group.exams['Mid Term Exam'].length > 0 ? 
            group.exams['Mid Term Exam'].reduce((a, b) => a + b, 0) / group.exams['Mid Term Exam'].length : null;
        const endAvg = group.exams['End Term Exam'].length > 0 ? 
            group.exams['End Term Exam'].reduce((a, b) => a + b, 0) / group.exams['End Term Exam'].length : null;
        
        const allScores = [...group.exams['Opener Exam'], ...group.exams['Mid Term Exam'], ...group.exams['End Term Exam']];
        const overallAvg = allScores.length > 0 ? 
            allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        
        return {
            ...group,
            openerAvg,
            midAvg,
            endAvg,
            overallAvg
        };
    });
    
    // Sort by subject name
    averages.sort((a, b) => a.subject.localeCompare(b.subject));
    
    tbody.innerHTML = averages.map(avg => `
        <tr>
            <td>${avg.subject}</td>
            <td>${avg.grade}</td>
            <td>${avg.stream}</td>
            <td>${avg.term}</td>
            <td>${avg.openerAvg !== null ? avg.openerAvg.toFixed(1) + '%' : '–'}</td>
            <td>${avg.midAvg !== null ? avg.midAvg.toFixed(1) + '%' : '–'}</td>
            <td>${avg.endAvg !== null ? avg.endAvg.toFixed(1) + '%' : '–'}</td>
            <td style="font-weight: bold;">${avg.overallAvg.toFixed(1)}%</td>
            <td>${formatRubricBadge(avg.overallAvg)}</td>
        </tr>
    `).join('');
};

const renderAveragesCharts = (records) => {
    // This would implement the Chart.js visualizations
    // Placeholder for chart rendering logic
    console.log('Rendering averages charts with', records.length, 'records');
};

// ==================== TRENDS PAGE RENDERING ====================
const renderTrendsAnalysis = () => {
    const records = loadRecords();
    
    // Update progress overview
    updateTrendsOverview(records);
    
    // Render trends table
    renderTrendsTable(records);
    
    // Render trend visualizations
    renderTrendVisualizations(records);
    
    // Generate insights
    generateTrendInsights(records);
};

const updateTrendsOverview = (records) => {
    if (records.length === 0) return;
    
    const trends = analyzeTrends(records);
    
    const improvingCountEl = el('improvingCount');
    const stableCountEl = el('stableCount');
    const decliningCountEl = el('decliningCount');
    const insufficientDataEl = el('insufficientData');
    
    if (improvingCountEl) improvingCountEl.textContent = trends.improving;
    if (stableCountEl) stableCountEl.textContent = trends.stable;
    if (decliningCountEl) decliningCountEl.textContent = trends.declining;
    if (insufficientDataEl) insufficientDataEl.textContent = trends.insufficientData;
};

const renderTrendsTable = (records) => {
    const tbody = document.querySelector('#trendsTable tbody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center loading-cell">No data available for trend analysis.</td>
            </tr>
        `;
        return;
    }
    
    const trends = calculateDetailedTrends(records);
    
    const trendsCountEl = el('trendsCount');
    if (trendsCountEl) {
        trendsCountEl.textContent = `${trends.length} trends analyzed`;
    }
    
    if (trends.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center loading-cell">
                    Not enough data for trend analysis. Need multiple exam scores per subject.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = trends.map(trend => `
        <tr>
            <td>${trend.subject}</td>
            <td>${trend.grade}</td>
            <td>${trend.stream}</td>
            <td>${trend.term}</td>
            <td>${trend.opener !== null ? trend.opener + '%' : '–'}</td>
            <td>${trend.midTerm !== null ? trend.midTerm + '%' : '–'}</td>
            <td>${trend.endTerm !== null ? trend.endTerm + '%' : '–'}</td>
            <td style="font-weight: bold; color: ${trend.trendColor};">${trend.trend}</td>
            <td>
                <span class="rubric-badge" style="background: ${trend.trendColor}">${trend.status}</span>
            </td>
        </tr>
    `).join('');
};

const renderTrendVisualizations = (records) => {
    // Placeholder for trend charts
    console.log('Rendering trend visualizations with', records.length, 'records');
};

const generateTrendInsights = (records) => {
    const container = el('trendInsights');
    if (!container) return;
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="insight-item">
                <div class="insight-icon">📊</div>
                <div class="insight-content">
                    <h4>Add More Data</h4>
                    <p>Enter exam scores for multiple terms to see trend analysis.</p>
                </div>
            </div>
        `;
        return;
    }
    
    const trends = analyzeTrends(records);
    const insights = [];
    
    if (trends.improving > trends.declining) {
        insights.push({
            icon: '📈',
            title: 'Positive Momentum',
            description: `More subjects are improving (${trends.improving}) than declining (${trends.declining}). Keep up the effective teaching strategies!`
        });
    }
    
    if (trends.insufficientData > 5) {
        insights.push({
            icon: '📝',
            title: 'Data Collection Opportunity',
            description: `${trends.insufficientData} subjects need more exam data for proper trend analysis.`
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            icon: '🔍',
            title: 'Continue Monitoring',
            description: 'Track performance over time to identify patterns and opportunities for improvement.'
        });
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
            </div>
        </div>
    `).join('');
};

// ==================== HELPER FUNCTIONS ====================
const findMatchingTarget = (record, targets) => {
    return targets.find(target => 
        target.subject === record.subject &&
        target.grade === record.grade &&
        target.stream === record.stream &&
        target.term === record.term &&
        target.examType === record.examType
    );
};

const countCriticalAlerts = (records, targets) => {
    return records.filter(record => {
        const target = findMatchingTarget(record, targets);
        return record.mean < 40 || (target && record.mean < target.score - 15);
    }).length;
};

const countOutstandingPerformance = (records) => {
    return records.filter(record => record.mean >= 85).length;
};

const calculateTargetAchievement = (records, targets) => {
    let metCount = 0;
    let totalTracked = 0;
    
    records.forEach(record => {
        const target = findMatchingTarget(record, targets);
        if (target) {
            totalTracked++;
            if (record.mean >= target.score) {
                metCount++;
            }
        }
    });
    
    return {
        met: metCount,
        total: totalTracked,
        rate: totalTracked > 0 ? Math.round((metCount / totalTracked) * 100) : 0
    };
};

const calculateSubjectVariation = (records) => {
    const subjectAverages = calculateSubjectAverages(records);
    if (subjectAverages.length < 2) return 0;
    
    const averages = subjectAverages.map(s => s.average);
    const max = Math.max(...averages);
    const min = Math.min(...averages);
    
    return max - min;
};

const calculateSubjectAverages = (records) => {
    const subjectMap = {};
    
    records.forEach(record => {
        const key = record.subject;
        if (!subjectMap[key]) {
            subjectMap[key] = { sum: 0, count: 0, subject: key };
        }
        subjectMap[key].sum += record.mean;
        subjectMap[key].count++;
    });
    
    const averages = Object.values(subjectMap).map(item => ({
        subject: item.subject,
        average: item.sum / item.count
    }));
    
    return averages.sort((a, b) => b.average - a.average);
};

const analyzeTrends = (records) => {
    const groups = {};
    
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}`;
        if (!groups[key]) {
            groups[key] = {
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                term: record.term,
                exams: {}
            };
        }
        groups[key].exams[record.examType] = record.mean;
    });
    
    let improving = 0;
    let declining = 0;
    let stable = 0;
    let insufficientData = 0;
    
    Object.values(groups).forEach(group => {
        const exams = Object.values(group.exams);
        if (exams.length < 2) {
            insufficientData++;
            return;
        }
        
        // Simple trend analysis - compare first and last available scores
        const scores = exams.filter(score => score !== undefined);
        if (scores.length >= 2) {
            const firstScore = scores[0];
            const lastScore = scores[scores.length - 1];
            const change = lastScore - firstScore;
            
            if (change > 2) improving++;
            else if (change < -2) declining++;
            else stable++;
        }
    });
    
    return { improving, declining, stable, insufficientData };
};

const calculateDetailedTrends = (records) => {
    const groups = {};
    const trends = [];
    
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}`;
        if (!groups[key]) {
            groups[key] = {
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                term: record.term,
                exams: {}
            };
        }
        groups[key].exams[record.examType] = record.mean;
    });
    
    Object.values(groups).forEach(group => {
        const opener = group.exams['Opener Exam'];
        const midTerm = group.exams['Mid Term Exam'];
        const endTerm = group.exams['End Term Exam'];
        
        const exams = [opener, midTerm, endTerm].filter(score => score !== undefined);
        if (exams.length < 2) return;
        
        let trend = '';
        let trendValue = 0;
        let status = 'Insufficient Data';
        let trendColor = '#666';
        
        if (opener !== undefined && endTerm !== undefined) {
            trendValue = endTerm - opener;
            trend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
            if (trendValue > 2) {
                status = 'Improving';
                trendColor = '#10b981';
            } else if (trendValue < -2) {
                status = 'Declining';
                trendColor = '#ef4444';
            } else {
                status = 'Stable';
                trendColor = '#f59e0b';
            }
        } else if (opener !== undefined && midTerm !== undefined) {
            trendValue = midTerm - opener;
            trend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
            status = trendValue > 0 ? 'Improving' : 'Declining';
            trendColor = trendValue > 0 ? '#10b981' : '#ef4444';
        } else if (midTerm !== undefined && endTerm !== undefined) {
            trendValue = endTerm - midTerm;
            trend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
            status = trendValue > 0 ? 'Improving' : 'Declining';
            trendColor = trendValue > 0 ? '#10b981' : '#ef4444';
        }
        
        trends.push({
            ...group,
            opener,
            midTerm,
            endTerm,
            trend,
            status,
            trendColor
        });
    });
    
    return trends;
};

// ==================== SORTING ====================
let currentSort = { column: 0, direction: 'asc' };

window.sortRecords = (columnIndex) => {
    const tbody = document.querySelector('#recordsTable tbody') || el('recordsBody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.rows);
    if (rows.length === 0) return;
    
    if (currentSort.column === columnIndex) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = columnIndex;
        currentSort.direction = 'asc';
    }
    
    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex]?.textContent?.trim() || '';
        let bValue = b.cells[columnIndex]?.textContent?.trim() || '';
        
        if (columnIndex === 7 || columnIndex === 8 || columnIndex === 9) {
            aValue = parseFloat(aValue.replace(/[^\d.-]/g, '')) || 0;
            bValue = parseFloat(bValue.replace(/[^\d.-]/g, '')) || 0;
        }
        
        if (columnIndex === 6) {
            aValue = parseInt(aValue) || 0;
            bValue = parseInt(bValue) || 0;
        }
        
        let result;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            result = aValue - bValue;
        } else {
            result = aValue.toString().localeCompare(bValue.toString());
        }
        
        return currentSort.direction === 'asc' ? result : -result;
    });
    
    rows.forEach(row => tbody.appendChild(row));
    updateSortIndicators(columnIndex);
};

const updateSortIndicators = (sortedColumn) => {
    const headers = document.querySelectorAll('#recordsTable th');
    headers.forEach((header, index) => {
        let text = header.textContent.replace(/ [↑↓]/, '');
        if (index === sortedColumn) {
            text += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        }
        header.textContent = text;
    });
};

// ==================== TRENDS & AVERAGES FILTERS ====================
window.applyTrendFilters = () => {
    showAlert('Trend filters applied!', 'success');
    // Implementation for trend filtering would go here
};

window.resetTrendFilters = () => {
    const trendFilter = el('trendFilter');
    const subjectFilter = el('subjectFilter');
    const trendGradeFilter = el('trendGradeFilter');
    
    if (trendFilter) trendFilter.value = '';
    if (subjectFilter) subjectFilter.value = '';
    if (trendGradeFilter) trendGradeFilter.value = '';
    
    showAlert('Trend filters reset!', 'info');
};

window.sortTrendsTable = (column) => {
    showAlert(`Sorting trends table by column ${column}`, 'info');
    // Implementation for trends table sorting would go here
};

window.applyAveragesFilters = () => {
    showAlert('Averages filters applied!', 'success');
    // Implementation for averages filtering would go here
};

window.resetAveragesFilters = () => {
    const gradeFilter = el('gradeFilter');
    const streamFilter = el('streamFilter');
    const termFilter = el('termFilter');
    
    if (gradeFilter) gradeFilter.value = '';
    if (streamFilter) streamFilter.value = '';
    if (termFilter) termFilter.value = '';
    
    showAlert('Averages filters reset!', 'info');
};

window.sortAveragesTable = (column) => {
    showAlert(`Sorting averages table by column ${column}`, 'info');
    // Implementation for averages table sorting would go here
};

window.exportAverages = () => {
    showAlert('Exporting averages data...', 'info');
    // Implementation for averages export would go here
};

// ==================== RENDERING FUNCTIONS ====================
const renderRecords = () => {
    const tbody = document.querySelector('#recordsTable tbody') || el('recordsBody');
    if (!tbody) return;
    
    const records = loadRecords();
    const targets = loadTargets();
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center" style="padding: 40px; color: #666;">
                    No records found. <a href="./data-entry.html" style="color: var(--primary);">Add your first record</a>
                </td>
            </tr>
        `;
        return;
    }
    
    const targetMap = {};
    targets.forEach(target => {
        const key = `${target.subject}|${target.grade}|${target.stream}|${target.term}|${target.examType}`;
        targetMap[key] = target.score;
    });
    
    tbody.innerHTML = records.map((record, index) => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const targetScore = targetMap[key] || null;
        const deviation = targetScore !== null ? record.mean - targetScore : null;
        const deviationStr = deviation !== null ? `${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)}%` : '–';
        const rubricBadge = formatRubricBadge(record.mean);
        
        return `
            <tr>
                <td>${record.teacher || '–'}</td>
                <td>${record.subject || '–'}</td>
                <td>${record.grade || '–'}</td>
                <td>${record.stream || '–'}</td>
                <td>${record.term || '–'}</td>
                <td>${record.examType || '–'}</td>
                <td>${record.year || '–'}</td>
                <td style="font-weight: bold;">${record.mean.toFixed(1)}%</td>
                <td>${targetScore !== null ? targetScore.toFixed(1) + '%' : '–'}</td>
                <td style="color: ${deviation !== null ? (deviation >= 0 ? '#10b981' : '#ef4444') : '#666'}; font-weight: bold;">
                    ${deviationStr}
                </td>
                <td>${rubricBadge}</td>
                <td>
                    <button onclick="deleteRecord(${index})" class="btn btn-danger small">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    const totalRecords = el('totalRecordsCount');
    if (totalRecords) {
        totalRecords.textContent = records.length;
    }
    
    const averageScore = el('averageScore');
    if (averageScore && records.length > 0) {
        const avg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
        averageScore.textContent = avg.toFixed(1) + '%';
    }
};

const renderTargets = () => {
    const tbody = document.querySelector('#targetsTable tbody');
    if (!tbody) return;
    
    const targets = loadTargets();
    
    if (targets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px; color: #666;">
                    No targets set. <a href="./set-targets.html" style="color: var(--primary);">Set your first target</a>
                </td>
            </tr>
        `;
        
        const emptyTargets = el('emptyTargets');
        if (emptyTargets) emptyTargets.style.display = 'block';
        return;
    }
    
    tbody.innerHTML = targets.map((target, index) => `
        <tr>
            <td>${target.subject}</td>
            <td>${target.grade}</td>
            <td>${target.stream}</td>
            <td>${target.term}</td>
            <td>${target.examType}</td>
            <td style="font-weight: bold; color: var(--primary);">${target.score}%</td>
            <td>
                <button onclick="deleteTarget(${index})" class="btn btn-danger small">Delete</button>
            </td>
        </tr>
    `).join('');
    
    updateTargetsSummary(targets);
    const emptyTargets = el('emptyTargets');
    if (emptyTargets) emptyTargets.style.display = 'none';
};

const updateTargetsSummary = (targets) => {
    const totalTargets = el('totalTargets');
    const averageTarget = el('averageTarget');
    const activeTargets = el('activeTargets');
    
    if (totalTargets) totalTargets.textContent = targets.length;
    
    if (averageTarget && targets.length > 0) {
        const avg = targets.reduce((sum, t) => sum + t.score, 0) / targets.length;
        averageTarget.textContent = avg.toFixed(1) + '%';
    }
    
    if (activeTargets) activeTargets.textContent = targets.length;
};

// ==================== AI INSIGHTS ====================
// ==================== COMPLETE AI INSIGHTS RENDERING ====================
const renderAIAnalysis = () => {
    const records = loadRecords();
    const targets = loadTargets();
    
    console.log('AI Insights: Processing', records.length, 'records and', targets.length, 'targets');
    
    if (records.length === 0) {
        // Show empty state for all sections
        updateEmptyAIState();
        return;
    }
    
    // Update executive summary
    updateExecutiveSummary(records, targets);
    
    // Generate alerts and recommendations
    generatePriorityAlerts(records, targets);
    generateOutstandingPerformance(records, targets);
    generateOnTrackPerformance(records, targets);
    generateAIRecommendations(records, targets);
};

const updateEmptyAIState = () => {
    // Update all sections to show empty states
    const overallAvgEl = el('overallAverage');
    const targetsMetEl = el('targetsMet');
    const needsAttentionEl = el('needsAttention');
    const outstandingCountEl = el('outstandingCount');
    
    if (overallAvgEl) overallAvgEl.textContent = '--';
    if (targetsMetEl) targetsMetEl.textContent = '--';
    if (needsAttentionEl) needsAttentionEl.textContent = '--';
    if (outstandingCountEl) outstandingCountEl.textContent = '--';
    
    // Keep the default empty states that are already in the HTML
};

// ==================== COMPLETE AVERAGES RENDERING ====================
const renderAveragesAnalysis = () => {
    const records = loadRecords();
    
    console.log('Averages: Processing', records.length, 'records');
    
    if (records.length === 0) {
        updateEmptyAveragesState();
        return;
    }
    
    // Update quick stats
    updateAveragesQuickStats(records);
    
    // Render averages table
    renderAveragesTable(records);
    
    // Render charts (placeholder - would need Chart.js implementation)
    renderAveragesCharts(records);
};

const updateEmptyAveragesState = () => {
    const totalSubjectsEl = el('totalSubjects');
    const bestSubjectScoreEl = el('bestSubjectScore');
    const bestSubjectNameEl = el('bestSubjectName');
    const improvedSubjectsEl = el('improvedSubjects');
    
    if (totalSubjectsEl) totalSubjectsEl.textContent = '--';
    if (bestSubjectScoreEl) bestSubjectScoreEl.textContent = '--';
    if (bestSubjectNameEl) bestSubjectNameEl.textContent = '--';
    if (improvedSubjectsEl) improvedSubjectsEl.textContent = '--';
};

// ==================== COMPLETE TRENDS RENDERING ====================
const renderTrendsAnalysis = () => {
    const records = loadRecords();
    
    console.log('Trends: Processing', records.length, 'records');
    
    if (records.length === 0) {
        updateEmptyTrendsState();
        return;
    }
    
    // Update progress overview
    updateTrendsOverview(records);
    
    // Render trends table
    renderTrendsTable(records);
    
    // Render trend visualizations (placeholder)
    renderTrendVisualizations(records);
    
    // Generate insights
    generateTrendInsights(records);
};

const updateEmptyTrendsState = () => {
    const improvingCountEl = el('improvingCount');
    const stableCountEl = el('stableCount');
    const decliningCountEl = el('decliningCount');
    const insufficientDataEl = el('insufficientData');
    
    if (improvingCountEl) improvingCountEl.textContent = '--';
    if (stableCountEl) stableCountEl.textContent = '--';
    if (decliningCountEl) decliningCountEl.textContent = '--';
    if (insufficientDataEl) insufficientDataEl.textContent = '--';
};

// ==================== CUMULATIVE AVERAGES ====================
const renderCumulativeAverages = () => {
    const tbody = document.querySelector('#cumulativeTable tbody');
    if (!tbody) return;
    
    const records = loadRecords();
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 40px; color: #666;">
                    No data available for cumulative averages.
                </td>
            </tr>
        `;
        return;
    }
    
    const groups = {};
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}`;
        if (!groups[key]) {
            groups[key] = {
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                term: record.term,
                exams: {
                    'Opener Exam': [],
                    'Mid Term Exam': [],
                    'End Term Exam': []
                }
            };
        }
        
        const examType = record.examType || '';
        if (examType.includes('Opener')) {
            groups[key].exams['Opener Exam'].push(record.mean);
        } else if (examType.includes('Mid')) {
            groups[key].exams['Mid Term Exam'].push(record.mean);
        } else if (examType.includes('End')) {
            groups[key].exams['End Term Exam'].push(record.mean);
        }
    });
    
    const averages = Object.values(groups).map(group => {
        const openerScores = group.exams['Opener Exam'];
        const midScores = group.exams['Mid Term Exam'];
        const endScores = group.exams['End Term Exam'];
        
        const openerAvg = openerScores.length > 0 ? 
            openerScores.reduce((a, b) => a + b, 0) / openerScores.length : null;
        const midAvg = midScores.length > 0 ? 
            midScores.reduce((a, b) => a + b, 0) / midScores.length : null;
        const endAvg = endScores.length > 0 ? 
            endScores.reduce((a, b) => a + b, 0) / endScores.length : null;
        
        const allScores = [...openerScores, ...midScores, ...endScores];
        const overallAvg = allScores.length > 0 ? 
            allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        
        return {
            ...group,
            openerAvg,
            midAvg,
            endAvg,
            overallAvg,
            rubric: getRubric(overallAvg)
        };
    });
    
    averages.sort((a, b) => {
        return a.subject.localeCompare(b.subject) ||
               a.grade.localeCompare(b.grade) ||
               a.stream.localeCompare(b.stream) ||
               a.term.localeCompare(b.term);
    });
    
    tbody.innerHTML = averages.map(avg => `
        <tr>
            <td>${avg.subject}</td>
            <td>${avg.grade}</td>
            <td>${avg.stream}</td>
            <td>${avg.term}</td>
            <td style="text-align: center; font-weight: ${avg.openerAvg !== null ? 'bold' : 'normal'}; 
                       color: ${avg.openerAvg !== null ? (avg.openerAvg >= 50 ? '#10b981' : '#ef4444') : '#666'};">
                ${avg.openerAvg !== null ? avg.openerAvg.toFixed(1) + '%' : '–'}
            </td>
            <td style="text-align: center; font-weight: ${avg.midAvg !== null ? 'bold' : 'normal'}; 
                       color: ${avg.midAvg !== null ? (avg.midAvg >= 50 ? '#10b981' : '#ef4444') : '#666'};">
                ${avg.midAvg !== null ? avg.midAvg.toFixed(1) + '%' : '–'}
            </td>
            <td style="text-align: center; font-weight: ${avg.endAvg !== null ? 'bold' : 'normal'}; 
                       color: ${avg.endAvg !== null ? (avg.endAvg >= 50 ? '#10b981' : '#ef4444') : '#666'};">
                ${avg.endAvg !== null ? avg.endAvg.toFixed(1) + '%' : '–'}
            </td>
            <td style="font-weight: bold; color: ${avg.rubric.color};">
                ${avg.overallAvg.toFixed(1)}%
            </td>
            <td>${formatRubricBadge(avg.overallAvg)}</td>
        </tr>
    `).join('');
};

// ==================== TREND ANALYSIS ====================
const renderTrendAnalysis = () => {
    const tbody = document.querySelector('#trendTable tbody');
    if (!tbody) return;
    
    const records = loadRecords();
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center" style="padding: 40px; color: #666;">
                    No data available for trend analysis.
                </td>
            </tr>
        `;
        return;
    }
    
    const groups = {};
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}`;
        if (!groups[key]) {
            groups[key] = {
                subject: record.subject,
                grade: record.grade,
                stream: record.stream,
                term: record.term,
                exams: {}
            };
        }
        
        const examType = record.examType || '';
        groups[key].exams[examType] = record.mean;
    });
    
    const trends = [];
    Object.values(groups).forEach(group => {
        const { exams } = group;
        const opener = exams['Opener Exam'];
        const mid = exams['Mid Term Exam'];
        const end = exams['End Term Exam'];
        
        const examCount = [opener, mid, end].filter(score => score !== undefined).length;
        if (examCount < 2) return;
        
        let trend = '';
        let trendValue = 0;
        let status = '';
        let statusColor = '#666';
        
        if (opener !== undefined && end !== undefined) {
            trendValue = end - opener;
            trend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
            status = trendValue > 2 ? 'Improving' : trendValue < -2 ? 'Declining' : 'Stable';
            statusColor = trendValue > 2 ? '#10b981' : trendValue < -2 ? '#ef4444' : '#f59e0b';
        } else if (opener !== undefined && mid !== undefined) {
            trendValue = mid - opener;
            trend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
            status = trendValue > 0 ? 'Improving' : 'Declining';
            statusColor = trendValue > 0 ? '#10b981' : '#ef4444';
        } else if (mid !== undefined && end !== undefined) {
            trendValue = end - mid;
            trend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
            status = trendValue > 0 ? 'Improving' : 'Declining';
            statusColor = trendValue > 0 ? '#10b981' : '#ef4444';
        }
        
        trends.push({
            ...group,
            opener: opener !== undefined ? opener.toFixed(1) : '–',
            mid: mid !== undefined ? mid.toFixed(1) : '–',
            end: end !== undefined ? end.toFixed(1) : '–',
            trend,
            status,
            statusColor
        });
    });
    
    trends.sort((a, b) => {
        return a.subject.localeCompare(b.subject) ||
               a.grade.localeCompare(b.grade) ||
               a.stream.localeCompare(b.stream) ||
               a.term.localeCompare(b.term);
    });
    
    tbody.innerHTML = trends.length > 0 ? trends.map(trend => `
        <tr>
            <td>${trend.subject}</td>
            <td>${trend.grade}</td>
            <td>${trend.stream}</td>
            <td>${trend.term}</td>
            <td style="text-align: center; font-weight: bold;">${trend.opener}%</td>
            <td style="text-align: center; font-weight: bold;">${trend.mid}%</td>
            <td style="text-align: center; font-weight: bold;">${trend.end}%</td>
            <td style="font-weight: bold; color: ${trend.statusColor};">${trend.trend}</td>
            <td>
                <span class="rubric-badge" style="background: ${trend.statusColor};">${trend.status}</span>
            </td>
        </tr>
    `).join('') : `
        <tr>
            <td colspan="9" class="text-center" style="padding: 40px; color: #666;">
                Not enough data for trend analysis (need 2+ exams per group).
            </td>
        </tr>
    `;
};

// ==================== DASHBOARD FUNCTIONS ====================
const updateDashboardStats = () => {
    const records = loadRecords();
    
    const totalAvgCard = el('totalAvgCard');
    if (totalAvgCard && records.length > 0) {
        const totalAvg = records.reduce((sum, record) => sum + record.mean, 0) / records.length;
        const rubric = getRubric(totalAvg);
        totalAvgCard.innerHTML = `
            <h3>Overall Average</h3>
            <div class="card-value" style="color: ${rubric.color};">${totalAvg.toFixed(1)}%</div>
            ${formatRubricBadge(totalAvg)}
            <p class="card-subtitle">Based on ${records.length} records</p>
        `;
    } else if (totalAvgCard) {
        totalAvgCard.innerHTML = `
            <h3>Overall Average</h3>
            <div class="card-value">–</div>
            <p class="card-subtitle">No data yet</p>
        `;
    }
    
    const bestCard = el('bestSubjectCard');
    if (bestCard && records.length > 0) {
        const subjectAverages = {};
        records.forEach(record => {
            const key = `${record.subject}|${record.grade}|${record.stream}`;
            if (!subjectAverages[key]) {
                subjectAverages[key] = { sum: 0, count: 0, subject: record.subject, grade: record.grade, stream: record.stream };
            }
            subjectAverages[key].sum += record.mean;
            subjectAverages[key].count++;
        });
        
        let best = null;
        Object.values(subjectAverages).forEach(subject => {
            const avg = subject.sum / subject.count;
            if (!best || avg > best.avg) {
                best = { ...subject, avg };
            }
        });
        
        if (best) {
            const rubric = getRubric(best.avg);
            bestCard.innerHTML = `
                <h3>Best Performance</h3>
                <div class="card-value" style="color: ${rubric.color};">${best.avg.toFixed(1)}%</div>
                <p class="card-subtitle">${best.subject}</p>
                <small>Grade ${best.grade} • ${best.stream}</small>
            `;
        }
    } else if (bestCard) {
        bestCard.innerHTML = `
            <h3>Best Performance</h3>
            <div class="card-value">–</div>
            <p class="card-subtitle">No data yet</p>
        `;
    }
    
    const worstCard = el('worstSubjectCard');
    if (worstCard && records.length > 0) {
        const subjectAverages = {};
        records.forEach(record => {
            const key = `${record.subject}|${record.grade}|${record.stream}`;
            if (!subjectAverages[key]) {
                subjectAverages[key] = { sum: 0, count: 0, subject: record.subject, grade: record.grade, stream: record.stream };
            }
            subjectAverages[key].sum += record.mean;
            subjectAverages[key].count++;
        });
        
        let worst = null;
        Object.values(subjectAverages).forEach(subject => {
            const avg = subject.sum / subject.count;
            if (!worst || avg < worst.avg) {
                worst = { ...subject, avg };
            }
        });
        
        if (worst) {
            const rubric = getRubric(worst.avg);
            worstCard.innerHTML = `
                <h3>Needs Support</h3>
                <div class="card-value" style="color: ${rubric.color};">${worst.avg.toFixed(1)}%</div>
                <p class="card-subtitle">${worst.subject}</p>
                <small>Grade ${worst.grade} • ${worst.stream}</small>
            `;
        }
    } else if (worstCard) {
        worstCard.innerHTML = `
            <h3>Needs Support</h3>
            <div class="card-value">–</div>
            <p class="card-subtitle">No data yet</p>
        `;
    }
};

const renderProgressChart = () => {
    const canvas = el('progressChart');
    if (!canvas || !window.Chart) return;
    
    const records = loadRecords();
    if (records.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    
    const termData = {};
    records.forEach(record => {
        const key = `${record.term} ${record.year}`;
        if (!termData[key]) {
            termData[key] = { sum: 0, count: 0 };
        }
        termData[key].sum += record.mean;
        termData[key].count++;
    });
    
    const labels = Object.keys(termData).sort();
    const data = labels.map(key => {
        const term = termData[key];
        return Number((term.sum / term.count).toFixed(1));
    });
    
    if (window.progressChartInstance) {
        window.progressChartInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    window.progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Mean Score',
                data: data,
                borderColor: '#8B0000',
                backgroundColor: 'rgba(139, 0, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8B0000',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Mean Score (%)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Term & Year'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
};

// ==================== EXPORT FUNCTIONS ====================
window.downloadPDF = () => {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        showAlert('PDF library not loaded. Please check your internet connection.', 'error');
        return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const teacherName = localStorage.getItem(STORAGE_KEYS.TEACHER) || 'Teacher';
    const records = loadRecords();
    
    let y = 20;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text('SmartScores Performance Report', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Teacher: ${teacherName} | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    if (records.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('No records available.', 20, y);
        doc.save(`SmartScores_Report_${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        return;
    }
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(139, 0, 0);
    
    const colWidths = [15, 25, 25, 20, 15, 20, 15, 15, 15, 15];
    const headers = ['Year', 'Teacher', 'Subject', 'Grade', 'Stream', 'Term', 'Exam', 'Mean', 'Target', 'Rubric'];
    let x = 10;
    
    headers.forEach((header, i) => {
        doc.rect(x, y, colWidths[i], 6, 'F');
        doc.text(header, x + 2, y + 4);
        x += colWidths[i];
    });
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    const targets = loadTargets();
    const targetMap = {};
    targets.forEach(t => {
        const key = `${t.subject}|${t.grade}|${t.stream}|${t.term}|${t.examType}`;
        targetMap[key] = t.score;
    });
    
    records.forEach(record => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
        
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key] || null;
        const rubric = getRubric(record.mean);
        const textColor = getContrastColor(rubric.color);
        
        x = 10;
        const cells = [
            record.year || '',
            (record.teacher || '').substring(0, 20),
            (record.subject || '').substring(0, 20),
            record.grade || '',
            (record.stream || '').substring(0, 15),
            (record.term || '').substring(0, 15),
            (record.examType || '').substring(0, 15),
            record.mean.toFixed(1),
            target ? target.toFixed(1) : '–',
            rubric.code
        ];
        
        cells.forEach((cell, i) => {
            if (i === 9) {
                doc.setFillColor(...hexToRgb(rubric.color));
                doc.rect(x, y, colWidths[i], 5, 'F');
                doc.setTextColor(...hexToRgb(textColor));
            } else {
                doc.setTextColor(0, 0, 0);
            }
            doc.text(String(cell), x + 1, y + 3);
            x += colWidths[i];
        });
        
        y += 6;
    });
    
    if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
    } else {
        y += 10;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0);
    doc.text('Performance Rubric Key:', 10, y);
    y += 8;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let legendX = 10;
    RUBRIC_MAP.forEach((rubric, index) => {
        if (legendX > pageWidth - 40) {
            legendX = 10;
            y += 8;
        }
        
        doc.setFillColor(...hexToRgb(rubric.color));
        doc.rect(legendX, y, 8, 4, 'F');
        doc.setTextColor(...hexToRgb(getContrastColor(rubric.color)));
        doc.text(rubric.code, legendX + 1, y + 3);
        doc.setTextColor(0, 0, 0);
        doc.text(` ${rubric.min}-${rubric.max}`, legendX + 10, y + 3);
        
        legendX += 35;
    });
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('SmartScores v3.0 © 2025 - Generated by Progressive Web App', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`SmartScores_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
};

window.exportToExcel = () => {
    if (typeof XLSX === 'undefined') {
        showAlert('Excel export library not loaded. Please check your internet connection.', 'error');
        return;
    }
    
    const records = loadRecords();
    if (records.length === 0) {
        showAlert('No data to export', 'error');
        return;
    }
    
    const targets = loadTargets();
    const targetMap = {};
    targets.forEach(t => {
        const key = `${t.subject}|${t.grade}|${t.stream}|${t.term}|${t.examType}`;
        targetMap[key] = t.score;
    });
    
    const excelData = records.map(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key] || null;
        const deviation = target !== null ? record.mean - target : null;
        const rubric = getRubric(record.mean);
        
        return {
            'Year': record.year,
            'Teacher': record.teacher,
            'Subject': record.subject,
            'Grade': record.grade,
            'Stream': record.stream,
            'Term': record.term,
            'Exam Type': record.examType,
            'Mean Score': record.mean,
            'Target': target,
            'Deviation': deviation,
            'Rubric': rubric.code,
            'Rubric Range': `${rubric.min}-${rubric.max}`
        };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
    
    const summaryData = [
        ['SmartScores Export Summary'],
        ['Generated', new Date().toLocaleString()],
        ['Teacher', localStorage.getItem(STORAGE_KEYS.TEACHER) || 'Unknown'],
        ['Total Records', records.length],
        [''],
        ['Rubric Key'],
        ...RUBRIC_MAP.map(r => [r.code, `${r.min}-${r.max}`])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    const teacherName = localStorage.getItem(STORAGE_KEYS.TEACHER) || 'Teacher';
    const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `SmartScores_Export_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    showAlert('Excel file exported successfully!', 'success');
};

window.exportBackup = () => {
    const records = loadRecords();
    const targets = loadTargets();
    const teacher = localStorage.getItem(STORAGE_KEYS.TEACHER);
    
    const backupData = {
        version: '3.0',
        exported: new Date().toISOString(),
        teacher: teacher,
        records: records,
        targets: targets,
        rubricSystem: 'EE1-BE2'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_scores_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('Backup file downloaded successfully!', 'success');
};

window.clearAllData = () => {
    if (confirm('⚠️ ARE YOU SURE?\n\nThis will delete ALL your records and targets permanently. This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEYS.RECORDS);
        localStorage.removeItem(STORAGE_KEYS.TARGETS);
        showAlert('All data has been cleared successfully.', 'success');
        renderAll();
    }
};

// ==================== MAIN RENDER FUNCTION ====================

const renderAll = () => {
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Current page:', currentPage, 'Rendering...');
    
    // Always render records (needed for all pages)
    renderRecords();
    
    // Page-specific rendering with proper function calls
    if (currentPage === 'index.html' || currentPage === '' || currentPage === './') {
        console.log('Rendering dashboard...');
        updateDashboardStats();
        renderProgressChart();
    } else if (currentPage === 'set-targets.html') {
        console.log('Rendering targets...');
        renderTargets();
    } else if (currentPage === 'ai-insights.html') {
        console.log('Rendering AI insights...');
        renderAIAnalysis();
    } else if (currentPage === 'averages.html') {
        console.log('Rendering averages...');
        renderAveragesAnalysis();
    } else if (currentPage === 'trends.html') {
        console.log('Rendering trends...');
        renderTrendsAnalysis();
    } else if (currentPage === 'data-entry.html') {
        console.log('Rendering data entry...');
        const teacherDisplay = el('currentTeacher');
        if (teacherDisplay) {
            teacherDisplay.textContent = localStorage.getItem(STORAGE_KEYS.TEACHER) || 'Not logged in';
        }
    } else if (currentPage === 'recorded-scores.html') {
        console.log('Rendering recorded scores...');
        // Already handled by renderRecords() above
    }
    
    console.log('Render complete for:', currentPage);
};

// ==================== MANUAL RENDERING TRIGGERS ====================
// ==================== FORCE RENDERING FOR ANALYSIS PAGES ====================
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Force render for analysis pages after DOM is fully loaded
    setTimeout(() => {
        if (currentPage === 'ai-insights.html') {
            console.log('Force rendering AI insights...');
            renderAIAnalysis();
        } else if (currentPage === 'averages.html') {
            console.log('Force rendering averages...');
            renderAveragesAnalysis();
        } else if (currentPage === 'trends.html') {
            console.log('Force rendering trends...');
            renderTrendsAnalysis();
        }
    }, 200); // Increased to 200ms for better reliability
});
/* =========================================================
   SIDEBAR NAVIGATION - FIXED VERSION
========================================================= */
.menu-toggle {
    position: fixed;
    top: 15px;
    left: 15px;
    background: var(--gradient-primary);
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 10px;
    z-index: 1001;
    cursor: pointer;
    font-size: 1.2em;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    display: block !important;
}

.menu-toggle:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(139, 0, 0, 0.3);
}

/* Sidebar base styles */
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    height: 100vh;
    background: var(--card);
    border-right: 1px solid var(--border);
    padding-top: 80px;
    transition: transform 0.3s ease;
    z-index: 1000;
    overflow-y: auto;
    box-shadow: 2px 0 20px rgba(0,0,0,0.1);
}

.sidebar.closed {
    transform: translateX(-100%);
}

.sidebar:not(.closed) {
    transform: translateX(0);
}

.sidebar a, .sidebar button {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    text-decoration: none;
    font-weight: 600;
    background: none;
    text-align: left;
    width: 100%;
    transition: all 0.3s ease;
    font-size: 1em;
    border: none;
    cursor: pointer;
}

.sidebar a:hover, .sidebar button:hover {
    background: rgba(139, 0, 0, 0.08);
    color: var(--primary);
}

.sidebar a.active {
    background: var(--gradient-primary);
    color: white;
    border-left: 4px solid var(--accent);
}

.sidebar button.logout-btn {
    background: linear-gradient(135deg, #e53e3e, #c53030);
    color: white;
    margin-top: auto;
    border: none;
    cursor: pointer;
    font-weight: 600;
}

.sidebar button.logout-btn:hover {
    background: linear-gradient(135deg, #f56565, #e53e3e);
    transform: translateY(-1px);
}

/* Desktop layout */
@media (min-width: 1024px) {
    .sidebar:not(.closed) {
        transform: translateX(0);
    }
    
    .content-with-sidebar {
        margin-left: 280px;
    }
    
    header {
        margin-left: 280px;
    }
    
    .floating-top-btn {
        right: 20px;
    }
}

/* Mobile layout */
@media (max-width: 1023px) {
    .content-with-sidebar {
        margin-left: 0;
    }
    
    header {
        margin-left: 0;
    }
    
    .floating-top-btn {
        right: 20px;
    }
}

// ==================== INITIALIZATION ====================
// ==================== SIDEBAR MANAGEMENT ====================

// Enhanced sidebar toggle function
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    console.log('Toggle sidebar called'); // Debug log
    
    if (!sidebar) {
        console.log('Sidebar element not found');
        return;
    }
    
    // Toggle the sidebar visibility
    sidebar.classList.toggle('closed');
    
    // Update toggle button text
    if (toggleBtn) {
        toggleBtn.textContent = sidebar.classList.contains('closed') ? '☰' : '✕';
    }
    
    console.log('Sidebar closed state:', sidebar.classList.contains('closed')); // Debug log
};

// Close sidebar when clicking outside (mobile only)
function closeSidebarOnClickOutside(event) {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (!sidebar || !toggleBtn) return;
    
    // Only close on mobile
    if (window.innerWidth >= 1024) return;
    
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnToggle = toggleBtn.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnToggle && !sidebar.classList.contains('closed')) {
        sidebar.classList.add('closed');
        if (toggleBtn) {
            toggleBtn.textContent = '☰';
        }
    }
}

// Initialize sidebar
function initializeSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    console.log('Initializing sidebar'); // Debug log
    
    if (!sidebar) {
        console.log('Sidebar not found during initialization');
        return;
    }
    
    // Set initial state based on screen size
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
        sidebar.classList.remove('closed');
    } else {
        sidebar.classList.add('closed');
    }
    
    // Setup click outside listener for mobile
    document.addEventListener('click', closeSidebarOnClickOutside);
    
    // Auto-close sidebar when clicking links on mobile
    const sidebarLinks = document.querySelectorAll('.sidebar a, .sidebar button');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                sidebar.classList.add('closed');
                if (toggleBtn) {
                    toggleBtn.textContent = '☰';
                }
            }
        });
    });
    
    console.log('Sidebar initialized. Closed:', sidebar.classList.contains('closed'));
}

// Handle window resize
function handleSidebarResize() {
    const sidebar = document.getElementById('sidebarMenu');
    if (!sidebar) return;
    
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
        sidebar.classList.remove('closed');
    } else {
        sidebar.classList.add('closed');
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    autoFillYear();
    
    // Initialize sidebar - ADD THIS LINE
    initializeSidebar();
    
    // Setup window resize handler for sidebar - ADD THIS LINE
    window.addEventListener('resize', handleSidebarResize);
    
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
    
    renderAll();
    
    const teacherNameElement = el('teacherName');
    if (teacherNameElement) {
        teacherNameElement.textContent = localStorage.getItem(STORAGE_KEYS.TEACHER) || 'Guest Teacher';
    }
});
