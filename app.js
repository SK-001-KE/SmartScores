(function () {
  const STORAGE_KEY = 'smartScores';

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
  const averageScoresTable = document.getElementById('averageScoresTable');
  const averageScoresTbody = averageScoresTable.querySelector('tbody');

  const importFileInput = document.getElementById('importFile');

  function showSmartAlert(message) {
    alert(message);  // Simple alert for now
  }

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

  function saveRecord() {
    const teacher = teacherEl.value.trim();
    const subject = subjectEl.value;
    const grade = gradeEl.value;
    const stream = streamEl.value;
    const term = termEl.value;
    const examType = examEl.value;
    const year = yearEl.value;
    const mean = Number(meanEl.value);

    if (!teacher || !subject || !grade || !stream || !term || !examType || !year || Number.isNaN(mean)) {
      showSmartAlert('Please fill in all fields correctly.');
      return;
    }

    const records = loadRecords();
    records.push({ teacher, subject, grade, stream, term, examType, year, mean });
    saveRecords(records);

    meanEl.value = '';
    showSmartAlert('Record saved successfully!');
    renderRecords();
    renderAverageScores();
  }

  function renderRecords() {
    const records = loadRecords();
    recordsTbody.innerHTML = '';
    records.forEach((r, i) => {
      const rRub = rubric(r.mean);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.teacher}</td>
        <td>${r.subject}</td>
        <td>${r.grade}</td>
        <td>${r.stream}</td>
        <td>${r.term}</td>
        <td>${r.examType}</td>
        <td>${r.year}</td>
        <td>${r.mean.toFixed(1)}%</td>
        <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px;">${rRub.text}</span></td>
      `;
      recordsTbody.appendChild(row);
    });
  }

  function renderAverageScores() {
    const records = loadRecords();
    const groups = {};

    records.forEach(r => {
      const key = `${r.subject}||${r.grade}||${r.stream}||${r.term}||${r.year}`;
      if (!groups[key]) groups[key] = { ...r, scores: [] };
      groups[key].scores.push(r.mean);
    });

    averageScoresTbody.innerHTML = '';
    Object.values(groups).forEach(g => {
      const avgScore = g.scores.reduce((acc, score) => acc + score, 0) / g.scores.length;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${g.subject}</td>
        <td>${g.grade}</td>
        <td>${g.stream}</td>
        <td>${g.term}</td>
        <td>${g.year}</td>
        <td>${avgScore.toFixed(1)}%</td>
      `;
      averageScoresTbody.appendChild(row);
    });
  }

  function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const tableHTML = averageScoresTable.outerHTML;
    pdf.html(tableHTML, {
      callback: function (doc) {
        doc.save('Averages_Insights.pdf');
      }
    });
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedRecords = JSON.parse(e.target.result);
        if (Array.isArray(importedRecords)) {
          saveRecords(importedRecords);
          showSmartAlert('Data imported successfully!');
          renderRecords();
          renderAverageScores();
        } else {
          alert('Invalid format.');
        }
      } catch (error) {
        alert('Failed to import data.');
      }
    };
    reader.readAsText(file);
  }

  window.saveRecord = saveRecord;
  window.renderRecords = renderRecords;
  window.renderAverageScores = renderAverageScores;
  window.downloadPDF = downloadPDF;

  document.addEventListener('DOMContentLoaded', renderRecords);
})();
