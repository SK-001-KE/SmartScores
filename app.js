(function () {
  // Check if service workers are supported in the browser
  if ('serviceWorker' in navigator) {
    // Register the service worker when the window is fully loaded
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')  // Specify the path to your service-worker.js
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // Storage key
  const STORAGE_KEY = 'smartScores';

  // Elements for rendering
  const recordsTbody = document.querySelector("#recordsTable tbody");
  const insightBox = document.getElementById('insightBox');

  // load records
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // helpers
  function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
  function average(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

  // rubric with exact spellings
  function rubric(score) {
    if (score >= 75) return { text: 'Exceeding Expectations', code: 'EE', color: '#16a34a', emoji: '🏆' };
    if (score >= 41) return { text: 'Meeting Expectations', code: 'ME', color: '#2563eb', emoji: '✅' };
    if (score >= 21) return { text: 'Approaching Expectations', code: 'AE', color: '#f59e0b', emoji: '⚠️' };
    return { text: 'Below Expectations', code: 'BE', color: '#ef4444', emoji: '❗' };
  }

  // render records table
  function renderRecords() {
    const records = loadRecords();
    // sort: Grade (numeric) -> Stream -> Subject -> Term -> Teacher
    records.sort((a,b)=>{
      const ga = parseInt(a.grade,10)||0, gb = parseInt(b.grade,10)||0;
      if (ga !== gb) return ga - gb;
      if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.term !== b.term) return a.term.localeCompare(b.term);
      return (a.teacher || '').localeCompare(b.teacher || '');
    });

    // render
    recordsTbody.innerHTML = '';
    records.forEach((r, i) => {
      const rRub = rubric(safeNum(r.mean));
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(r.teacher)}</td>
        <td>${escapeHtml(r.subject)}</td>
        <td>${escapeHtml(r.grade)}</td>
        <td>${escapeHtml(r.stream)}</td>
        <td>${escapeHtml(r.term)}</td>
        <td>${escapeHtml(r.examType)}</td>
        <td>${escapeHtml(r.year)}</td>
        <td style="font-weight:700">${safeNum(r.mean).toFixed(1)}%</td>
      `;
      recordsTbody.appendChild(row);
    });
  }

  // render summary and insights
  function renderSummaryAndInsight() {
    const records = loadRecords();
    const groups = {}; // key -> {grade, stream, subject, term, arr}
    records.forEach(r => {
      const key = `${r.grade}||${r.stream}||${r.subject}||${r.term}`;
      if (!groups[key]) groups[key] = { grade: r.grade, stream: r.stream, subject: r.subject, term: r.term, scores: [] };
      groups[key].scores.push(safeNum(r.mean));
    });

    // render summary table
    const summaryTbody = document.querySelector("#summaryTable tbody");
    summaryTbody.innerHTML = '';
    const groupArr = Object.values(groups).sort((a,b) => {
      const ga = parseInt(a.grade, 10) || 0, gb = parseInt(b.grade, 10) || 0;
      if (ga !== gb) return ga - gb;
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
      return a.term.localeCompare(b.term);
    });

    groupArr.forEach(g => {
      const avgVal = average(g.scores);
      const rRub = rubric(avgVal);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(g.grade)}</td>
        <td>${escapeHtml(g.subject)}</td>
        <td>${escapeHtml(g.stream)}</td>
        <td>${g.scores.length ? avgVal.toFixed(1) + '%' : ''}</td>
        <td><span style="background:${rRub.color}; color:#fff; padding:4px 8px; border-radius:6px; font-weight:700">${rRub.text}</span></td>
      `;
      summaryTbody.appendChild(tr);
    });

    // compute overall average across groups (weighted by counts)
    let totalSum = 0, totalCount = 0;
    Object.values(groups).forEach(g => {
      totalSum += g.scores.reduce((a,b)=>a+b,0);
      totalCount += g.scores.length;
    });
    const overall = totalCount ? (totalSum/totalCount) : 0;
    const overallRub = rubric(overall);

    let insightHtml = `<strong>💡 Smart Insight:</strong> Overall average is <b style="color:${overallRub.color}">${overall.toFixed(1)}%</b> — <b>${overallRub.text}</b>.`;

    // top subject-stream combos and lowest
    const subjectAverages = {};
    records.forEach(r => {
      const key = `${r.subject}||${r.stream}`;
      if (!subjectAverages[key]) subjectAverages[key] = { sum: 0, count: 0, subject: r.subject, stream: r.stream };
      subjectAverages[key].sum += safeNum(r.mean);
      subjectAverages[key].count++;
    });
    const subjArr = Object.values(subjectAverages).map(s => ({ subject: s.subject, stream: s.stream, avg: s.sum / s.count }));
    subjArr.sort((a, b) => b.avg - a.avg);
    const top = subjArr[0];
    const bottom = subjArr[subjArr.length - 1];

    if (top) insightHtml += `<br>🏆 Top: <b>${escapeHtml(top.subject)}</b> (${escapeHtml(top.stream)}) — ${top.avg.toFixed(1)}%.`;
    if (bottom) insightHtml += `<br>🔻 Needs attention: <b>${escapeHtml(bottom.subject)}</b> (${escapeHtml(bottom.stream)}) — ${bottom.avg.toFixed(1)}%.`;

    insightBox.innerHTML = insightHtml;
  }

  // helper: escape html
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial render at startup
  function init() {
    renderRecords();
    renderSummaryAndInsight();
  }

  init();
})();
