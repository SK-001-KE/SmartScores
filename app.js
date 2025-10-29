// app.js — SmartScores v2.1 (AI + Auto Teacher + PDF Header)
(() => {
  const STORAGE_KEY = 'smartScores';
  const TEACHER_KEY = 'lastTeacherName';
  
  const el = {
    teacher: () => document.getElementById('teacherName'),
    subject: () => document.getElementById('subject'),
    grade: () => document.getElementById('grade'),
    stream: () => document.getElementById('stream'),
    term: () => document.getElementById('term'),
    examType: () => document.getElementById('examType'),
    year: () => document.getElementById('year'),
    mean: () => document.getElementById('meanScore'),
    recordsTbody: () => document.querySelector('#recordsTable tbody'),
    averageTbody: () => document.querySelector('#averageScoresTable tbody'),
    importFile: () => document.getElementById('importFile'),
    totalRecords: () => document.getElementById('totalRecords'),
    avgScore: () => document.getElementById('avgScore'),
    topSubject: () => document.getElementById('topSubject'),
    insights: () => document.getElementById('insights') // NEW
  };

  const showAlert = (msg) => alert(msg);

  // Load last teacher name
  const loadLastTeacher = () => {
    const name = localStorage.getItem(TEACHER_KEY);
    if (name && el.teacher()) el.teacher().value = name;
  };

  const loadRecords = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  };

  const saveRecords = (records) => localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

  const rubric = (score) => {
    if (score >= 75) return { text: 'Exceeding', code: 'EE', color: '#16a34a', emoji: 'Trophy' };
    if (score >= 41) return { text: 'Meeting', code: 'ME', color: '#2563eb', emoji: 'Check' };
    if (score >= 21) return { text: 'Approaching', code: 'AE', color: '#f59e0b', emoji: 'Warning' };
    return { text: 'Below', code: 'BE', color: '#ef4444', emoji: 'Exclamation' };
  };

  // NEW: AI Insights Engine
  const generateAIInsights = () => {
    const records = loadRecords();
    if (records.length === 0) return [];

    const subjectStats = {};
    records.forEach(r => {
      const key = `${r.subject}|${r.grade}`;
      if (!subjectStats[key]) subjectStats[key] = { sum: 0, count: 0, teacher:: [] };
      subjectStats[key].sum += r.mean;
      subjectStats[key].count++;
      subjectStats[key].records.push(r);
    });

    const insights = [];
    for (const [key, data] of Object.entries(subjectStats)) {
      const avg = data.sum / data.count;
      const [subject, grade] = key.split('|');
      if (avg < 40) {
        insights.push(`You need to check on **${subject}** in **Grade ${grade}** – average is only **${avg.toFixed(1)}%**.`);
      } else if (avg < 60) {
        insights.push(`**${subject}** in **Grade ${grade}** is approaching expectations (**${avg.toFixed(1)}%**). Consider revision sessions.`);
      } else if (avg > 80) {
        insights.push(`Great job! **${subject}** in **Grade ${grade}** is exceeding expectations (**${avg.toFixed(1)}%**).`);
      }
    }

    // Top performer
    const best = Object.entries(subjectStats)
      .reduce((a, b) => (b[1].sum / b[1].count) > (a[1].sum / a[1].count) ? b : a, [null, { sum: 0, count: 1 }]);
    if (best[0]) {
      const [subject, grade] = best[0].split('|');
      insights.unshift(`**Top performer:** **${subject}** in **Grade ${grade}** with **${(best[1].sum / best[1].count).toFixed(1)}%**.`);
    }

    return insights.slice(0, 5); // Top 5 insights
  };

  window.saveRecord = () => {
    const record = {
      teacher: el.teacher()?.value.trim(),
      subject: el.subject()?.value,
      grade: el.grade()?.value,
      stream: el.stream()?.value,
      term: el.term()?.value,
      examType: el.examType()?.value,
      year: el.year()?.value,
      mean: Number(el.mean()?.value)
    };

    if (!record.teacher || !record.subject || !record.grade || !record.stream || 
        !record.term || !record.examType || !record.year || Number.isNaN(record.mean)) {
      showAlert('Please fill all fields.');
      return;
    }

    if (record.mean < 0 || record.mean > 100) {
      showAlert('Mean score must be 0–100.');
      return;
    }
    if (record.year < 2000 || record.year > 2100) {
      showAlert('Year must be 2000–2100.');
      return;
    }

    const records = loadRecords();
    const exists = records.some(r =>
      r.teacher === record.teacher && r.subject === record.subject &&
      r.grade === record.grade && r.stream === record.stream &&
      r.term === record.term && r.examType === record.examType && r.year === record.year
    );
    if (exists) {
      showAlert('This record already exists!');
      return;
    }

    records.push(record);
    saveRecords(records);
    localStorage.setItem(TEACHER_KEY, record.teacher); // Save teacher name
    el.mean().value = '';
    showAlert('Record saved!');
    renderAll();
  };

  const renderRecords = () => {
    const tbody = el.recordsTbody();
    if (!tbody) return;
    const records = loadRecords();
    tbody.innerHTML = '';
    records.forEach(r => {
      const rub = rubric(r.mean);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.teacher}</td>
        <td>${r.subject}</td>
        <td>${r.grade}</td>
        <td>${r.stream}</td>
        <td>${r.term}</td>
        <td>${r.examType}</td>
        <td>${r.year}</td>
        <td>${r.mean.toFixed(1)}%</td>
        <td><span style="background:${rub.color};color:#fff;padding:4px 8px;border-radius:6px;">
          ${rub.emoji} ${rub.text}
        </span></td>
      `;
      tbody.appendChild(row);
    });
  };

  const renderAverageScores = () => {
    const tbody = el.averageTbody();
    if (!tbody) return;
    const records = loadRecords();
    const groups = {};
    records.forEach(r => {
      const key = `${r.subject}||${r.grade}||${r.stream}||${r.term}||${r.year}`;
      if (!groups[key]) groups[key] = { ...r, scores: [] };
      groups[key].scores.push(r.mean);
    });
    tbody.innerHTML = '';
    Object.values(groups).forEach(g => {
      const avg = g.scores.reduce((a, s) => a + s, 0) / g.scores.length;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${g.subject}</td>
        <td>${g.grade}</td>
        <td>${g.stream}</td>
        <td>${g.term}</td>
        <td>${g.year}</td>
        <td>${avg.toFixed(1)}%</td>
      `;
      tbody.appendChild(row);
    });
  };

  const updateDashboardStats = () => {
    const records = loadRecords();
    if (el.totalRecords()) el.totalRecords().textContent = records.length;
    const overallAvg = records.length > 0
      ? (records.reduce((a, r) => a + r.mean, 0) / records.length).toFixed(1)
      : 0;
    if (el.avgScore()) el.avgScore().textContent = overallAvg + '%';

    const subjectAvgs = {};
    records.forEach(r => {
      if (!subjectAvgs[r.subject]) subjectAvgs[r.subject] = { sum: 0, count: 0 };
      subjectAvgs[r.subject].sum += r.mean;
      subjectAvgs[r.subject].count++;
    });
    let top = { name: '-', avg: 0 };
    for (const [sub, data] of Object.entries(subjectAvgs)) {
      const avg = data.sum / data.count;
      if (avg > top.avg) top = { name: sub, avg };
    }
    if (el.topSubject()) el.topSubject().textContent = top.name;
  };

  const renderAIInsights = () => {
    const container = el.insights();
    if (!container) return;
    const insights = generateAIInsights();
    container.innerHTML = insights.length > 0
      ? insights.map(i => `<p style="margin:8px 0; padding:10px; background:#fffbe6; border-left:4px solid #f59e0b; border-radius:4px;">${i}</p>`).join('')
      : '<p>No insights yet. Add more data!</p>';
  };

  const renderAll = () => {
    renderRecords();
    renderAverageScores();
    updateDashboardStats();
    renderAIInsights();
  };

  // NEW: PDF with Teacher Name
  window.downloadPDF = () => {
    if (!window.jspdf || !window.html2canvas) {
      showAlert('PDF library not loaded.');
      return;
    }
    const table = document.getElementById('averageScoresTable');
    if (!table || table.querySelector('tbody').children.length === 0) {
      showAlert('No data to export.');
      return;
    }

    const teacherName = loadRecords()[0]?.teacher || 'All Teachers';

    html2canvas(table, { scale: 2 }).then(canvas => {
      const img = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 180;
      const height = (canvas.height * width) / canvas.width;

      // Header
      pdf.setFontSize(16);
      pdf.text(`SmartScores Report - ${teacherName}`, 20, 20);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 28);

      pdf.addImage(img, 'PNG', 15, 35, width, height);
      pdf.save(`SmartScores_Report_${teacherName.replace(/ /g, '_')}.pdf`);
    });
  };

  window.importData = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.json')) {
      showAlert('Please select a .json backup file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data) && data.length > 0 && data[0].mean !== undefined) {
          saveRecords(data);
          showAlert('Data imported!');
          renderAll();
        } else throw '';
      } catch {
        showAlert('Invalid file.');
      }
    };
    reader.readAsText(file);
  };

  window.clearAllData = () => {
    if (confirm('Delete ALL data?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TEACHER_KEY);
      renderAll();
      showAlert('Cleared!');
    }
  };

  window.exportBackup = () => {
    const data = JSON.stringify(loadRecords(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartscores-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadLastTeacher();
    renderAll();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  });
})();
