// SmartScores v2.9.27 - FULLY CLEAN + WORKING
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
  if (s >= 75) return { text: 'Exceeding',   color: '#16a34a', emoji: 'Trophy' };  // Trophy
  if (s >= 41) return { text: 'Meeting',     color: '#2563eb', emoji: 'Check' };   // Check
  if (s >= 21) return { text: 'Approaching', color: '#f59e0b', emoji: 'Warning' }; // Warning
  return { text: 'Below',      color: '#ef4444', emoji: 'Alert' };   // Alert
};

  // === GLOBAL FUNCTIONS ===
  window.toggleDarkMode = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  window.logout = () => {
    if (confirm('Logout and clear your name?')) {
      localStorage.removeItem('teacherFullName');
      window.location.href = 'login.html';
    }
  };

  // === SEARCH – FIXED ===
window.filterRecords = () => {
  const searchInput = el('searchInput');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const rows = document.querySelectorAll('#recordsTable tbody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  if (searchTerm && visibleCount === 0) {
    showAlert('No records found. Try different keywords.');
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

  // === LOADERS ===
  const loadTheme = () => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = theme;
  };

  const loadTeacherName = () => {
    const name = localStorage.getItem('teacherFullName');
    if (name && el('teacherName')) {
      el('teacherName').value = name;
      el('teacherName').setAttribute('readonly', true);
    }
  };

  const loadRecords = () => load(STORAGE_KEY);
  const saveRecords = r => save(STORAGE_KEY, r);
  const loadTargets = () => load(TARGETS_KEY);
  const saveTargets = t => save(TARGETS_KEY, t);

  // === SAVE RECORD ===
  const handleSaveRecord = () => {
  const loggedName = localStorage.getItem('teacherFullName');
  if (!loggedName) {
    showAlert('Please login first.');
    window.location.href = 'login.html';
    return;
  }

  const record = {
    teacher: loggedName,
    subject: el('subject')?.value?.trim(),
    grade: el('grade')?.value?.trim(),
    stream: el('stream')?.value?.trim(),
    term: el('term')?.value?.trim(),
    examType: el('examType')?.value?.trim(),
    year: el('year')?.value?.trim(),  // ← STRING
    mean: Number(el('meanScore')?.value)
  };

  // === VALIDATE ALL FIELDS ===
  if (!record.subject || !record.grade || !record.stream || 
      !record.term || !record.examType || !record.year || isNaN(record.mean)) {
    return showAlert('Please fill all fields correctly.');
  }

  if (record.mean < 0 || record.mean > 100) {
    return showAlert('Mean score must be 0–100.');
  }

  const yearNum = Number(record.year);
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return showAlert('Year must be 2000–2100.');
  }

  const records = loadRecords();

  // === DUPLICATE CHECK – ALL STRINGS, TRIMMED, EXACT ===
  const exists = records.some(r => 
    r.teacher === record.teacher &&
    r.subject === record.subject &&
    r.grade === record.grade &&
    r.stream === record.stream &&
    r.term === record.term &&
    r.examType === record.examType &&
    String(r.year) === record.year  // ← BOTH STRINGS
  );

  if (exists) {
    return showAlert('This record already exists!');
  }

  // === SAVE ===
  records.push({
    ...record,
    year: record.year  // keep as string
  });
  saveRecords(records);
  localStorage.setItem(TEACHER_KEY, record.teacher);
  el('meanScore').value = '';
  showAlert('Record saved successfully!');
  renderAll();
};

const autoFillYear = () => {
  const yearInput = el('year');
  if (yearInput && !yearInput.value.trim()) {
    yearInput.value = new Date().getFullYear();
  }
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

  // === RENDER RECORDS ===
  const renderRecords = () => {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    const records = loadRecords();
    const targets = loadTargets();
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

  // === PROGRESS CHART ===
  const renderProgressChart = () => {
    const canvas = el('progressChart');
    if (!canvas || !window.Chart) return;
    const records = loadRecords();
    if (!records.length) {
      canvas.style.display = 'none';
      return;
    }
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

  // === DASHBOARD STATS ===
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

  // === PDF DOWNLOAD ===
  window.downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const teacherName = localStorage.getItem('teacherFullName') || 'Unknown Teacher';
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`Teacher: ${teacherName}`, 14, 15);
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('SmartScores Performance Report', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });
    const records = loadRecords();
    if (!records.length) {
      doc.setFontSize(12);
      doc.text('No records found.', 14, 50);
      doc.save(`SmartScores_${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
      return;
    }
    const startY = 45;
    let y = startY;
    const rowHeight = 8;
    const colWidths = [30, 18, 18, 25, 30, 20, 25];
    const headers = ['Subject', 'Grade', 'Stream', 'Term', 'Exam', 'Mean', 'Rubric'];
    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let x = 14;
    headers.forEach((h, i) => {
      doc.rect(x, y - 6, colWidths[i], 8, 'F');
      doc.text(h, x + 2, y - 1);
      x += colWidths[i];
    });
    y += rowHeight;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    records.forEach(r => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
        x = 14;
        doc.setFillColor(37, 99, 235);
        doc.setTextColor(255, 255, 255);
        headers.forEach((h, i) => {
          doc.rect(x, y - 6, colWidths[i], 8, 'F');
          doc.text(h, x + 2, y - 1);
          x += colWidths[i];
        });
        y += rowHeight;
        doc.setTextColor(0, 0, 0);
      }
      const rub = rubric(r.mean);
      const cells = [
        r.subject,
        `G${r.grade}`,
        r.stream,
        r.term,
        r.examType,
        `${r.mean.toFixed(1)}%`,
        `${rub.emoji} ${rub.text}`
      ];
      x = 14;
      cells.forEach((cell, i) => {
        if (i === 6) {
          const color = rub.color.replace('#', '');
          const rColor = parseInt(color.substr(0,2), 16);
          const gColor = parseInt(color.substr(2,2), 16);
          const bColor = parseInt(color.substr(4,2), 16);
          doc.setFillColor(rColor, gColor, bColor);
          doc.rect(x, y - 6, colWidths[i], 7, 'F');
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setTextColor(0, 0, 0);
        }
        doc.text(cell, x + 2, y - 1);
        x += colWidths[i];
      });
      y += rowHeight;
    });
    const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`SmartScores_${safeName}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // === EXCEL, BACKUP, CLEAR ===
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
    renderProgressChart();
    renderAIInsights();
  };

  // === INIT – INSIDE IIFE ===
  document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTeacherName();
    autoFillYear();
    renderAll();

    const dataForm = el('dataEntryForm');
    if (dataForm) {
      dataForm.addEventListener('submit', e => {
        e.preventDefault();
        handleSaveRecord();
      });
    }

    const searchInput = el('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterRecords);  // Real-time search
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
      renderRecords();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  });

})(); // END OF IIFE
