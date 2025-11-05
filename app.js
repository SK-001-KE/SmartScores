/* ------------------------------
   SmartScores App Logic v2.9.20
   by Kariuki (2025)
--------------------------------*/

// STORAGE KEYS
const DATA_KEY = "smartScoresRecords";
const TEACHER_KEY = "teacherFullName";
const TARGET_KEY = "teacherTargetScore";
const THEME_KEY = "themeMode";

/* ------------------------------
   THEME / DARK MODE
--------------------------------*/
function loadTheme() {
  const mode = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", mode);
}
function toggleDarkMode() {
  const mode = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem(THEME_KEY, mode);
}

/* ------------------------------
   SIDEBAR TOGGLE
--------------------------------*/
function attachSidebarToggle() {
  const btn = document.getElementById("sidebarToggle");
  const menu = document.getElementById("sidebarMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    menu.classList.toggle("closed");
  });
}

// Run once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();               // Load saved theme
  attachSidebarToggle();     // Attach sidebar toggle
});

/* ------------------------------
   AUTH
--------------------------------*/
function logout() {
  localStorage.removeItem(TEACHER_KEY);
  window.location.href = "login.html";
}

// === AUTH GUARD (run on every protected page) ===
(function authGuard() {
  const protectedPages = [
    "index.html",
    "data-entry.html",
    "recorded-scores.html",
    "averages-insights.html",
    "set-targets.html"
  ];
  const current = location.pathname.split("/").pop();
  if (protectedPages.includes(current) && !localStorage.getItem(TEACHER_KEY)) {
    window.location.replace("login.html"); // replace = no back loop
  }
})();

