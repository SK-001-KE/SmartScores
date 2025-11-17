/* =========================================================
   SMARTSCORES APP v3.0 - CLEAN EDITION
   by Kariuki (2025)
   Focus: Data management, rendering, calculations
========================================================= */

// --- In app.js ---
const STORAGE_KEYS = {
    RECORDS: 'smartScoresRecords',
    TARGETS: 'smartScoresTargets', 
    TEACHER: 'teacherFullName',
    TEACHER_FULL_NAME: 'teacherFullName',
    THEME: 'themeMode',
    LEARNER_SCORES: 'learnerScores'
};
// ==================== TERM PERIODS CONFIGURATION ====================
const TERM_PERIODS = {
    'Term 1': {
        start: 'January 1',
        end: 'April 30',
        fullPeriod: '1st January to 30th April'
    },
    'Term 2': {
        start: 'May 1', 
        end: 'August 31',
        fullPeriod: '1st May to 31st August'
    },
    'Term 3': {
        start: 'September 1',
        end: 'December 31',
        fullPeriod: '1st September to 31st December'
    }
};

// Function to get current term based on current date
const getCurrentTerm = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-11
    
    if (currentMonth >= 1 && currentMonth <= 4) {
        return 'Term 1';
    } else if (currentMonth >= 5 && currentMonth <= 8) {
        return 'Term 2';
    } else {
        return 'Term 3';
    }
};

// Function to get term period display text
const getTermPeriod = (term) => {
    return TERM_PERIODS[term] ? TERM_PERIODS[term].fullPeriod : 'Period not defined';
};

