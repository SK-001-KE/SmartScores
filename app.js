// app.js — SmartScores v2.0 (final)
// © Kariuki 2025
// UPDATED: PDF generation now uses jsPDF-AutoTable for clean data output.

(function () {
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
        transition: 'opacity 0.3s ease-in-out',
        opacity: 0,
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
      // For the records table, include an index column (for PDF too)
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

    // Update records table header for the new index column
    const headerRow = recordsTable.querySelector('thead tr');
    // Check if the index column header exists, if not, add it
    if (headerRow && headerRow.cells.length < 11) {
        // Insert '<th>#</th>' at the beginning of the header
        headerRow.insertAdjacentHTML('afterbegin', '<th>#</th>');
    }
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
        <td style="font-weight:700">${g.scores.length ? avgVal.toFixed(1) + '%' : ''}</td>
        <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px; font-weight:700">${rRub.text}</span></td>
      `;
      summaryTbody.appendChild(tr);
    });

    // Check and update summary table header for the Rubric column
    const summaryHeaderRow = summaryTable.querySelector('thead tr');
    if (summaryHeaderRow && summaryHeaderRow.cells.length < 5) {
        // Insert '<th>Rubric</th>' at the end of the header
        summaryHeaderRow.insertAdjacentHTML('beforeend', '<th>Rubric</th>');
    }


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

  // 📄 download PDF (using jsPDF-AutoTable for clean data)
  window.downloadPDF = async function downloadPDF() {
    // Check if the required library is available
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('PDF generation failed. jsPDF library not fully loaded.');
        return;
    }
    if (typeof window.jspdf.jsPDF.prototype.autoTable === 'undefined') {
        alert('PDF generation failed. jsPDF-AutoTable plugin is not loaded. Please check your HTML file.');
        return;
    }

    // 1. Initialize jsPDF
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        let yOffset = 30; // Starting Y position and margin

        // --- 2. Add Header ---
        
        // Title
        pdf.setFontSize(18);
        pdf.setTextColor(30, 58, 138); // Blue
        pdf.text("SmartScores — Teacher Mean Score Report", 30, yOffset);
        yOffset += 20;

        // Date
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128); // Gray
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 30, yOffset);
        yOffset += 30;

        // --- 3. Add Recorded Scores Table ---
        
        // Section Title
        pdf.setFontSize(14);
        pdf.setTextColor(128, 0, 0); // Maroon
        pdf.text("Recorded Scores", 30, yOffset);
        yOffset += 15;

        // AutoTable for Recorded Scores (using recordsTable ID)
        pdf.autoTable({
            html: recordsTable,
            startY: yOffset,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }, // Blue
            margin: { left: 30, right: 30 },
            // Styles the Rubric column specifically
            columnStyles: { 
                10: { cellWidth: 80 } // Adjust width for the Rubric column (index 10)
            },
            didDrawPage: function(data) {
                // Add footer
                pdf.setFontSize(8);
                pdf.text('Page ' + pdf.internal.getNumberOfPages(), data.settings.margin.left + 500, pdf.internal.pageSize.height - 10);
            }
        });

        // Update yOffset for next section
        yOffset = pdf.autoTable.previous.finalY + 20; 

        // --- 4. Add Summary Table ---
        
        // Check if a new page is needed
        if (yOffset > pdf.internal.pageSize.getHeight() - 70) {
            pdf.addPage();
            yOffset = 30;
        }

        // Section Title
        pdf.setFontSize(14);
        pdf.setTextColor(128, 0, 0); // Maroon
        pdf.text("Average Score Summary", 30, yOffset);
        yOffset += 15;

        // AutoTable for Summary (using summaryTable ID)
        pdf.autoTable({
            html: summaryTable,
            startY: yOffset,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }, // Blue
            margin: { left: 30, right: 30 }
        });

        // Update yOffset for next section
        yOffset = pdf.autoTable.previous.finalY + 20;

        // --- 5. Add Insight Box (as text) ---
        
        // Check if a new page is needed
        if (yOffset > pdf.internal.pageSize.getHeight() - 50) {
            pdf.addPage();
            yOffset = 30;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(30, 58, 138); // Dark Blue for Insight
        pdf.text("Smart Insight:", 30, yOffset);
        yOffset += 15;

        // Get and clean HTML content from insightBox
        const insightText = document.getElementById('insightBox').innerText;
        // Use splitTextToSize to handle line wrapping
        const splitText = pdf.splitTextToSize(insightText, pdf.internal.pageSize.getWidth() - 60);

        pdf.setFontSize(10);
        pdf.setTextColor(34, 34, 34); // Near Black
        pdf.text(splitText, 30, yOffset);
        
        // --- 6. Save the PDF ---
        const filename = `SmartScores_Report_${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(filename);
        showSmartAlert('📄 SmartScores says: PDF downloaded successfully!');

    } catch (err) {
        console.error("PDF Generation Error (using jsPDF-AutoTable):", err);
        alert('PDF generation failed. Check the browser console for specific errors and ensure jspdf-autotable is loaded.');
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
    // Note: These are redundant but ensure compatibility if used before the IIFE loads
    window.exportExcel = window.exportExcel || exportExcel;
    window.importExcel = window.importExcel || importExcel;
    window.resetData = window.resetData || resetData;
    window.downloadPDF = window.downloadPDF || downloadPDF;
  }

  init();

})();
