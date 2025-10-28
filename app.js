// SmartScores Recorder - main app logic
// Summary updated: average per teacher+subject+grade+stream+term+year calculated from cumulative exams entered for that term.
// PDF and HTML summary use the same grouped logic (averages are computed from available exam records only).

const { jsPDF } = window.jspdf;
const STORAGE_KEY = 'smartscores_records_v1';
const KEEP_TEACHER_KEY = 'smartscores_keep_teacher';

let records = [];
let editIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('recordForm');
  const teacherInput = document.getElementById('teacher');
  const subjectInput = document.getElementById('subject');
  const gradeInput = document.getElementById('grade');
  const streamInput = document.getElementById('stream');
  const termInput = document.getElementById('term');
  const examInput = document.getElementById('examType');
  const yearInput = document.getElementById('year');
  const meanInput = document.getElementById('meanScore');
  const saveBtn = document.getElementById('saveBtn');
  const cancelEdit = document.getElementById('cancelEdit');
  const keepTeacher = document.getElementById('keepTeacher');

  const filterTeacher = document.getElementById('filterTeacher');
  const filterGrade = document.getElementById('filterGrade');
  const filterStream = document.getElementById('filterStream');
  const filterYear = document.getElementById('filterYear');
  const searchBox = document.getElementById('searchBox');
  const clearFilters = document.getElementById('clearFilters');

  const recordsTableBody = document.querySelector('#recordsTable tbody');
  const summaryDiv = document.getElementById('summary');
  const insightsDiv = document.getElementById('insightsContent');

  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const importFile = document.getElementById('importFile');
  const btnPdf = document.getElementById('btnPdf');
  const btnReset = document.getElementById('btnReset');

  const menuToggle = document.getElementById('menuToggle');
  const leftPanel = document.getElementById('leftPanel');
  const overlay = document.getElementById('overlay');

  // restore keepTeacher state from localStorage (default: true)
  const storedKeep = localStorage.getItem(KEEP_TEACHER_KEY);
  if (storedKeep === null) {
    keepTeacher.checked = true;
    localStorage.setItem(KEEP_TEACHER_KEY, 'true');
  } else {
    keepTeacher.checked = storedKeep === 'true';
  }
  keepTeacher.addEventListener('change', () => {
    localStorage.setItem(KEEP_TEACHER_KEY, keepTeacher.checked ? 'true' : 'false');
  });

  // load
  loadRecords();
  renderControls();
  renderAll();

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic required validation for selects and text input
    const teacher = teacherInput.value.trim();
    if (!teacher) return alert('Please enter the teacher name.');

    if (!subjectInput.value) return alert('Please select a subject.');
    if (!gradeInput.value) return alert('Please select a grade.');
    if (!streamInput.value) return alert('Please select a stream.');
    if (!termInput.value) return alert('Please select a term.');
    if (!examInput.value) return alert('Please select an exam type.');

    // Validation of numeric fields
    const year = parseInt(yearInput.value, 10);
    const mean = parseFloat(meanInput.value);
    if (isNaN(year) || year < 1900 || year > 2100) return alert('Please enter a valid year between 1900 and 2100.');
    if (isNaN(mean) || mean < 0 || mean > 100) return alert('Mean score must be a number between 0 and 100.');

    const rec = {
      teacher,
      subject: subjectInput.value,
      grade: gradeInput.value,
      stream: streamInput.value,
      term: String(termInput.value),
      examType: examInput.value,
      year: String(year),
      meanScore: Number(mean.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    // Duplicate check: same teacher, subject, grade, stream, term, examType, year
    const dupIndex = records.findIndex(r =>
      r.teacher.toLowerCase() === rec.teacher.toLowerCase() &&
      r.subject === rec.subject &&
      r.grade === rec.grade &&
      r.stream === rec.stream &&
      r.term === rec.term &&
      r.examType === rec.examType &&
      r.year === rec.year
    );

    if (editIndex > -1) {
      // updating existing
      records[editIndex] = rec;
      editIndex = -1;
      cancelEdit.style.display = 'none';
      document.getElementById('formTitle').innerText = 'Add Record';
    } else if (dupIndex > -1) {
      if (!confirm('A record with these keys already exists. Overwrite?')) return;
      records[dupIndex] = rec;
    } else {
      records.push(rec);
    }

    saveRecords();  // Make sure to call this after modifying records

    // Reset the form but optionally keep teacher (based on checkbox)
    const savedTeacher = rec.teacher;
    form.reset();
    if (keepTeacher.checked) {
      teacherInput.value = savedTeacher;
    } else {
      teacherInput.value = '';
    }
    // ensure other selects cleared
    subjectInput.value = '';
    gradeInput.value = '';
    streamInput.value = '';
    termInput.value = '';
    examInput.value = '';

    renderControls();
    renderAll();
    // Close drawer on mobile after saving
    if (window.innerWidth <= 900) closeDrawer();
  });

  // Save records to localStorage
  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));  // Save updated records to localStorage
    } catch (e) {
      console.error('Error saving records to localStorage', e);
    }
  }

  // Load records from localStorage
  function loadRecords() {
    try {
      const storedRecords = localStorage.getItem(STORAGE_KEY);
      records = storedRecords ? JSON.parse(storedRecords) : [];
    } catch (e) {
      console.error('Failed to load records', e);
      records = [];
    }
  }

  // Additional helper functions...

  // Render all records and summaries
  function renderAll() {
    const filteredRecords = applyFilters(records);
    renderTable(filteredRecords);
    renderSummary(filteredRecords);
    renderInsights(filteredRecords);
  }

  // Apply filters to the records based on user input
  function applyFilters(arr) {
    const ft = filterTeacher.value.trim().toLowerCase();
    const fg = filterGrade.value.trim().toLowerCase();
    const fs = filterStream.value.trim().toLowerCase();
    const fy = filterYear.value.trim();
    const q = searchBox.value.trim().toLowerCase();

    return arr.filter(r => {
      if (ft && r.teacher.toLowerCase() !== ft) return false;
      if (fg && r.grade.toLowerCase() !== fg) return false;
      if (fs && r.stream.toLowerCase() !== fs) return false;
      if (fy && r.year !== fy) return false;
      if (q) {
        const hay = `${r.teacher} ${r.subject} ${r.grade} ${r.stream} ${r.examType} ${r.year} ${r.term} ${r.meanScore}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  // Render table for records
  function renderTable(arr) {
    // Code for rendering records table...
  }

  // Render summary of records
  function renderSummary(arr) {
    // Code for rendering summary...
  }

  // Render insights (based on records)
  function renderInsights(arr) {
    // Code for rendering insights...
  }
});
