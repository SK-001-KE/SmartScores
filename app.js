// SmartScores v2.9.7 - FULLY WORKING (No Reload, Saves, Updates Table)
(() => {
  const STORAGE_KEY = 'smartScores';
  const TARGETS_KEY = 'smartScoresTargets';
  const TEACHER_KEY = 'lastTeacherName';

  // DOM Helpers
  const el = id => document.getElementById(id);
  const showAlert = msg => alert(msg);

  // Storage
  const load = (k, def = []) => {
    try { return JSON.parse(localStorage.getItem(k)) || def; }
    catch { return def; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // Rubric
  const rubric = s => {
    if (s >= 75) return { text: 'Exceeding', color: '#16a34a', emoji: 'Trophy' };
    if (s >= 41) return { text: 'Meeting', color: '#2563eb', emoji: 'Check' };
    if (s >= 21) return { text: 'Approaching', color: '#f59e0b', emoji: 'Warning' };
    return { text: 'Below', color: '#ef4444', emoji: 'Alert' };
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

  // === SAVE RECORD (FIXED) ===
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
    renderAll(); // Updates Recorded Scores table
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

    const saveBtn = document.querySelector('#dataEntryForm button');
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
    const saveBtn = document.querySelector('#dataEntryForm button');
    if (saveBtn) {
      saveBtn.textContent = 'Save Record';
      saveBtn.onclick = null; // Will be reattached by form listener
    }
  };

  // === DELETE RECORD ===
  window.deleteRecord = (i) => {
    if (confirm('Delete this record?')) {
      const records = loadRecords();
      records.splice(i, 1);
      saveRecords(records);
      showAlert('Record deleted.');
      renderAll();
    }
  };

  // === FILTER RECORDS ===
  window.filterRecords = () => {
    const search = (el('searchInput')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('#recordsTable tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(search) ? '' : 'none';
    });
  };

  // === SAVE TARGET ===
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
      return showAlert('Please fill all fields.');
    }

    if (target.score < 0 || target.score > 100) return showAlert('Target must be 0–100.');

    const targets = loadTargets();
    const exists = targets.some(t =>
      t.subject === target.subject && t.grade === target.grade && t.stream === target.stream &&
      t.term === target.term && t.examType === target.examType
    );
    if (exists) return showAlert('Target already exists!');

    targets.push(target);
    saveTargets(targets);
    el('targetScore').value = '';
    showAlert('Target saved!');
    renderTargets();
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

  window.editTarget = (i) => {
    const targets = loadTargets();
    const t = targets[i];
    el('targetSubject').value = t.subject;
    el('targetGrade').value = t.grade;
    el('targetStream').value = t.stream;
    el('targetTerm').value = t.term;
    el('targetExamType').value = t.examType;
    el('targetScore').value = t.score;

    const btn = document.querySelector('#set-targets.html button');
    if (btn) {
      btn.textContent = 'Update Target';
      btn.onclick = () => updateTarget(i);
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

    if (!updated.subject || isNaN(updated.score)) return showAlert('Fill all.');
    const targets = loadTargets();
    targets[i] = updated;
    saveTargets(targets);
    resetTargetForm();
    showAlert('Target updated!');
    renderTargets();
  };

  const resetTargetForm = () => {
    el('targetScore').value = '';
    const btn = document.querySelector('#set-targets.html button');
    if (btn) {
      btn.textContent = 'Save Target';
      btn.onclick = saveTarget;
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

  // === RENDER ALL (Used everywhere) ===
  const renderAll = () => {
    renderRecords();
    renderAverageScores();
    updateDashboardStats();
    renderAIInsights();
    renderTargets();

    const toggleBtn = el('chartToggle');
    if (toggleBtn) toggleBtn.style.display = loadRecords().length > 0 ? 'inline-block' : 'none';
  };

  // === AVERAGE SCORES (for insights page) ===
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

  // === DASHBOARD STATS ===
  const updateDashboardStats = () => {
    const records = loadRecords();
    const uniqueTeachers = new Set(records.map(r => r.teacher)).size;
    el('totalTeachers') && (el('totalTeachers').textContent = uniqueTeachers);

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
    el('topSubject') && (el('topSubject').textContent = top.name);
    el('worstSubject') && (el('worstSubject').textContent = worst.name);

    const last = records[records.length - 1];
    el('lastEntry') && (el('lastEntry').textContent = last ? `${last.term} ${last.year}` : 'Never');
  };

  // === AI INSIGHTS ===
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

  // === CHART (optional) ===
  let chartInstance = null;
  window.toggleChart = () => {
    const container = el('chartContainer');
    const btn = el('chartToggle');
    const show = container.style.display === 'none';
    container.style.display = show ? 'block' : 'none';
    btn.textContent = show ? 'Hide Chart' : 'Show Chart';
    if (show) renderChart();
  };

  const renderChart = () => {
    const canvas = el('avgChart');
    if (!canvas || !window.Chart) return;
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
      data: { labels, datasets: [{ label: 'Avg %', data, backgroundColor: '#2563eb', borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  };

  // === INIT ===
  document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadLastTeacher();
    renderAll();

    // FORM SUBMIT LISTENER (PREVENT RELOAD)
    const form = el('dataEntryForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecord();
      });
    }

    // AUTO RENDER ON RECORDED SCORES PAGE
    if (location.pathname.includes('recorded-scores')) {
      renderRecords();
      filterRecords();
    }

    // SERVICE WORKER
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
  });
})();
