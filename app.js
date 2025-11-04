// SmartScores v2.9.99 - UPDATED for EE1..BE2 rubrics, PDF legend & badge colors
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

  // === RUBRIC (EE1..BE2) ===
  const rubricMap = [
    { code: 'EE1', min: 90, max: 100, color: '#0B6623', text: 'EE1 90-99' },
    { code: 'EE2', min: 75, max: 89, color: '#2E8B57', text: 'EE2 75-89' },
    { code: 'ME1', min: 58, max: 74, color: '#1E3A8A', text: 'ME1 58-74' },
    { code: 'ME2', min: 41, max: 57, color: '#3B82F6', text: 'ME2 41-57' },
    { code: 'AE1', min: 31, max: 40, color: '#F97316', text: 'AE1 31-40' },
    { code: 'AE2', min: 21, max: 30, color: '#FDBA74', text: 'AE2 21-30' }, // light -> black text
    { code: 'BE1', min: 11, max: 20, color: '#DC2626', text: 'BE1 11-20' },
    { code: 'BE2', min: 0,  max: 10, color: '#7F1D1D', text: 'BE2 0-10' }
  ];

  const getRubric = (scoreRaw) => {
    const score = Number(scoreRaw);
    if (isNaN(score)) return { code: 'N/A', color: '#999', text: 'N/A' };
    for (const r of rubricMap) {
      if (score >= r.min && score <= r.max) return { code: r.code, color: r.color, text: r.text, min: r.min, max: r.max };
    }
    // fallback (covers >100 or negative)
    if (score > 100) return { code: 'EE1', color: rubricMap[0].color, text: rubricMap[0].text };
    return { code: 'BE2', color: rubricMap[rubricMap.length - 1].color, text: rubricMap[rubricMap.length - 1].text };
  };

  // Helper: hex -> [r,g,b]
  const hexToRgb = (hex) => {
    const v = hex.replace('#','');
    return [parseInt(v.substr(0,2),16), parseInt(v.substr(2,2),16), parseInt(v.substr(4,2),16)];
  };

  // Create HTML badge for web tables (background + white text except AE2)
  const formatRubricBadge = (score) => {
    const r = getRubric(score);
    const textColor = (r.code === 'AE2') ? '#000' : '#fff';
    return `<span class="rubric ${r.code}" style="background:${r.color};color:${textColor};padding:4px 8px;border-radius:6px;font-weight:700;display:inline-block;font-size:0.9rem;">${r.code}</span>`;
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

  // === SEARCH & DELETE ===
  // filterRecords now handles both table layouts (#recordsTable tbody OR #recordsBody)
  window.filterRecords = () => {
    const searchEl = el('searchInput');
    const q = searchEl ? searchEl.value.toLowerCase() : '';
    // collect rows from either table structure
    const tb = document.querySelector('#recordsTable tbody') || document.getElementById('recordsBody');
    if (!tb) return;
    const rows = Array.from(tb.querySelectorAll('tr'));
    let visible = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (!q || text.includes(q)) { row.style.display=''; visible++; }
      else row.style.display='none';
    });
    if (q && visible === 0) showAlert('No records found. Try different keywords.');
  };

  window.deleteRecord = (i) => {
    if (confirm('Delete record?')) {
      const records = loadRecords();
      if (i >= 0 && i < records.length) {
        records.splice(i, 1);
        saveRecords(records);
        showAlert('Deleted.');
        renderAll();
      }
    }
  };

  window.deleteTarget = (i) => {
    if (confirm('Delete target?')) {
      const targets = loadTargets();
      if (i >= 0 && i < targets.length) {
        targets.splice(i, 1);
        saveTargets(targets);
        showAlert('Deleted.');
        renderTargets();
      }
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
    const subject = el('subject')?.value?.trim();
    const grade = el('grade')?.value?.trim();
    const stream = el('stream')?.value?.trim();
    const term = el('term')?.value?.trim();
    let examType = el('examType')?.value?.trim();
    const year = el('year')?.value?.trim();
    const mean = Number(el('meanScore')?.value);

    // normalize examType if needed
    const examMap = {
      'opener': 'Opener Exam',
      'opener exam': 'Opener Exam',
      'mid': 'Mid Term Exam',
      'mid term exam': 'Mid Term Exam',
      'end': 'End Term Exam',
      'end term exam': 'End Term Exam'
    };
    if (examType) {
      const k = examType.toLowerCase();
      examType = examMap[k] || examType;
    }

    const record = { teacher: loggedName, subject, grade, stream, term, examType, year, mean };

    if (!record.subject || !record.grade || !record.stream || !record.term || !record.examType || !record.year || isNaN(record.mean)) {
      return showAlert('Please fill all fields correctly.');
    }
    if (record.mean < 0 || record.mean > 100) return showAlert('Mean score must be 0–100.');
    const yearNum = Number(record.year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) return showAlert('Year must be 2000–2100.');

    const records = loadRecords();
    const exists = records.some(r =>
      r.teacher === record.teacher &&
      r.subject === record.subject &&
      r.grade === record.grade &&
      r.stream === record.stream &&
      r.term === record.term &&
      r.examType === record.examType &&
      String(r.year) === record.year
    );
    if (exists) return showAlert('This record already exists!');

    records.push({ ...record, year: record.year, mean: Number(record.mean) });
    saveRecords(records);
    localStorage.setItem(TEACHER_KEY, record.teacher);
    if (el('meanScore')) el('meanScore').value = '';
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
      subject: el('targetSubject')?.value?.trim(),
      grade: el('targetGrade')?.value?.trim(),
      stream: el('targetStream')?.value?.trim(),
      term: el('targetTerm')?.value?.trim(),
      examType: el('targetExamType')?.value?.trim(),
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
    if (el('targetScore')) el('targetScore').value = '';
    showAlert('Target saved!');
    renderTargets();
  };

  // === RENDER RECORDS ===
  const renderRecords = () => {
    // support two table structures:
    // 1) <table id="recordsTable"><tbody>...</tbody></table>
    // 2) <table class="records-table"><tbody id="recordsBody">...</tbody></table>
    const tbody = document.querySelector('#recordsTable tbody') || document.getElementById('recordsBody');
    if (!tbody) return;
    const records = loadRecords();
    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:20px;color:#666;">No records yet. Enter data in Data Entry.</td></tr>';
      return;
    }
    const targets = loadTargets();
    const targetMap = {};
    targets.forEach(t => {
      const key = `${t.subject}|${t.grade}|${t.stream}|${t.term}|${t.examType}`;
      targetMap[key] = t.score;
    });

    tbody.innerHTML = records.map((r, idx) => {
      const key = `${r.subject}|${r.grade}|${r.stream}|${r.term}|${r.examType}`;
      const target = Number(targetMap[key] || 0);
      const deviationNum = Number((r.mean - target).toFixed(1));
      const deviationStr = `${deviationNum >= 0 ? '+' : ''}${deviationNum.toFixed(1)}%`;
      const rubricBadge = formatRubricBadge(r.mean);
      // include a delete action where table originally supported actions (some pages expect deleteRecord)
      const actions = `<button onclick="deleteRecord(${idx})" class="btn btn-danger" style="padding:6px 8px;font-size:0.85rem;border-radius:6px;">Delete</button>`;
      return `
        <tr>
          <td>${r.year || ''}</td>
          <td>${r.teacher || ''}</td>
          <td>G${r.grade || ''} • ${r.stream || ''}</td>
          <td>${r.subject || ''}</td>
          <td>-</td>
          <td style="text-align:right;">${Number(r.mean).toFixed(1)}%</td>
          <td style="text-align:center;">${rubricBadge}</td>
        </tr>
      `;
    }).join('');
    // don't auto-sort here (we can't rely on column indexes for both table shapes)
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
    `).join('') || '<tr><td colspan="7">No targets set.</td></tr>';
  };

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
      const target = Number(targetMap[key] || 0);
      const deviation = Number((r.mean - target).toFixed(1));
      if (deviation < -10) {
        insights.push(`${r.subject} (G${r.grade} ${r.stream}) – ${r.mean.toFixed(1)}% vs ${target}% target: ${Math.abs(deviation).toFixed(1)}% below – Needs urgent attention`);
      } else if (deviation > 10) {
        insights.push(`${r.subject} (G${r.grade} ${r.stream}) – ${r.mean.toFixed(1)}% vs ${target}% target: +${deviation.toFixed(1)}% – Outstanding!`);
      }
    });
    container.innerHTML = insights.length
      ? insights.map(i => `<p class="insight">${i}</p>`).join('')
      : '<p class="insight">All subjects on track with targets!</p>';
  };

  const renderCumulativeAverages = () => {
    const tbody = document.querySelector('#cumulativeTable tbody');
    if (!tbody) return;
    const records = loadRecords();
    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#666;">No data for cumulative averages.</td></tr>';
      return;
    }

    const groups = {};
    records.forEach(r => {
      const key = `${r.subject}|${r.grade}|${r.stream}|${r.term}`;
      if (!groups[key]) {
        groups[key] = {
          subject: r.subject,
          grade: r.grade,
          stream: r.stream,
          term: r.term,
          opener: null,
          mid: null,
          end: null
        };
      }
      const examTypeLower = (r.examType || '').toLowerCase();
      if (examTypeLower.includes('opener')) groups[key].opener = Number(r.mean);
      if (examTypeLower.includes('mid')) groups[key].mid = Number(r.mean);
      if (examTypeLower.includes('end')) groups[key].end = Number(r.mean);
    });

    const averages = [];
    for (const [key, g] of Object.entries(groups)) {
      const scores = [g.opener, g.mid, g.end].filter(s => s !== null && !isNaN(s));
      const avgNum = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const avg = avgNum.toFixed(1);
      averages.push({ ...g, avg, avgNum });
    }

    averages.sort((a, b) =>
      a.subject.localeCompare(b.subject) ||
      a.grade.localeCompare(b.grade) ||
      a.stream.localeCompare(b.stream) ||
      a.term.localeCompare(b.term)
    );

    tbody.innerHTML = averages.map(g => {
      const rub = getRubric(g.avgNum);
      return `
        <tr>
          <td>${g.subject}</td>
          <td>${g.grade}</td>
          <td>${g.stream}</td>
          <td>${g.term}</td>
          <td style="text-align:center;font-weight:600;color:${(g.opener !== null && g.opener >= 50) ? '#16a34a' : '#dc2626'}">
            ${g.opener !== null ? g.opener.toFixed(1) + '%' : '–'}
          </td>
          <td style="text-align:center;font-weight:600;color:${(g.mid !== null && g.mid >= 50) ? '#16a34a' : '#dc2626'}">
            ${g.mid !== null ? g.mid.toFixed(1) + '%' : '–'}
          </td>
          <td style="text-align:center;font-weight:600;color:${(g.end !== null && g.end >= 50) ? '#16a34a' : '#dc2626'}">
            ${g.end !== null ? g.end.toFixed(1) + '%' : '–'}
          </td>
          <td style="font-weight:bold;color:${g.avgNum >= 90 ? '#0B6623' : g.avgNum >= 75 ? '#2E8B57' : g.avgNum >= 58 ? '#1E3A8A' : g.avgNum >= 41 ? '#3B82F6' : g.avgNum >= 31 ? '#F97316' : g.avgNum >= 21 ? '#FDBA74' : g.avgNum >= 11 ? '#DC2626' : '#7F1D1D'}">
            ${g.avg}% <small>(${rub.code})</small>
          </td>
        </tr>
      `;
    }).join('');
  };

  const renderTrendAnalysis = () => {
    const tbody = document.querySelector('#trendTable tbody');
    if (!tbody) return;
    const records = loadRecords();
    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#666;">No data for trend analysis.</td></tr>';
      return;
    }

    const groups = {};
    records.forEach(r => {
      const key = `${r.subject}|${r.grade}|${r.stream}|${r.term}`;
      if (!groups[key]) {
        groups[key] = {
          subject: r.subject,
          grade: r.grade,
          stream: r.stream,
          term: r.term,
          exams: {}
        };
      }
      const examLower = (r.examType || '').toLowerCase();
      if (examLower.includes('opener')) groups[key].exams['Opener Exam'] = Number(r.mean);
      if (examLower.includes('mid')) groups[key].exams['Mid Term Exam'] = Number(r.mean);
      if (examLower.includes('end')) groups[key].exams['End Term Exam'] = Number(r.mean);
    });

    const trends = [];
    for (const [key, group] of Object.entries(groups)) {
      const { exams } = group;
      const opener = exams['Opener Exam'] ?? null;
      const mid = exams['Mid Term Exam'] ?? null;
      const end = exams['End Term Exam'] ?? null;

      // Need at least 2 exams
      if ([opener, mid, end].filter(v => v !== null).length < 2) continue;

      let trendNum = 0;
      let status = '';
      let color = '';
      let rub = { code: '' };

      if (opener !== null && end !== null) {
        trendNum = Number((end - opener).toFixed(1));
        status = trendNum > 0 ? 'Improved' : trendNum < 0 ? 'Declined' : 'Stable';
        color = trendNum > 0 ? '#16a34a' : trendNum < 0 ? '#ef4444' : '#f59e0b';
        rub = getRubric(end);
      } else if (opener !== null && mid !== null) {
        trendNum = Number((mid - opener).toFixed(1));
        status = trendNum > 0 ? 'Improving' : 'Declining';
        color = trendNum > 0 ? '#16a34a' : '#ef4444';
        rub = getRubric(mid);
      } else if (mid !== null && end !== null) {
        trendNum = Number((end - mid).toFixed(1));
        status = trendNum > 0 ? 'Improving' : 'Declining';
        color = trendNum > 0 ? '#16a34a' : '#ef4444';
        rub = getRubric(end);
      }

      trends.push({
        ...group,
        opener: opener !== null ? opener.toFixed(1) : '–',
        mid: mid !== null ? mid.toFixed(1) : '–',
        end: end !== null ? end.toFixed(1) : '–',
        trend: trendNum !== 0 ? `${trendNum > 0 ? '+' : ''}${trendNum}%` : '–',
        status,
        color,
        rub: rub.code
      });
    }

    trends.sort((a, b) =>
      a.subject.localeCompare(b.subject) ||
      a.grade.localeCompare(b.grade) ||
      a.stream.localeCompare(b.stream) ||
      a.term.localeCompare(b.term)
    );

    tbody.innerHTML = trends.length
      ? trends.map(t => `
        <tr>
          <td>${t.subject}</td>
          <td>${t.grade}</td>
          <td>${t.stream}</td>
          <td>${t.term}</td>
          <td style="text-align:center;font-weight:600;">${t.opener}%</td>
          <td style="text-align:center;font-weight:600;">${t.mid}%</td>
          <td style="text-align:center;font-weight:600;">${t.end}%</td>
          <td style="font-weight:bold;color:${t.color}">${t.trend}</td>
          <td><span class="rubric-badge" style="background:${t.color};color:#fff;padding:4px 8px;border-radius:6px;">${t.status} (${t.rub})</span></td>
        </tr>
      `).join('')
      : '<tr><td colspan="9" style="text-align:center;padding:20px;color:#666;">Not enough data (need 2+ exams).</td></tr>';
  };

  const renderProgressChart = () => {
    const canvas = el('progressChart');
    if (!canvas || !window.Chart) return;
    const records = loadRecords();
    if (!records.length) { canvas.style.display = 'none'; return; }
    const termData = {};
    records.forEach(r => {
      const key = `${r.term} ${r.year}`;
      if (!termData[key]) termData[key] = { sum: 0, count: 0 };
      termData[key].sum += Number(r.mean);
      termData[key].count++;
    });
    const labels = Object.keys(termData).sort();
    const data = labels.map(k => Number((termData[k].sum / termData[k].count).toFixed(1)));
    if (window.progressChartInstance) window.progressChartInstance.destroy();
    window.progressChartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Average Mean Score', data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#2563eb', pointRadius: 6 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Mean Score (%)' } }, x: { title: { display: true, text: 'Term & Year' } } } }
    });
  };

  const updateDashboardStats = () => {
    const records = loadRecords();
    if (!records.length) return;
    const totalAvg = records.reduce((sum, r) => sum + Number(r.mean), 0) / records.length;
    const totalRub = getRubric(totalAvg);
    const avgCard = el('totalAvgCard');
    if (avgCard) {
      avgCard.innerHTML = `<h2 style="margin:0;font-size:3rem;color:#fff;font-weight:bold;">${totalAvg.toFixed(1)}%</h2><p style="margin:8px 0;font-size:1.3rem;color:#fff;">${totalRub.code} ${totalRub.text}</p><small style="color:#e0f2fe;">Overall Performance</small>`;
    }
    const subjectStats = {};
    records.forEach(r => {
      const key = `${r.subject}|${r.grade}|${r.stream}`;
      if (!subjectStats[key]) subjectStats[key] = { sum: 0, count: 0, subject: r.subject, grade: r.grade, stream: r.stream };
      subjectStats[key].sum += Number(r.mean);
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
      bestCard.innerHTML = `<h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${best.avg.toFixed(1)}%</h2><p style="margin:8px 0;font-size:1.2rem;color:#fff;">${best.subject}</p><small style="color:#d1fae5;">G${best.grade} • ${best.stream}</small>`;
    }
    const worstCard = el('worstSubjectCard');
    if (worstCard && worst.avg <= 100) {
      worstCard.innerHTML = `<h2 style="margin:0;font-size:2.5rem;color:#fff;font-weight:bold;">${worst.avg.toFixed(1)}%</h2><p style="margin:8px 0;font-size:1.2rem;color:#fff;">${worst.subject}</p><small style="color:#fecaca;">G${worst.grade} • ${worst.stream}</small>`;
    }
  };

  // === PDF, EXCEL, BACKUP, CLEAR ===
  window.downloadPDF = () => {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return showAlert('jsPDF not loaded.');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const teacherName = localStorage.getItem('teacherFullName') || 'Teacher';
    let y = 15;

    // HEADER
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
    doc.text(`SmartScores Report – ${teacherName}`, 14, y);
    y += 6;
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
    y += 8;

    const records = loadRecords();
    if (!records.length) {
      doc.setFontSize(10); doc.text('No data.', 14, y);
      doc.save(`SmartScores_${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      return;
    }

    // RECORDS TABLE
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.setFillColor(37, 99, 235);
    let x = 10;
    const colWidths = [20, 30, 30, 30, 25, 18, 18]; // Date, Teacher, Class, Subject, Student, Score, Rubric
    const headers = ['Year', 'Teacher', 'Class', 'Subject', 'Student', 'Score', 'Rubric'];
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 6, 'F');
      doc.text(h, x + 1, y + 4);
      x += colWidths[i];
    });
    y += 6;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(0, 0, 0);

    records.forEach(r => {
      if (y > pageHeight - 25) { doc.addPage(); y = 20; }
      const rub = getRubric(r.mean);
      x = 10;
      const cells = [
        `${r.year || ''}`,
        `${r.teacher || ''}`.substring(0, 28),
        `G${r.grade || ''} • ${r.stream || ''}`.substring(0, 28),
        `${r.subject || ''}`.substring(0, 28),
        '-', // student placeholder
        `${Number(r.mean).toFixed(1)}%`,
        rub.code
      ];
      cells.forEach((cell, i) => {
        if (i === 6) {
          // draw colored pill for rubric
          const bg = rub.color;
          doc.setFillColor(...hexToRgb(bg));
          doc.rect(x, y, colWidths[i], 6, 'F');
          // text color: white except for AE2 (use black)
          const textColor = (rub.code === 'AE2') ? [0,0,0] : [255,255,255];
          doc.setTextColor(...textColor);
        } else {
          doc.setTextColor(0,0,0);
        }
        doc.text(String(cell), x + 1, y + 4);
        x += colWidths[i];
      });
      y += 7;
    });

    // PDF Legend (always include)
    if (y > pageHeight - 60) { doc.addPage(); y = 20; } else y += 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
    doc.text('Rubric Key', 14, y); y += 6;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    // print legend as single or multiple lines
    let legendLine = '';
    rubricMap.forEach((r, idx) => {
      legendLine += `${r.code} ${r.min}-${r.max}`;
      if (idx < rubricMap.length - 1) legendLine += ', ';
    });
    // wrap text if necessary
    const maxWidth = pageWidth - 28;
    const split = doc.splitTextToSize(legendLine, maxWidth);
    doc.setTextColor(0,0,0);
    split.forEach(line => { doc.text(line, 14, y); y += 6; });

    // FOOTER
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text('SmartScores © 2025 | Generated by PWA', 10, pageHeight - 8);

    const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`SmartScores_${safeName}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  window.exportToExcel = () => {
    if (typeof XLSX === 'undefined') return showAlert('XLSX not loaded.');
    const records = loadRecords();
    if (!records.length) return showAlert('No data.');
    const data = records.map(r => ({ Year: r.year, Teacher: r.teacher, Class: `G${r.grade} • ${r.stream}`, Subject: r.subject, Score: r.mean, Rubric: getRubric(r.mean).code }));
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
    a.href = url; a.download = `backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showAlert('Backup saved!');
  };

  window.clearAllData = () => {
    if (confirm('Delete ALL data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TARGETS_KEY);
      showAlert('All data cleared.');
      renderAll();
    }
  };

  // Sorting kept but only used by pages with #recordsTable and ths
  let currentRecordSort = { col: 1, dir: 'asc' };
  window.sortRecords = (colIndex) => {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.rows);
    if (rows.length === 0) return;
    if (currentRecordSort.col === colIndex) {
      currentRecordSort.dir = currentRecordSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      currentRecordSort.col = colIndex;
      currentRecordSort.dir = 'asc';
    }
    const examOrder = { 'Opener Exam': 1, 'Mid Term Exam': 2, 'End Term Exam': 3 };
    rows.sort((a, b) => {
      let A = a.cells[colIndex].textContent.trim();
      let B = b.cells[colIndex].textContent.trim();
      if (colIndex === 5) {
        const orderA = examOrder[A] || 99; const orderB = examOrder[B] || 99;
        return currentRecordSort.dir === 'asc' ? orderA - orderB : orderB - orderA;
      }
      if (colIndex === 7 || colIndex === 8) {
        A = parseFloat(A.replace(/[+%]/g, '')) || 0;
        B = parseFloat(B.replace(/[+%]/g, '')) || 0;
      }
      let result = (typeof A === 'number' && typeof B === 'number') ? A - B : String(A).localeCompare(String(B));
      return currentRecordSort.dir === 'asc' ? result : -result;
    });
    rows.forEach(row => tbody.appendChild(row));
    const ths = document.querySelectorAll('#recordsTable th');
    ths.forEach((th, i) => {
      th.style.fontWeight = i === colIndex ? 'bold' : 'normal';
      th.textContent = th.textContent.replace(/ ↑| ↓/g, '');
      if (i === colIndex) th.textContent += currentRecordSort.dir === 'asc' ? ' ↓' : ' ↑';
    });
  };

  // === RENDER ALL ===
  const renderDashboard = () => { renderRecords(); renderTargets(); updateDashboardStats(); renderProgressChart(); };
  const renderInsights = () => {
    renderAIInsights();
    renderRecords();
    renderCumulativeAverages();
    renderTrendAnalysis();

    setTimeout(() => {
      renderCumulativeAverages();
      renderTrendAnalysis();
    }, 100);
  };
  const renderAll = () => {
    if (location.pathname.includes('averages-insights')) renderInsights();
    else renderDashboard();
  };

  // === DARK MODE TOGGLE ===