// Function to display term periods in the UI
const displayTermPeriods = () => {
    const termPeriodsContainer = document.getElementById('termPeriodsDisplay');
    
    if (!termPeriodsContainer) return;
    
    const currentTerm = getCurrentTerm();
    
    let html = `
        <div class="term-periods-container">
            <h3>Academic Term Periods</h3>
            <div class="current-term-badge">
                📅 Current Term: <strong>${currentTerm}</strong>
            </div>
            <div class="term-periods-grid">
    `;
    
    Object.entries(TERM_PERIODS).forEach(([term, period]) => {
        const isCurrent = term === currentTerm;
        html += `
            <div class="term-period-card ${isCurrent ? 'current-term' : ''}">
                <div class="term-header">
                    <h4>${term}</h4>
                    ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
                </div>
                <div class="term-dates">
                    <div class="date-range">
                        <span class="date-label">Starts:</span>
                        <span class="date-value">${period.start}</span>
                    </div>
                    <div class="date-range">
                        <span class="date-label">Ends:</span>
                        <span class="date-value">${period.end}</span>
                    </div>
                </div>
                <div class="full-period">${period.fullPeriod}</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    termPeriodsContainer.innerHTML = html;
};

// Function to add term period info to data entry forms
const enhanceFormsWithTermInfo = () => {
    const termSelect = document.getElementById('term');
    
    if (termSelect) {
        // Add change event to show term period when term is selected
        termSelect.addEventListener('change', function() {
            const selectedTerm = this.value;
            if (selectedTerm && TERM_PERIODS[selectedTerm]) {
                // Create or update term period info display
                let termInfo = document.getElementById('termPeriodInfo');
                if (!termInfo) {
                    termInfo = document.createElement('div');
                    termInfo.id = 'termPeriodInfo';
                    termInfo.className = 'term-period-info';
                    termSelect.parentNode.appendChild(termInfo);
                }
                termInfo.innerHTML = `
                    <small>📅 ${TERM_PERIODS[selectedTerm].fullPeriod}</small>
                `;
            } else {
                const termInfo = document.getElementById('termPeriodInfo');
                if (termInfo) {
                    termInfo.remove();
                }
            }
        });
        
        // Trigger change event if there's already a selected value
        if (termSelect.value) {
            termSelect.dispatchEvent(new Event('change'));
        }
    }
};

// Function to add term period validation
const validateTermDate = (term, date) => {
    if (!term || !date || !TERM_PERIODS[term]) return true; // Skip validation if data missing
    
    const inputDate = new Date(date);
    const termData = TERM_PERIODS[term];
    
    // Simple month-based validation (you can enhance this with exact dates)
    const inputMonth = inputDate.getMonth() + 1;
    
    if (term === 'Term 1' && (inputMonth >= 1 && inputMonth <= 4)) return true;
    if (term === 'Term 2' && (inputMonth >= 5 && inputMonth <= 8)) return true;
    if (term === 'Term 3' && (inputMonth >= 9 && inputMonth <= 12)) return true;
    
    return false;
};
// DOM Helper
const el = id => document.getElementById(id);

// Alert Helper
const showAlert = (message, type = 'info') => {
    // Create a more sophisticated alert that shows sync status
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 300px;
        box-shadow: var(--shadow);
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        success: '#10B981',
        error: '#EF4444', 
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    alertDiv.style.background = colors[type] || colors.info;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
};

// Add CSS for the animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

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
const loadLearnerScores = () => loadData(STORAGE_KEYS.LEARNER_SCORES, []);

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

// ==================== SYNC STATUS INDICATOR ====================
const createSyncStatusIndicator = () => {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'syncStatus';
    statusDiv.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: 600;
        z-index: 1000;
        transition: all 0.3s ease;
        background: var(--card);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
    `;
    
    document.body.appendChild(statusDiv);
    return statusDiv;
};

const updateSyncStatus = () => {
    if (typeof firebaseSync === 'undefined') return;
    
    const statusDiv = document.getElementById('syncStatus') || createSyncStatusIndicator();
    const status = firebaseSync.getSyncStatus();
    const user = firebaseAuth.getCurrentUser();
    
    let statusText = '';
    let statusColor = '#666';
    
    if (!user) {
        statusText = '🔓 Not signed in';
        statusColor = '#6B7280';
    } else if (user.uid === 'local-user') {
        statusText = '📱 Local mode';
        statusColor = '#F59E0B';
    } else if (!status.isOnline) {
        statusText = '📴 Offline - queued';
        statusColor = '#EF4444';
    } else if (status.queueLength > 0) {
        statusText = `🔄 Syncing (${status.queueLength})`;
        statusColor = '#F59E0B';
    } else {
        statusText = '☁️ Synced';
        statusColor = '#10B981';
    }
    
    statusDiv.textContent = statusText;
    statusDiv.style.background = statusColor;
    statusDiv.style.color = 'white';
};

// Update sync status every 5 seconds and on network events
setInterval(updateSyncStatus, 5000);
window.addEventListener('online', updateSyncStatus);
window.addEventListener('offline', updateSyncStatus);

// ==================== ENHANCED LEARNER SCORES WITH DEVIATION ====================
const calculateDeviation = (term) => {
    const scores = [term.opener, term.mid, term.end].filter(score => score !== null);
    
    if (scores.length < 2) return null;
    
    // Calculate deviation between last two available exams
    const availableScores = [];
    if (term.end !== null) availableScores.push(term.end);
    if (term.mid !== null) availableScores.push(term.mid);
    if (term.opener !== null) availableScores.push(term.opener);
    
    // Take the last two scores
    const recentScores = availableScores.slice(0, 2);
    if (recentScores.length === 2) {
        return recentScores[0] - recentScores[1];
    }
    
    return null;
};

const formatDeviation = (deviation) => {
    if (deviation === null) return '–';
    
    const sign = deviation >= 0 ? '+' : '';
    const className = deviation > 0 ? 'deviation-positive' : 
                     deviation < 0 ? 'deviation-negative' : 'deviation-neutral';
    
    return `<span class="${className}">${sign}${deviation.toFixed(1)}</span>`;
};

const calculateProgress = (term1Avg, term3Avg) => {
    if (term1Avg === null || term3Avg === null) return '–';
    
    const progress = term3Avg - term1Avg;
    const className = progress > 2 ? 'progress-improving' : 
                     progress < -2 ? 'progress-declining' : 'progress-stable';
    const sign = progress >= 0 ? '+' : '';
    const icon = progress > 2 ? '📈' : progress < -2 ? '📉' : '➡️';
    
    return `<span class="${className}">${icon} ${sign}${progress.toFixed(1)}</span>`;
};

// Add this function to calculate term averages
const calculateTermAverage = (term) => {
    const scores = [term.opener, term.mid, term.end].filter(score => score !== null);
    if (scores.length === 0) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Add this function to calculate annual average
const calculateAnnualAverage = (termAverages) => {
    const validAverages = termAverages.filter(avg => avg !== null);
    if (validAverages.length === 0) return null;
    return validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length;
};

// Add this function to format scores
const formatScore = (score) => {
    if (score === null || score === undefined) return '–';
    return score.toFixed(1);
};

// Add this function to get color for score
const getColorForScore = (score) => {
    if (score === null) return '#666';
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
};

const renderRecentRecords = () => {
    const container = document.getElementById('recentRecords');
    if (!container) return;
    
    const records = loadRecords();
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No records yet. Start by entering scores in the Data Entry page.</p>
                <a href="./data-entry.html" class="btn btn-primary">Add First Record</a>
            </div>
        `;
        return;
    }
    
    const recentRecords = records
        .sort((a, b) => new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id))
        .slice(0, 5);
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Grade</th>
                    <th>Stream</th>
                    <th>Term</th>
                    <th>Exam</th>
                    <th>Mean Score</th>
                </tr>
            </thead>
            <tbody>
                ${recentRecords.map(record => `
                    <tr>
                        <td>${record.subject}</td>
                        <td>${record.grade}</td>
                        <td>${record.stream}</td>
                        <td>${record.term}</td>
                        <td>${record.examType}</td>
                        <td style="font-weight: bold; color: ${getColorForScore(record.mean)}">
                            ${record.mean.toFixed(1)}%
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

// Enhanced grouping function with deviation calculation
const groupLearnerScores = (scores) => {
    const learnerMap = {};
    
    scores.forEach(score => {
        const key = `${score.admissionNo}-${score.year}`;
        if (!learnerMap[key]) {
            learnerMap[key] = {
                admissionNo: score.admissionNo,
                learnerName: score.learnerName,
                grade: score.grade,
                stream: score.stream,
                year: score.year,
                terms: {
                    'Term 1': { opener: null, mid: null, end: null },
                    'Term 2': { opener: null, mid: null, end: null },
                    'Term 3': { opener: null, mid: null, end: null }
                }
            };
        }
        
        // Assign scores to appropriate term and exam type
        if (score.term in learnerMap[key].terms) {
            if (score.examType.includes('Opener')) {
                learnerMap[key].terms[score.term].opener = score.score;
            } else if (score.examType.includes('Mid')) {
                learnerMap[key].terms[score.term].mid = score.score;
            } else if (score.examType.includes('End')) {
                learnerMap[key].terms[score.term].end = score.score;
            }
        }
    });
    
    return learnerMap;
};

// Enhanced table generation with deviation columns
const generateLearnerTableHTML = (learnerData) => {
    return Object.values(learnerData).map(learner => {
        const term1 = learner.terms['Term 1'];
        const term2 = learner.terms['Term 2'];
        const term3 = learner.terms['Term 3'];
        
        const term1Avg = calculateTermAverage(term1);
        const term2Avg = calculateTermAverage(term2);
        const term3Avg = calculateTermAverage(term3);
        
        const term1Deviation = calculateDeviation(term1);
        const term2Deviation = calculateDeviation(term2);
        const term3Deviation = calculateDeviation(term3);
        
        const annualAvg = calculateAnnualAverage([term1Avg, term2Avg, term3Avg]);
        const rubricBadge = formatRubricBadge(annualAvg);
        const progress = calculateProgress(term1Avg, term3Avg);
        
        return `
            <tr>
                <td>${learner.admissionNo}</td>
                <td><strong>${learner.learnerName}</strong></td>
                <td>${learner.grade}</td>
                <td>${learner.stream}</td>
                
                <!-- Term 1 -->
                <td>${formatScore(term1.opener)}</td>
                <td>${formatScore(term1.mid)}</td>
                <td>${formatScore(term1.end)}</td>
                <td style="font-weight: bold; color: ${getColorForScore(term1Avg)}">${formatScore(term1Avg)}</td>
                <td>${formatDeviation(term1Deviation)}</td>
                
                <!-- Term 2 -->
                <td>${formatScore(term2.opener)}</td>
                <td>${formatScore(term2.mid)}</td>
                <td>${formatScore(term2.end)}</td>
                <td style="font-weight: bold; color: ${getColorForScore(term2Avg)}">${formatScore(term2Avg)}</td>
                <td>${formatDeviation(term2Deviation)}</td>
                
                <!-- Term 3 -->
                <td>${formatScore(term3.opener)}</td>
                <td>${formatScore(term3.mid)}</td>
                <td>${formatScore(term3.end)}</td>
                <td style="font-weight: bold; color: ${getColorForScore(term3Avg)}">${formatScore(term3Avg)}</td>
                <td>${formatDeviation(term3Deviation)}</td>
                
                <!-- Annual Summary -->
                <td style="font-weight: bold; color: ${getColorForScore(annualAvg)}">${formatScore(annualAvg)}</td>
                <td>${progress}</td>
                <td>${rubricBadge}</td>
            </tr>
        `;
    }).join('');
};

// Enhanced performance summary
const updatePerformanceSummary = (learnerData) => {
    const learners = Object.values(learnerData);
    
    if (learners.length === 0) {
        document.getElementById('performanceSummary').style.display = 'none';
        return;
    }
    
    document.getElementById('performanceSummary').style.display = 'grid';
    
    // Calculate summary statistics
    let totalAnnual = 0;
    let passCount = 0;
    let totalImprovement = 0;
    let improvementCount = 0;
    const termAverages = { term1: 0, term2: 0, term3: 0 };
    let termCounts = { term1: 0, term2: 0, term3: 0 };
    
    learners.forEach(learner => {
        const term1Avg = calculateTermAverage(learner.terms['Term 1']);
        const term2Avg = calculateTermAverage(learner.terms['Term 2']);
        const term3Avg = calculateTermAverage(learner.terms['Term 3']);
        const annualAvg = calculateAnnualAverage([term1Avg, term2Avg, term3Avg]);
        
        if (annualAvg !== null) {
            totalAnnual += annualAvg;
            if (annualAvg >= 50) passCount++;
        }
        
        // Track term averages
        [['Term 1', term1Avg], ['Term 2', term2Avg], ['Term 3', term3Avg]].forEach(([term, avg]) => {
            if (avg !== null) {
                termAverages[term.toLowerCase().replace(' ', '')] += avg;
                termCounts[term.toLowerCase().replace(' ', '')]++;
            }
        });
        
        // Track improvement
        if (term1Avg !== null && term3Avg !== null) {
            totalImprovement += (term3Avg - term1Avg);
            improvementCount++;
        }
    });
    
    const classAverage = totalAnnual / learners.length;
    const passRate = (passCount / learners.length) * 100;
    const avgImprovement = improvementCount > 0 ? totalImprovement / improvementCount : 0;
    
    // Calculate consistency (variance between terms)
    const validTermAverages = Object.values(termAverages).filter((avg, index) => termCounts[Object.keys(termAverages)[index]] > 0);
    const mean = validTermAverages.reduce((a, b) => a + b, 0) / validTermAverages.length;
    const variance = validTermAverages.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validTermAverages.length;
    const consistencyScore = Math.max(0, 10 - Math.sqrt(variance) / 3);
    
    // Update summary cards
    document.getElementById('summaryClassAverage').textContent = classAverage.toFixed(1) + '%';
    document.getElementById('summaryLearnerCount').textContent = `${learners.length} learners`;
    document.getElementById('summaryImprovement').textContent = (avgImprovement >= 0 ? '+' : '') + avgImprovement.toFixed(1) + '%';
    document.getElementById('summaryPassRate').textContent = passRate.toFixed(1) + '%';
    document.getElementById('summaryConsistency').textContent = consistencyScore.toFixed(1);
};

// Enhanced analytics dashboard
const updateAnalyticsDashboard = async () => {
    const scores = await loadLearnerScores();
    const learnerData = groupLearnerScores(scores);
    const learners = Object.values(learnerData);
    
    if (learners.length === 0) {
        document.getElementById('classAverageCard').querySelector('.card-value').textContent = 'N/A';
        document.getElementById('improvementCard').querySelector('.card-value').textContent = 'N/A';
        document.getElementById('consistencyCard').querySelector('.card-value').textContent = 'N/A';
        document.getElementById('topPerformerCard').querySelector('.card-value').textContent = 'N/A';
        return;
    }
    
    // Calculate analytics
    let totalAnnual = 0;
    let totalImprovement = 0;
    let improvementCount = 0;
    let topPerformer = { name: 'N/A', average: 0 };
    const termAverages = { term1: 0, term2: 0, term3: 0 };
    let termCounts = { term1: 0, term2: 0, term3: 0 };
    
    learners.forEach(learner => {
        const term1Avg = calculateTermAverage(learner.terms['Term 1']);
        const term2Avg = calculateTermAverage(learner.terms['Term 2']);
        const term3Avg = calculateTermAverage(learner.terms['Term 3']);
        const annualAvg = calculateAnnualAverage([term1Avg, term2Avg, term3Avg]);
        
        if (annualAvg !== null) {
            totalAnnual += annualAvg;
            
            // Track top performer
            if (annualAvg > topPerformer.average) {
                topPerformer = { 
                    name: learner.learnerName, 
                    average: annualAvg 
                };
            }
        }
        
        // Track term averages for consistency
        [['term1', term1Avg], ['term2', term2Avg], ['term3', term3Avg]].forEach(([term, avg]) => {
            if (avg !== null) {
                termAverages[term] += avg;
                termCounts[term]++;
            }
        });
        
        // Track improvement
        if (term1Avg !== null && term3Avg !== null) {
            totalImprovement += (term3Avg - term1Avg);
            improvementCount++;
        }
    });
    
    const classAverage = totalAnnual / learners.length;
    const avgImprovement = improvementCount > 0 ? totalImprovement / improvementCount : 0;
    
    // Calculate consistency
    const validTermAverages = Object.entries(termAverages)
        .filter(([term,]) => termCounts[term] > 0)
        .map(([term, total]) => total / termCounts[term]);
    
    const mean = validTermAverages.reduce((a, b) => a + b, 0) / validTermAverages.length;
    const variance = validTermAverages.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validTermAverages.length;
    const consistencyScore = Math.max(0, 10 - Math.sqrt(variance) / 3);
    
    // Update dashboard cards
    document.getElementById('classAverageCard').querySelector('.card-value').textContent = classAverage.toFixed(1) + '%';
    document.getElementById('improvementCard').querySelector('.card-value').textContent = (avgImprovement >= 0 ? '+' : '') + avgImprovement.toFixed(1) + '%';
    document.getElementById('consistencyCard').querySelector('.card-value').textContent = consistencyScore.toFixed(1) + '/10';
    document.getElementById('topPerformerCard').querySelector('.card-value').textContent = topPerformer.average.toFixed(1) + '%';
    document.getElementById('topPerformerCard').querySelector('.card-subtitle').textContent = topPerformer.name;
};

// Enhanced rendering with performance summary
const renderLearnerScores = async () => {
    const tbody = el('learnerScoresBody');
    const emptyState = el('emptyLearnerState');
    
    if (!tbody) return;
    
    const scores = await loadLearnerScores();
    
    // Apply filters
    let filteredScores = scores;
    const subjectFilter = el('filterSubject')?.value;
    const gradeFilter = el('filterGrade')?.value;
    const streamFilter = el('filterStream')?.value;
    const yearFilter = el('filterYear')?.value;
    
    if (subjectFilter) {
        filteredScores = filteredScores.filter(score => score.subject === subjectFilter);
    }
    if (gradeFilter) {
        filteredScores = filteredScores.filter(score => score.grade === gradeFilter);
    }
    if (streamFilter) {
        filteredScores = filteredScores.filter(score => score.stream === streamFilter);
    }
    if (yearFilter) {
        filteredScores = filteredScores.filter(score => score.year.toString() === yearFilter);
    }
    
    if (filteredScores.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        updateLearnerRecordsCount(0);
        document.getElementById('performanceSummary').style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Group and display filtered scores
    const learnerData = groupLearnerScores(filteredScores);
    tbody.innerHTML = generateLearnerTableHTML(learnerData);
    updateLearnerRecordsCount(Object.keys(learnerData).length);
    updatePerformanceSummary(learnerData);
};

// Enhanced export with deviation data
const exportSubjectReportExcel = async (scores, subject, grade, stream, year) => {
    if (scores.length === 0) {
        showAlert('No data to export', 'error');
        return;
    }
    
    // Group data by learner
    const learnerData = groupLearnerScores(scores);
    const learners = Object.values(learnerData);
    
    // Prepare data for Excel with deviation columns
    const excelData = learners.map(learner => {
        const term1 = learner.terms['Term 1'];
        const term2 = learner.terms['Term 2'];
        const term3 = learner.terms['Term 3'];
        
        const term1Avg = calculateTermAverage(term1);
        const term2Avg = calculateTermAverage(term2);
        const term3Avg = calculateTermAverage(term3);
        
        const term1Deviation = calculateDeviation(term1);
        const term2Deviation = calculateDeviation(term2);
        const term3Deviation = calculateDeviation(term3);
        
        const annualAvg = calculateAnnualAverage([term1Avg, term2Avg, term3Avg]);
        const rubric = annualAvg !== null ? getRubric(annualAvg) : { code: 'N/A', text: 'N/A' };
        const progress = term1Avg !== null && term3Avg !== null ? term3Avg - term1Avg : null;
        
        return {
            'Admission No': learner.admissionNo,
            'Learner Name': learner.learnerName,
            'Grade': learner.grade,
            'Stream': learner.stream,
            'Year': learner.year,
            
            // Term 1 Scores
            'Term 1 Opener': term1.opener,
            'Term 1 Mid Term': term1.mid,
            'Term 1 End Term': term1.end,
            'Term 1 Average': term1Avg,
            'Term 1 Deviation': term1Deviation,
            
            // Term 2 Scores
            'Term 2 Opener': term2.opener,
            'Term 2 Mid Term': term2.mid,
            'Term 2 End Term': term2.end,
            'Term 2 Average': term2Avg,
            'Term 2 Deviation': term2Deviation,
            
            // Term 3 Scores
            'Term 3 Opener': term3.opener,
            'Term 3 Mid Term': term3.mid,
            'Term 3 End Term': term3.end,
            'Term 3 Average': term3Avg,
            'Term 3 Deviation': term3Deviation,
            
            // Annual Summary
            'Annual Average': annualAvg,
            'Progress (T1 to T3)': progress,
            'Performance Rubric': rubric.code,
            'Rubric Description': rubric.text,
            'Teacher': learner.teacher || getTeacherName()
        };
    });
    
    // Calculate class statistics with deviation analysis
    const classStats = calculateClassStatistics(learners);
    
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Main data sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Learner Scores');
    
    // Summary sheet with deviation analysis
    const summaryData = [
        ['SMARTSCORES PERFORMANCE REPORT WITH PROGRESS TRACKING'],
        [''],
        ['Report Details:', '', '', '', 'Progress Analysis:', '', ''],
        [`Subject: ${subject}`, '', '', '', `Average Improvement: ${classStats.avgImprovement.toFixed(1)}%`],
        [`Grade: ${grade}`, '', '', '', `Consistent Improvers: ${classStats.consistentImprovers}`],
        [`Stream: ${stream}`, '', '', '', `Declining Learners: ${classStats.decliningLearners}`],
        [`Year: ${year}`, '', '', '', `Stable Performers: ${classStats.stablePerformers}`],
        [`Teacher: ${getTeacherName()}`, '', '', '', `Best Progress: ${classStats.bestProgress}`],
        [`Generated: ${new Date().toLocaleString()}`, '', '', '', `Needs Attention: ${classStats.needsAttention}`],
        [''],
        ['Deviation Analysis (Last Two Exams)'],
        ['Term', 'Positive Deviation', 'Negative Deviation', 'Neutral', 'Avg Deviation'],
        ['Term 1', classStats.deviationAnalysis.term1.positive, classStats.deviationAnalysis.term1.negative, classStats.deviationAnalysis.term1.neutral, classStats.deviationAnalysis.term1.average],
        ['Term 2', classStats.deviationAnalysis.term2.positive, classStats.deviationAnalysis.term2.negative, classStats.deviationAnalysis.term2.neutral, classStats.deviationAnalysis.term2.average],
        ['Term 3', classStats.deviationAnalysis.term3.positive, classStats.deviationAnalysis.term3.negative, classStats.deviationAnalysis.term3.neutral, classStats.deviationAnalysis.term3.average],
        [''],
        ['Performance Distribution'],
        ['Rubric', 'Count', 'Percentage'],
        ...classStats.rubricDistribution.map(r => [r.rubric, r.count, `${r.percentage}%`])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Progress Summary');
    
    // Generate filename
    const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTeacher = getTeacherName().replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Progress_Report_${safeSubject}_Grade${grade}_${stream}_${year}_${safeTeacher}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    showAlert(`Progress report exported successfully! ${learners.length} learners included.`, 'success');
};

// Enhanced class statistics with deviation analysis
const calculateClassStatistics = (learners) => {
    const stats = {
        totalLearners: learners.length,
        classAverage: 0,
        avgImprovement: 0,
        consistentImprovers: 0,
        decliningLearners: 0,
        stablePerformers: 0,
        bestProgress: 'N/A',
        needsAttention: 0,
        deviationAnalysis: {
            term1: { positive: 0, negative: 0, neutral: 0, average: 0 },
            term2: { positive: 0, negative: 0, neutral: 0, average: 0 },
            term3: { positive: 0, negative: 0, neutral: 0, average: 0 }
        },
        rubricDistribution: []
    };
    
    if (learners.length === 0) return stats;
    
    let totalAnnual = 0;
    let totalImprovement = 0;
    let improvementCount = 0;
    const rubricCount = {};
    let bestProgressValue = -100;
    let bestProgressName = 'N/A';
    
    // Track deviations per term
    const termDeviations = { term1: [], term2: [], term3: [] };
    
    learners.forEach(learner => {
        const term1 = learner.terms['Term 1'];
        const term2 = learner.terms['Term 2'];
        const term3 = learner.terms['Term 3'];
        
        const term1Avg = calculateTermAverage(term1);
        const term2Avg = calculateTermAverage(term2);
        const term3Avg = calculateTermAverage(term3);
        const annualAvg = calculateAnnualAverage([term1Avg, term2Avg, term3Avg]);
        
        if (annualAvg !== null) {
            totalAnnual += annualAvg;
            
            // Count rubrics
            const rubric = getRubric(annualAvg).code;
            rubricCount[rubric] = (rubricCount[rubric] || 0) + 1;
        }
        
        // Track progress
        if (term1Avg !== null && term3Avg !== null) {
            const progress = term3Avg - term1Avg;
            totalImprovement += progress;
            improvementCount++;
            
            // Track progress categories
            if (progress > 5) stats.consistentImprovers++;
            else if (progress < -5) stats.decliningLearners++;
            else stats.stablePerformers++;
            
            // Track best progress
            if (progress > bestProgressValue) {
                bestProgressValue = progress;
                bestProgressName = learner.learnerName;
            }
            
            // Track needs attention
            if (term3Avg < 40) stats.needsAttention++;
        }
        
        // Calculate and track deviations
        [['term1', term1], ['term2', term2], ['term3', term3]].forEach(([term, termData]) => {
            const deviation = calculateDeviation(termData);
            if (deviation !== null) {
                termDeviations[term].push(deviation);
                
                // Count deviation categories
                if (deviation > 0) stats.deviationAnalysis[term].positive++;
                else if (deviation < 0) stats.deviationAnalysis[term].negative++;
                else stats.deviationAnalysis[term].neutral++;
            }
        });
    });
    
    // Calculate averages
    stats.classAverage = totalAnnual / learners.length;
    stats.avgImprovement = improvementCount > 0 ? totalImprovement / improvementCount : 0;
    stats.bestProgress = bestProgressName !== 'N/A' ? `${bestProgressName} (+${bestProgressValue.toFixed(1)}%)` : 'N/A';
    
    // Calculate average deviations
    Object.keys(termDeviations).forEach(term => {
        const deviations = termDeviations[term];
        if (deviations.length > 0) {
            stats.deviationAnalysis[term].average = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        }
    });
    
    // Rubric distribution
    stats.rubricDistribution = Object.entries(rubricCount).map(([rubric, count]) => ({
        rubric,
        count,
        percentage: ((count / learners.length) * 100).toFixed(1)
    }));
    
    return stats;
};

// ==================== DATA MIGRATION ====================
const migrateExistingData = async () => {
    if (typeof firebaseSync === 'undefined' || typeof firebaseAuth === 'undefined') return;
    
    const user = firebaseAuth.getCurrentUser();
    if (!user || user.uid === 'local-user') return;
    
    // Check if we've already migrated
    const migrationKey = `data_migrated_${user.uid}`;
    if (localStorage.getItem(migrationKey)) return;
    
    console.log('🔄 Checking for existing data to migrate...');
    
    // Migrate records
    const localRecords = localStorage.getItem('smartScoresRecords');
    if (localRecords) {
        const records = JSON.parse(localRecords);
        if (records.length > 0) {
            console.log(`📦 Migrating ${records.length} records to cloud...`);
            await firebaseSync.saveRecords(records);
        }
    }
    
    // Migrate targets
    const localTargets = localStorage.getItem('smartScoresTargets');
    if (localTargets) {
        const targets = JSON.parse(localTargets);
        if (targets.length > 0) {
            console.log(`🎯 Migrating ${targets.length} targets to cloud...`);
            await firebaseSync.saveTargets(targets);
        }
    }
    
    // Mark as migrated
    localStorage.setItem(migrationKey, 'true');
    console.log('✅ Data migration completed');
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

// ==================== MOBILE NAVIGATION MANAGEMENT ====================
window.toggleMobileMenu = function() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    
    if (mobileSidebar) {
        mobileSidebar.classList.toggle('closed');
        
        // Update toggle button text
        if (toggleBtn) {
            toggleBtn.textContent = mobileSidebar.classList.contains('closed') ? '☰' : '✕';
        }
        
        // Close sidebar when clicking outside on mobile
        if (!mobileSidebar.classList.contains('closed')) {
            setTimeout(() => {
                document.addEventListener('click', closeMobileSidebarOnClickOutside);
            }, 100);
        }
    }
};

// Close mobile sidebar when clicking outside
function closeMobileSidebarOnClickOutside(event) {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    
    if (!mobileSidebar || !toggleBtn) return;
    
    const isClickInsideSidebar = mobileSidebar.contains(event.target);
    const isClickOnToggle = toggleBtn.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnToggle && !mobileSidebar.classList.contains('closed')) {
        mobileSidebar.classList.add('closed');
        document.removeEventListener('click', closeMobileSidebarOnClickOutside);
    }
}

// Auto-close mobile sidebar when navigating
function setupMobileSidebarAutoClose() {
    if (window.innerWidth < 1024) {
        const mobileSidebarLinks = document.querySelectorAll('.mobile-sidebar a');
        mobileSidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                const mobileSidebar = document.getElementById('mobileSidebar');
                if (mobileSidebar && !mobileSidebar.classList.contains('closed')) {
                    mobileSidebar.classList.add('closed');
                }
            });
        });
    }
}

// ==================== DATA ENTRY ====================
// Update the teacher name retrieval throughout app.js
const getTeacherName = () => {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_FULL_NAME) || 
           localStorage.getItem('teacherFullName') || 
           'Guest Teacher';
};

