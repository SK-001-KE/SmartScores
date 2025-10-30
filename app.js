// SmartScores v2.9.5 - Concise Core
const STORAGE = 'smartScores', TARGETS = 'smartScoresTargets', TEACHER = 'lastTeacherName';
const el = id => document.getElementById(id);
const load = (k, def = []) => JSON.parse(localStorage.getItem(k)) || def;
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const rubric = s => ({
  text: s >= 75 ? 'Exceeding' : s >= 41 ? 'Meeting' : s >= 21 ? 'Approaching' : 'Below',
  color: s >= 75 ? '#16a34a' : s >= 41 ? '#2563eb' : s >= 21 ? '#f59e0b' : '#ef4444',
  emoji: s >= 75 ? 'Trophy' : s >= 41 ? 'Checkmark' : s >= 21 ? 'Warning' : 'Cross'
});

let chartInstance;

// PWA & Theme
const toggleDarkMode = () => document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
const loadTheme = () => { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; };
const saveTheme = () => localStorage.setItem('theme', document.documentElement.dataset.theme);

// Records
const loadRecords = () => load(STORAGE);
const saveRecords = r => save(STORAGE, r);
const loadTargets = () => load(TARGETS);
const saveTargets = t => save(TARGETS, t);

// Save Record
window.saveRecord = () => {
  const r = {
    teacher: el('teacherName').value.trim(),
    subject: el('subject').value.trim(),
    grade: el('grade').value,
    stream: el('stream').value.trim(),
    term: el('term').value,
    examType: el('examType').value,
    year: el('year').value,
    mean: parseFloat(el('mean').value)
  };
  if (!r.teacher || !r.subject || isNaN(r.mean)) return alert('Fill all fields.');
  localStorage.setItem(TEACHER, r.teacher);
  const recs = loadRecords();
  recs.push(r);
  saveRecords(recs);
  resetForm();
  renderAll();
  alert('Saved!');
};

// Reset form
const resetForm = () => {
  ['teacherName','subject','stream','year','mean'].forEach(id => el(id).value = '');
  el('teacherName').value = localStorage.getItem(TEACHER) || '';
};

// Render records table
const renderRecords = () => {
  const tbody = el('recordsTable')?.querySelector('tbody');
  if (!tbody) return;
  const recs = loadRecords();
  tbody.innerHTML = recs.map((r, i) => `
    <tr data-index="${i}">
      <td>${r.teacher}</td><td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td>
      <td>${r.term}</td><td>${r.examType}</td><td>${r.year}</td><td>${r.mean.toFixed(1)}%</td>
      <td><span style="background:${rubric(r.mean).color};color:#fff;padding:4px 8px;border-radius:6px;">
        ${rubric(r.mean).emoji} ${rubric(r.mean).text}
      </span></td>
      <td>
        <button onclick="editRecord(${i})" class="icon">Edit</button>
        <button onclick="deleteRecord(${i})" class="icon">Delete</button>
      </td>
    </tr>`).join('');
  filterRecords();
};

// Edit/Delete
window.editRecord = i => { const r = loadRecords()[i]; Object.keys(r).forEach(k => el(k) ? el(k).value = r[k] : null); deleteRecord(i); };
window.deleteRecord = i => { if (confirm('Delete?')) { const recs = loadRecords(); recs.splice(i,1); saveRecords(recs); renderAll(); } };

// Search & Sort
let sortCol = -1, sortAsc = true;
window.filterRecords = () => {
  const term = el('searchInput')?.value.toLowerCase() || '';
  const rows = document.querySelectorAll('#recordsTable tbody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
};
window.sortTable = col => {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = true; }
  const tbody = el('recordsTable')?.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a,b) => {
    const av = a.children[col].textContent, bv = b.children[col].textContent;
    const res = av.localeCompare(bv, undefined, {numeric: true});
    return sortAsc ? res : -res;
  });
  rows.forEach(r => tbody.appendChild(r));
};

// Targets
const populateTargetDropdowns = () => {
  const recs = loadRecords();
  const sets = { subject: new Set(), grade: new Set(), stream: new Set() };
  recs.forEach(r => { sets.subject.add(r.subject); sets.grade.add(r.grade); sets.stream.add(r.stream); });
  ['Subject','Grade','Stream'].forEach((t, i) => {
    const sel = el(`target${t}`);
    if (sel) sel.innerHTML = `<option value="">Select ${t}</option>` + Array.from(sets[t.toLowerCase()]).sort().map(v => `<option>${v}</option>`).join('');
  });
};
window.saveTarget = () => {
  const t = {
    subject: el('targetSubject').value,
    grade: el('targetGrade').value,
    stream: el('targetStream').value,
    term: el('targetTerm').value,
    examType: el('targetExamType').value,
    score: parseFloat(el('targetScore').value)
  };
  if (Object.values(t).some(v => v === '' || isNaN(t.score))) return alert('Fill all.');
  const targets = loadTargets();
  if (targets.some(x => JSON.stringify(x) === JSON.stringify(t))) return alert('Exists.');
  targets.push(t);
  saveTargets(targets);
  el('targetScore').value = '';
  renderTargets();
  alert('Target saved!');
};
const renderTargets = () => {
  const tbody = el('targetsTable')?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = loadTargets().map((t, i) => `
    <tr>
      <td>${t.subject}</td><td>${t.grade}</td><td>${t.stream}</td><td>${t.term}</td><td>${t.examType}</td><td>${t.score}%</td>
      <td>
        <button onclick="editTarget(${i})" style="background:#f59e0b;color:white;padding:4px 8px;border:none;border-radius:4px;margin-right:4px;">Edit</button>
        <button onclick="deleteTarget(${i})" style="background:#dc2626;color:white;padding:4px 8px;border:none;border-radius:4px;">Delete</button>
      </td>
    </tr>`).join('');
};
window.editTarget = i => {
  const t = loadTargets()[i];
  ['subject','grade','stream','term','examType'].forEach(f => el(`target${f.capitalize()}`).value = t[f]);
  el('targetScore').value = t.score;
  const btn = document.querySelector('button[onclick="saveTarget()"]');
  btn.textContent = 'Update'; btn.onclick = () => { updateTarget(i); };
};
const updateTarget = i => {
  const updated = { /* same as saveTarget */ };
  // ... (reuse saveTarget logic)
};
window.deleteTarget = i => { if (confirm('Delete?')) { const t = loadTargets(); t.splice(i,1); saveTargets(t); renderTargets(); } };

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  if (location.pathname.includes('data-entry')) el('teacherName').value = localStorage.getItem(TEACHER) || '';
  if (location.pathname.includes('set-targets')) { populateTargetDropdowns(); renderTargets(); }
  renderAll();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
});