function toggleDarkMode() {
  const current = localStorage.getItem("theme") || "light";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
}

// Apply theme on load
function loadTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
}


  // === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadTeacherName();
  autoFillYear();
  renderAll();

  const dataForm = el('dataEntryForm');
  if (dataForm) dataForm.addEventListener('submit', e => { 
    e.preventDefault(); 
    handleSaveRecord(); 
  });

  const targetForm = el('setTargetsForm');
  if (targetForm) targetForm.addEventListener('submit', e => { 
    e.preventDefault(); 
    handleSaveTarget(); 
  });

  const searchInput = el('searchInput');
  if (searchInput) searchInput.addEventListener('input', filterRecords);

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{/*sw register failed*/});
  }

  // Rubric toggle
  const rubricBtn = document.getElementById('rubricBtn');
  const rubricPanel = document.getElementById('rubricPanel');
  if (rubricBtn && rubricPanel) {
    rubricBtn.addEventListener('click', () => {
      rubricPanel.style.display = rubricPanel.style.display === 'block' ? 'none' : 'block';
    });
  }

  // Service Worker auto-update listener
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        if (confirm('SmartScores update available! Refresh now?')) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    });
  }

  // === LOGOUT BUTTON HANDLER ===
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('teacherFullName');
      localStorage.removeItem('lastTeacherName'); // optional if you use auto-fill name
      window.location.href = 'login.html';
    });
  }
});