const getTeacherFirstName = () => {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_FIRST_NAME) || 
           localStorage.getItem('teacherFirstName') || 
           'Teacher';
};

// ==================== DATA ENTRY HANDLER ====================
const handleSaveRecord = async (event) => {
    if (event) event.preventDefault();

    console.log('🔄 Starting save process...');

    const teacherName = getTeacherName();
    console.log('👨‍🏫 Teacher name:', teacherName);
    
    // Basic Validation
    const subject = document.getElementById('subject')?.value?.trim();
    const grade = document.getElementById('grade')?.value?.trim();
    const meanScoreValue = document.getElementById('meanScore')?.value;

    if (!teacherName || teacherName === 'Guest Teacher') {
        showAlert('Please sign in or set your teacher name in the profile section.', 'error');
        return;
    }
    
    if (!subject || !grade || !meanScoreValue) {
        showAlert('Please fill in Subject, Grade, and Mean Score.', 'error');
        return;
    }

    const mean = parseFloat(meanScoreValue);
    if (isNaN(mean) || mean < 0 || mean > 100) {
        showAlert('Mean Score must be a number between 0 and 100.', 'error');
        return;
    }

    // Create Record Object
    const record = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        teacher: teacherName, 
        subject: subject,
        grade: grade,
        stream: document.getElementById('stream')?.value?.trim() || 'N/A', 
        term: document.getElementById('term')?.value?.trim(),
        examType: document.getElementById('examType')?.value?.trim(),
        year: document.getElementById('year')?.value?.trim(),
        mean: mean
    };

    console.log('📝 Record to save:', record);

    try {
        // Load, Check Duplicate, and Push
        const existingRecords = loadRecords(); 
        console.log('📊 Existing records count:', existingRecords.length);

        // Simple check for duplicate entry 
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
            showAlert('A record with these exact details already exists!', 'error');
            return;
        }

        existingRecords.push(record);

        // Save and Refresh
        const saveSuccess = saveRecords(existingRecords);
        
        if (saveSuccess) {
            console.log('✅ Record saved successfully');
            showAlert('Record saved successfully!', 'success');
            
            // Reset form and refill the year field
            const dataForm = document.getElementById('dataEntryForm');
            if (dataForm) {
                dataForm.reset(); 
                // Auto-fill year again after reset
                const yearInput = document.getElementById('year');
                if (yearInput) {
                    yearInput.value = new Date().getFullYear();
                }
            }

            // CRITICAL: Refresh all views
            await renderAll();
           // Force refresh of recorded-scores page if we're there
    if (window.location.pathname.includes('recorded-scores.html')) {
        await renderRecords();
    }
            
        } else {
            throw new Error('Failed to save records');
        }
    } catch (error) {
        console.error('❌ Error saving record:', error);
        showAlert('Error saving record: ' + error.message, 'error');
    }
};

