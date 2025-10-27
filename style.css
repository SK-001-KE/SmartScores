// Teacher Mean Score Tracker - Kariuki 2025

const form = document.getElementById("scoreForm");
const tableBody = document.querySelector("#recordsTable tbody");
const insightOutput = document.getElementById("insightOutput");
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");
const pdfBtn = document.getElementById("downloadPdfBtn");

let records = JSON.parse(localStorage.getItem("records")) || [];

function saveToLocal() {
  localStorage.setItem("records", JSON.stringify(records));
}

function gradeColorTag(score) {
  if (score >= 75) return { tag: "Exceeding Expectations", color: "#0c9800", emoji: "🏆" };
  if (score >= 41) return { tag: "Meeting Expectations", color: "#0091ff", emoji: "👍" };
  if (score >= 21) return { tag: "Approaching Expectations", color: "#ffae00", emoji: "🤔" };
  return { tag: "Below Expectations", color: "#e60000", emoji: "⚠️" };
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function renderTable() {
  tableBody.innerHTML = "";
  records.forEach(r => {
    const row = document.createElement("tr");
    const grade = gradeColorTag(r.meanScore);
    row.innerHTML = `
      <td>${r.teacher}</td>
      <td>${r.subject}</td>
      <td>${r.stream}</td>
      <td>${r.meanScore}</td>
      <td style="color:${grade.color}">${grade.tag}</td>
      <td>${r.date}</td>
    `;
    tableBody.appendChild(row);
  });
  renderInsights();
}

function renderInsights() {
  if (records.length === 0) {
    insightOutput.innerHTML = "<p>No data yet. Add scores to view insights.</p>";
    return;
  }
  const avg = records.reduce((a,b)=>a+b.meanScore,0)/records.length;
  const grade = gradeColorTag(avg);
  let tip = "";
  if (avg >= 75) tip = "Excellent work! Keep motivating your learners 💪";
  else if (avg >= 41) tip = "Good effort! Maintain consistency 📘";
  else if (avg >= 21) tip = "Getting there! Review weak areas 🧭";
  else tip = "Needs strong intervention. Consider remedial strategies 📉";

  insightOutput.innerHTML = `
    <div style="border-left:5px solid ${grade.color}; padding-left:10px;">
      <p>Overall Average: <b>${avg.toFixed(2)}</b></p>
      <p>Status: <span style="color:${grade.color}">${grade.tag} ${grade.emoji}</span></p>
      <p>${tip}</p>
    </div>
  `;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const teacher = document.getElementById("teacherName").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const stream = document.getElementById("stream").value.trim();
  const meanScore = parseFloat(document.getElementById("meanScore").value);
  if (isNaN(meanScore)) return alert("Please enter a valid number");

  records.push({ teacher, subject, stream, meanScore, date: formatDate() });
  saveToLocal();
  renderTable();
  document.getElementById("meanScore").value = "";
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mean_score_records.json";
  a.click();
});

resetBtn.addEventListener("click", () => {
  const confirmReset = prompt("Type DELETE to clear all records. This action cannot be undone!");
  if (confirmReset === "DELETE") {
    records = [];
    localStorage.removeItem("records");
    renderTable();
    alert("All records have been deleted.");
  }
});

pdfBtn.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait" });

  doc.setFontSize(16);
  doc.text("Teacher Mean Score Tracker Report", 10, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${formatDate()}`, 10, 30);

  let y = 40;
  records.forEach((r, i) => {
    const grade = gradeColorTag(r.meanScore);
    doc.text(`${i + 1}. ${r.teacher} - ${r.subject} (${r.stream}): ${r.meanScore} - ${grade.tag}`, 10, y);
    y += 8;
  });

  y += 10;
  doc.text("Insights:", 10, y);
  y += 8;
  const avg = records.reduce((a,b)=>a+b.meanScore,0)/records.length;
  const grade = gradeColorTag(avg);
  doc.text(`Overall Average: ${avg.toFixed(2)} (${grade.tag})`, 10, y);
  y += 8;
  doc.text("Kariuki 2025", 10, y + 10);

  doc.save("Teacher_Mean_Score_Report.pdf");
});

renderTable();

// PWA service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("Service Worker Registered"));
}
