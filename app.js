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
    alert("⚠️ Please fill in all fields correctly.");
    return;
  }

  // Prevent overwriting existing record
  const existing = records.find(r =>
    r.teacherName === teacherName &&
    r.subject === subject &&
    r.grade === grade &&
    r.stream === stream &&
    r.term === term &&
    r.examType === examType &&
    r.year === year
  );
  if (existing) {
    if (!confirm(`⚠️ Record already exists for ${teacherName} in ${subject}, Grade ${grade}, ${stream}, ${term}. Overwrite?`)) {
      return;
    } else {
      records = records.filter(r => r !== existing);
    }
  }

  const rubric = getRubric(meanScore);
  const colorTag = getRubricColor(rubric);

  const record = { teacherName, subject, grade, stream, term, examType, year, meanScore, rubric, colorTag };
  records.push(record);
  localStorage.setItem("smartScoresRecords", JSON.stringify(records));

  document.getElementById("meanScore").value = ""; // reset only mean score

  renderRecords();
  renderSummary();

  alert(`✅ SmartScores says: Record saved successfully for ${teacherName}!`);
}

// ===== Rubric Functions =====
function getRubric(score) {
  if (score >= 75) return "Exceeding Expectations";  // Green
  if (score >= 60) return "Meeting Expectations";    // Yellow
  if (score >= 50) return "Approaching Expectations";// Orange
  return "Below Expectations";                        // Red
}

function getRubricColor(rubric) {
  switch(rubric) {
    case "Exceeding Expectations": return "🟢";
    case "Meeting Expectations": return "🟡";
    case "Approaching Expectations": return "🟠";
    case "Below Expectations": return "🔴";
  }
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
      <td>${r.rubric} ${r.colorTag}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Render average summary and insights
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

  let insights = "";
  for (const key in summary) {
    const [grade, subject, stream] = key.split("-");
    const avg = (summary[key].total / summary[key].count).toFixed(2);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${grade}</td><td>${subject}</td><td>${stream}</td><td>${avg}</td>`;
    tbody.appendChild(tr);

    if (avg >= 75) insights += `🌟 SmartScores says: ${subject} Grade ${grade} (${stream}) is Exceeding Expectations.\n`;
    else if (avg >= 60) insights += `✅ SmartScores says: ${subject} Grade ${grade} (${stream}) is Meeting Expectations.\n`;
    else if (avg >= 50) insights += `⚠️ SmartScores says: ${subject} Grade ${grade} (${stream}) is Approaching Expectations.\n`;
    else insights += `🔴 SmartScores says: ${subject} Grade ${grade} (${stream}) is Below Expectations.\n`;
  }

  document.getElementById("insightBox").innerText = insights || "✅ SmartScores says: All classes performing within average range.";
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
      alert("✅ SmartScores says: Data imported successfully!");
    } catch (err) {
      alert("⚠️ Failed to import data: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ===== Reset Data =====
function resetData() {
  if (confirm("⚠️ Are you sure you want to reset all data? This cannot be undone.")) {
    records = [];
    localStorage.removeItem("smartScoresRecords");
    renderRecords();
    renderSummary();
    alert("✅ SmartScores says: All data has been reset.");
  }
}

// ===== PDF Generation (includes summary + insights) =====
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("SmartScores Report", 14, 20);

  // Logo
  const logo = new Image();
  logo.src = "logo.png";
  logo.onload = () => {
    doc.addImage(logo, "PNG", 160, 10, 30, 30);

    let startY = 35;

    // Records table
    const recordHeaders = ["Teacher","Subject","Grade","Stream","Term","Exam Type","Year","Mean Score","Rubric"];
    const recordBody = records.map(r => [
      r.teacherName, r.subject, r.grade, r.stream, r.term, r.examType, r.year, r.meanScore, r.rubric + " " + r.colorTag
    ]);
    doc.autoTable({ head: [recordHeaders], body: recordBody, startY, styles:{fontSize:10} });

    // Summary table
    startY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("Average Score Summary", 14, startY);
    startY += 6;

    const summaryData = [];
    const summaryMap = {};
    records.forEach(r=>{
      const key=`${r.grade}-${r.subject}-${r.stream}`;
      if(!summaryMap[key]) summaryMap[key]={total:0,count:0};
      summaryMap[key].total+=r.meanScore; summaryMap[key].count+=1;
    });
    for(const key in summaryMap){
      const [grade,subject,stream]=key.split("-");
      const avg=(summaryMap[key].total/summaryMap[key].count).toFixed(2);
      summaryData.push([grade,subject,stream,avg]);
    }
    doc.autoTable({ head:[["Grade","Subject","Stream","Average"]], body: summaryData, startY, styles:{fontSize:10} });

    // Insights
    startY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    let insightsText = document.getElementById("insightBox").innerText;
    doc.text("Insights:",14,startY);
    startY += 6;
    doc.setFontSize(10);
    const splitInsights = doc.splitTextToSize(insightsText, 180);
    doc.text(splitInsights,14,startY);

    // Save PDF
    doc.save("SmartScores_Report.pdf");
  };
}

// ===== Initial Rendering =====
renderRecords();
renderSummary();