// Add these missing functions to app.js

// AI Insights specific functions
const updateAIInsights = () => {
    const records = loadRecords();
    const targets = loadTargets();
    
    // Update summary cards
    updateSummaryCards(records, targets);
    updateAlerts(records, targets);
    updateRecommendations(records, targets);
};

const updateSummaryCards = (records, targets) => {
    if (records.length === 0) return;
    
    // Overall Average
    const overallAvg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
    el('overallAverage').textContent = overallAvg.toFixed(1) + '%';
    
    // Targets Met
    const targetsMet = calculateTargetsMet(records, targets);
    el('targetsMet').textContent = targetsMet.metCount;
    el('targetsCount').textContent = targetsMet.total + ' subjects';
    
    // Needs Attention
    const attention = calculateAttentionNeeded(records, targets);
    el('needsAttention').textContent = attention.count;
    el('attentionCount').textContent = attention.count + ' alerts';
    
    // Outstanding
    const outstanding = calculateOutstanding(records);
    el('outstandingCount').textContent = outstanding.count;
    el('outstandingText').textContent = outstanding.count + ' subjects';
};

const calculateTargetsMet = (records, targets) => {
    let metCount = 0;
    const targetMap = {};
    
    targets.forEach(target => {
        const key = `${target.subject}|${target.grade}|${target.stream}|${target.term}|${target.examType}`;
        targetMap[key] = target.score;
    });
    
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key];
        if (target && record.mean >= target) {
            metCount++;
        }
    });
    
    return { metCount, total: targets.length };
};

