// ===== SmartScores v2.0 - app.js =====
(function () {
  const STORAGE_KEY = "smartScoresRecords";

  // --- Register Service Worker ---
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .then((reg) =>
          console.log("✅ Service Worker registered:", reg.scope)
        )
        .catch((err) => console.error("❌ SW registration failed:", err));
    });
  }

  // ===== Helper Functions =====
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error loading records:", e);
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function showMessage(msg) {
    alert(msg);
  }

  function safeNum(x) {
    const n = Number(x);
    return isNaN(n) ? 0 : n;
  }

  // ===== Save Record Logic =====
  window.saveRecord = function saveRecord() {
    const teacher = document.getElementById("teacherName")?.value.trim();
    const subject = document.getElementById("subject")?.value.trim();
    const grade = document.getElementById("grade")?.value.trim();
    const stream = document.getElementById("stream")?.value.trim();
    const term = document.getElementById("term")?.value.trim();
    const examType = document.getElementById("examType")?.value.trim();
    const year = document.getElementById("year")?.value.trim();
    const mean = Number(document.getElementById("meanScore")?.value.trim());

    if (
      !teacher ||
      !subject ||
      !grade ||
      !stream ||
      !term ||
      !examType ||
      !year ||
      Number.isNaN(mean)
    ) {
      showMessage("⚠️ Please fill in all fields correctly.");
      return;
    }

    const records = loadRecords();
    const exists = records.findIndex(
      (r) =>
        r.teacher === teacher &&
        r.subject === subject &&
        r.grade === grade &&
        r.stream === stream &&
        r.term === term &&
        r.examType === examType &&
        r.year === year
    );

    if (exists > -1) {
      if (confirm("Record exists. Overwrite it?")) {
        records[exists].mean = mean;
      } else return;
    } else {
      records.push({
        teacher,
        subject,
        grade,
        stream,
        term,
        examType,
        year,
        mean,
      });
    }

    saveRecords(records);
    document.getElementById("meanScore").value = "";
    showMessage("✅ Record saved successfully!");
    renderRecords();
  };

  // ===== Render Recorded Scores =====
  window.renderRecords = function renderRecords() {
    const tbody = document.querySelector("#recordsTable tbody");
    if (!tbody) return;
    const records = loadRecords();
    tbody.innerHTML = "";

    records.forEach((r) => {
      const row = document.createElement("tr");
      const rub = rubric(r.mean);
      row.innerHTML = `
        <td>${r.teacher}</td>
        <td>${r.subject}</td>
        <td>${r.grade}</td>
        <td>${r.stream}</td>
        <td>${r.term}</td>
        <td>${r.examType}</td>
        <td>${r.year}</td>
        <td>${r.mean.toFixed(1)}%</td>
        <td><span style="background:${rub.color}; color:#fff; padding:4px 8px; border-radius:6px;">${rub.code}</span></td>
      `;
      tbody.appendChild(row);
    });
  };

  // ===== Rubric Function =====
  function rubric(score) {
    if (score >= 75) return { code: "EE", color: "#16a34a" };
    if (score >= 41) return { code: "ME", color: "#2563eb" };
    if (score >= 21) return { code: "AE", color: "#f59e0b" };
    return { code: "BE", color: "#ef4444" };
  }

  // ===== Clear All Records =====
  window.clearAllData = function () {
    if (
      confirm("⚠️ This will permanently delete all records. Continue?")
    ) {
      localStorage.removeItem(STORAGE_KEY);
      showMessage("🧹 All data cleared!");
      renderRecords();
      renderAverages();
    }
  };

  // ===== Export Backup =====
  window.exportBackup = function () {
    const records = loadRecords();
    if (!records.length) {
      showMessage("No data to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `SmartScores_Backup_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
  };

  // ===== Import Backup =====
  window.importBackup = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        if (
          confirm("⚠️ Importing will replace your current records. Continue?")
        ) {
          saveRecords(imported);
          showMessage("📥 Backup imported successfully!");
          renderRecords();
          renderAverages();
        }
      } catch (err) {
        showMessage("❌ Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  // ===== Render Averages and Insights =====
  window.renderAverages = function renderAverages() {
    const tbody = document.querySelector("#averageScoresTable tbody");
    if (!tbody) return;
    const records = loadRecords();
    tbody.innerHTML = "";

    const groups = {};

    // group by subject, grade, stream, term, year
    for (const r of records) {
      const key = [r.subject, r.grade, r.stream, r.term, r.year].join("|");
      if (!groups[key]) groups[key] = [];
      groups[key].push(r.mean);
    }

    for (const [key, means] of Object.entries(groups)) {
      const [subject, grade, stream, term, year] = key.split("|");
      const avg = means.reduce((a, b) => a + b, 0) / means.length;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${subject}</td>
        <td>${grade}</td>
        <td>${stream}</td>
        <td>${term}</td>
        <td>${year}</td>
        <td>${avg.toFixed(2)}%</td>
      `;
      tbody.appendChild(row);
    }
  };

  // ===== PDF Download (Averages & Insights) =====
  window.downloadPDF = function downloadPDF() {
    const averagesTable = document.getElementById("averageScoresTable");
    if (!averagesTable) return alert("No data to download!");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.text("SmartScores Averages & Insights", 14, 16);
    pdf.autoTable({ html: "#averageScoresTable", startY: 25 });
    pdf.save(`SmartScores_Averages_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`);
    alert("📄 PDF downloaded successfully!");
  };

  // ===== Auto-Initialize on Each Page =====
  function init() {
    renderRecords();
    renderAverages();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
