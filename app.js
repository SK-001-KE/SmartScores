// SmartScores v2.9.9 - Save FIXED + Dashboard Clean & Centered
(() => {
  const STORAGE_KEY = 'smartScores';
  const TARGETS_KEY = 'smartScoresTargets';
  const TEACHER_KEY = 'lastTeacherName';
  const BACKUP_KEY = 'lastBackupTime';

  const el = id => document.getElementById(id);
  const showAlert = msg => alert(msg);

  const load = (k, def = []) => {
    try { return JSON.parse(localStorage.getItem(k)) || def; }
    catch { return def; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const rubric = s => {
    if (s >= 75) return { text: 'Exceeding', color: '#16a34a', emoji: 'Trophy' };
    if (s >= 41) return { text: 'Meeting', color: '#2563eb', emoji: 'Check' };
    if (s >= 21) return { text: 'Approaching', color: '#f59e0b', emoji: 'Warning' };
    return { text: 'Below', color: '#ef4444', emoji: 'Alert' };
  };

  window.toggleDarkMode = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };
  const loadTheme = () => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = theme;
  };

  const loadLastTeacher = () => {
    const name = localStorage.getItem(TEACHER_KEY);
    if (name && el('teacherName')) el('teacherName').value = name;
  };

  const loadRecords = () => load(STORAGE_KEY);
  const saveRecords = r => save(STORAGE_KEY, r);
  const loadTargets = () => load(TARGETS_KEY);
  const saveTargets = t => save(TARGETS_KEY, t);

  // === SAVE RECORD – FIXED ===
  window.saveRecord = () => {
    const record = {
      teacher: el('teacherName')?.value.trim(),
      subject: el('subject')?.value,
      grade: el('grade')?.value,
      stream: el('stream')?.value,
      term: el('term')?.value,
      examType: el('examType')?.value,
      year: el('year')?.value,
      mean: Number(el('meanScore')?.value)
    };

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
    el('meanScore').value = '';
    showAlert('Record saved successfully!');
    renderAll();
  };

  // === RENDER RECORDS ===
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
    filterRecords();
  };

  // === EDIT RECORD ===
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

    const saveBtn = document.querySelector('#dataEntryForm button[type="submit"]');
    if (saveBtn) {
      saveBtn.textContent = 'Update Record';
      saveBtn.onclick = () => updateRecord(i);
    }

    el('teacherName').scrollIntoView({ behavior: 'smooth' });
  };

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
    showAlert('Record updated!');
    renderAll();
  };

  const resetForm = () => {
    el('meanScore').value = '';
    const saveBtn = document.querySelector('#dataEntryForm button[type="submit"]');
    if (saveBtn) {
      saveBtn.textContent = 'Save Record';
      saveBtn.onclick = null;
    }
  };

  window.deleteRecord = (i) => {
    if (confirm('Delete this record?')) {
      const records = loadRecords();
      records.splice(i, 1);
      saveRecords(records);
      showAlert('Record deleted.');
      renderAll();
    }
  };

  // === BACKUP, EXCEL, CLEAR ===
  window.exportBackup = () => {
    const records = loadRecords();
    if (!records.length) return showAlert('No data to backup.');
    const data = JSON.stringify(records, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartscores-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(BACKUP_KEY, Date.now().toString());
    showAlert('Backup saved!');
  };

  window.exportToExcel = () => {
    if (typeof XLSX === 'undefined') return showAlert('Excel library not loaded.');
    const records = loadRecords();
    if (!records.length) return showAlert('No data.');
    const data = records.map(r => ({
      Teacher: r.teacher,
      Subject: r.subject,
      Grade: r.grade,
      Stream: r.stream,
      Term: r.term,
      'Exam Type': r.examType,
      Year: r.year,
      'Mean Score': r.mean,
      Rubric: rubric(r.mean).text
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scores');
    XLSX.writeFile(wb, `SmartScores_${new Date().toISOString().slice(0,10)}.xlsx`);
    showAlert('Excel exported!');
  };

  window.clearAllData = () => {
    if (!confirm('Delete ALL records?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TEACHER_KEY);
    showAlert('All data cleared.');
    renderAll();
  };

  // === FILTER ===
  window.filterRecords = () => {
    const search = (el('searchInput')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('#recordsTable tbody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
  };

  // === DASHBOARD – CLEAN & CENTERED ===
  const updateDashboardStats = () => {
    const records = loadRecords();
    if (!records.length) return;

    const totalAvg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
    const totalRub = rubric(totalAvg);

    // Card 1: Total Average
    const avgCard = el('totalAvgCard');
    if (avgCard) {
      avgCard.innerHTML = `
        <h3>${totalAvg.toFixed(1)}%</h3>
        <p style="margin:5px 0;"><strong>${totalRub.emoji} ${totalRub.text}</strong></p>
        <small style="color:#666;">Overall Performance</small>
      `;
    }

    // Card 2: Best Subject
    const subjectStats = {};
    records.forEach(r => {
      const key = `${r.subject}|${r.grade}|${r.stream}`;
      if (!subjectStats[key]) subjectStats[key] = { sum: 0, count: 0, ...r };
      subjectStats[key].sum += r.mean;
      subjectStats[key].count++;
    });

    let best = { avg: 0 }, worst = { avg: 100 };
    for (const [key, s] of Object.entries(subjectStats)) {
      const avg = s.sum / s.count;
      if (avg > best.avg) best = { ...s, avg };
      if (avg < worst.avg) worst = { ...s, avg };
    }

    const bestCard = el('bestSubjectCard');
    if (bestCard && best.avg > 0) {
      bestCard.innerHTML = `
        <h3>${best.avg.toFixed(1)}%</h3>
        <p><strong>${best.subject}</strong></p>
        <small>G${best.grade} • ${best.stream}</small>
      `;
    }

    const worstCard = el('worstSubjectCard');
    if (worstCard && worst.avg < 100) {
      worstCard.innerHTML = `
        <h3>${worst.avg.toFixed(1)}%</h3>
        <p><strong>${worst.subject}</strong></p>
        <small>G${worst.grade} • ${worst.stream}</small>
      `;
    }
  };

  // === RENDER ALL ===
  const renderAll = () => {
    renderRecords();
    updateDashboardStats();
    const toggleBtn = el('chartToggle');
    if (toggleBtn) toggleBtn.style.display = loadRecords().length > 0 ? 'inline-block' : 'none';
  };

  // === INIT ===
  document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadLastTeacher();
    renderAll();

    // FIXED: Form submit listener
    const form = el('dataEntryForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecord();
      });
    }

    if (location.pathname.includes('recorded-scores')) {
      renderRecords();
      filterRecords();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
  });
})();
