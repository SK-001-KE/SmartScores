// SmartScores v2.0 - Teacher Mean Score Tracker
// Kariuki 2025

// --- Utility Functions ---
const storageKey = "smartScoresRecords";
const getRecords = () => JSON.parse(localStorage.getItem(storageKey)) || [];
const saveRecords = (records) => localStorage.setItem(storageKey, JSON.stringify(records));

// --- Modal Handling ---
const modal = document.getElementById("confirmModal");
const confirmMsg = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

function showConfirm(message, onConfirm) {
  confirmMsg.textContent = message;
  modal.classList.remove("hidden");
  confirmYes.onclick = () => {
    modal.classList.add("hidden");
    onConfirm(true);
  };
  confirmNo.onclick = () => {
    modal.classList.add("hidden");
    onConfirm(false);
  };
}

// --- Grading Logic ---
function getGradeLabel(score) {
  if (score >= 75) return { label: "Exceeding Expectations", color: "#2ecc71" };
  if (score >= 41) return { label: "Meeting Expectations", color: "#3498db" };
  if (score >= 21) return { label: "Approaching Expectations", color: "#f1c40f" };
  return { label: "Below Expectations", color: "#e74c3c" };
}

// --- Rendering Table ---
function renderRecords() {
  const tbody = document.querySelector("#recordsTable tbody");
  const summaryDiv = document.getElementById("summarySection");
  const insightDiv = document.getElementById("insightSection");

  const records = getRecords();
  records.sort((a, b) => {
    return (
      a.grade.localeCompare(b.grade) ||
      a.subject.localeCompare(b.subject) ||
      a.examType.localeCompare(b.examType) ||
      a.term.localeCompare(b.term) ||
      a.teacherName.localeCompare(b.teacherName)
    );
  });

  tbody.innerHTML = "";
  records.forEach((r) => {
    const tr = document.createElement("tr");
    const gradeInfo = getGradeLabel(r.meanScore);
    tr.innerHTML = `
      <td>${r.teacherName}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.subject}</td>
      <td>${r.term}</td>
      <td>${r.examType}</td>
      <td>${r.year}</td>
      <td>${r.meanScore}</td>
      <td style="color:${gradeInfo.color}">${gradeInfo.label}</td>
    `;
    tbody.appendChild(tr);
  });

  // --- Summary and Average per Grade/Subject/Term ---
  const summaryMap = {};
  records.forEach((r) => {
    const key = `${r.grade}-${r.subject}-${r.term}`;
    if (!summaryMap[key]) summaryMap[key] = { total: 0, count: 0 };
    summaryMap[key].total += r.meanScore;
    summaryMap[key].count++;
  });

  summaryDiv.innerHTML = "<h3>Average Scores Summary</h3>";
  const sumTable = document.createElement("table");
  sumTable.innerHTML = `<tr><th>Grade</th><th>Subject</th><th>Term</th><th>Average Score</th></tr>`;
  Object.keys(summaryMap).forEach((key) => {
    const [grade, subject, term] = key.split("-");
    const avg = (summaryMap[key].total / summaryMap[key].count).toFixed(2);
    sumTable.innerHTML += `<tr><td>${grade}</td><td>${subject}</td><td>${term}</td><td>${avg}</td></tr>`;
  });
  summaryDiv.appendChild(sumTable);

  // --- Smart Insights ---
  let avgScore =
    records.reduce((acc, r) => acc + r.meanScore, 0) / (records.length || 1);
  const overallGrade = getGradeLabel(avgScore);
  insightDiv.innerHTML = `
    <h3>Smart Insight 💡</h3>
    <p style="color:${overallGrade.color}">
      The overall performance is <strong>${overallGrade.label}</strong> (${avgScore.toFixed(
    2
  )}%). 
      ${
        avgScore >= 75
          ? "🏆 Excellent work!"
          : avgScore >= 41
          ? "📘 Keep maintaining steady progress."
          : avgScore >= 21
          ? "⚙️ More effort needed to reach expectations."
          : "🚨 Immediate intervention is recommended."
      }
    </p>
  `;
}

