// SMARTSCORES v1.0 – TEACHER MEAN SCORE TRACKER
// © Kariuki 2025

let records = JSON.parse(localStorage.getItem("smartScores")) || [];
const form = document.getElementById("scoreForm");
const tableBody = document.querySelector("#recordsTable tbody");
const summaryBody = document.querySelector("#summaryTable tbody");
const insightBox = document.getElementById("insightBox");
const dateSpan = document.getElementById("currentDate");

// Long format date
dateSpan.textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

// 💬 SmartScores Custom Notification
function showSmartAlert(message) {
  const box = document.createElement("div");
  box.textContent = message;
  Object.assign(box.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#003366",
    color: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    zIndex: 9999,
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "opacity 0.5s ease"
  });
  document.body.appendChild(box);
  setTimeout(() => { box.style.opacity = "0"; }, 2500);
  setTimeout(() => box.remove(), 3000);
}

// 🧾 Save Record
form.onsubmit = e => {
  e.preventDefault();

  const rec = {
    teacher: form.teacher.value.trim(),
    grade: form.grade.value,
    stream: form.stream.value,
    subject: form.subject.value,
    term: form.term.value,
    examType: form.examType.value,
    year: form.year.value,
    mean: parseFloat(form.mean.value)
  };

  // Check for duplicate
  const idx = records.findIndex(r =>
    r.teacher === rec.teacher &&
    r.subject === rec.subject &&
    r.grade === rec.grade &&
    r.stream === rec.stream &&
    r.term === rec.term &&
    r.examType === rec.examType &&
    r.year === rec.year
  );

  if (idx > -1) {
    if (!confirm("⚠️ SmartScores says: This record already exists. Overwrite it?")) return;
    records[idx] = rec;
  } else {
    records.push(rec);
  }

  localStorage.setItem("smartScores", JSON.stringify(records));
  form.mean.value = ""; // clear mean only
  showSmartAlert("💬 SmartScores says: Record saved successfully!");
  updateDisplay();
};

// 🧮 Display Records
function updateDisplay() {
  tableBody.innerHTML = "";
  records.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.teacher}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.subject}</td>
      <td>${r.term}</td>
      <td>${r.examType}</td>
      <td>${r.year}</td>
      <td>${r.mean}</td>
    `;
    tableBody.appendChild(tr);
  });
  updateSummary();
}

// 📊 Summary per Grade/Subject/Term/Stream
function updateSummary() {
  const summary = {};
  records.forEach(r => {
    const key = `${r.grade}-${r.subject}-${r.term}-${r.stream}`;
    if (!summary[key]) summary[key] = { total: 0, count: 0 };
    summary[key].total += r.mean;
    summary[key].count++;
  });

  summaryBody.innerHTML = "";
  let insights = [];

  for (const key in summary) {
    const [grade, subject, term, stream] = key.split("-");
    const avg = (summary[key].total / summary[key].count).toFixed(2);
    let remark = "";
    let color = "";

    if (avg >= 75) { remark = "Exceeding Expectations"; color = "green"; }
    else if (avg >= 41) { remark = "Meeting Expectations"; color = "blue"; }
    else if (avg >= 21) { remark = "Approaching Expectations"; color = "orange"; }
    else { remark = "Below Expectations"; color = "red"; }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${grade}</td>
      <td>${stream}</td>
      <td>${subject}</td>
      <td>${term}</td>
      <td>${avg}</td>
      <td style="color:${color}; font-weight:600;">${remark}</td>
    `;
    summaryBody.appendChild(tr);

    insights.push(`📘 ${subject} (${grade}${stream} - ${term}): ${remark} (${avg}%)`);
  }

  insightBox.innerHTML = insights.length
    ? `<h3>SmartScores Insight 💡</h3><ul>${insights.map(i => `<li>${i}</li>`).join("")}</ul>`
    : `<p>No data available yet.</p>`;
}

// 🧾 Export to Excel
function exportToExcel() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(records);
  XLSX.utils.book_append_sheet(wb, ws, "SmartScores");
  XLSX.writeFile(wb, "SmartScores_Export.xlsx");
  showSmartAlert("💬 SmartScores says: Data exported successfully!");
}

// 📥 Import from Excel
function importFromExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    records = XLSX.utils.sheet_to_json(sheet);
    localStorage.setItem("smartScores", JSON.stringify(records));
    updateDisplay();
    showSmartAlert("💬 SmartScores says: Data imported successfully!");
  };
  reader.readAsArrayBuffer(file);
}

// 🗑️ Reset All Records
function resetData() {
  if (confirm("⚠️ SmartScores says: This will delete all records. Proceed?")) {
    localStorage.removeItem("smartScores");
    records = [];
    updateDisplay();
    showSmartAlert("💬 SmartScores says: All data cleared!");
  }
}

// 🧾 Download PDF Report
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait" });
  doc.setFontSize(14);
  doc.text("SmartScores Mean Score Summary", 14, 15);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 14, 25);

  const tableData = [["Grade", "Stream", "Subject", "Term", "Avg", "Remark"]];
  summaryBody.querySelectorAll("tr").forEach(row => {
    const cells = Array.from(row.children).map(td => td.innerText);
    tableData.push(cells);
  });

  doc.autoTable({ startY: 35, head: [tableData[0]], body: tableData.slice(1) });
  doc.text("Kariuki 2025 • SmartScores", 14, doc.lastAutoTable.finalY + 15);
  doc.save("SmartScores_Report.pdf");
  showSmartAlert("💬 SmartScores says: PDF report downloaded!");
}

// Initialize
updateDisplay();
