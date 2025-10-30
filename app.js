// SmartScores v2.9.17 - CLEAN + STABLE + PDF DOWNLOAD
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
  const handleSaveRecord = () => {
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
      return showAlert('Please fill all fields.');
    }

    if (record.mean < 0 || record.mean > 100) return showAlert('Mean 0–100.');
    if (record.year < 2000 || record.year > 2100) return showAlert('Year 2000–2100.');

    const records = loadRecords();
    const exists = records.some(r =>
      r.teacher === record.teacher && r.subject === record.subject &&
      r.grade === record.grade && r.stream === record.stream &&
      r.term === record.term && r.examType === record.examType && r.year === record.year
    );
    if (exists) return showAlert('Record exists!');

    records.push(record);
    saveRecords(records);
    localStorage.setItem(TEACHER_KEY, record.teacher);
    el('meanScore').value = '';
    showAlert('Saved!');
    renderAll();
  };

  // === SAVE TARGET ===
  const handleSaveTarget = () => {
    const target = {
      subject: el('targetSubject')?.value,
      grade: el('targetGrade')?.value,
      stream: el('targetStream')?.value,
      term: el('targetTerm')?.value,
      examType: el('targetExamType')?.value,
      score: Number(el('targetScore')?.value)
    };

    if (!target.subject || !target.grade || !target.stream || !target.term || !target.examType || isNaN(target.score)) {
      return showAlert('Fill all fields.');
    }

    if (target.score < 0 || target.score > 100) return showAlert('Target 0–100.');

    const targets = loadTargets();
    const exists = targets.some(t =>
      t.subject === target.subject && t.grade === target.grade &&
      t.stream === target.stream && t.term === target.term && t.examType === target.examType
    );
    if (exists) return showAlert('Target exists!');

    targets.push(target);
    saveTargets(targets);
    el('targetScore').value = '';
    showAlert('Target saved!');
    renderTargets();
  };

  // === DELETE ===
  window.deleteRecord = (i) => {
    if (confirm('Delete?')) {
      const records = loadRecords();
      records.splice(i, 1);
      saveRecords(records);
      showAlert('Deleted.');
      renderAll();
    }
  };

  window.deleteTarget = (i) => {
    if (confirm('Delete?')) {
      const targets = loadTargets();
      targets.splice(i, 1);
      saveTargets(targets);
      showAlert('Deleted.');
      renderTargets();
    }
  };

  // === RENDER TABLES ===
 const renderRecords = () => {
  const tbody = document.querySelector('#recordsTable tbody');
  if (!tbody) return;
  const records = loadRecords();
  const targets = loadTargets();

  // Create target lookup: subject|grade|stream|term|examType → score
  const targetMap = {};
  targets.forEach(t => {
    const key = `${t.subject}|${t.grade}|${t.stream}|${t.term}|${t.examType}`;
    targetMap[key] = t.score;
  });

  tbody.innerHTML = records.map(r => {
    const key = `${r.subject}|${r.grade}|${r.stream}|${r.term}|${r.examType}`;
    const target = targetMap[key] || 0;
    const deviation = (r.mean - target).toFixed(1);
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
        <td>${target}%</td>
        <td style="font-weight:bold;color:${deviation >= 0 ? '#16a34a' : '#dc2626'}">
          ${deviation >= 0 ? '+' : ''}${deviation}%
        </td>
        <td><span style="background:${rub.color};color:#fff;padding:4px 8px;border-radius:6px;">${rub.emoji} ${rub.text}</span></td>
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
          <button onclick="deleteTarget(${i})" class="btn btn-danger" style="padding:6px 10px;font-size:0.9rem;">Delete</button>
        </td>
      </tr>
    `).join('');
  };

 // === RENDER AI INSIGHTS ===
const renderAIInsights = () => {
  const container = el('insights');
  if (!container) return;
  const records = loadRecords();
  const targets = loadTargets();

  if (!records.length) {
    container.innerHTML = '<p class="insight">No data. Enter scores to see insights.</p>';
    return;
  }

  // Target map
  const targetMap = {};
  targets.forEach(t => {
    const key = `${t.subject}|${t.grade}|${t.stream}|${t.term}|${t.examType}`;
    targetMap[key] = t.score;
  });

  const insights = [];
  records.forEach(r => {
    const key = `${r.subject}|${r.grade}|${r.stream}|${r.term}|${r.examType}`;
    const target = targetMap[key] || 0;
    const deviation = r.mean - target;

    if (deviation < -10) {
      insights.push(`${r.subject} (G${r.grade} ${r.stream}) – ${r.mean.toFixed(1)}% vs ${target}% target: **${deviation.toFixed(1)}% below** – Needs urgent attention`);
    } else if (deviation > 10) {
      insights.push(`${r.subject} (G${r.grade} ${r.stream}) – ${r.mean.toFixed(1)}% vs ${target}% target: **+${deviation.toFixed(1)}% above** – Outstanding!`);
    }
  });

  container.innerHTML = insights.length 
    ? insights.map(i => `<p class="insight">${i}</p>`).join('')
    : '<p class="insight">All subjects on track with targets!</p>';
};
  const renderProgressChart = () => {
  const canvas = el('progressChart');
  if (!canvas || !window.Chart) return;

  const records = loadRecords();
  if (!records.length) {
    canvas.style.display = 'none';
    return;
  }

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
 // === DASHBOARD – BEST & WORST FIXED ===
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
    if (!subjectStats[key]) subjectStats[key] = { sum: 0, count: 0, subject: r.subject, grade: r.grade, stream: r.stream };
    subjectStats[key].sum += r.mean;
    subjectStats[key].count++;
  });

  let best = { avg: -1 }, worst = { avg: 101 };
  for (const s of Object.values(subjectStats)) {
    const avg = s.sum / s.count;
    if (avg > best.avg) best = { ...s, avg };
    if (avg < worst.avg) worst = { ...s, avg };
  }

  const bestCard = el('bestSubjectCard');
  if (bestCard && best.avg >= 0) {
    bestCard.innerHTML = `
      <h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${best.avg.toFixed(1)}%</h2>
      <p style="margin:8px 0;font-size:1.2rem;color:#fff;">${best.subject}</p>
      <small style="color:#d1fae5;">G${best.grade} • ${best.stream}</small>
    `;
  }

  const worstCard = el('worstSubjectCard');
  if (worstCard && worst.avg <= 100) {
    worstCard.innerHTML = `
      <h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${worst.avg.toFixed(1)}%</h2>
      <p style="margin:8px 0;font-size:1.2rem;color:#fff;">${worst.subject}</p>
      <small style="color:#fecaca;">G${worst.grade} • ${worst.stream}</small>
    `;
  }
};

  // === PDF DOWNLOAD – FIXED ===
  window.downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('SmartScores Report', 105, 20, { align: 'center' });

    const records = loadRecords();
    let y = 40;
    records.forEach(r => {
      doc.setFontSize(10);
      doc.text(`${r.subject} G${r.grade} ${r.stream} – ${r.mean.toFixed(1)}%`, 20, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save(`SmartScores_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // === EXCEL EXPORT ===
  window.exportToExcel = () => {
    if (typeof XLSX === 'undefined') return showAlert('XLSX not loaded.');
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
      Mean: r.mean
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scores');
    XLSX.writeFile(wb, `SmartScores_${new Date().toISOString().slice(0,10)}.xlsx`);
    showAlert('Excel exported!');
  };

  // === BACKUP ===
  window.exportBackup = () => {
    const records = loadRecords();
    if (!records.length) return showAlert('No data.');
    const data = JSON.stringify(records, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('Backup saved!');
  };

  // === CLEAR ALL ===
  window.clearAllData = () => {
    if (confirm('Delete ALL data?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TEACHER_KEY);
      showAlert('All cleared.');
      renderAll();
    }
  };

  // === RENDER ALL ===
  const renderAll = () => {
  renderRecords();
  renderTargets();
  updateDashboardStats();
  renderProgressChart();  // ADD THIS LINE
  renderAIInsights();
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
        handleSaveRecord();
      });
    }

    const targetForm = el('setTargetsForm');
    if (targetForm) {
      targetForm.addEventListener('submit', e => {
        e.preventDefault();
        handleSaveTarget();
      });
    }
    if (location.pathname.includes('averages-insights')) {
  renderAIInsights();
  renderRecords();  // ADD THIS
}

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  });
})();
