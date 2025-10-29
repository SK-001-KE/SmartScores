(() => {
  const STORAGE_KEY = 'smartScores';
  
  // DOM Elements (lazy-loaded)
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
    totalRecords: () => document.getElementById('totalRecords'),
    avgScore: () => document.getElementById('avgScore'),
    topSubject: () => document.getElementById('topSubject'),
    worstSubject: () => document.getElementById('worstSubject'),
    lastEntry: () => document.getElementById('lastEntry')
  };

  const showAlert = (msg) => alert(msg);

  const loadRecords = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveRecords = (records) => localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

  // Rubric for mean scores
  const rubric = (score) => {
    if (score >= 75) return { text: 'Exceeding', code: 'EE', color: '#16a34a', emoji: '🏆' };
    if (score >= 41) return { text: 'Meeting', code: 'ME', color: '#2563eb', emoji: '✅' };
    if (score >= 21) return { text: 'Approaching', code: 'AE', color: '#f59e0b', emoji: '⚠️' };
    return { text: 'Below', code: 'BE', color: '#ef4444', emoji: '❌' };
  };

 // Save a new record
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

  // Validate input
  if (!record.teacher || !record.subject || !record.grade || !record.stream || 
      !record.term || !record.examType || !record.year || Number.isNaN(record.mean)) {
    showAlert('Please fill all fields.');
    return;
  }

  // Validate the mean score and year
  if (record.mean < 0 || record.mean > 100) {
    showAlert('Mean score must be between 0 and 100.');
    return;
  }

  if (record.year < 2000 || record.year > 2100) {
    showAlert('Year must be between 2000 and 2100.');
    return;
  }

  // Prevent duplicate records (if the same record already exists)
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
    showAlert('This record already exists!');
    return;
  }

  // Save the new record
  records.push(record);
  saveRecords(records);

  // Clear the mean input field after saving
  el.mean().value = ''; 

  // Show success alert
  showAlert('Record saved!');

  // Update dashboard stats after saving the record
  updateDashboardStats();

  // Re-render the records and averages
  renderAll();
};

const updateDashboardStats = () => {
  const records = loadRecords();

  // Calculate the overall average score of all records
  const overallAvg = records.length > 0
    ? (records.reduce((a, r) => a + r.mean, 0) / records.length).toFixed(1) // Average of all the mean scores
    : 0;

  // Update the "Average of All Data Entered" stat
  if (el.avgScore()) {
    el.avgScore().textContent = overallAvg + '%';  // Display as percentage
  }

  // Top and Worst Subjects
  let topSubject = '-', worstSubject = '-', lastEntry = 'Never';
  let topSubjectAvg = 0, worstSubjectAvg = Infinity;
  
  const subjectStats = {};
  records.forEach(r => {
    if (!subjectStats[r.subject]) subjectStats[r.subject] = { sum: 0, count: 0 };
    subjectStats[r.subject].sum += r.mean;
    subjectStats[r.subject].count++;
  });

  for (const [subject, stats] of Object.entries(subjectStats)) {
    const avg = stats.sum / stats.count;
    if (avg > topSubjectAvg) {
      topSubject = subject;
      topSubjectAvg = avg;
    }
    if (avg < worstSubjectAvg) {
      worstSubject = subject;
      worstSubjectAvg = avg;
    }
  }

  if (el.topSubject()) el.topSubject().textContent = topSubject;
  if (el.worstSubject()) el.worstSubject().textContent = worstSubject;

  // Last entry (most recent)
  if (records.length > 0) {
    const lastRecord = records[records.length - 1];
    lastEntry = `${lastRecord.subject} (${lastRecord.term} - ${lastRecord.year})`;
  }

  if (el.lastEntry()) el.lastEntry().textContent = lastEntry;
};


  // Render all records and averages
  const renderAll = () => {
    renderRecords();
    renderAverageScores();
    updateDashboardStats(); // Ensure dashboard is updated on load or after changes
  };

  // Render Records Table
  const renderRecords = () => {
    const tbody = el.recordsTbody();
    if (!tbody) return;
    const records = loadRecords();
    tbody.innerHTML = '';
    records.forEach((r, i) => {
      const rub = rubric(r.mean);
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
        <td><span style="background:${rub.color};color:#fff;padding:4px 8px;border-radius:6px;">
          ${rub.emoji} ${rub.text}
        </span></td>
      `;
      tbody.appendChild(row);
    });
  };

  // Render Average Scores Table
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
// Update chart with new data
const updateChart = () => {
  const ctx = document.getElementById('avgChart').getContext('2d');
  const data = loadRecords(); // Load records from localStorage

  const subjects = data.map(record => record.subject);
  const avgScores = data.map(record => record.mean);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subjects,
      datasets: [{
        label: 'Average Scores',
        data: avgScores,
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
};
// Toggle chart visibility
const toggleChart = () => {
  const chartContainer = document.getElementById('chartContainer');
  const chartToggleButton = document.getElementById('chartToggle');
  if (chartContainer.style.display === 'none') {
    chartContainer.style.display = 'block';
    chartToggleButton.textContent = 'Hide Chart';
    updateChart();  // Update chart with new data
  } else {
    chartContainer.style.display = 'none';
    chartToggleButton.textContent = 'Show Chart';
  }
};
// Download data as PDF
const downloadPDF = () => {
  const doc = new jsPDF();
  doc.text('Average Scores Report', 14, 16);
  
  const table = document.getElementById('averageScoresTable');
  doc.autoTable({ html: table });
  doc.save('average_scores_report.pdf');
};
// Export data to Excel
const exportToExcel = () => {
  const table = document.getElementById('averageScoresTable');
  const wb = XLSX.utils.table_to_book(table);
  XLSX.writeFile(wb, 'average_scores.xlsx');
};

  // Initialize app
  document.addEventListener('DOMContentLoaded', () => {
    renderAll(); // Render records and stats on page load

    // Register service worker for offline capabilities
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(err => console.error('Service Worker registration failed:', err));
    }
  });
})();
