let records = JSON.parse(localStorage.getItem('smartScoresData') || '[]');
const tableBody = document.querySelector('#summaryTable tbody');
const insightText = document.getElementById('insightText');

function renderTable() {
  tableBody.innerHTML = '';
  if (records.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10">No records yet.</td></tr>';
    insightText.textContent = "No data yet. Add records to see performance feedback.";
    return;
  }

  records.forEach(r => {
    const row = document.createElement('tr');
    const perf = getPerformance(r.meanScore);
    row.innerHTML = `
      <td>${r.teacherName}</td><td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td>
      <td>${r.term}</td><td>${r.examType}</td><td>${r.year}</td><td>${r.meanScore}</td>
      <td><span class="tag ${perf.code}">${perf.text}</span></td><td>${r.date}</td>
    `;
    tableBody.appendChild(row);
  });

  generateInsight();
}

function saveRecord() {
  const teacherName = document.getElementById('teacherName').value.trim();
  const subject = document.getElementById('subject').value;
  const grade = document.getElementById('grade').value;
  const stream = document.getElementById('stream').value;
  const term = document.getElementById('term').value;
  const examType = document.getElementById('examType').value;
  const year = document.getElementById('year').value;
  const meanScore = parseFloat(document.getElementById('meanScore').value);

  if (!teacherName || !subject || !grade || !stream || !term || !examType || isNaN(meanScore)) {
    alert("⚠️ Please fill all fields correctly.");
    return;
  }

  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const record = { teacherName, subject, grade, stream, term, examType, year, meanScore, date };
  records.push(record);
  localStorage.setItem('smartScoresData', JSON.stringify(records));
  document.getElementById('meanScore').value = '';
  renderTable();
}

function getPerformance(score) {
  if (score >= 75) return { text: "Exceeding Expectations", code: "EE" };
  if (score >= 41) return { text: "Meeting Expectations", code: "ME" };
  if (score >= 21) return { text: "Approaching Expectations", code: "AE" };
  return { text: "Below Expectations", code: "BE" };
}

function generateInsight() {
  const avg = records.reduce((a, r) => a + r.meanScore, 0) / records.length;
  const perf = getPerformance(avg);
  insightText.innerHTML = `💡 Average Mean Score: <b>${avg.toFixed(1)}</b> — 
    <span class="tag ${perf.code}">${perf.text}</span>`;
}

function downloadPDF() {
  if (records.length === 0) return alert("⚠️ No records to export.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait" });

  doc.setFontSize(16);
  doc.text("SmartScores Teacher Mean Score Report", 10, 15);
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}`, 10, 25);

  let y = 35;
  records.forEach(r => {
    doc.text(`${r.teacherName} | ${r.subject} | ${r.grade}${r.stream} | ${r.term} | ${r.examType} | ${r.meanScore}`, 10, y);
    y += 8;
  });

  y += 10;
  const avg = records.reduce((a, r) => a + r.meanScore, 0) / records.length;
  const perf = getPerformance(avg);
  doc.text(`Insight: Avg Mean = ${avg.toFixed(1)} (${perf.text})`, 10, y);

  doc.save(`SmartScores_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

document.getElementById('saveBtn').addEventListener('click', saveRecord);
document.getElementById('pdfBtn').addEventListener('click', downloadPDF);
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('⚠️ This will delete all saved records. Continue?')) {
    localStorage.removeItem('smartScoresData');
    records = [];
    renderTable();
  }
});

document.getElementById('aboutBtn').addEventListener('click', () => {
  document.getElementById('aboutModal').style.display = 'flex';
});
function closeAbout() {
  document.getElementById('aboutModal').style.display = 'none';
}

renderTable();
