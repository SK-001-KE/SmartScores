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

  // Constants for storage and UI elements
  const STORAGE_KEY = 'smartScores';
  const teacherEl = document.getElementById('teacherName');
  const subjectEl = document.getElementById('subject');
  const gradeEl = document.getElementById('grade');
  const streamEl = document.getElementById('stream');
  const termEl = document.getElementById('term');
  const examEl = document.getElementById('examType');
  const yearEl = document.getElementById('year');
  const meanEl = document.getElementById('meanScore');
  const recordsTbody = document.getElementById('recordsTbody');

  // Show an alert message
  function showSmartAlert(message) {
    alert(message);
  }

  // Load saved records from local storage
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Save records to local storage
  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // Save a new record
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
      if (!confirm('This record already exists. Overwrite it?')) return;
      records[idx].mean = mean;
    } else {
      records.push({ teacher, subject, grade, stream, term, examType, year, mean });
    }

    saveRecords(records);
    meanEl.value = '';
    showSmartAlert('Record saved successfully!');
    renderRecords();
  };

  // Render saved records
  function renderRecords() {
    const records = loadRecords();
    recordsTbody.innerHTML = '';
    records.forEach((r, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.teacher}</td>
        <td>${r.subject}</td>
        <td>${r.grade}</td>
        <td>${r.stream}</td>
        <td>${r.term}</td>
        <td>${r.examType}</td>
        <td>${r.year}</td>
        <td>${r.mean}</td>
      `;
      recordsTbody.appendChild(row);
    });
  }

  // Initialize the app
  function init() {
    renderRecords();
  }

  init();
})();
