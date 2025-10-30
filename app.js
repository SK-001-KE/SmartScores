// SmartScores v2.9.11 - SAVE BUTTONS FIXED + DASHBOARD CLEAN
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
    if (s >= 75) return { text: 'Exceeding', color: '#16a34a', emoji: '🏆' };
    if (s >= 41) return { text: 'Meeting', color: '#2563eb', emoji: '✅' };
    if (s >= 21) return { text: 'Approaching', color: '#f59e0b', emoji: '⚠️' };
    return { text: 'Below', color: '#ef4444', emoji: '❗' };
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

  // === SAVE TARGET – FIXED ===
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

    if (target.score < 0 || target.score > 100) return showAlert('Target must be 0–100.');

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

  // === RENDER TARGETS ===
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

  // === EDIT/UPDATE ===
  window.editRecord = (i) => {
    const records = loadRecords();
    const r = records[i];
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

  window.editTarget = (i) => {
    const targets = loadTargets();
    const t = targets[i];
    el('targetSubject').value = t.subject;
    el('targetGrade').value = t.grade;
    el('targetStream').value = t.stream;
    el('targetTerm').value = t.term;
    el('targetExamType').value = t.examType;
    el('targetScore').value = t.score;

    const saveBtn = document.querySelector('#setTargetsForm button[type="submit"]');
    if (saveBtn) {
      saveBtn.textContent = 'Update Target';
      saveBtn.onclick = () => updateTarget(i);
    }
  };

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

  const resetForm = () => {
    el('meanScore').value = '';
    const saveBtn = document.querySelector('#dataEntryForm button[type="submit"]');
    if (saveBtn) {
      saveBtn.textContent = 'Save Record';
      saveBtn.onclick = null;
    }
  };

  const resetTargetForm = () => {
    el('targetScore').value = '';
    const saveBtn = document.querySelector('#setTargetsForm button[type="submit"]');
    if (saveBtn) {
      saveBtn.textContent = 'Save Target';
      saveBtn.onclick = null;
    }
  };

  window.deleteRecord = (i) => {
    if (confirm('Delete record?')) {
      const records = loadRecords();
      records.splice(i, 1);
      saveRecords(records);
      showAlert('Deleted.');
      renderAll();
    }
  };

  window.deleteTarget = (i) => {
    if (confirm('Delete target?')) {
      const targets = loadTargets();
      targets.splice(i, 1);
      saveTargets(targets);
      showAlert('Deleted.');
      renderTargets();
    }
  };

  // === BACKUP – FIXED ===
  window.exportBackup = () => {
    const records = loadRecords();
    if (!records.length) return showAlert('No data.');
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

  // === EXPORT EXCEL – FIXED ===
  window.exportToExcel = () => {
    if (typeof XLSX === 'undefined') return showAlert('Load Excel library.');
    const records = loadRecords();
    if (!records.length) return showAlert('No data.');
    const data = records.map(r => ({
      Teacher: r.teacher,
      Subject: r.subject,
      Grade: r.grade,
      Stream: r.stream,
      Term: r.term,
      Exam: r.examType,
      Year: r.year,
      Mean: r.mean,
      Rubric: rubric(r.mean).text
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scores');
    XLSX.writeFile(wb, `SmartScores_${new Date().toISOString().slice(0,10)}.xlsx`);
    showAlert('Excel exported!');
  };

  // === CLEAR ALL – FIXED ===
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

  // === RENDER AVERAGES ===
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
      const target = targets.find(t => t.subject === g.subject && t.grade === g.grade && t.stream === g.stream && t.term === g.term && t.examType === g.examType);
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

  // === AI INSIGHTS – FIXED ===
  const renderAIInsights = () => {
    const container = el('insights');
    if (!container) return;
    const records = loadRecords();
    if (!records.length) {
      container.innerHTML = '<p>No data yet. Enter scores to see insights.</p>';
      return;
    }

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

    container.innerHTML = insights.length 
      ? insights.map(i => `<p style="margin:10px 0;padding:12px;background:#f0f9ff;border-left:4px solid #2563eb;border-radius:4px;">${i}</p>`).join('')
      : '<p style="color:#666;">All subjects are performing well!</p>';
  };

  // === DASHBOARD STATS – BIG FONTS + WHITE TEXT ===
  const updateDashboardStats = () => {
    const records = loadRecords();
    if (!records.length) return;

    const totalAvg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
    const totalRub = rubric(totalAvg);

    // Total Average Card
    const avgCard = el('totalAvgCard');
    if (avgCard) {
      avgCard.innerHTML = `
        <h2 style="margin:0;font-size:3rem;color:#fff;font-weight:bold;">${totalAvg.toFixed(1)}%</h2>
        <p style="margin:8px 0;font-size:1.3rem;color:#fff;">${totalRub.emoji} ${totalRub.text}</p>
        <small style="color:#e0f2fe;font-size:1rem;">Overall Performance</small>
      `;
    }

    // Best Subject Card
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
    if (bestCard) {
      bestCard.innerHTML = `
        <h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${best.avg.toFixed(1)}%</h2>
        <p style="margin:8px 0;font-size:1.2rem;color:#fff;font-weight:bold;">${best.subject}</p>
        <small style="color:#d1fae5;">G${best.grade} • ${best.stream}</small>
      `;
    }

    const worstCard = el('worstSubjectCard');
    if (worstCard) {
      worstCard.innerHTML = `
        <h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${worst.avg.toFixed(1)}%</h2>
        <p style="margin:8px 0;font-size:1.2rem;color:#fff;font-weight:bold;">${worst.subject}</p>
        <small style="color:#fecaca;">G${worst.grade} • ${worst.stream}</small>
      `;
    }
  };

  // === RENDER ALL ===
  const renderAll = () => {
    renderRecords();
    renderTargets();
    updateDashboardStats();
    renderAIInsights();
    renderAverageScores();
  };

  // === INIT ===
  document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadLastTeacher();
    renderAll();

    // FIXED FORM LISTENERS
    const dataForm = el('dataEntryForm');
    if (dataForm) {
      dataForm.addEventListener('submit', e => {
        e.preventDefault();
        saveRecord();
      });
    }

    const targetForm = el('setTargetsForm');
    if (targetForm) {
      targetForm.addEventListener('submit', e => {
        e.preventDefault();
        saveTarget();
      });
    }

    if (location.pathname.includes('recorded-scores')) {
      renderRecords();
      filterRecords();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  });
})();
