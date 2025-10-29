(() => {
  const STORAGE_KEY = 'smartScoresRecords';

  // DOM Elements
  const el = {
    teacher: () => document.getElementById('teacherName'),
    subject: () => document.getElementById('subject'),
    grade: () => document.getElementById('grade'),
    stream: () => document.getElementById('stream'),
    term: () => document.getElementById('term'),
    examType: () => document.getElementById('examType'),
    year: () => document.getElementById('year'),
    mean: () => document.getElementById('mean'),
    recordsTbody: () => document.querySelector('#recordsTable tbody'),
    averageTbody: () => document.querySelector('#averageScoresTable tbody'),
    insights: () => document.getElementById('insights'),
    chartContainer: () => document.getElementById('chartContainer'),
    chartToggle: () => document.getElementById('chartToggle'),
    avgChart: () => document.getElementById('avgChart'),
  };

  // Load records from localStorage
  const loadRecords = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  // Save records to localStorage
  const saveRecords = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  };

  // Save record logic (called from form submission)
  window.saveRecord = () => {
    const record = {
      teacher: el.teacher()?.value.trim(),
      subject: el.subject()?.value,
      grade: el.grade()?.value,
      stream: el.stream()?.value,
      term: el.term()?.value,
      examType: el.examType()?.value,
      year: el.year()?.value,
      mean: Number(el.mean()?.value),
    };

    // Validation for empty fields and correct data
    if (!record.teacher || !record.subject || !record.grade || !record.stream || !record.term || !record.examType || !record.year || Number.isNaN(record.mean)) {
      alert('Please fill all fields correctly.');
      return;
    }

    if (record.mean < 0 || record.mean > 100) {
      alert('Mean score must be between 0 and 100.');
      return;
    }

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
    if (exists) {
      alert('This record already exists!');
      return;
    }

    records.push(record);
    saveRecords(records);
    el.mean().value = '';  // Clear the mean score input after save
    alert('Record saved successfully!');
    renderAll();  // Re-render all records and update stats
  };

  // Render records to the dashboard
  const renderRecords = () => {
    const tbody = el.recordsTbody();
    if (!tbody) return;

    const records = loadRecords();
    tbody.innerHTML = '';
    records.forEach((r, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.teacher}</td>
        <td>${r.subject}</td>
        <td>${r.grade}</td>
        <td>${r.stream}</td>
        <td>${r.term}</td>
        <td>${r.examType}</td>
        <td>${r.year}</td>
        <td>${r.mean.toFixed(1)}%</td>
      `;
      tbody.appendChild(row);
    });
  };

  // Render average scores table
  const renderAverageScores = () => {
    const tbody = el.averageTbody();
    if (!tbody) return;

    const records = loadRecords();
    const groups = {};

    // Group records by subject, grade, stream, term, and year
    records.forEach(r => {
      const key = `${r.subject}||${r.grade}||${r.stream}||${r.term}||${r.year}`;
      if (!groups[key]) groups[key] = { ...r, scores: [] };
      groups[key].scores.push(r.mean);
    });

    tbody.innerHTML = ''; // Clear previous content

    // Render grouped averages
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

  // Update dashboard stats (e.g., total teachers, top subject, last entry)
  const updateDashboardStats = () => {
    const records = loadRecords();
    if (!records.length) return;

    const totalTeachers = new Set(records.map(r => r.teacher)).size;
    const topSubject = records.reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + 1;
      return acc;
    }, {});
    const maxSubject = Object.keys(topSubject).reduce((a, b) => topSubject[a] > topSubject[b] ? a : b);

    // Update dashboard elements
    document.getElementById('totalTeachers').textContent = totalTeachers;
    document.getElementById('topSubject').textContent = maxSubject;
    document.getElementById('lastEntry').textContent = records[records.length - 1].year;  // Last entry year
  };

  // Render all (records, averages, and update dashboard)
  const renderAll = () => {
    renderRecords();
    renderAverageScores();
    updateDashboardStats();
  };

  // Toggle chart visibility (Chart.js logic)
  window.toggleChart = () => {
    const chartContainer = el.chartContainer();
    const chartToggle = el.chartToggle();
    if (chartContainer.style.display === 'none') {
      chartContainer.style.display = 'block';
      chartToggle.textContent = 'Hide Chart';
      renderChart();
    } else {
      chartContainer.style.display = 'none';
      chartToggle.textContent = 'Show Chart';
    }
  };

  // Render chart using Chart.js
  const renderChart = () => {
    const records = loadRecords();
    const subjectScores = {};

    // Collect data for chart (average per subject)
    records.forEach(r => {
      if (!subjectScores[r.subject]) subjectScores[r.subject] = { total: 0, count: 0 };
      subjectScores[r.subject].total += r.mean;
      subjectScores[r.subject].count++;
    });

    const labels = Object.keys(subjectScores);
    const data = labels.map(label => subjectScores[label].total / subjectScores[label].count);

    // Setup Chart.js
    new Chart(el.avgChart(), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Average Score',
          data,
          backgroundColor: '#2563eb',
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
      },
    });
  };

  // Download PDF logic
  window.downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const table = document.getElementById('averageScoresTable');
    html2canvas(table).then(canvas => {
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 190;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, 'PNG', 10, 10, width, height);
      pdf.save('SmartScores_Averages_Insights.pdf');
    });
  };

  // Export to Excel
  window.exportToExcel = () => {
    const records = loadRecords();
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');
    XLSX.writeFile(wb, 'SmartScores_Records.xlsx');
  };

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', renderAll);
})();