const calculateAttentionNeeded = (records, targets) => {
    const critical = [];
    const targetMap = {};
    
    targets.forEach(target => {
        const key = `${target.subject}|${target.grade}|${target.stream}|${target.term}|${target.examType}`;
        targetMap[key] = target.score;
    });
    
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key];
        
        // Critical if significantly below target or very low score
        if ((target && record.mean < target - 10) || record.mean < 40) {
            critical.push(record);
        }
    });
    
    return { count: critical.length, records: critical };
};

const calculateOutstanding = (records) => {
    const outstanding = records.filter(record => record.mean >= 80);
    return { count: outstanding.length, records: outstanding };
};

const updateAlerts = (records, targets) => {
    const attention = calculateAttentionNeeded(records, targets);
    const outstanding = calculateOutstanding(records);
    
    // Update critical alerts
    updateAlertSection('criticalAlerts', attention.records, 'critical', 'No critical alerts! All subjects are performing well.');
    el('criticalBadge').textContent = attention.count + ' critical';
    
    // Update positive alerts
    updateAlertSection('positiveAlerts', outstanding.records, 'positive', 'No outstanding performance alerts yet.');
    el('positiveBadge').textContent = outstanding.count + ' outstanding';
    
    // Update on-track alerts
    updateOnTrackAlerts(records, targets);
};