// --- Save Record ---
document.getElementById("saveBtn").addEventListener("click", () => {
  const teacherName = document.getElementById("teacherName").value.trim();
  const grade = document.getElementById("grade").value;
  const stream = document.getElementById("stream").value;
  const subject = document.getElementById("subject").value;
  const term = document.getElementById("term").value;
  const examType = document.getElementById("examType").value;
  const year = document.getElementById("year").value;
  const meanScore = parseFloat(document.getElementById("meanScore").value);

  if (!teacherName || isNaN(meanScore) || !year) {
    alert("Please fill all required fields correctly.");
    return;
  }

  const newRecord = {
    teacherName,
    grade,
    stream,
    subject,
    term,
    examType,
    year,
    meanScore,
  };

  let records = getRecords();
  const existingIndex = records.findIndex(
    (r) =>
      r.teacherName === teacherName &&
      r.grade === grade &&
      r.subject === subject &&
      r.term === term &&
      r.examType === examType
  );

  if (existingIndex > -1) {
    showConfirm(
      "A record for this Grade, Subject, and Exam Type already exists. Overwrite?",
      (confirmed) => {
        if (confirmed) {
          records[existingIndex] = newRecord;
          saveRecords(records);
          renderRecords();
          alert("Record updated successfully.");
          document.getElementById("meanScore").value = "";
        }
      }
    );
  } else {
    records.push(newRecord);
    saveRecords(records);
    renderRecords();
    alert("Record saved successfully.");
    document.getElementById("meanScore").value = "";
  }
});

// --- Reset All Data ---
document.getElementById("resetBtn").addEventListener("click", () => {
  showConfirm(
    "This will delete all stored data permanently. Are you sure?",
    (confirmed) => {
      if (confirmed) {
        localStorage.removeItem(storageKey);
        renderRecords();
      }
    }
  );
});

// --- Export to Excel ---
document.getElementById("exportExcel").addEventListener("click", () => {
  const records = getRecords();
  if (records.length === 0) {
    alert("No records to export.");
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(records);
  XLSX.utils.book_append_sheet(wb, ws, "SmartScores");
  XLSX.writeFile(wb, "SmartScores_Backup.xlsx");
});

// --- Import from Excel ---
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importExcel").click();
});
document.getElementById("importExcel").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const imported = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (Array.isArray(imported) && imported.length) {
      showConfirm(
        "Importing will replace existing records. Continue?",
        (confirmed) => {
          if (confirmed) {
            saveRecords(imported);
            renderRecords();
            alert("Data imported successfully.");
          }
        }
      );
    } else {
      alert("Invalid file format or empty data.");
    }
  };
  reader.readAsArrayBuffer(file);
});

// --- PDF Report ---
document.getElementById("downloadPdf").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });

  const date = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFontSize(16);
  doc.text("SmartScores - Teacher Mean Score Report", 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated on: ${date}`, 40, 55);

  const records = getRecords();
  if (records.length === 0) {
    doc.text("No data available.", 40, 80);
  } else {
    const tableData = records.map((r) => [
      r.teacherName,
      r.grade,
      r.stream,
      r.subject,
      r.term,
      r.examType,
      r.year,
      r.meanScore,
      getGradeLabel(r.meanScore).label,
    ]);

    doc.autoTable({
      startY: 70,
      head: [
        [
          "Teacher",
          "Grade",
          "Stream",
          "Subject",
          "Term",
          "Exam Type",
          "Year",
          "Mean",
          "Grade Label",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [52, 73, 94] },
      bodyStyles: { fontSize: 8 },
    });
  }

  const insight = document.getElementById("insightSection").innerText;
  doc.text("Insights Summary:", 40, doc.lastAutoTable.finalY + 30);
  doc.text(insight, 40, doc.lastAutoTable.finalY + 45, { maxWidth: 500 });

  doc.save("SmartScores_Report.pdf");
});

// --- Initialize App ---
renderRecords();
