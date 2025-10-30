// SmartScores v2.9.6 - Concise Core (Updated for Dropdowns)
(() => {
  const STORAGE_KEY = 'smartScores';
  const TARGETS_KEY = 'smartScoresTargets';
  const TEACHER_KEY = 'lastTeacherName';
  const AUTO_DELETE_KEY = 'autoDeleteSetting';

  // DOM Helpers
  const el = id => document.getElementById(id);
  const showAlert = msg => alert(msg);
// Reset form on page load (optional)
if (location.pathname.includes('data-entry')) {
  el('meanScore').value = '';
}
  // Storage Helpers
  const load = (k, def = []) => {
    try { return JSON.parse(localStorage.getItem(k)) || def; }
    catch { return def; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // Rubric
  const rubric = s => {
    if (s >= 75) return { text: 'Exceeding', color: '#16a34a', emoji: '🏆' };
    if (s >= 41) return { text: 'Meeting', color: '#2563eb', emoji: '✅' };
    if (s >= 21) return { text: 'Approaching', color: '#f59e0b', emoji: '⚠️' };
    return { text: 'Below', color: '#ef4444', emoji: '❗' };
  };

  // Theme
  window.toggleDarkMode = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };
  const loadTheme = () => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = theme;
  };

  // Load Last Teacher
  const loadLastTeacher = () => {
    const name = localStorage.getItem(TEACHER_KEY);
    if (name && el('teacherName')) el('teacherName').value = name;
  };

  // Records
  const loadRecords = () => load(STORAGE_KEY);
  const saveRecords = r => save(STORAGE_KEY, r);

  // Targets
  const loadTargets = () => load(TARGETS_KEY);
  const saveTargets = t => save(TARGETS_KEY, t);

 
  // Save Record – FIXED
window.saveRecord = () => {
  const record = {
    teacher: el('teacherName')?.value.trim(),
    subject: el('subject')?.value,
    grade: el('grade')?.value,
    stream: el('stream')?.value,
    term: el('term')?.value,
    examType: el('examType')?.value,
    year: el('year')?.value,
    mean: Number(el('meanScore')?.value)  // ← FIXED: was 'mean'
  };

  // Validation
  if (!record.teacher || !record.subject || !record.grade || !record.stream || 
      !record.term || !record.examType || !record.year || isNaN(record.mean)) {
    return showAlert('Please fill all fields correctly.');
  }

  if (record.mean < 0 || record.mean > 100) return showAlert('Mean score must be 0–100.');
  if (record.year < 2000 || record.year > 2100) return showAlert('Year must be 2000–2100.');

  const records = loadRecords();
  const exists = records.some(r =>
    r.teacher === record.teacher &&
    r.subject === record.subject &&
    r.grade === record.grade &&
    r.stream === record.stream &&
    r.term === record.term &&
    r.examType === record.examType &&
    r.year === record.year
  );
  if (exists) return showAlert('This record already exists!');

  records.push(record);
  saveRecords(records);
  localStorage.setItem(TEACHER_KEY, record.teacher);

  // Clear only mean score
  el('meanScore').value = '';

  showAlert('Record saved successfully!');
  renderAll();
};

  // Render Records
  const renderRecords = () => {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    const records = loadRecords();
    tbody.innerHTML = records.map((r, i) => {
      const rub = rubric(r.mean);
      return `
        <tr data-index="${i}">
          <td>${r.teacher}</td>
          <td>${r.subject}</td>
          <td>${r.grade}</td>
          <td>${r.stream}</td>
          <td>${r.term}</td>
          <td>${r.examType}</td>
          <td>${r.year}</td>
          <td>${r.mean.toFixed(1)}%</td>
          <td><span style="background:${rub.color};color:#fff;padding:4px 8px;border-radius:6px;">${rub.emoji} ${rub.text}</span></td>
          <td>
            <button onclick="editRecord(${i})" style="background:#f59e0b;color:white;border:none;padding:4px 8px;margin-right:4px;border-radius:4px;cursor:pointer;">Edit</button>
            <button onclick="deleteRecord(${i})" style="background:#dc2626;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  };

  // Edit Record (Updated for Dropdowns)
  window.editRecord = (i) => {
    const records = loadRecords();
    const r = records[i];
    if (!r) return;

    el('teacherName').value = r.teacher;
    el('subject').value = r.subject;
    el('grade').value = r.grade;
    el('stream').value = r.stream;
    el('term').value = r.term;
    el('examType').value = r.examType;
    el('year').value = r.year;
    el('meanScore').value = r.mean;

    // Change button to Update
    const saveBtn = document.querySelector('button[onclick="saveRecord()"]');
    if (saveBtn) {
      saveBtn.textContent = 'Update Record';
      saveBtn.onclick = () => updateRecord(i);
    }

    // Scroll to form
    el('teacherName').scrollIntoView({ behavior: 'smooth' });
  };

  // Update Record
  const updateRecord = (i) => {
    const updated = {
      teacher: el('teacherName')?.value.trim(),
      subject: el('subject')?.value,
      grade: el('grade')?.value,
      stream: el('stream')?.value,
      term: el('term')?.value,
      examType: el('examType')?.value,
      year: el('year')?.value,
      mean: Number(el('meanScore')?.value)
    };

    if (!updated.teacher || !updated.subject || isNaN(updated.mean)) return showAlert('Fill all fields.');
    if (updated.mean < 0 || updated.mean > 100) return showAlert('Mean 0–100.');

    const records = loadRecords();
    records[i] = updated;
    saveRecords(records);
    localStorage.setItem(TEACHER_KEY, updated.teacher);
    resetForm();
    showAlert('Updated!');
    renderAll();
  };

  // Reset Form
  const resetForm = () => {
    el('meanScore').value = '';
    const saveBtn = document.querySelector('button[onclick]');
    if (saveBtn && saveBtn.textContent.includes('Update')) {
      saveBtn.textContent = 'Save Record';
      saveBtn.onclick = saveRecord;
    }
  };

  // Delete Record
  window.deleteRecord = (i) => {
    if (confirm('Delete this record?')) {
      const records = loadRecords();
      records.splice(i, 1);
      saveRecords(records);
      showAlert('Deleted.');
      renderAll();
    }
  };

  // Filter Records
  window.filterRecords = () => {
    const search = el('searchInput')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#recordsTable tbody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
  };

  // Sort Table
  let sortConfig = { key: null, direction: 'asc' };
  window.sortTable = (key) => {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;

    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    sortConfig = { key, direction };

    // Clear indicators
    document.querySelectorAll('th').forEach(th => th.classList.remove('sort-asc', 'sort-desc', 'sorted'));
    const header = Array.from(document.querySelectorAll('th')).find(th => th.textContent.trim().toLowerCase().includes(key));
    if (header) header.classList.add(`sort-${direction}`, 'sorted');

    const records = loadRecords();
    records.sort((a, b) => {
      let aVal = a[key], bVal = b[key];
      if (key === 'mean' || key === 'year' || key === 'grade') {
        aVal = Number(aVal); bVal = Number(bVal);
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    saveRecords(records);
    renderRecords();
  };

  // Save Target (Updated for Dropdowns)
  window.saveTarget = () => {
    const target = {
      subject: el('targetSubject')?.value,
      grade: el('targetGrade')?.value,
      stream: el('targetStream')?.value,
      term: el('targetTerm')?.value,
      examType: el('targetExamType')?.value,
      score: Number(el('targetScore')?.value)
    };

    if (!target.subject || !target.grade || !target.stream || !target.term || !target.examType || isNaN(target.score)) {
      return showAlert('Please fill all fields correctly.');
    }

    if (target.score < 0 || target.score > 100) return showAlert('Target must be between 0 and 100.');

    const targets = loadTargets();
    const exists = targets.some(t =>
      t.subject === target.subject &&
      t.grade === target.grade &&
      t.stream === target.stream &&
      t.term === target.term &&
      t.examType === target.examType
    );
    if (exists) return showAlert('This target already exists!');

    targets.push(target);
    saveTargets(targets);
    el('targetScore').value = '';
    showAlert('Target saved successfully!');
    renderTargets();
  };

  // Render Targets
  const renderTargets = () => {
    const tbody = document.querySelector('#targetsTable tbody');
    if (!tbody) return;
    const targets = loadTargets();
    tbody.innerHTML = targets.map((t, i) => `
      <tr>
        <td>${t.subject}</td>
        <td>${t.grade}</td>
        <td>${t.stream}</td>
        <td>${t.term}</td>
        <td>${t.examType}</td>
        <td>${t.score}%</td>
        <td>
          <button onclick="editTarget(${i})" style="background:#f59e0b;color:white;border:none;padding:4px 8px;margin-right:4px;border-radius:4px;cursor:pointer;">Edit</button>
          <button onclick="deleteTarget(${i})" style="background:#dc2626;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">Delete</button>
        </td>
      </tr>
    `).join('');
  };

  // Edit Target (Updated for Dropdowns)
  window.editTarget = (i) => {
    const targets = loadTargets();
    const t = targets[i];
    if (!t) return;

    el('targetSubject').value = t.subject;
    el('targetGrade').value = t.grade;
    el('targetStream').value = t.stream;
    el('targetTerm').value = t.term;
    el('targetExamType').value = t.examType;
    el('targetScore').value = t.score;

    const saveBtn = document.querySelector('button[onclick="saveTarget()"]');
    if (saveBtn) {
      saveBtn.textContent = 'Update Target';
      saveBtn.onclick = () => updateTarget(i);
    }

    el('targetSubject').scrollIntoView({ behavior: 'smooth' });
  };

  // Update Target
  const updateTarget = (i) => {
    const updated = {
      subject: el('targetSubject')?.value,
      grade: el('targetGrade')?.value,
      stream: el('targetStream')?.value,
      term: el('targetTerm')?.value,
      examType: el('targetExamType')?.value,
      score: Number(el('targetScore')?.value)
    };

    if (!updated.subject || isNaN(updated.score)) return showAlert('Fill all fields.');
    if (updated.score < 0 || updated.score > 100) return showAlert('Target 0–100.');

    const targets = loadTargets();
    targets[i] = updated;
    saveTargets(targets);
    resetTargetForm();
    showAlert('Target updated!');
    renderTargets();
  };

  // Reset Target Form
  const resetTargetForm = () => {
    el('targetScore').value = '';
    const saveBtn = document.querySelector('button[onclick]');
    if (saveBtn && saveBtn.textContent.includes('Update')) {
      saveBtn.textContent = 'Save Target';
      saveBtn.onclick = saveTarget;
    }
  };

  // Delete Target
  window.deleteTarget = (i) => {
    if (confirm('Delete this target?')) {
      const targets = loadTargets();
      targets.splice(i, 1);
      saveTargets(targets);
      showAlert('Deleted.');
      renderTargets();
    }
  };

  // Render Averages with Deviation
  const renderAverageScores = () => {
    const tbody = document.querySelector('#averageScoresTable tbody');
    if (!tbody) return;
    const records = loadRecords();
    const targets = loadTargets();
    const groups = {};
    records.forEach(r => {
      const key = `${r.subject}||${r.grade}||${r.stream}||${r.term}||${r.examType}`;
      if (!groups[key]) groups[key] = { ...r, scores: [] };
      groups[key].scores.push(r.mean);
    });
    tbody.innerHTML = Object.values(groups).map(g => {
      const avg = g.scores.reduce((a, s) => a + s, 0) / g.scores.length;
      const target = targets.find(t =>
        t.subject === g.subject && t.grade === g.grade && t.stream === g.stream &&
        t.term === g.term && t.examType === g.examType
      );
      const deviation = target ? avg - target.score : null;
      const devText = deviation !== null ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%` : '—';
      const devColor = deviation > 0 ? '#16a34a' : deviation < 0 ? '#dc2626' : '#666';
      return `
        <tr>
          <td>${g.subject}</td>
          <td>${g.grade}</td>
          <td>${g.stream}</td>
          <td>${g.term}</td>
          <td>${g.examType}</td>
          <td>${avg.toFixed(1)}%</td>
          <td style="font-weight:bold;color:${devColor};">${devText}</td>
        </tr>
      `;
    }).join('');
  };

  // Render AI Insights
  const renderAIInsights = () => {
    const container = el('insights');
    if (!container) return;
    const records = loadRecords();
    const groups = {};
    records.forEach(r => {
      const key = `${r.subject}|${r.grade}`;
      if (!groups[key]) groups[key] = { sum: 0, count: 0 };
      groups[key].sum += r.mean;
      groups[key].count++;
    });
    const insights = [];
    for (const [key, data] of Object.entries(groups)) {
      const avg = data.sum / data.count;
      const [subject, grade] = key.split('|');
      if (avg < 40) insights.push(`Check **${subject}** in **Grade ${grade}** – only **${avg.toFixed(1)}%**.`);
      else if (avg < 60) insights.push(`**${subject}** in **Grade ${grade}** needs review (**${avg.toFixed(1)}%**).`);
      else if (avg > 80) insights.push(`**${subject}** in **Grade ${grade}** is excelling (**${avg.toFixed(1)}%**).`);
    }
    container.innerHTML = insights.length ? insights.map(i => `<p class="insight">${i}</p>`).join('') : '<p>No insights yet.</p>';
  };

  // Chart Toggle
  window.toggleChart = () => {
    const container = el('chartContainer');
    const btn = el('chartToggle');
    const show = container.style.display === 'none';
    container.style.display = show ? 'block' : 'none';
    btn.textContent = show ? 'Hide Chart' : 'Show Chart';
    if (show) renderChart();
  };

  // Render Chart
  const renderChart = () => {
    const canvas = el('avgChart');
    if (!canvas) return;
    if (chartInstance) chartInstance.destroy();

    const records = loadRecords();
    const subjectData = {};
    records.forEach(r => {
      const key = `${r.subject} G${r.grade}`;
      if (!subjectData[key]) subjectData[key] = { sum: 0, count: 0 };
      subjectData[key].sum += r.mean;
      subjectData[key].count++;
    });
    const labels = Object.keys(subjectData);
    const data = labels.map(k => (subjectData[k].sum / subjectData[k].count).toFixed(1));

    chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Average %',
          data,
          backgroundColor: '#2563eb',
          borderRadius: 4,
          barThickness: 18
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } }
      }
    });
  };

  // Export PDF
  window.downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const table = el('averageScoresTable');
    if (!table) return showAlert('No data.');
    html2canvas(table, { scale: 2 }).then(canvas => {
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = 190, h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 10, 10, w, h);
      pdf.save('SmartScores_Averages.pdf');
    });
  };

  // Export Excel
  window.exportToExcel = () => {
    const records = loadRecords();
    if (!records.length) return showAlert('No data.');
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({ ...r, Rubric: rubric(r.mean).text })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scores');
    XLSX.writeFile(wb, 'SmartScores.xlsx');
  };

  // Export Backup
  window.exportBackup = () => {
    const data = JSON.stringify(loadRecords(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartscores-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('lastBackupTime', Date.now().toString());
    el('backupReminder')?.style.display = 'none';
  };

  // Import Data
  window.importData = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.json')) return showAlert('Select .json file.');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          saveRecords(data);
          showAlert('Imported!');
          renderAll();
        } else throw '';
      } catch { showAlert('Invalid file.'); }
    };
    reader.readAsText(file);
  };

  // Clear All Data
  window.clearAllData = () => {
    if (confirm('Delete ALL data?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TEACHER_KEY);
      renderAll();
      showAlert('Cleared.');
    }
  };

  // Auto Delete
  window.runAutoDelete = () => {
    const setting = el('autoDeleteSetting')?.value || '1';
    const records = loadRecords();
    const currentYear = new Date().getFullYear();
    const keepYears = parseInt(setting);
    const kept = records.filter(r => (keepYears === 0) || (currentYear - parseInt(r.year)) <= keepYears);
    const deleted = records.length - kept.length;
    if (deleted === 0) return showAlert('No old records.');
    saveRecords(kept);
    showAlert(`${deleted} old records deleted.`);
    renderAll();
  };

  // Update Dashboard Stats
  const updateDashboardStats = () => {
    const records = loadRecords();
    const uniqueTeachers = new Set(records.map(r => r.teacher)).size;
    el('totalTeachers').textContent = uniqueTeachers;

    const subjectStats = {};
    records.forEach(r => {
      const key = `${r.subject} G${r.grade}`;
      if (!subjectStats[key]) subjectStats[key] = { sum: 0, count: 0 };
      subjectStats[key].sum += r.mean;
      subjectStats[key].count++;
    });

    let top = { name: '-', avg: 0 }, worst = { name: '-', avg: 100 };
    for (const [name, s] of Object.entries(subjectStats)) {
      const avg = s.sum / s.count;
      if (avg > top.avg) top = { name, avg };
      if (avg < worst.avg) worst = { name, avg };
    }
    el('topSubject').textContent = top.name;
    el('worstSubject').textContent = worst.name;

    const last = records[records.length - 1];
    el('lastEntry').textContent = last ? `${last.term} ${last.year}` : 'Never';

    // Backup Reminder
    const lastBackup = localStorage.getItem('lastBackupTime');
    const reminder = el('backupReminder');
    if (reminder && (!lastBackup || (Date.now() - parseInt(lastBackup)) > 7 * 24 * 60 * 60 * 1000)) {
      reminder.style.display = 'block';
    }
  };

  // Render All
  const renderAll = () => {
    renderRecords();
    renderAverageScores();
    updateDashboardStats();
    renderAIInsights();

    const records = loadRecords();
    const toggleBtn = el('chartToggle');
    if (toggleBtn) toggleBtn.style.display = records.length > 0 ? 'inline-block' : 'none';
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    loadLastTeacher();
    loadTheme();
    renderAll();

    const settingSelect = el('autoDeleteSetting');
    if (settingSelect) settingSelect.addEventListener('change', () => localStorage.setItem(AUTO_DELETE_KEY, settingSelect.value));

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');
  });
})();
