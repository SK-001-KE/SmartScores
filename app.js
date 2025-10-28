// SmartScores v2.0 — Complete App Logic
// © SmartScores 2025

let records = JSON.parse(localStorage.getItem('smartRecords') || '[]');

// Form fields
const teacher = document.getElementById('teacherName');
const subject = document.getElementById('subject');
const grade = document.getElementById('grade');
const stream = document.getElementById('stream');
const term = document.getElementById('term');
const exam = document.getElementById('examType');
const year = document.getElementById('year');
const score = document.getElementById('meanScore');

// Filters
const filterTeacher = document.getElementById('filterTeacher');
const filterGrade = document.getElementById('filterGrade');
const filterStream = document.getElementById('filterStream');
const filterYear = document.getElementById('filterYear');
const searchInput = document.getElementById('searchInput');

const insightBox = document.getElementById('insightBox');
let chart;
const ctx = document.getElementById('barChart')?.getContext('2d');

// Hidden index for editing
const recordIndexInput = document.createElement('input');
recordIndexInput.type = 'hidden';
recordIndexInput.id = 'recordIndex';
document.body.appendChild(recordIndexInput);

// -------------------- UTILITY --------------------
function unique(arr){ return [...new Set(arr)]; }
function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function grading(score){
  if(score>=75) return {label:"Exceeding Expectations", color:"#22c55e", emoji:"🏅"};
  if(score>=41) return {label:"Meeting Expectations", color:"#3b82f6", emoji:"😊"};
  if(score>=21) return {label:"Approaching Expectations", color:"#eab308", emoji:"🟡"};
  return {label:"Below Expectations", color:"#ef4444", emoji:"⚠️"};
}

// -------------------- SAVE / EDIT --------------------
function saveRecord(){
  const rec = {
    teacher: teacher.value.trim(),
    subject: subject.value,
    grade: grade.value,
    stream: stream.value,
    term: parseInt(term.value),
    exam: exam.value,
    year: parseInt(year.value),
    score: parseFloat(score.value)
  };
  const idx = recordIndexInput.value ? parseInt(recordIndexInput.value) : -1;
  if(idx>-1){ 
    records[idx]=rec; 
    recordIndexInput.value=''; 
  } else { 
    records.push(rec); 
  }
  localStorage.setItem('smartRecords', JSON.stringify(records));
  alert("✅ Record saved successfully!");
  clearForm();
  updateAll();
}
function clearForm(){ teacher.value=''; subject.value=''; score.value=''; }

// -------------------- FILTERS --------------------
function populateFilters(){
  filterTeacher.innerHTML = '<option value="">All Teachers</option>' + unique(records.map(r=>r.teacher)).sort().map(t=>`<option>${t}</option>`).join('');
  filterGrade.innerHTML = '<option value="">All Grades</option>' + unique(records.map(r=>r.grade)).sort().map(g=>`<option>${g}</option>`).join('');
  filterStream.innerHTML = '<option value="">All Streams</option>' + unique(records.map(r=>r.stream)).sort().map(s=>`<option>${s}</option>`).join('');
  filterYear.innerHTML = '<option value="">All Years</option>' + unique(records.map(r=>r.year)).sort().map(y=>`<option>${y}</option>`).join('');
}
function getFiltered(){
  let filtered = records.filter(r=>
    (!filterTeacher.value || r.teacher===filterTeacher.value) &&
    (!filterGrade.value || r.grade===filterGrade.value) &&
    (!filterStream.value || r.stream===filterStream.value) &&
    (!filterYear.value || r.year==filterYear.value)
  );
  const termSearch = searchInput.value.trim().toLowerCase();
  if(termSearch){
    filtered = filtered.filter(r =>
      r.teacher.toLowerCase().includes(termSearch) ||
      r.subject.toLowerCase().includes(termSearch) ||
      r.grade.toString().includes(termSearch) ||
      r.stream.toLowerCase().includes(termSearch) ||
      r.exam.toLowerCase().includes(termSearch) ||
      r.year.toString().includes(termSearch)
    );
  }
  return filtered;
}

