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

  // Mobile drawer toggle
  function openDrawer() {
    leftPanel.classList.add('show');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    leftPanel.classList.remove('show');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (leftPanel.classList.contains('show')) closeDrawer();
      else openDrawer();
    });
  }
  if (overlay) overlay.addEventListener('click', () => closeDrawer());

  // Close drawer when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeDrawer();
    }
  });

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

    saveRecords();

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

  cancelEdit.addEventListener('click', () => {
    editIndex = -1;
    cancelEdit.style.display = 'none';
    document.getElementById('formTitle').innerText = 'Add Record';
    form.reset();
    // keep or clear teacher depending on checkbox
    if (!keepTeacher.checked) teacherInput.value = '';
    // ensure selects cleared
    subjectInput.value = '';
    gradeInput.value = '';
    streamInput.value = '';
    termInput.value = '';
    examInput.value = '';
  });

  // Filters & search
  [filterTeacher, filterGrade, filterStream, filterYear].forEach(el => el.addEventListener('change', renderAll));
  searchBox.addEventListener('input', renderAll);
  clearFilters.addEventListener('click', () => {
    filterTeacher.value = '';
    filterGrade.value = '';
    filterStream.value = '';
    filterYear.value = '';
    searchBox.value = '';
    renderAll();
  });

  // Export/Import/Reset
  btnExport.addEventListener('click', () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartscores-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImport.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!Array.isArray(incoming)) throw new Error('Invalid JSON format: expected array of records.');
        if (!confirm('Import will replace current records. Continue?')) return;
        records = incoming;
        saveRecords();
        renderControls();
        renderAll();
        alert('Import successful.');
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  btnReset.addEventListener('click', () => {
    if (!confirm('This will permanently delete all records. Are you sure?')) return;
    records = [];
    saveRecords();
    renderControls();
    renderAll