const updateAlertSection = (containerId, records, type, emptyMessage) => {
    const container = el(containerId);
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-alert">
                <div class="empty-icon">${type === 'critical' ? '✅' : '📊'}</div>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = records.map(record => `
        <div class="alert-item ${type}">
            <div class="alert-icon">${type === 'critical' ? '⚠️' : '🎉'}</div>
            <div class="alert-content">
                <h4>${record.subject} - ${type === 'critical' ? 'Needs Attention' : 'Outstanding!'}</h4>
                <p>Grade ${record.grade}, ${record.stream} - ${record.mean.toFixed(1)}%</p>
            </div>
            <span class="alert-tag">${type === 'critical' ? 'Critical' : 'Excellent'}</span>
        </div>
    `).join('');
};

const updateOnTrackAlerts = (records, targets) => {
    const onTrack = [];
    const targetMap = {};
    
    targets.forEach(target => {
        const key = `${target.subject}|${target.grade}|${target.stream}|${target.term}|${target.examType}`;
        targetMap[key] = target.score;
    });
    
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key];
        
        if (target && Math.abs(record.mean - target) <= 5) {
            onTrack.push(record);
        }
    });
    
    updateAlertSection('onTrackAlerts', onTrack, 'info', 'No subjects currently tracked against targets.');
    el('onTrackBadge').textContent = onTrack.length + ' on track';
};

const updateRecommendations = (records, targets) => {
    const recommendations = generateAIRecommendations(records, targets);
    const container = el('aiRecommendations');
    
    el('recommendationBadge').textContent = recommendations.length + ' recommendations';
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-recommendation">
                <div class="empty-icon">🤖</div>
                <p>Add more data and set targets to get AI recommendations.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-icon">💡</div>
            <div class="recommendation-content">
                <h4>${rec.title}</h4>
                <p>${rec.message}</p>
                ${rec.suggestion ? `<p><strong>Suggestion:</strong> ${rec.suggestion}</p>` : ''}
            </div>
        </div>
    `).join('');
};

const generateAIRecommendations = (records, targets) => {
    const recommendations = [];
    
    if (records.length === 0) return recommendations;
    
    // Check for low performing subjects
    const subjectAverages = {};
    records.forEach(record => {
        const key = record.subject;
        if (!subjectAverages[key]) {
            subjectAverages[key] = { sum: 0, count: 0 };
        }
        subjectAverages[key].sum += record.mean;
        subjectAverages[key].count++;
    });
    
    Object.entries(subjectAverages).forEach(([subject, data]) => {
        const avg = data.sum / data.count;
        if (avg < 50) {
            recommendations.push({
                title: `Low Performance in ${subject}`,
                message: `Average score is ${avg.toFixed(1)}%, which is below the satisfactory level.`,
                suggestion: 'Consider additional support, remedial classes, or differentiated instruction.'
            });
        }
    });
    
    // Check target performance
    const targetMap = {};
    targets.forEach(target => {
        const key = `${target.subject}|${target.grade}|${target.stream}|${target.term}|${target.examType}`;
        targetMap[key] = target.score;
    });
    
    let belowTargetCount = 0;
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key];
        if (target && record.mean < target - 5) {
            belowTargetCount++;
        }
    });
    
    if (belowTargetCount > 0) {
        recommendations.push({
            title: 'Multiple Subjects Below Target',
            message: `${belowTargetCount} records are significantly below their targets.`,
            suggestion: 'Review teaching strategies and provide targeted interventions.'
        });
    }
    
    return recommendations;
};

// ==================== TARGET MANAGEMENT ====================
const handleSaveTarget = async (event) => {
    if (event) event.preventDefault();
    
    const target = {
        subject: el('targetSubject')?.value?.trim(),
        grade: el('targetGrade')?.value?.trim(),
        stream: el('targetStream')?.value?.trim(),
        term: el('targetTerm')?.value?.trim(),
        examType: el('targetExamType')?.value?.trim(),
        score: parseFloat(el('targetScore')?.value)
    };
    
    // Validation
    if (!target.subject || !target.grade || !target.term || !target.examType || isNaN(target.score)) {
        showAlert('Please fill in all required fields with valid data.', 'error');
        return;
    }
    
    if (target.score < 0 || target.score > 100) {
        showAlert('Target score must be between 0 and 100.', 'error');
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
const renderAIInsights = () => {
    const container = el('insights');
    if (!container) return;
    
    const records = loadRecords();
    const targets = loadTargets();
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="insight-item">
                <p>No data available. Start by entering scores to generate insights.</p>
            </div>
        `;
        return;
    }
    
    const targetMap = {};
    targets.forEach(target => {
        const key = `${target.subject}|${target.grade}|${target.stream}|${target.term}|${target.examType}`;
        targetMap[key] = target.score;
    });
    
    const insights = [];
    let onTrackCount = 0;
    let aboveTargetCount = 0;
    let belowTargetCount = 0;
    
    records.forEach(record => {
        const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
        const target = targetMap[key];
        
        if (target !== undefined) {
            const deviation = ((record.mean - target) / target) * 100;
            const absoluteDeviation = Math.abs(deviation);
            
            if (absoluteDeviation > 10) {
                const insight = {
                    subject: record.subject,
                    grade: record.grade,
                    stream: record.stream,
                    term: record.term,
                    actual: record.mean,
                    target: target,
                    deviation: deviation,
                    type: deviation > 0 ? 'above' : 'below'
                };
                insights.push(insight);
                
                if (deviation > 0) aboveTargetCount++;
                else belowTargetCount++;
            } else {
                onTrackCount++;
            }
        }
    });
    
    let insightsHTML = '';
    
    if (insights.length === 0 && targets.length > 0) {
        insightsHTML = `
            <div class="insight-item positive">
                <h4>🎉 Excellent Performance!</h4>
                <p>All ${onTrackCount} tracked subjects are within 10% of their targets.</p>
            </div>
        `;
    } else if (insights.length > 0) {
        insightsHTML = insights.map(insight => `
            <div class="insight-item ${insight.type === 'above' ? 'positive' : 'negative'}">
                <h4>${insight.type === 'above' ? '🚀 Outstanding!' : '⚠️ Needs Attention'}</h4>
                <p><strong>${insight.subject}</strong> (Grade ${insight.grade}, ${insight.stream}, ${insight.term})</p>
                <p>Actual: <strong>${insight.actual.toFixed(1)}%</strong> | Target: ${insight.target}%</p>
                <p>Deviation: <strong style="color: ${insight.type === 'above' ? '#10b981' : '#ef4444'}">
                    ${insight.deviation > 0 ? '+' : ''}${insight.deviation.toFixed(1)}%
                </strong></p>
            </div>
        `).join('');
        
        insightsHTML += `
            <div class="insights-summary">
                <p><strong>Summary:</strong> ${aboveTargetCount} above target, ${belowTargetCount} below target, ${onTrackCount} on track</p>
            </div>
        `;
    } else {
        insightsHTML = `
            <div class="insight-item">
                <h4>📊 Set Targets for Better Insights</h4>
                <p>Set performance targets to get AI insights about your class performance.</p>
                <a href="./set-targets.html" class="btn btn-primary">Set Targets</a>
            </div>
        `;
    }
    
    container.innerHTML = insightsHTML;
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
    if (!canvas || !window.Chart) {
        console.error('Chart.js not loaded');
        return;
    }
    
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

