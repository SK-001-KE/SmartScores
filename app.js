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

  const STORAGE_KEY = 'smartScores';

  // load records
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // save records
  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // clear all data
  window.clearAllData = function () {
    if (confirm('⚠️ This will delete all recorded data. Are you sure you want to continue?')) {
      localStorage.removeItem(STORAGE_KEY);
      alert('🧹 All data cleared successfully.');
      renderRecords();
      renderSummaryAndInsight();
    }
  };

  // export backup
  window.exportBackup = function () {
    const records = loadRecords();
    if (!records.length) { alert('No data to export.'); return; }
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SmartScores_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    alert('💾 Data backup exported successfully!');
  };

  // import backup
  window.importBackup = function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        if (confirm('Import will replace current records. Continue?')) {
          saveRecords(imported);
          alert('📥 Data imported successfully!');
          renderRecords();
          renderSummaryAndInsight();
        }
      } catch (err) {
        alert('Invalid file format. Please upload a valid SmartScores backup file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // render records
  function renderRecords() {
    const records = loadRecords();
    const recordsTable = document.getElementById('recordsTable');
    const recordsTbody = recordsTable.querySelector('tbody');
    recordsTbody.innerHTML = '';
    records.forEach((r, i) => {
      const row = document.createElement('tr');
      const rRub = rubric(safeNum(r.mean));
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
        <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px; font-weight:700">${rRub.text}</span></td>
      `;
      recordsTbody.appendChild(row);
    });
  }

  // rubric helper
  function rubric(score) {
    if (score >= 75) return { text: 'Exceeding Expectations', code: 'EE', color: '#16a34a' };
    if (score >= 41) return { text: 'Meeting Expectations', code: 'ME', color: '#2563eb' };
    if (score >= 21) return { text: 'Approaching Expectations', code: 'AE', color: '#f59e0b' };
    return { text: 'Below Expectations', code: 'BE', color: '#ef4444' };
  }

  // helper to escape HTML
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // initial render
  function init() {
    renderRecords();
  }

  init();
})();
