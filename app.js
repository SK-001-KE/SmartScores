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

document.addEventListener("DOMContentLoaded", attachSidebarToggle);

/* ------------------------------
   AUTH
--------------------------------*/
function logout() {
  localStorage.removeItem(TEACHER_KEY);
  window.location.href = "login.html";
}
// === SIDEBAR TOGGLE ===
document.addEventListener("DOMContentLoaded", () => {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarMenu = document.getElementById("sidebarMenu");

  if (sidebarToggle && sidebarMenu) {
    sidebarToggle.addEventListener("click", () => {
      sidebarMenu.classList.toggle("closed");
    });
  }
});

// Block access without login
(function authGuard() {
  const protectedPages = ["index.html","data-entry.html","recorded-scores.html","averages-insights.html","set-targets.html"];
  const current = location.pathname.split("/").pop();

  if (protectedPages.includes(current) && !localStorage.getItem(TEACHER_KEY)) {
    window.location.href = "login.html";
  }
})();

/* ------------------------------
   DATA STORAGE HELPERS
--------------------------------*/
function getRecords() {
  return JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
}

function saveRecords(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

/* ------------------------------
   SAVE NEW RECORD
--------------------------------*/
async function saveRecord(e) {
  if (e) e.preventDefault();

  const record = {
    subject: document.getElementById("subject").value,
    grade: document.getElementById("grade").value,
    stream: document.getElementById("stream").value.trim(),
    term: document.getElementById("term").value,
    opener: parseFloat(document.getElementById("opener").value),
    midterm: parseFloat(document.getElementById("midterm").value),
    endterm: parseFloat(document.getElementById("endterm").value),
    average: 0
  };

  record.average = ((record.opener + record.midterm + record.endterm) / 3).toFixed(1);

  if (!record.subject || !record.grade || !record.term) return alert("Fill all fields");

  const data = getRecords();
  data.push(record);
  saveRecords(data);

  alert("✅ Record saved!");
  document.getElementById("dataEntryForm").reset();
}

// Attach listener only if form exists
document.getElementById("dataEntryForm")?.addEventListener("submit", saveRecord);

/* ------------------------------
   SHOW RECORDED TABLE
--------------------------------*/
function showRecorded() {
  const container = document.querySelector("#recordedTable tbody");
  if (!container) return;

  const data = getRecords();
  container.innerHTML = data.map(r => `
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
  const data = getRecords();
  const insightsBox = document.getElementById("insights");

  if (!insightsBox) return;
  if (data.length === 0) {
    insightsBox.innerHTML = "<p>No data yet. Enter scores to generate insights.</p>";
    return;
  }

  let overall = (data.reduce((t,r)=>t+parseFloat(r.average),0) / data.length).toFixed(1);

  const best = data.reduce((a,b)=> a.average > b.average ? a : b);
  const worst = data.reduce((a,b)=> a.average < b.average ? a : b);

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
  const data = getRecords();
  const recBody = document.querySelector("#recordsTable tbody");
  const cumBody = document.querySelector("#cumulativeTable tbody");
  const trendBody = document.querySelector("#trendTable tbody");

  if (!recBody) return;

  // Raw table
  recBody.innerHTML = data.map(r=>`
    <tr>
      <td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td><td>${r.term}</td>
      <td>${r.opener}</td><td>${r.midterm}</td><td>${r.endterm}</td><td>${r.average}</td>
    </tr>
  `).join("");

  // Group cumulative
  let groups = {};
  data.forEach(r=>{
    const key = `${r.subject}-${r.grade}-${r.stream}-${r.term}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(parseFloat(r.average));
  });

  cumBody.innerHTML = Object.entries(groups).map(([k,arr])=>{
    const [s,g,st,t] = k.split("-");
    const avg = (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
    return `<tr><td>${s}</td><td>${g}</td><td>${st}</td><td>${t}</td><td>${arr.join(", ")}</td><td>${avg}</td></tr>`;
  }).join("");

  // Trend table
  trendBody.innerHTML = data.map(r=>{
    const trend = r.endterm>r.opener ? "↑ Improving" :
                  r.endterm<r.opener ? "↓ Drop" : "→ Steady";
    const status = r.average>=75 ? "Excellent" :
                   r.average>=50 ? "Fair" : "Needs Support";

    return `
    <tr>
      <td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td><td>${r.term}</td>
      <td>${r.opener}</td><td>${r.midterm}</td><td>${r.endterm}</td>
      <td>${trend}</td><td>${status}</td>
    </tr>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", populateInsightsTables);

/* ------------------------------
   PDF EXPORT (Simple text summary)
--------------------------------*/
async function downloadPDF() {
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

/* ------------------------------
   BACKUP EXPORT / IMPORT
--------------------------------*/
function exportBackup() {
  const data = getRecords();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "SmartScoresBackup.json";
  a.click();
  URL.revokeObjectURL(url);

  alert("✅ Backup downloaded");
}

/* ------------------------------
   TARGET SCORE SAVE
--------------------------------*/
document.getElementById("targetsForm")?.addEventListener("submit", e=>{
  e.preventDefault();
  const v = document.getElementById("targetScore").value;
  localStorage.setItem(TARGET_KEY, v);
  alert("🎯 Target saved!");
});
