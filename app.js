// SmartScores v2.9.12 - PDF + EDIT FIXED + DASHBOARD CLEAN
(() => {
  const STORAGE_KEY = 'smartScores';
  const TARGETS_KEY = 'smartScoresTargets';
  const TEACHER_KEY = 'lastTeacherName';

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

  // === SAVE RECORD ===
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

  // === EDIT RECORD – FIXED ===
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

  // === EDIT TARGET – FIXED ===
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

  const resetTargetForm = () => {
    el('targetScore').value = '';
    const saveBtn = document.querySelector('#setTargetsForm button[type="submit"]');
    if (saveBtn) {
      saveBtn.textContent = 'Save Target';
      saveBtn.onclick = null;
    }
  };

  // === DELETE ===
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

  // === DOWNLOAD PDF – FIXED ===
  window.downloadPDF = () => {
    if (typeof window.print !== 'function') return showAlert('Print not supported.');
    const printBtn = el('printBtn');
    if (printBtn) printBtn.style.display = 'none';
    window.print();
    setTimeout(() => {
      if (printBtn) printBtn.style.display = 'block';
    }, 1000);
  };

  // === RENDER TABLES ===
  const renderRecords = () => {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    const records = loadRecords();
    tbody.innerHTML = records.map((r, i) => {
      const rub = rubric(r.mean);
      return `
        <tr>
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
            <button onclick="editRecord(${i})" class="btn" style="background:#f59e0b;padding:6px 10px;font-size:0.9rem;">Edit</button>
            <button onclick="deleteRecord(${i})" class="btn btn-danger" style="padding:6px 10px;font-size:0.9rem;">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  };

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
          <button onclick="editTarget(${i})" class="btn" style="background:#f59e0b;padding:6px 10px;font-size:0.9rem;">Edit</button>
          <button onclick="deleteTarget(${i})" class="btn btn-danger" style="padding:6px 10px;font-size:0.9rem;">Delete</button>
        </td>
      </tr>
    `).join('');
  };

  // === DASHBOARD – 3 CARDS ONLY ===
  const updateDashboardStats = () => {
    const records = loadRecords();
    if (!records.length) return;

    const totalAvg = records.reduce((sum, r) => sum + r.mean, 0) / records.length;
    const totalRub = rubric(totalAvg);

    const avgCard = el('totalAvgCard');
    if (avgCard) {
      avgCard.innerHTML = `
        <h2 style="margin:0;font-size:3rem;color:#fff;font-weight:bold;">${totalAvg.toFixed(1)}%</h2>
        <p style="margin:8px 0;font-size:1.3rem;color:#fff;">${totalRub.emoji} ${totalRub.text}</p>
        <small style="color:#e0f2fe;">Overall Performance</small>
      `;
    }

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
        <h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${best.avg.toFixed(1)}%</h2>
        <p style="margin:8px 0;font-size:1.2rem;color:#fff;">${best.subject}</p>
        <small style="color:#d1fae5;">G${best.grade} • ${best.stream}</small>
      `;
    }

    const worstCard = el('worstSubjectCard');
    if (worstCard && worst.avg < 100) {
      worstCard.innerHTML = `
        <h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${worst.avg.toFixed(1)}%</h2>
        <p style="margin:8px 0;font-size:1.2rem;color:#fff;">${worst.subject}</p>
        <small style="color:#fecaca;">G${worst.grade} • ${worst.stream}</small>
      `;
    }
  };

  // === RENDER ALL ===
 const renderAll = () => {
  renderRecords();
  renderTargets();
  updateDashboardStats();
  renderProgressChart();  // NEW
  renderAIInsights();
  renderAverageScores();
};
    const renderProgressChart = () => {
  const canvas = el('progressChart');
  if (!canvas || !window.Chart) return;

  const records = loadRecords();
  if (!records.length) return;

  // Group by Term + Year
  const termData = {};
  records.forEach(r => {
    const key = `${r.term} ${r.year}`;
    if (!termData[key]) termData[key] = { sum: 0, count: 0 };
    termData[key].sum += r.mean;
    termData[key].count++;
  });

  const labels = Object.keys(termData).sort();
  const data = labels.map(k => (termData[k].sum / termData[k].count).toFixed(1));

  if (window.progressChartInstance) window.progressChartInstance.destroy();

  window.progressChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Average Mean Score',
        data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: 'Mean Score (%)' } },
        x: { title: { display: true, text: 'Term & Year' } }
      }
    }
  });
};
    updateDashboardStats();
  };

  // === INIT ===
  document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadLastTeacher();
    renderAll();

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
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  });
})();
