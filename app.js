// ===== SmartScores v2.0 app.js =====

// Load records from localStorage
let records = JSON.parse(localStorage.getItem("smartScoresRecords") || "[]");

// ===== Helper Functions =====

// Save a new record
function saveRecord() {
  const teacherName = document.getElementById("teacherName").value.trim();
  const subject = document.getElementById("subject").value;
  const grade = document.getElementById("grade").value;
  const stream = document.getElementById("stream").value;
  const term = document.getElementById("term").value;
  const examType = document.getElementById("examType").value;
  const year = document.getElementById("year").value;
  const meanScore = parseFloat(document.getElementById("meanScore").value);

  if (!teacherName || !subject || !grade || !stream || !term || !examType || !year || isNaN(meanScore)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const rubric = getRubric(meanScore);

  const record = {
    teacherName, subject, grade, stream, term, examType, year, meanScore, rubric
  };

  records.push(record);
  localStorage.setItem("smartScoresRecords", JSON.stringify(records));

  // Reset only mean score
  document.getElementById("meanScore").value = "";

  renderRecords();
  renderSummary();
}

// Determine rubric based on mean score
function getRubric(score) {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

// ===== Render Functions =====

// Render records table
function renderRecords() {
  const tbody = document.querySelector("#recordsTable tbody");
  tbody.innerHTML = "";
  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.teacherName}</td>
      <td>${r.subject}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.term}</td>
      <td>${r.examType}</td>
      <td>${r.year}</td>
      <td>${r.meanScore}</td>
      <td>${r.rubric}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Render average summary table
function renderSummary() {
  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";
  const summary = {};

  records.forEach(r => {
    const key = `${r.grade}-${r.subject}-${r.stream}`;
    if (!summary[key]) summary[key] = { total: 0, count: 0 };
    summary[key].total += r.meanScore;
    summary[key].count += 1;
  });

  const insightBox = document.getElementById("insightBox");
  let insights = "";

  for (const key in summary) {
    const [grade, subject, stream] = key.split("-");
    const avg = (summary[key].total / summary[key].count).toFixed(2);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${grade}</td>
      <td>${subject}</td>
      <td>${stream}</td>
      <td>${avg}</td>
    `;
    tbody.appendChild(tr);

    if (avg >= 75) insights += `🌟 ${subject} Grade ${grade} (${stream}) is performing well.\n`;
    if (avg < 50) insights += `⚠️ ${subject} Grade ${grade} (${stream}) needs improvement.\n`;
  }

  insightBox.innerText = insights || "All classes are performing within average range.";
}

// ===== Export / Import JSON =====

function exportExcel() {
  const dataStr = JSON.stringify(records, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "SmartScores_Backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid data format.");
      records = imported;
      localStorage.setItem("smartScoresRecords", JSON.stringify(records));
      renderRecords();
      renderSummary();
      alert("Data imported successfully!");
    } catch (err) {
      alert("Failed to import data: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ===== Reset Data =====
function resetData() {
  if (confirm("Are you sure you want to reset all data?")) {
    records = [];
    localStorage.removeItem("smartScoresRecords");
    renderRecords();
    renderSummary();
  }
}

// ===== PDF Generation =====
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("SmartScores Report", 14, 22);

  const table = document.getElementById("recordsTable");
  const headers = [];
  table.querySelectorAll("thead th").forEach(th => headers.push(th.innerText));

  const data = [];
  table.querySelectorAll("tbody tr").forEach(tr => {
    const row = [];
    tr.querySelectorAll("td").forEach(td => row.push(td.innerText));
    data.push(row);
  });

  doc.autoTable({
    head: [headers],
    body: data,
    startY: 30,
    styles: { fontSize: 10 }
  });

  doc.save("SmartScores_Report.pdf");
}

// ===== Initial Rendering =====
renderRecords();
renderSummary();
