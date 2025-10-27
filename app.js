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
      <td>${r.teacherName}</td>
      <td>${r.subject}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.term}</td>
      <td>${r.examType}</td>
      <td>${r.year}</td>
      <td>${r.meanScore}</td>
      <td><span class="tag ${perf.code}">${perf.text}</span></td>
      <td>${r.date}</td>
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

document.getElementById('saveBtn').addEventListener('click', saveRecord);

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('⚠️ This will delete all saved records. Continue?')) {
    localStorage.removeItem('smartScoresData');
    records = [];
    renderTable();
  }
});

renderTable();
