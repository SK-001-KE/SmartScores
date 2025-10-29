(function () {
  // Check if service workers are supported in the browser
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // Storage key
  const STORAGE_KEY = 'smartScores';

  // Elements
  const teacherEl = document.getElementById('teacherName');
  const subjectEl = document.getElementById('subject');
  const gradeEl = document.getElementById('grade');
  const streamEl = document.getElementById('stream');
  const termEl = document.getElementById('term');
  const examEl = document.getElementById('examType');
  const yearEl = document.getElementById('year');
  const meanEl = document.getElementById('meanScore');
  
  const recordsTable = document.getElementById('recordsTable');
  const recordsTbody = recordsTable.querySelector('tbody');
  const summaryTable = document.getElementById('summaryTable');
  const summaryTbody = summaryTable.querySelector('tbody');
  const insightBox = document.getElementById('insightBox');
  const averageScoresTable = document.getElementById('averageScoresTable');
  const averageScoresTbody = averageScoresTable.querySelector('tbody');
  
  const importFileInput = document.getElementById('importFile');
  const exportButton = document.getElementById('exportButton');
  const clearButton = document.getElementById('clearButton');

  // small toast notification
  function showSmartAlert(message) {
    const id = 'smartscores-toast';
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement('div');
      box.id = id;
      Object.assign(box.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#1e40af',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        fontWeight: 700,
      });
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.opacity = '1';
    setTimeout(() => { box.style.opacity = '0'; }, 2600);
  }

  // Load and save records
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

  // Rubric logic
  function rubric(score) {
    if (score >= 75) return { text: 'Exceeding Expectations', code: 'EE', color: '#16a34a', emoji: '🏆' };
    if (score >= 41) return { text: 'Meeting Expectations', code: 'ME', color: '#2563eb', emoji: '✅' };
    if (score >= 21) return { text: 'Approaching Expectations', code: 'AE', color: '#f59e0b', emoji: '⚠️' };
    return { text: 'Below Expectations', code: 'BE', color: '#ef4444', emoji: '❗' };
  }

  // helpers
  function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
  function average(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

  // Render Records
  function renderRecords() {
    const records = loadRecords();
    records.sort((a,b)=>{
      const ga = parseInt(a.grade,10)||0, gb = parseInt(b.grade,10)||0;
      if (ga !== gb) return ga - gb;
      if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.term !== b.term) return a.term.localeCompare(b.term);
      return (a.teacher || '').localeCompare(b.teacher || '');
    });

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

  // Render Average Scores Table
  function renderAverageScores() {
    const records = loadRecords();
    const groups = {}; // key -> {grade,stream,subject,term,arr}
    records.forEach(r => {
      const key = `${r.subject}||${r.grade}||${r.stream}||${r.term}||${r.year}`;
      if (!groups[key]) groups[key] = { subject: r.subject, grade: r.grade, stream: r.stream, term: r.term, year: r.year, scores: [] };
      groups[key].scores.push(safeNum(r.mean));
    });

    averageScoresTbody.innerHTML = '';
    const groupArr = Object.values(groups).sort((a,b)=>{
      const ga = parseInt(a.grade,10)||0, gb = parseInt(b.grade,10)||0;
      if (ga !== gb) return ga - gb;
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
      return a.term.localeCompare(b.term);
    });

    groupArr.forEach(g => {
      const avgVal = average(g.scores);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(g.subject)}</td>
        <td>${escapeHtml(g.grade)}</td>
        <td>${escapeHtml(g.stream)}</td>
        <td>${escapeHtml(g.term)}</td>
        <td>${escapeHtml(g.year)}</td>
        <td>${avgVal.toFixed(1)}%</td>
      `;
      averageScoresTbody.appendChild(tr);
    });
  }

  // Save Record
  window.saveRecord = function saveRecord() {
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
    meanEl.value = '';
    showSmartAlert('💬 SmartScores says: Record saved successfully!');
    renderRecords();
    renderAverageScores();
  };

  // Export Data
  window.exportData = function exportData() {
    const records = loadRecords();
    if (!records.length) { alert('No data to export.'); return; }
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SmartScores_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showSmartAlert('💾 Data exported successfully!');
  };

  // Import Data
  window.importData = function importData(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        if (confirm('Import will replace current records. Continue?')) {
          saveRecords(imported);
          showSmartAlert('📥 Data imported successfully!');
          renderRecords();
          renderAverageScores();
        }
      } catch (err) {
        alert('Invalid file. Please import a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // reset input for re-selection
  };

  // Clear All Data
  window.clearAllData = function clearAllData() {
    if (confirm('⚠️ SmartScores says: This will delete ALL records. Continue?')) {
      localStorage.removeItem(STORAGE_KEY);
      showSmartAlert('🧹 All data cleared!');
      renderRecords();
      renderAverageScores();
    }
  };

  // PDF download on Averages & Insights page
  window.downloadPDF = async function downloadPDF() {
    const report = document.createElement('div');
    report.style.width = '800px';
    report.style.padding = '24px';
    report.style.fontFamily = 'Segoe UI, Tahoma, sans-serif';
    report.style.background = '#fff';
    report.style.color = '#222';

    const logoHtml = `<div style="text-align:center;margin-bottom:8px;">
      <h2 style="margin:0;color:#1e3a8a;">SmartScores — Averages & Insights Report</h2>
      <p style="margin:4px 0 12px 0;color:#6b7280;">${new Date().toLocaleString()}</p>
    </div>`;

    const averageClone = averageScoresTable.cloneNode(true);
    report.innerHTML = logoHtml + '<h3 style="color:#800000;margin-bottom:6px;">Averages Summary</h3>';
    report.appendChild(averageClone);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });

    const canvas = await html2canvas(report, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 30;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    pdf.save('SmartScores_Averages_Insights.pdf');
    showSmartAlert('📄 PDF downloaded successfully!');
  };

  // Initialize
  function init() {
    renderRecords();
    renderAverageScores();
  }

  init();
})();