// ==================== EXPORT FUNCTIONS - ENHANCED ====================
window.downloadPDF = () => {
    try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            showAlert('PDF library not loaded. Please check your internet connection.', 'error');
            return;
        }
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const teacherName = getTeacherName() || 'Teacher';
        const records = loadRecords();
        
        let y = 20;
        
        // Header
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
            const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
            doc.save(`SmartScores_Report_${safeName}.pdf`);
            showAlert('PDF exported (empty report)', 'info');
            return;
        }
        
        // Table Header
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
        
        // Table Data
        doc.setFont('helvetica', 'normal');
        const targets = loadTargets();
        const targetMap = {};
        targets.forEach(t => {
            const key = `${t.subject}|${t.grade}|${t.stream}|${t.term}|${t.examType}`;
            targetMap[key] = t.score;
        });
        
        records.forEach((record, index) => {
            // Check if we need a new page
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
                
                // Add header to new page
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.setFillColor(139, 0, 0);
                
                x = 10;
                headers.forEach((header, i) => {
                    doc.rect(x, y, colWidths[i], 6, 'F');
                    doc.text(header, x + 2, y + 4);
                    x += colWidths[i];
                });
                y += 6;
                doc.setFont('helvetica', 'normal');
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
                // Alternate row colors for better readability
                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(x, y, colWidths[i], 5, 'F');
                }
                
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
        
        // Add summary section
        if (y > pageHeight - 60) {
            doc.addPage();
            y = 20;
        } else {
            y += 10;
        }
        
        // Performance Summary
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 0, 0);
        doc.text('Performance Summary:', 10, y);
        y += 8;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const totalAvg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
        const above80 = records.filter(r => r.mean >= 80).length;
        const below50 = records.filter(r => r.mean < 50).length;
        
        doc.text(`Total Records: ${records.length}`, 15, y);
        y += 5;
        doc.text(`Overall Average: ${totalAvg.toFixed(1)}%`, 15, y);
        y += 5;
        doc.text(`Excellent (≥80%): ${above80} records`, 15, y);
        y += 5;
        doc.text(`Needs Support (<50%): ${below50} records`, 15, y);
        y += 10;
        
        // Rubric Key
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
            if (legendX > pageWidth - 60) {
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
        
        // Footer
        y = pageHeight - 15;
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('SmartScores v3.0 © 2025 - Generated by Progressive Web App', pageWidth / 2, y, { align: 'center' });
        
        const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`SmartScores_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        showAlert(`PDF exported successfully! ${records.length} records included.`, 'success');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showAlert('Error exporting PDF. Please try again.', 'error');
    }
};

const hexToRgb = (hex) => {
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    } catch (error) {
        console.error('Hex to RGB conversion error:', error);
        return [0, 0, 0]; // Default to black on error
    }
};

window.exportToExcel = () => {
    try {
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
        
        // Enhanced Excel Data with more analytics
        const excelData = records.map(record => {
            const key = `${record.subject}|${record.grade}|${t.stream}|${record.term}|${record.examType}`;
            const target = targetMap[key] || null;
            const deviation = target !== null ? record.mean - target : null;
            const rubric = getRubric(record.mean);
            const performanceStatus = target !== null ? 
                (deviation >= 5 ? 'Above Target' : deviation <= -5 ? 'Below Target' : 'On Target') : 
                'No Target Set';
            
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
                'Performance Status': performanceStatus,
                'Rubric': rubric.code,
                'Rubric Range': `${rubric.min}-${rubric.max}`,
                'Rubric Description': rubric.text
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
        
        // Enhanced Summary Sheet
        const totalAvg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
        const targetsMet = records.filter(record => {
            const key = `${record.subject}|${record.grade}|${record.stream}|${record.term}|${record.examType}`;
            const target = targetMap[key];
            return target && record.mean >= target;
        }).length;
        
        const summaryData = [
            ['SMARTSCORES EXPORT SUMMARY'],
            [''],
            ['Report Details:', '', '', 'Performance Analytics:'],
            [`Teacher: ${getTeacherName() || 'Unknown'}`, '', '', `Total Records: ${records.length}`],
            [`Generated: ${new Date().toLocaleString()}`, '', '', `Overall Average: ${totalAvg.toFixed(1)}%`],
            ['', '', '', `Targets Met: ${targetsMet}/${targets.length}`],
            [''],
            ['Performance Distribution'],
            ['Rubric', 'Count', 'Percentage', 'Description'],
            ...RUBRIC_MAP.map(rubric => {
                const count = records.filter(r => {
                    const scoreRubric = getRubric(r.mean);
                    return scoreRubric.code === rubric.code;
                }).length;
                const percentage = ((count / records.length) * 100).toFixed(1);
                return [rubric.code, count, `${percentage}%`, rubric.text];
            }),
            [''],
            ['Export Notes:'],
            ['• Generated by SmartScores Progressive Web App'],
            ['• Data is based on recorded exam scores'],
            ['• Rubric system: EE1 (90-100) to BE2 (0-10)']
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Auto-size columns for better readability
        const wscols = [
            {wch: 8},  // Year
            {wch: 20}, // Teacher
            {wch: 15}, // Subject
            {wch: 8},  // Grade
            {wch: 12}, // Stream
            {wch: 10}, // Term
            {wch: 15}, // Exam Type
            {wch: 12}, // Mean Score
            {wch: 10}, // Target
            {wch: 12}, // Deviation
            {wch: 15}, // Performance Status
            {wch: 8},  // Rubric
            {wch: 15}, // Rubric Range
            {wch: 20}  // Rubric Description
        ];
        worksheet['!cols'] = wscols;

        const teacherName = getTeacherName() || 'Teacher';
        const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `SmartScores_Export_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        XLSX.writeFile(workbook, filename);
        showAlert(`Excel file exported successfully! ${records.length} records included.`, 'success');

    } catch (error) {
        console.error('Excel Export Error:', error);
        showAlert('Error exporting Excel file. Please try again.', 'error');
    }
};