/* ------------------------------
   DATA STORAGE HELPERS
--------------------------------*/
function getRecords() {
  const raw = localStorage.getItem(DATA_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveRecords(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

/* ------------------------------
   SAVE NEW RECORD
--------------------------------*/
function saveRecord(e) {
  if (e) e.preventDefault();

  const subject = document.getElementById("subject")?.value;
  const grade = document.getElementById("grade")?.value;
  const stream = document.getElementById("stream")?.value.trim();
  const term = document.getElementById("term")?.value;
  const opener = parseFloat(document.getElementById("opener")?.value);
  const midterm = parseFloat(document.getElementById("midterm")?.value);
  const endterm = parseFloat(document.getElementById("endterm")?.value);

  if (!subject || !grade || !term || isNaN(opener) || isNaN(midterm) || isNaN(endterm)) {
    alert("Please fill all fields with valid numbers.");
    return;
  }

  const average = ((opener + midterm + endterm) / 3).toFixed(1);

  const record = { subject, grade, stream, term, opener, midterm, endterm, average: Number(average) };

  const data = getRecords();
  data.push(record);
  saveRecords(data);
  alert("Record saved!");
  document.getElementById("dataEntryForm")?.reset();
}

// Attach only if form exists
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dataEntryForm");
  if (form) {
    form.addEventListener("submit", saveRecord);
  }
});

/* ------------------------------
   SHOW RECORDED TABLE
--------------------------------*/
function showRecorded() {
  const tbody = document.querySelector("#recordedTable tbody");
  if (!tbody) return;

  const data = getRecords();
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.subject}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.term}</td>
      <td>${r.opener}</td>
      <td>${r.midterm}</td>
      <td>${r.endterm}</td>
    </tr>
  `).join("");
}
document.addEventListener("DOMContentLoaded", showRecorded);

/* ------------------------------
   INSIGHTS + TABLES (AI-ish)
--------------------------------*/
function computeInsights() {
  const insightsBox = document.getElementById("insights");
  if (!insightsBox) return;

  const data = getRecords();
  if (data.length === 0) {
    insightsBox.innerHTML = "<p>No data yet. Enter scores to generate insights.</p>";
    return;
  }

  const overall = (data.reduce((t, r) => t + parseFloat(r.average), 0) / data.length).toFixed(1);
  const best = data.reduce((a, b) => (a.average > b.average ? a : b));
  const worst = data.reduce((a, b) => (a.average < b.average ? a : b));

  insightsBox.innerHTML = `
    <div class="form-box">
      <p><strong>Overall Mean:</strong> ${overall}%</p>
      <p><strong>Best Performance:</strong> ${best.subject} (${best.average}%)</p>
      <p><strong>Needs Support:</strong> ${worst.subject} (${worst.average}%)</p>
    </div>
  `;
}
document.addEventListener("DOMContentLoaded", computeInsights);

/* ------------------------------
   FILL TABLES ON INSIGHTS PAGE
--------------------------------*/
function populateInsightsTables() {
  const recBody = document.querySelector("#recordsTable tbody");
  const cumBody = document.querySelector("#cumulativeTable tbody");
  const trendBody = document.querySelector("#trendTable tbody");
  if (!recBody && !cumBody && !trendBody) return;

  const data = getRecords();

  // Raw table
  if (recBody) {
    recBody.innerHTML = data.map(r => `
      <tr>
        <td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td><td>${r.term}</td>
        <td>${r.opener}</td><td>${r.midterm}</td><td>${r.endterm}</td><td>${r.average}</td>
      </tr>
    `).join("");
  }

  // Cumulative averages
  if (cumBody) {
    const groups = {};
    data.forEach(r => {
      const key = `${r.subject}-${r.grade}-${r.stream}-${r.term}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(parseFloat(r.average));
    });

    cumBody.innerHTML = Object.entries(groups).map(([k, arr]) => {
      const [s, g, st, t] = k.split("-");
      const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
      return `<tr><td>${s}</td><td>${g}</td><td>${st}</td><td>${t}</td><td>${arr.join(", ")}</td><td>${avg}</td></tr>`;
    }).join("");
  }

  // Trend table
  if (trendBody) {
    trendBody.innerHTML = data.map(r => {
      const trend = r.endterm > r.opener ? "Improving" :
                    r.endterm < r.opener ? "Drop" : "Steady";
      const status = r.average >= 75 ? "Excellent" :
                     r.average >= 50 ? "Fair" : "Needs Support";
      return `
        <tr>
          <td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td><td>${r.term}</td>
          <td>${r.opener}</td><td>${r.midterm}</td><td>${r.endterm}</td>
          <td>${trend}</td><td>${status}</td>
        </tr>`;
    }).join("");
  }
}
document.addEventListener("DOMContentLoaded", populateInsightsTables);

/* ------------------------------
   PDF EXPORT (Simple text summary)
--------------------------------*/
function downloadPDF() {
  if (!window.jspdf) {
    alert("jsPDF not loaded. Check internet or CDN.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = getRecords();

  doc.text("SmartScores Report", 10, 10);
  let y = 20;
  data.forEach(r => {
    doc.text(
      `${r.subject} G${r.grade} ${r.stream} ${r.term} | ${r.opener} - ${r.midterm} - ${r.endterm} Avg:${r.average}`,
      10, y
    );
    y += 8;
  });
  doc.save("SmartScores_Report.pdf");
}
// === SIDEBAR TOGGLE (for onclick="toggleSidebar()") ===
window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebarMenu');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (!sidebar) return;
  sidebar.classList.toggle('closed');
  if (toggleBtn) {
    const isClosed = sidebar.classList.contains('closed');
    toggleBtn.setAttribute('aria-expanded', !isClosed);
  }
};

/* ------------------------------
   BACKUP EXPORT / IMPORT
--------------------------------*/
function exportBackup() {
  const data = getRecords();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "SmartScoresBackup.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Backup downloaded");
}

/* ------------------------------
   TARGET SCORE SAVE
--------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("targetsForm");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const v = document.getElementById("targetScore")?.value.trim();
      if (!v || isNaN(v) || v < 0 || v > 100) {
        alert("Enter a valid target (0–100)");
        return;
      }
      localStorage.setItem(TARGET_KEY, v);
      alert("Target saved!");
    });
  }
});