// -------------------- RECORDS --------------------
function renderRecords(){
  const tbody = document.querySelector('#recordsTable tbody'); tbody.innerHTML='';
  getFiltered().forEach((r, idx)=>{
    const gradeInfo = grading(r.score);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.teacher}</td><td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td><td>${r.term}</td><td>${r.exam}</td><td>${r.year}</td><td style="color:${gradeInfo.color}; font-weight:600;">${r.score}</td>
      <td><button onclick="editRecord(${idx})">✏️ Edit</button> <button onclick="deleteRecord(${idx})" style="background:#dc2626;">🗑️</button></td>`;
    tbody.appendChild(tr);
  });
}
function editRecord(idx){
  const r = records[idx]; 
  teacher.value=r.teacher; subject.value=r.subject; grade.value=r.grade; stream.value=r.stream; 
  term.value=r.term; exam.value=r.exam; year.value=r.year; score.value=r.score; 
  recordIndexInput.value=idx;
}
function deleteRecord(idx){
  if(confirm("⚠️ Delete this record?")){
    records.splice(idx,1); 
    localStorage.setItem('smartRecords', JSON.stringify(records)); 
    updateAll(); 
  }
}

// -------------------- SUMMARY & INSIGHTS --------------------
function renderSummary(){
  const tbody = document.querySelector('#summaryTable tbody'); tbody.innerHTML='';
  const filtered = getFiltered();
  const grouped = {};
  filtered.forEach(r=>{
    const key = [r.teacher,r.grade,r.stream,r.subject].join('|');
    if(!grouped[key]) grouped[key]={teacher:r.teacher,grade:r.grade,stream:r.stream,subject:r.subject,t1:[],t2:[],t3:[]};
    grouped[key]['t'+r.term].push(r.score);
  });
  const insights=[];
  Object.values(grouped).forEach(g=>{
    const a1=avg(g.t1), a2=avg(g.t2), a3=avg(g.t3);
    const overall=avg([a1,a2,a3].filter(v=>v>0));
    tbody.innerHTML+=`<tr><td>${g.teacher}</td><td>${g.grade}</td><td>${g.stream}</td><td>${g.subject}</td><td>${a1?a1.toFixed(1):''}</td><td>${a2?a2.toFixed(1):''}</td><td>${a3?a3.toFixed(1):''}</td><td style="color:${grading(overall).color}; font-weight:600;">${overall?overall.toFixed(1):''}</td></tr>`;
    if(overall) insights.push(`${grading(overall).emoji} <b>${g.teacher}</b> (${g.subject} - Grade ${g.grade}, ${g.stream}) is <span style='color:${grading(overall).color}; font-weight:600;'>${grading(overall).label}</span> with an average of <b>${overall.toFixed(1)}</b>.`);
  });
  insightBox.innerHTML = insights.length ? insights.join('<br>') : "<i>No insights yet.</i>";
}

// -------------------- CHART --------------------
function renderChart(){
  if(!ctx) return; if(chart) chart.destroy();
  const filtered = getFiltered();
  const subjects = unique(filtered.map(r=>r.subject));
  const termAverages = [1,2,3].map(t=>subjects.map(sub=>{
    const subset=filtered.filter(r=>r.term==t && r.subject==sub); 
    return avg(subset.map(s=>s.score)); 
  }));
  chart = new Chart(ctx,{
    type:'bar',
    data:{labels:subjects,datasets:[
      {label:'Term 1',data:termAverages[0],backgroundColor:'#3b82f6'},
      {label:'Term 2',data:termAverages[1],backgroundColor:'#f59e0b'},
      {label:'Term 3',data:termAverages[2],backgroundColor:'#10b981'}
    ]},
    options:{responsive:true,scales:{y:{beginAtZero:true,max:100}}}
  });
}

// -------------------- UPDATE --------------------
function updateAll(){ populateFilters(); renderRecords(); renderSummary(); renderChart(); }
searchInput.addEventListener('input', updateAll);
filterTeacher.addEventListener('change', updateAll);
filterGrade.addEventListener('change', updateAll);
filterStream.addEventListener('change', updateAll);
filterYear.addEventListener('change', updateAll);

// -------------------- RESET / EXPORT / IMPORT --------------------
function resetData(){ if(confirm("⚠️ Reset all records?")){ records=[]; localStorage.removeItem('smartRecords'); updateAll(); } }
function exportExcel(){ 
  const blob=new Blob([JSON.stringify(records)],{type:'application/json'}); 
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); 
  a.download=`SmartScores_Backup_${new Date().getFullYear()}.json`; a.click(); 
}
function importExcel(e){ 
  const file=e.target.files[0]; 
  if(!file) return; 
  const reader=new FileReader(); 
  reader.onload=ev=>{
    try{
      const imported=JSON.parse(ev.target.result); 
      if(Array.isArray(imported)){
        records=imported; 
        localStorage.setItem('smartRecords', JSON.stringify(records)); 
        updateAll(); 
        alert("📥 Import successful!"); 
      } 
    }catch(err){ alert("❌ Invalid file!"); }
  }; 
  reader.readAsText(file); 
}

// -------------------- PDF --------------------
async function downloadPDF() {
  try {
    const { jsPDF } = window.jspdf || jspdf;
    const reportArea = document.createElement('div');
    reportArea.style.padding = '20px';
    reportArea.innerHTML = `
      <h2 style="text-align:center; color:#1e3a8a;">SmartScores Report</h2>
      <p style="text-align:center; font-size:0.9rem;">${new Date().toLocaleString()}</p>
      <h3 style="color:#800000;">Recorded Scores</h3>
      ${document.getElementById('recordsTable').outerHTML}
      <h3 style="color:#800000;">Average Score Summary</h3>
      ${document.getElementById('summaryTable').outerHTML}
      <div style="font-style:italic; text-align:center; color:#1e3a8a;">${insightBox.innerHTML}</div>
    `;
    const canvas = await html2canvas(reportArea,{scale:2});
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({orientation:'portrait',unit:'pt',format:'a4'});
    const imgWidth=550; const pageHeight=pdf.internal.pageSize.height;
    const imgHeight=(canvas.height*imgWidth)/canvas.width; let heightLeft=imgHeight; let position=20;
    pdf.addImage(imgData,'PNG',25,position,imgWidth,imgHeight); heightLeft-=pageHeight;
    while(heightLeft>0){ position=heightLeft-imgHeight; pdf.addPage(); pdf.addImage(imgData,'PNG',25,position,imgWidth,imgHeight); heightLeft-=pageHeight; }
    pdf.save(`SmartScores_Report_${new Date().getFullYear()}.pdf`);
    alert("📄 PDF downloaded!");
  } catch(err) { console.error(err); alert("❌ PDF generation failed!"); }
}

// -------------------- INITIALIZE --------------------
updateAll();