// Add a simple CSV export option as fallback
window.exportToCSV = () => {
    try {
        const records = loadRecords();
        if (records.length === 0) {
            showAlert('No data to export', 'error');
            return;
        }
        
        const headers = ['Year', 'Teacher', 'Subject', 'Grade', 'Stream', 'Term', 'Exam Type', 'Mean Score'];
        const csvContent = [
            headers.join(','),
            ...records.map(record => 
                headers.map(header => {
                    const value = record[header.toLowerCase().replace(' ', '')] || '';
                    return `"${value}"`;
                }).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `SmartScores_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('CSV file exported successfully!', 'success');
        
    } catch (error) {
        console.error('CSV Export Error:', error);
        showAlert('Error exporting CSV file. Please try again.', 'error');
    }
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

// ==================== MISSING FUNCTION IMPLEMENTATIONS ====================
const updateLearnerRecordsCount = (count) => {
    const counter = document.getElementById('learnerRecordsCount');
    if (counter) counter.textContent = count;
};

window.updateRecordCounts = () => {
    const records = loadRecords();
    const totalElement = document.getElementById('totalRecordsCount');
    if (totalElement) totalElement.textContent = records.length;
};

// ==================== MAIN RENDER FUNCTION ====================
const renderAll = async () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Always render records first
    renderRecords();
    
    // Page-specific rendering
    if (currentPage === 'index.html' || currentPage === '' || currentPage === 'index.html#') {
        displayTermPeriods();
        updateDashboardStats();
        renderRecentRecords();
        renderProgressChart();
    } else if (currentPage === 'set-targets.html') {
        renderTargets();
    } else if (currentPage === 'ai-insights.html') {
        updateAIInsights();
    } else if (currentPage === 'averages.html') {
        renderCumulativeAverages();
    } else if (currentPage === 'trends.html') {
        renderTrendAnalysis();
    } else if (currentPage === 'data-entry.html') {
        const teacherDisplay = document.getElementById('currentTeacher');
        if (teacherDisplay) {
            teacherDisplay.textContent = getTeacherName() || 'Not logged in';
        }
        
        const records = loadRecords();
        const totalRecords = document.getElementById('totalRecords');
        const termRecords = document.getElementById('termRecords');
        const yearRecords = document.getElementById('yearRecords');
        
        if (totalRecords) totalRecords.textContent = records.length;
        
        if (termRecords) {
            const currentTerm = 'Term 1';
            const termCount = records.filter(r => r.term === currentTerm).length;
            termRecords.textContent = termCount;
        }
        
        if (yearRecords) {
            const currentYear = new Date().getFullYear();
            const yearCount = records.filter(r => parseInt(r.year) === currentYear).length;
            yearRecords.textContent = yearCount;
        }
    } else if (currentPage === 'recorded-scores.html') {
        // Ensure the recorded scores table is properly rendered
        renderRecords();
    } else if (currentPage === 'learner-scores.html') {
        await renderLearnerScores();
    }
};

// ==================== GLOBAL RENDERING ORCHESTRATOR ====================
window.renderAll = async () => {
    // 1. Render the main Recorded Scores table (for recorded-scores.html)
    if (el('recordsBody')) {
        renderRecords(); 
    }
    
    // 2. Render the Set Targets table (for set-targets.html)
    if (el('targetsTable')) {
        renderTargets();
    }

    // 3. Render the Learner Scores table (for learner-scores.html)
    if (el('learnerScoresBody')) {
        await renderLearnerScores();
    }
    
    // 4. Update the Dashboard Analytics
    if (el('classAverageCard')) { 
        await updateAnalyticsDashboard(); 
    }
    
    // 5. Update the overall record counts and stats
    if (window.updateRecordCounts) {
        window.updateRecordCounts();
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    // NEW: Run the session check on every page load immediately
    if (window.auth && window.auth.checkSessionTimeout) {
        window.auth.checkSessionTimeout();
    }
    loadTheme();
    
    // Auto-fill year function
    window.autoFillYear = () => {
        const yearInput = document.getElementById('year');
        if (yearInput && !yearInput.value) {
            yearInput.value = new Date().getFullYear();
        }
    };
    
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
    
    // Update teacher name display
    const teacherFullName = getTeacherName();
    document.querySelectorAll('#teacherName, #currentTeacher, .teacher-name').forEach(element => {
        element.textContent = teacherFullName;
    });
};
// ==================== GLOBAL FUNCTION EXPORTS ====================
// Add this section at the VERY END of app.js, after all your functions

// Ensure functions are available globally for HTML event handlers
window.handleSaveRecord = handleSaveRecord;
window.renderRecords = renderRecords;
window.renderTargets = renderTargets;
window.deleteRecord = deleteRecord;
window.deleteTarget = deleteTarget;
window.filterRecords = filterRecords;
window.filterTargets = filterTargets;
window.sortRecords = sortRecords;
window.updateDashboardStats = updateDashboardStats;
window.renderRecentRecords = renderRecentRecords;
window.renderProgressChart = renderProgressChart;
window.downloadPDF = downloadPDF;
window.exportToExcel = exportToExcel;
window.exportBackup = exportBackup;
window.clearAllData = clearAllData;
window.toggleDarkMode = toggleDarkMode;
window.toggleMobileMenu = toggleMobileMenu;
window.renderAll = renderAll;

// Analytics and Learner Scores functions
window.updateAnalyticsDashboard = updateAnalyticsDashboard;
window.renderLearnerScores = renderLearnerScores;
window.exportSubjectReportExcel = exportSubjectReportExcel;

// AI Insights functions
window.updateAIInsights = updateAIInsights;

// Trends and Averages functions  
window.applyTrendFilters = applyTrendFilters;
window.resetTrendFilters = resetTrendFilters;
window.sortTrendsTable = sortTrendsTable;
window.applyAveragesFilters = applyAveragesFilters;
window.resetAveragesFilters = resetAveragesFilters;
window.sortAveragesTable = sortAveragesTable;
window.exportAverages = exportAverages;

// Helper functions
window.getTeacherName = getTeacherName;
window.formatRubricBadge = formatRubricBadge;

// Sync and migration functions
window.updateSyncStatus = updateSyncStatus;
window.migrateExistingData = migrateExistingData;

// Add this to app.js to ensure the cumulative averages function is available
window.renderCumulativeAverages = renderCumulativeAverages;

// Debug: Log available functions
console.log('✅ app.js loaded - Global functions exported:', Object.keys(window).filter(key => 
    typeof window[key] === 'function' && 
    (key.includes('render') || key.includes('save') || key.includes('update') || key.includes('handle'))
).length + ' functions available');


