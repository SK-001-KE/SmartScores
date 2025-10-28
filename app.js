let records = JSON.parse(localStorage.getItem("smartScoresRecords") || "[]");

function saveRecord() {
  const teacherName = document.getElementById("teacherName").value.trim();
  const subject = document.getElementById("subject").value;
  const grade = document.getElementById("grade").value;
  const stream = document.getElementById("stream").value;
  const term = document.getElementById("term").value;
  const examType = document.getElementById("examType").value;
  const year = document.getElementById("year").value;
  const meanScore = parseFloat(document.getElementById("meanScore").value);
  if (!teacherName||!subject||!grade||!stream||!term||!examType||!year||isNaN(meanScore)){
    alert("⚠️ Fill all fields correctly."); return;
  }
  const existing = records.find(r=>r.teacherName===teacherName&&r.subject===subject&&r.grade===grade&&r.stream===stream&&r.term===term&&r.examType===examType&&r.year===year);
  if(existing && !confirm("⚠️ Record exists. Overwrite?")) return;
  if(existing) records = records.filter(r=>r!==existing);
  const rubric = getRubric(meanScore);
  const colorTag = getRubricColor(rubric);
  records.push({teacherName,subject,grade,stream,term,examType,year,meanScore,rubric,colorTag});
  localStorage.setItem("smartScoresRecords",JSON.stringify(records));
  document.getElementById("meanScore").value="";
  renderRecords(); renderSummary();
  alert(`✅ SmartScores says: Record saved successfully for ${teacherName}!`);
}

function getRubric(score){if(score>=75) return "Exceeding Expectations";if(score>=60)return "Meeting Expectations";if(score>=50)return "Approaching Expectations";return "Below Expectations";}
function getRubricColor(r){switch(r){case "Exceeding Expectations":return "🟢";case "Meeting Expectations":return "🟡";case "Approaching Expectations":return "🟠";case "Below Expectations":return "🔴";}}

function renderRecords(){
  const tbody=document.querySelector("#recordsTable tbody");tbody.innerHTML="";
  records.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.teacherName}</td><td>${r.subject}</td><td>${r.grade}</td><td>${r.stream}</td><td>${r.term}</td><td>${r.examType}</td><td>${r.year}</td><td>${r.meanScore}</td><td>${r.rubric} ${r.colorTag}</td>`;
    tbody.appendChild(tr);
  });
}

function renderSummary(){
  const tbody=document.querySelector("#summaryTable tbody");tbody.innerHTML="";
  const summary={};
  records.forEach(r=>{const key=`${r.grade}-${r.subject}-${r.stream}`;if(!summary[key])summary[key]={total:0,count:0};summary[key].total+=r.meanScore;summary[key].count+=1;});
  let insights="";
  for(const key in summary){
    const [grade,subject,stream]=key.split("-");
    const avg=(summary[key].total/summary[key].count).toFixed(2);
    const tr=document.createElement("tr");tr.innerHTML=`<td>${grade}</td><td>${subject}</td><td>${stream}</td><td>${avg}</td>`;tbody.appendChild(tr);
    if(avg>=75) insights+=`🌟 SmartScores says: ${subject} Grade ${grade} (${stream}) is Exceeding Expectations.\n`;
    else if(avg>=60) insights+=`✅ SmartScores says: ${subject} Grade ${grade} (${stream}) is Meeting Expectations.\n`;
    else if(avg>=50) insights+=`⚠️ SmartScores says: ${subject} Grade ${grade} (${stream}) is Approaching Expectations.\n`;
    else insights+=`🔴 SmartScores says: ${subject} Grade ${grade} (${stream}) is Below Expectations.\n`;
  }
  document.getElementById("insightBox").innerText=insights||"✅ SmartScores says: All classes performing within average range.";
}

function exportExcel(){
  const blob=new Blob([JSON.stringify(records,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="SmartScores_Backup.json"; a.click();
}

function importExcel(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{try{const imported=JSON.parse(e.target.result);if(!Array.isArray(imported))throw new Error("Invalid format.");records=imported;localStorage.setItem("smartScoresRecords",JSON.stringify(records));renderRecords();renderSummary();alert("✅ SmartScores says: Data imported successfully!");}catch(err){alert("⚠️ Failed to import: "+err.message);}};
  reader.readAsText(file);
}

function resetData(){if(confirm("⚠️ Reset all data? This cannot be undone.")){records=[];localStorage.removeItem("smartScoresRecords");renderRecords();renderSummary();alert("✅ SmartScores says: All data has been reset.");}}

function downloadPDF(){
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF();doc.setFontSize(18);doc.text("SmartScores Report",14,20);let startY=30;
  const recordHeaders=["Teacher","Subject","Grade","Stream","Term","Exam Type","Year","Mean Score","Rubric"];
  const recordBody=records.map(r=>[r.teacherName,r.subject,r.grade,r.stream,r.term,r.examType,r.year,r.meanScore,r.rubric+" "+r.colorTag]);
  doc.autoTable({head:[recordHeaders],body:recordBody,startY,styles:{fontSize:10
