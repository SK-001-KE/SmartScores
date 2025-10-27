let records = JSON.parse(localStorage.getItem('meanScoreRecords') || '[]');

// Handle form submission
document.getElementById('dataForm').addEventListener('submit', e => {
  e.preventDefault();
  const record = {
    teacherName: teacherName.value.trim(),
    subject: subject.value,
    grade: grade.value,
    stream: stream.value,
    term: term.value,
    examType: examType.value,
    year: year.value,
    meanScore: parseFloat(meanScore.value),
    date: new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  };
  records.push(record);
  localStorage.setItem('meanScoreRecords', JSON.stringify(records));
  meanScore.value = ''; // clear score only
  displayRecords();
  alert("✅ Record saved successfully!");
});

// Display table
function displayRecords() {
  const tbody = document.querySelector('#summaryTable tbody');
  tbody.innerHTML = '';
  records.forEach(r => {
    const perf = getPerformance(r.meanScore);
    tbody.innerHTML += `
      <tr>
        <td>${r.teacherName}</td><td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td>
        <td>${r.term}</td><td>${r.examType}</td><td>${r.year}</td>
        <td>${r.meanScore.toFixed(1)}</td>
        <td><span class="grade-tag ${perf.code}">${perf.label}</span></td>
        <td>${r.date}</td>
      </tr>`;
  });
}

// Grading scale
function getPerformance(score) {
  if (score >= 75) return { code:'EE', label:'Exceeding Expectations' };
  if (score >= 41) return { code:'ME', label:'Meeting Expectations' };
  if (score >= 21) return { code:'AE', label:'Approaching Expectations' };
  return { code:'BE', label:'Below Expectations' };
}

// Generate insights
function generateInsight() {
  if (!records.length) { alert("No data available."); return; }
  const avg = (records.reduce((a,b)=>a+b.meanScore,0) / records.length).toFixed(1);
  const perf = getPerformance(avg);
  const insight = `💡 Overall average score is ${avg}. Teachers are mostly <span class="grade-tag ${perf.code}">${perf.label}</span>.`;
  document.getElementById('insightBox').innerHTML = insight;
}

// Reset data
function resetData() {
  if (confirm("⚠️ Are you sure you want to reset? All data will be deleted!")) {
    localStorage.removeItem('meanScoreRecords');
    records = [];
    displayRecords();
    document.getElementById('insightBox').innerHTML = "💡 Insights will appear here...";
    alert("Data reset successfully!");
  }
}

// Download PDF (text-only)
function downloadPDF() {
  const text = records.map(r =>
    `${r.teacherName} | ${r.subject} | Grade ${r.grade} ${r.stream} | ${r.term} | ${r.examType} | ${r.year} | Score: ${r.meanScore} | ${r.date}`
  ).join('\n');
  const blob = new Blob([`Teacher Mean Score Tracker v1.0\n\n${text}\n\nGenerated on ${new Date().toLocaleString()}\nKariuki 2025`], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Teacher_Mean_Score_Report_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
}

displayRecords();
