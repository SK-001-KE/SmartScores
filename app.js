/* ============================================================
   SmartScores v2.0
   Teacher Mean Score Tracker
   Author: Kariuki 2025
   ============================================================ */

const form = document.getElementById("scoreForm");
const tableBody = document.getElementById("recordsBody");
const summaryBody = document.getElementById("summaryBody");
const insightBox = document.getElementById("insightBox");

// --- Utility to get and save local data ---
function getRecords() {
  return JSON.parse(localStorage.getItem("smartScores") || "[]");
}
function saveRecords(records) {
  localStorage.setItem("smartScores", JSON.stringify(records));
}

// --- Determine rubric + color ---
function getRubric(mean) {
  if (mean >= 75) return { label: "Exceeding Expectations", color: "#00b300", emoji: "🌟" };
  if (mean >= 41) return { label: "Meeting Expectations", color: "#2196f3", emoji: "👍" };
  if (mean >= 21) return { label: "Approaching Expectations", color: "#ff9800", emoji: "🟡" };
  return { label: "Below Expectations", color: "#f44336", emoji: "❌" };
}

// --- Add Record ---
form.addEventListener("submit", e => {
  e.preventDefault();

  const teacher = form.teacher.value.trim();
  const subject = form.subject.value;
  const grade = form.grade.value;
  const stream = form.stream.value;
  const term = form.term.value;
  const examType = form.examType.value;
  const year = form.year.value;
  const mean = parseFloat(form.mean.value);

  if (!teacher || isNaN(mean)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const records = getRecords();
  const existingIndex = records.findIndex(r =>
    r.teacher === teacher &&
    r.subject === subject &&
    r.grade === grade &&
    r.stream === stream &&
    r.term === term &&
    r.examType === examType &&
    r.year === year
  );

  if (existingIndex !== -1) {
    if (!confirm("SmartScores says: A record for this combination exists. Overwrite it?")) return;
    records[existingIndex].mean = mean;
  } else {
    records.push({ teacher, subject, grade, stream, term, examType, year, mean });
  }

  saveRecords(records);
  form.mean.value = ""; // clear only mean
  alert("💬 SmartScores says: Record saved successfully.");
  renderTable();
  renderSummary();
});

// --- Render Table ---
function renderTable() {
  const records = getRecords();
  tableBody.innerHTML = "";

  records.forEach((r, i) => {
    const { label, color } = getRubric(r.mean);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.teacher}</td>
      <td>${r.subject}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.term}</td>
      <td>${r.examType}</td>
      <td>${r.year}</td>
      <td style="color:${color};font-weight:600;">${r.mean}</td>
      <td><span style="color:${color};">${label}</span></td>
    `;
    tableBody.appendChild(row);
  });
}

// --- Render Summary by Grade–Subject–Term ---
function renderSummary() {
  const records = getRecords();
  summaryBody.innerHTML = "";

  const grouped = {};
  records.forEach(r => {
    const key = `${r.grade}-${r.subject}-${r.term}-${r.stream}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r.mean);
  });

  Object.keys(grouped).forEach(key => {
    const [grade, subject, term, stream] = key.split("-");
    const avg = (
      grouped[key].reduce((a, b) => a + b, 0) / grouped[key].length
    ).toFixed(2);
    const { label, color, emoji } = getRubric(avg);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${grade}</td>
      <td>${stream}</td>
      <td>${subject}</td>
      <td>${term}</td>
      <td style="color:${color};font-weight:600;">${avg}</td>
      <td><span style="color:${color};">${emoji} ${label}</span></td>
    `;
    summaryBody.appendChild(row);
  });

  generateInsight(records);
}

// --- Smart Insight ---
function generateInsight(records) {
  if (!records.length) {
    insightBox.innerHTML = "";
    return;
  }

  const avg = (
    records.reduce((a, r) => a + r.mean, 0) / records.length
  ).toFixed(2);
  const { label, color, emoji } = getRubric(avg);

  let message = "";
  if (avg >= 75) message = "Excellent performance across all entries!";
  else if (avg >= 41) message = "Good job! Most records meet expectations.";
  else if (avg >= 21) message = "Keep improving — several areas are close to the target.";
  else message = "Performance is below expectations. Review strategies.";

  insightBox.innerHTML = `
    <div style="border-left:5px solid ${color}; padding:10px; margin-top:15px; background:#f5f7fa; border-radius:6px;">
      <strong>🤖 SmartScores Insight:</strong><br>
      <span style="color:${color}; font-weight:600;">${emoji} ${label}</span> — ${message}
      <div style="margin-top:5px;font-size:0.9em;">Overall Average: <b>${avg}</b></div>
    </div>
  `;
}

// --- Reset Data ---
function resetData() {
  if (confirm("⚠️ SmartScores says: This will delete all records. Proceed?")) {
    localStorage.removeItem("smartScores");
    renderTable();
    renderSummary();
    insightBox.innerHTML = "";
    alert("All data cleared successfully.");
  }
}

// --- Export Excel ---
function exportToExcel() {
  const records = getRecords();
  if (!records.length) return alert("No data to export!");

  const csv = [
    ["Teacher","Subject","Grade","Stream","Term","ExamType","Year","Mean"],
    ...records.map(r => [r.teacher, r.subject, r.grade, r.stream, r.term, r.examType, r.year, r.mean])
  ].map(e => e.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "SmartScores_v2.0_Data.csv";
  a.click();
}

// --- Import Excel ---
function importFromExcel(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split("\n").slice(1);
    const imported = lines.map(l => {
      const [teacher, subject, grade, stream, term, examType, year, mean] = l.split(",");
      return { teacher, subject, grade, stream, term, examType, year, mean: parseFloat(mean) };
    }).filter(r => r.teacher);
    const existing = getRecords();
    saveRecords([...existing, ...imported]);
    renderTable();
    renderSummary();
    alert("SmartScores says: Imported successfully!");
  };
  reader.readAsText(file);
}

// --- Download PDF (using print) ---
function downloadPDF() {
  alert("💬 SmartScores says: Use your browser's 'Save as PDF' to download report.");
  window.print();
}

// --- On Load ---
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  renderSummary();
});
