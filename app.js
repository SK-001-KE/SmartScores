(function () {
  // Storage key
  const STORAGE_KEY = 'smartScores';

  // Elements for averages and insights page
  const averagesTbody = document.querySelector("#averagesTable tbody");
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

  // render averages table
  function renderAverages() {
    const records = loadRecords();
    const groups = {}; // key -> {subject, grade, stream, term, year, scores}
    
    records.forEach(r => {
      const key = `${r.subject}||${r.grade}||${r.stream}||${r.term}||${r.year}`;
      if (!groups[key]) groups[key] = { subject: r.subject, grade: r.grade, stream: r.stream, term: r.term, year: r.year, scores: [] };
      groups[key].scores.push(safeNum(r.mean));
    });

    // render averages table
    averagesTbody.innerHTML = '';
    const groupArr = Object.values(groups).sort((a,b) => {
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
      if (a.term !== b.term) return a.term.localeCompare(b.term);
      return a.year - b.year;
    });

    groupArr.forEach(g => {
      const avgVal = average(g.scores);
      const rRub = rubric(avgVal);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(g.subject)}</td>
        <td>${escapeHtml(g.grade)}</td>
        <td>${escapeHtml(g.stream)}</td>
        <td>${escapeHtml(g.term)}</td>
        <td>${escapeHtml(g.year)}</td>
        <td>${avgVal.toFixed(1)}%</td>
      `;
      averagesTbody.appendChild(tr);
    });
  }

  // render AI insight based on averages
  function renderInsight() {
    const records = loadRecords();
    const averageScores = records.map(r => safeNum(r.mean));
    const overallAvg = average(averageScores);
    const overallRub = rubric(overallAvg);

    let insightHtml = `<strong>💡 Smart Insight:</strong> Overall average is <b style="color:${overallRub.color}">${overallAvg.toFixed(1)}%</b> — <b>${overallRub.text}</b>.`;

    // AI-generated insights based on the rubric
    insightHtml += `<br>📈 The overall performance is categorized as ${overallRub.emoji} ${overallRub.text}.`;

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
    renderAverages();
    renderInsight();
  }

  init();
})();
