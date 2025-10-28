// SmartScores v2.0 — Complete App Logic
// © SmartScores 2025

let records = JSON.parse(localStorage.getItem('smartRecords') || '[]');
const form = document.getElementById('dataForm');
const insightBox = document.getElementById('insightBox');
const ctx = document.getElementById('barChart')?.getContext('2d');
let chart;

// Hidden input to track edits
const recordIndexInput = document.createElement('input');
recordIndexInput.type = 'hidden';
recordIndexInput.id = 'recordIndex';
form.appendChild(recordIndexInput);

// Utility functions
function unique(arr) { return [...new Set(arr)]; }
function avg(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function grading(score){
  if(score>=75) return {label:"Exceeding Expectations", color:"#22c55e", emoji:"🏅"};
  if(score>=41) return {label:"Meeting Expectations", color:"#3b82f6", emoji:"😊"};
  if(score>=21) return {label:"Approaching Expectations", color:"#eab308", emoji:"🟡"};
  return {label:"Below Expectations", color:"#ef4444", emoji:"⚠️"};
}

// --------------------- SAVE / EDIT RECORD ---------------------
form.onsubmit = e => {
  e.preventDefault();
  const rec = {
    teacher: teacher.value.trim(),
    subject: subject.value,
    grade: grade.value,
    stream: stream.value,
    term: term.value,
    exam: exam.value,
    year: year.value,
    score: parseFloat(score.value)
  };

  const idx = recordIndexInput.value || records.findIndex(r =>
    r.teacher === rec.teacher &&
    r.subject === rec.subject &&
    r.grade === rec.grade &&
    r.stream === rec.stream &&
    r.term === rec.term &&
    r.exam === rec.exam &&
    r.year === rec.year
  );

  if(idx > -1){
    if(!confirm("⚠️ This record already exists. Do you want to overwrite it?")) return;
    records[idx] = rec;
  } else {
    records.push(rec);
  }

  localStorage.setItem('smartRecords', JSON.stringify(records));
  alert("SmartScores says: ✅ Record saved successfully!");
  recordIndexInput.value = ''; // reset edit tracker
  updateAll();
};

// --------------------- POPULATE FILTERS ---------------------
function populateFilters(){
  const teachers = unique(records.map(r=>r.teacher)).sort();
  const grades = unique(records.map(r=>r.grade)).sort();
  const streams = unique(records.map(r=>r.stream)).sort();
  const years = unique(records.map(r=>r.year)).sort();
  
  filterTeacher.innerHTML = '<option value="">All Teachers</option>' + teachers.map(t=>`<option>${t}</option>`).join('');
  filterGrade.innerHTML = '<option value="">All Grades</option>' + grades.map(g=>`<option>${g}</option>`).join('');
  filterStream.innerHTML = '<option value="">All Streams</option>' + streams.map(s=>`<option>${s}</option>`).join('');
  filterYear.innerHTML = '<option value="">All Years</option>' + years.map(y=>`<option>${y}</option>`).join('');
}

// --------------------- FILTERED RECORDS ---------------------
function getFiltered(){
  return records.filter(r=>
    (!filterTeacher.value || r.teacher===filterTeacher.value) &&
    (!filterGrade.value || r.grade===filterGrade.value) &&
    (!filterStream.value || r.stream===filterStream.value) &&
    (!filterYear.value || r.year===filterYear.value)
  );
}

// --------------------- RENDER RECORDS TABLE ---------------------
function renderRecords(filteredRecords = records){
  const tbody = document.querySelector('#recordsTable tbody');
  tbody.innerHTML = '';
  filteredRecords.forEach((r, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${r.teacher}</td>
      <td>${r.subject}</td>
      <td>${r.grade}</td>
      <td>${r.stream}</td>
      <td>${r.term}</td>
      <td>${r.exam}</td>
      <td>${r.year}</td>
      <td>${r.score}</td>
      <td>
        <button onclick="editRecord(${idx})">Edit</button>
        <button onclick="deleteRecord(${idx})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// --------------------- EDIT / DELETE FUNCTIONS ---------------------
function editRecord(idx){
  const r = records[idx];
  teacher.value = r.teacher;
  subject.value = r.subject;
  grade.value = r.grade;
  stream.value = r.stream;
  term.value = r.term;
  exam.value = r.exam;
  year.value = r.year;
  score.value = r.score;
  recordIndexInput.value = idx;
}

function deleteRecord(idx){
  if(confirm("🗑️ Are you sure you want to delete this record?")){
    records.splice(idx,1);
    localStorage.setItem('smartRecords', JSON.stringify(records));
    updateAll();
  }
}

// --------------------- SEARCH / FILTER BAR ---------------------
const searchInput = document.createElement('input');
searchInput.id = 'searchInput';
searchInput.placeholder = 'Search records...';
searchInput.style.marginBottom = '10px';
searchInput.onkeyup = () => {
  const query = searchInput.value.toLowerCase();
  const filtered = records.filter(r =>
    r.teacher.toLowerCase().includes(query) ||
    r.subject.toLowerCase().includes(query) ||
    r.grade.toLowerCase().includes(query) ||
    r.stream.toLowerCase().includes(query)
  );
  renderRecords(filtered);
};
document.querySelector('#recordsTable').parentElement.insertBefore(searchInput, document.querySelector('#recordsTable'));

// --------------------- DASHBOARD & SUMMARY ---------------------
function updateAll(){
  populateFilters();
  const filtered = getFiltered();
  renderRecords(filtered);
  renderSummary(filtered);
  renderChart(filtered);
}

// --------------------- CHART ---------------------
function renderChart(filtered){
  if(!ctx) return;
  if(chart) chart.destroy();

  const subjects = unique(filtered.map(r=>r.subject));
  const termAverages = [1,2,3].map(t => subjects.map(sub=>{
    const subset = filtered.filter(r=>r.term==t && r.subject==sub);
    return avg(subset.map(s=>s.score));
  }));

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subjects,
      datasets: [
        {label: 'Term 1', data: termAverages[0], backgroundColor:'#3b82f6'},
        {label: 'Term 2', data: termAverages[1], backgroundColor:'#f59e0b'},
        {label: 'Term 3', data: termAverages[2], backgroundColor:'#10b981'}
      ]
    },
    options:{ responsive:true, scales:{y:{beginAtZero:true,max:100}} }
  });
}

// --------------------- SUMMARY & INSIGHT ---------------------
function renderSummary(filtered){
  const tbody = document.querySelector('#summaryTable tbody');
  tbody.innerHTML = '';
  const grouped = {};

  filtered.forEach(r=>{
    const key = [r.teacher, r.grade, r.stream, r.subject].join('|');
    if(!grouped[key]) grouped[key] = {teacher:r.teacher, grade:r.grade, stream:r.stream, subject:r.subject, t1:[], t2:[], t3:[]};
    grouped[key]['t'+r.term].push(r.score);
  });

  Object.values(grouped).forEach(g=>{
    const a1 = avg(g.t1), a2 = avg(g.t2), a3 = avg(g.t3);
    const overall = avg([a1,a2,a3].filter(v=>v>0));
    const gradeInfo = grading(overall);

    tbody.innerHTML += `
      <tr>
        <td>${g.teacher}</td><td>${g.grade}</td><td>${g.stream}</td><td>${g.subject}</td>
        <td>${a1?a1.toFixed(1):''}</td>
        <td>${a2?a2.toFixed(1):''}</td>
        <td>${a3?a3.toFixed(1):''}</td>
        <td style="color:${gradeInfo.color};font-weight:600;">${overall?overall.toFixed(1):''}</td>
      </tr>`;
  });

  // Smart Insight
  const insights = [];
  Object.values(grouped).forEach(g=>{
    const overall = avg([avg(g.t1), avg(g.t2), avg(g.t3)].filter(v=>v>0));
    const gi = grading(overall);
    if(overall)
      insights.push(`${gi.emoji} <b>${g.teacher}</b> (${g.subject} - Grade ${g.grade}, ${g.stream}) is <span style='color:${gi.color};font-weight:600;'>${gi.label}</span> with an average of <b>${overall.toFixed(1)}</b>.`);
  });
  insightBox.innerHTML = insights.length ? insights.join('<br>') : "<i>No insights yet.</i>";
}

// --------------------- RESET DATA ---------------------
function resetData(){
  if(confirm("⚠️ Resetting will permanently delete all records. Proceed?")){
    localStorage.removeItem('smartRecords');
    records = [];
    updateAll();
    alert("SmartScores says: 🧹 All records cleared!");
  }
}

// --------------------- EXPORT / IMPORT ---------------------
function exportExcel(){
  const data = JSON.stringify(records);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SmartScores_Backup_${new Date().getFullYear()}.json`;
  a.click();
  alert("SmartScores says: 💾 Backup exported successfully!");
}

function importExcel(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const imported = JSON.parse(e.target.result);
      if(Array.isArray(imported)){
        records = imported;
        localStorage.setItem('smartRecords', JSON.stringify(records));
        alert("SmartScores says: 📥 Data imported successfully!");
        updateAll();
      }
    }catch(err){
      alert("❌ Invalid file format!");
    }
  };
  reader.readAsText(file);
}

// --------------------- PDF REPORT ---------------------
async function downloadPDF(){
  const { jsPDF } = window.jspdf;

  // Inline Base64 logo
  const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; // replace with full Base64

  const reportArea = document.createElement('div');
  reportArea.style.padding = '20px';
  reportArea.innerHTML = `
    <div style="text-align:center;">
      <img src="${logoBase64}" style="width:70px;height:70px;"><br>
      <h2 style="color:#1e3a8a;margin:0;">SmartScores Report</h2>
      <p style="font-size:0.9rem;">${new Date().toLocaleString()}</p>
    </div>
    <h3 style="color:#800000;">Recorded Scores</h3>
    ${document.getElementById('recordsTable').outerHTML}
    <br>
    <h3 style="color:#800000;">Average Score Summary</h3>
    ${document.getElementById('summaryTable').outerHTML}
    <br>
    <div style="font-style:italic; text-align:center; color:#1e3a8a;">
      ${insightBox.innerHTML}
    </div>
  `;

  const canvas = await html2canvas(reportArea, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const imgWidth = 550;
  const pageHeight = pdf.internal.pageSize.height;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 20;

  pdf.addImage(imgData, 'PNG', 25, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while(heightLeft > 0){
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 25, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const filename = `SmartScores_Report_${new Date().getFullYear()}.pdf`;
  pdf.save(filename);
  alert("SmartScores says: 📄 PDF report downloaded successfully!");
}

// --------------------- INITIALIZE ---------------------
updateAll();
