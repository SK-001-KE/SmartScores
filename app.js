// app.js — SmartScores v2.0

(function () {
  // Check if service workers are supported in the browser
  if ('serviceWorker' in navigator) {
    // Register the service worker when the window is fully loaded
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')  // Specify the path to your service-worker.js
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // === Your existing app logic goes here ===
  
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

  const importFileInput = document.getElementById('importFile');

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

  // load records
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

  // rubric with exact spellings
  function rubric(score) {
    if (score >= 75) return { text: 'Exceeding Expectations', code: 'EE', color: '#16a34a', emoji: '🏆' };
    if (score >= 41) return { text: 'Meeting Expectations', code: 'ME', color: '#2563eb', emoji: '✅' };
    if (score >= 21) return { text: 'Approaching Expectations', code: 'AE', color: '#f59e0b', emoji: '⚠️' };
    return { text: 'Below Expectations', code: 'BE', color: '#ef4444', emoji: '❗' };
  }

  // helpers
  function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
  function average(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

  // render records table
  function renderRecords() {
    const records = loadRecords();
    // sort: Grade (numeric) -> Stream -> Subject -> Term -> Teacher
    records.sort((a,b)=>{
      const ga = parseInt(a.grade,10)||0, gb = parseInt(b.grade,10)||0;
      if (ga !== gb) return ga - gb;
      if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.term !== b.term) return a.term.localeCompare(b.term);
      return (a.teacher || '').localeCompare(b.teacher || '');
    });

    // render
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
        <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.85em">${rRub.text}</span></td>
      `;
      recordsTbody.appendChild(row);
    });
  }

  // render summary grouped by Grade + Stream + Subject + Term
  function renderSummaryAndInsight() {
    const records = loadRecords();
    const groups = {}; // key -> {grade,stream,subject,term,arr}
    records.forEach(r => {
      const key = `${r.grade}||${r.stream}||${r.subject}||${r.term}`;
      if (!groups[key]) groups[key] = { grade: r.grade, stream: r.stream, subject: r.subject, term: r.term, scores: [] };
      groups[key].scores.push(safeNum(r.mean));
    });

    // render summary table
    summaryTbody.innerHTML = '';
    const groupArr = Object.values(groups).sort((a,b)=>{
      const ga = parseInt(a.grade,10)||0, gb = parseInt(b.grade,10)||0;
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

    // smart insight below summary — concise
    if (groupArr.length === 0) {
      insightBox.innerHTML = '<em>No data yet. Add records to see insights.</em>';
      return;
    }

    // compute overall average across groups (weighted by counts)
    let totalSum = 0, totalCount = 0;
    Object.values(groups).forEach(g => {
      totalSum += g.scores.reduce((a,b)=>a+b,0);
      totalCount += g.scores.length;
    });
    const overall = totalCount ? (totalSum/totalCount) : 0;
    const overallRub = rubric(overall);

    // top subject-stream combos and lowest
    const subjectAverages = {};
    records.forEach(r=>{
      const key = `${r.subject}||${r.stream}`;
      if (!subjectAverages[key]) subjectAverages[key] = { sum:0, count:0, subject:r.subject, stream:r.stream };
      subjectAverages[key].sum += safeNum(r.mean);
      subjectAverages[key].count++;
    });
    const subjArr = Object.values(subjectAverages).map(s=>({ subject:s.subject, stream:s.stream, avg: s.sum/s.count }));
    subjArr.sort((a,b) => b.avg - a.avg);
    const top = subjArr[0];
    const bottom = subjArr[subjArr.length-1];

    let insightHtml = `<strong>💡 Smart Insight:</strong> Overall average is <b style="color:${overallRub.color}">${overall.toFixed(1)}%</b> — <b>${overallRub.text}</b>.`;
    if (top) insightHtml += `<br>🏆 Top: <b>${escapeHtml(top.subject)}</b> (${escapeHtml(top.stream)}) — ${top.avg.toFixed(1)}%.`;
    if (bottom) insightHtml += `<br>🔻 Needs attention: <b>${escapeHtml(bottom.subject)}</b> (${escapeHtml(bottom.stream)}) — ${bottom.avg.toFixed(1)}%.`;

    insightBox.innerHTML = insightHtml;
  }

  // helper: escape html
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // save record triggered from Save button in index.html
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
    // clear only mean field (user asked earlier)
    meanEl.value = '';
    showSmartAlert('💬 SmartScores says: Record saved successfully!');
    renderRecords();
    renderSummaryAndInsight();
  };

  // reset data
  window.resetData = function resetData() {
    if (!confirm('⚠️ SmartScores says: This will delete ALL records. Continue?')) return;
    localStorage.removeItem(STORAGE_KEY);
    showSmartAlert('🧹 SmartScores says: All data deleted!');
    renderRecords();
    renderSummaryAndInsight();
  };

  // export JSON backup
  window.exportExcel = function exportExcel() {
    const records = loadRecords();
    if (!records.length) { alert('No data to export.'); return; }
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SmartScores_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showSmartAlert('💾 SmartScores says: Backup exported successfully!');
  };

  // import backup JSON
  window.importExcel = function importExcel(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        // optional: ask merge or replace — simple replace here
        if (confirm('Import will replace current records. Continue?')) {
          saveRecords(imported);
          showSmartAlert('📥 SmartScores says: Data imported successfully!');
          renderRecords();
          renderSummaryAndInsight();
        }
      } catch (err) {
        alert('Invalid file. Please import a JSON backup that was exported from SmartScores.');
      }
    };
    reader.readAsText(file);
    // clear input so same file can be reselected later
    event.target.value = '';
  };

  // download PDF (auto generate and save) — uses html2canvas + jsPDF
  window.downloadPDF = async function downloadPDF() {
    // create a clean container to render report (not visible)
    const report = document.createElement('div');
    report.style.width = '800px';
    report.style.padding = '24px';
    report.style.fontFamily = 'Segoe UI, Tahoma, sans-serif';
    report.style.background = '#fff';
    report.style.color = '#222';

    // header with logo (logo.png expected in project root)
    const logoHtml = `<div style="text-align:center;margin-bottom:8px;">
      <img src="logo.png" alt="Logo" style="width:80px;height:80px;display:block;margin:0 auto 8px auto;" />
      <h2 style="margin:0;color:#1e3a8a;">SmartScores — Teacher Mean Score Report</h2>
      <p style="margin:4px 0 12px 0;color:#6b7280;">${new Date().toLocaleString()}</p>
    </div>`;

    // Use current tables' HTML but remove action buttons or interactive elements
    // Clone records table and summary table
    const recordsClone = recordsTable.cloneNode(true);
    // remove tbody children will be replaced with current rendered rows
    // ensure cloned table uses the currently rendered rows (it does)
    const summaryClone = summaryTable.cloneNode(true);

    report.innerHTML = logoHtml + '<h3 style="color:#800000;margin-bottom:6px;">Recorded Scores</h3>';
    report.appendChild(recordsClone);
    report.innerHTML += '<br/><h3 style="color:#800000;margin-bottom:6px;">Average Score Summary</h3>';
    report.appendChild(summaryClone);

    // Also include insight
    const insightDiv = document.createElement('div');
    insightDiv.style.marginTop = '12px';
    insightDiv.innerHTML = `<h4 style="color:#1e3a8a">Smart Insight</h4><div>${insightBox.innerHTML}</div>`;
    report.appendChild(insightDiv);

    // Render to canvas
    try {
      const canvas = await html2canvas(report, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // scale image to page width minus margins
      const margin = 30;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = margin;
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);

      // if content taller than one page, add pages
      let heightLeft = imgHeight - (pageHeight - margin * 2);
      while (heightLeft > 0) {
        pdf.addPage();
        y = - (imgHeight - heightLeft) + margin;
        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      const filename = `SmartScores_Report_${new Date().toISOString().slice(0,10)}.pdf`;
      pdf.save(filename);
      showSmartAlert('📄 SmartScores says: PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('PDF generation failed. Make sure html2canvas and jsPDF are loaded.');
    }
  };

  // initial render at startup
  function init() {
    renderRecords();
    renderSummaryAndInsight();

    // hook file input if present
    if (importFileInput) {
      importFileInput.addEventListener('change', importExcel);
    }
    // ensure other global functions exist for onClick calls from HTML
    window.exportExcel = window.exportExcel || exportExcel;
    window.importExcel = window.importExcel || importExcel;
    window.resetData = window.resetData || resetData;
    window.downloadPDF = window.downloadPDF || downloadPDF;
  }

  init();
})();
