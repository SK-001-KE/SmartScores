// app.js — SmartScores v2.0 (shared for all pages)

// Storage key
const STORAGE_KEY = 'smartScores';

// Helper functions
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function rubric(score) {
  if (score >= 75) return { text: 'Exceeding Expectations', code: 'EE', color: '#16a34a', emoji: '🏆' };
  if (score >= 41) return { text: 'Meeting Expectations', code: 'ME', color: '#2563eb', emoji: '✅' };
  if (score >= 21) return { text: 'Approaching Expectations', code: 'AE', color: '#f59e0b', emoji: '⚠️' };
  return { text: 'Below Expectations', code: 'BE', color: '#ef4444', emoji: '❗' };
}

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

function average(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

// Render recorded scores table
function renderRecords() {
  const records = loadRecords();
  const recordsTable = document.getElementById('recordsTable');
  const recordsTbody = recordsTable.querySelector('tbody');

  // Sort records by Grade, Stream, Subject, Term, Teacher
  records.sort((a, b) => {
    const ga = parseInt(a.grade, 10) || 0, gb = parseInt(b.grade, 10) || 0;
    if (ga !== gb) return ga - gb;
    if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    if (a.term !== b.term) return a.term.localeCompare(b.term);
    return (a.teacher || '').localeCompare(b.teacher || '');
  });

  // Render records
  recordsTbody.innerHTML = '';
  records.forEach((r, i) => {
    const rRub = rubric(safeNum(r.mean));
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(r.teacher)}</td>
      <td>${escapeHtml(r.subject)}</td>
      <td>${escapeHtml(r.grade)}</td>
      <td>${escapeHtml(r.stream)}</td>
      <td>${escapeHtml(r.term)}</td>
      <td>${escapeHtml(r.examType)}</td>
      <td>${escapeHtml(r.year)}</td>
      <td style="font-weight:700">${safeNum(r.mean).toFixed(1)}%</td>
      <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.85em">${rRub.text}</span></td>
    `;
    recordsTbody.appendChild(row);
  });
}

// Render Summary and Insight
function renderSummaryAndInsight() {
  const records = loadRecords();
  const groups = {}; // Group by Grade, Stream, Subject, Term
  records.forEach(r => {
    const key = `${r.grade}||${r.stream}||${r.subject}||${r.term}`;
    if (!groups[key]) groups[key] = { grade: r.grade, stream: r.stream, subject: r.subject, term: r.term, scores: [] };
    groups[key].scores.push(safeNum(r.mean));
  });

  // Render summary table
  const summaryTable = document.getElementById('summaryTable');
  const summaryTbody = summaryTable.querySelector('tbody');
  summaryTbody.innerHTML = '';

  const groupArr = Object.values(groups).sort((a, b) => {
    const ga = parseInt(a.grade, 10) || 0, gb = parseInt(b.grade, 10) || 0;
    if (ga !== gb) return ga - gb;
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
    return a.term.localeCompare(b.term);
  });

  groupArr.forEach(g => {
    const avgVal = average(g.scores);
    const rRub = rubric(avgVal);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(g.grade)}</td>
      <td>${escapeHtml(g.subject)}</td>
      <td>${escapeHtml(g.stream)}</td>
      <td>${g.scores.length ? avgVal.toFixed(1) + '%' : ''}</td>
      <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px; font-weight:700">${rRub.text}</span></td>
    `;
    summaryTbody.appendChild(tr);
  });

  // Smart Insight
  const insightBox = document.getElementById('insightBox');
  let totalSum = 0, totalCount = 0;
  Object.values(groups).forEach(g => {
    totalSum += g.scores.reduce((a, b) => a + b, 0);
    totalCount += g.scores.length;
  });

  const overall = totalCount ? (totalSum / totalCount) : 0;
  const overallRub = rubric(overall);

  let insightHtml = `<strong>💡 Smart Insight:</strong> Overall average is <b style="color:${overallRub.color}">${overall.toFixed(1)}%</b> — <b>${overallRub.text}</b>.`;

  insightBox.innerHTML = insightHtml;
}

// Helper: Escape HTML to avoid XSS
function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Save Record
window.saveRecord = function saveRecord() {
  const teacherEl = document.getElementById('teacherName');
  const subjectEl = document.getElementById('subject');
  const gradeEl = document.getElementById('grade');
  const streamEl = document.getElementById('stream');
  const termEl = document.getElementById('term');
  const examEl = document.getElementById('examType');
  const yearEl = document.getElementById('year');
  const meanEl = document.getElementById('meanScore');

  const teacher = teacherEl.value.trim();
  const subject = subjectEl.value;
  const grade = gradeEl.value;
  const stream = streamEl.value;
  const term = termEl.value;
  const examType = examEl.value;
  const year = yearEl.value;
  const mean = Number(meanEl.value);

  if (!teacher || !subject || !grade || !stream || !term || !examType || !year || Number.isNaN(mean)) {
    alert('Please fill all fields correctly.');
    return;
  }

  const records = loadRecords();
  const idx = records.findIndex(r =>
    r.teacher === teacher &&
    r.subject === subject &&
    r.grade === grade &&
    r.stream === stream &&
    r.term === term &&
    r.examType === examType &&
    r.year === year
  );

  if (idx > -1) {
    if (!confirm('⚠️ SmartScores says: This record already exists. Overwrite it?')) return;
    records[idx].mean = mean;
  } else {
    records.push({ teacher, subject, grade, stream, term, examType, year, mean });
  }

  saveRecords(records);
  meanEl.value = ''; // clear mean score after saving
  alert('Record saved successfully!');
};

// Reset Data
window.resetData = function resetData() {
  if (!confirm('⚠️ This will delete ALL records. Continue?')) return;
  localStorage.removeItem(STORAGE_KEY);
  alert('All data deleted!');
  renderRecords();
  renderSummaryAndInsight();
};

// Export to JSON
window.exportExcel = function exportExcel() {
  const records = loadRecords();
  if (!records.length) { alert('No data to export.'); return; }
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SmartScores_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
};

// Import JSON
window.importExcel = function importExcel(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const records = JSON.parse(e.target.result);
      saveRecords(records);
      alert('Backup imported successfully!');
      renderRecords();
      renderSummaryAndInsight();
    } catch (err) {
      alert('Error importing backup!');
    }
  };
  reader.readAsText(file);
};

document.addEventListener('DOMContentLoaded', function () {
  const currentPage = window.location.pathname;
  if (currentPage.includes('data-entry.html')) {
    // Only load the data entry page logic here
  }
  if (currentPage.includes('recorded-scores.html')) {
    renderRecords();
  }
  if (currentPage.includes('summary-insights.html')) {
    renderSummaryAndInsight();
  }
});
