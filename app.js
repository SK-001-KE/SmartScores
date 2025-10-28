/* app.js — SmartScores v2.0
   - Overwrite modal
   - Export/Import XLSX and JSON
   - Sorted records, averages, PDF
   - Uses SheetJS (xlsx) and jsPDF (both via CDN)
*/

const STORAGE_KEY = 'smartScoresData';
let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// DOM refs
const tbody = document.querySelector('#summaryTable tbody');
const insightText = document.getElementById('insightText');
const saveBtn = document.getElementById('saveBtn');
const pdfBtn = document.getElementById('pdfBtn');
const resetBtn = document.getElementById('resetBtn');
const aboutBtn = document.getElementById('aboutBtn');
const exportXlsxBtn = document.getElementById('exportXlsxBtn');
const importBtn = document.getElementById('importBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
const confirmCancel = document.getElementById('confirmCancel');

const importFileInput = document.getElementById('importFileInput');

// utility functions
function saveStorage(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function formatDateLong(d=new Date()){
  return d.toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
function getPerf(score){
  if(score>=75) return {text:'Exceeding Expectations', code:'EE'};
  if(score>=41) return {text:'Meeting Expectations', code:'ME'};
  if(score>=21) return {text:'Approaching Expectations', code:'AE'};
  return {text:'Below Expectations', code:'BE'};
}
function examOrder(e){
  const map={'Opener Exam':1,'Opener':1,'Mid Term Exam':2,'Mid Term':2,'End Term Exam':3,'End Term':3};
  return map[e]||99;
}
function escapeHtml(s){ if(s===null||s===undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// sorting
function sortRecords(arr){
  return arr.slice().sort((a,b)=>{
    const ga= parseInt(a.grade,10)||0, gb= parseInt(b.grade,10)||0;
    if(ga!==gb) return ga-gb;
    const s = (a.subject||'').localeCompare(b.subject||'');
    if(s!==0) return s;
    const e = examOrder(a.examType||a.exam||''), eb = examOrder(b.examType||b.exam||'');
    if(e!==eb) return e-eb;
    const ta = a.term||'', tb = b.term||'';
    if(ta!==tb) return ta.localeCompare(tb);
    return (a.teacherName||'').localeCompare(b.teacherName||'');
  });
}

// averages per grade|subject|term
function computeAverages(list){
  const map = {};
  list.forEach(r=>{
    const key = `${r.grade}||${r.subject}||${r.term}`;
    if(!map[key]) map[key] = {grade:r.grade, subject:r.subject, term:r.term, sum:0, count:0};
    map[key].sum += Number(r.meanScore||0);
    map[key].count += 1;
  });
  return Object.values(map).map(v=>({grade:v.grade,subject:v.subject,term:v.term,avg:v.sum/v.count}));
}

// render table + averages
function renderTable(){
  tbody.innerHTML = '';
  if(records.length===0){
    tbody.innerHTML = '<tr><td colspan="10">No records yet.</td></tr>';
    insightText.textContent = 'No data yet. Add records to see performance feedback.';
    const avgBlock = document.getElementById('averagesBlock'); if(avgBlock) avgBlock.remove();
    return;
  }
  const sorted = sortRecords(records);
  sorted.forEach(r=>{
    const perf = getPerf(Number(r.meanScore));
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.teacherName)}</td>
      <td>${escapeHtml(r.subject)}</td>
      <td>${escapeHtml(r.grade)}</td>
      <td>${escapeHtml(r.stream)}</td>
      <td>${escapeHtml(r.term)}</td>
      <td>${escapeHtml(r.examType)}</td>
      <td>${escapeHtml(r.year)}</td>
      <td>${Number(r.meanScore).toFixed(1)}</td>
      <td><span class="tag ${perf.code}">${perf.text}</span></td>
      <td>${escapeHtml(r.date)}</td>
    `;
    tbody.appendChild(tr);
  });

  // averages block
  const avgList = computeAverages(records);
  let avgHtml = '';
  if(avgList.length){
    avgHtml += '<div id="averagesBlock" style="margin-top:12px;background:#fff;padding:10px;border-radius:8px;">';
    avgHtml += '<strong>Average (per Grade • Subject • Term)</strong>';
    avgHtml += '<table style="width:100%;margin-top:8px;border-collapse:collapse;"><tr style="background:#f0f6ff;"><th style="padding:6px;border:1px solid #e2e8f0">Grade</th><th style="padding:6px;border:1px solid #e2e8f0">Subject</th><th style="padding:6px;border:1px solid #e2e8f0">Term</th><th style="padding:6px;border:1px solid #e2e8f0">Avg</th></tr>';
    avgList.forEach(a=>{
      const perf = getPerf(a.avg);
      avgHtml += `<tr><td style="padding:6px;border:1px solid #e2e8f0">${escapeHtml(a.grade)}</td><td style="padding:6px;border:1px solid #e2e8f0">${escapeHtml(a.subject)}</td><td style="padding:6px;border:1px solid #e2e8f0">${escapeHtml(a.term)}</td><td style="padding:6px;border:1px solid #e2e8f0">${a.avg.toFixed(1)} <span style="margin-left:6px;padding:3px 6px;border-radius:6px;background:${perfColor(perf.code)};color:white;font-weight:600">${perf.text}</span></td></tr>`;
    });
    avgHtml += '</table></div>';
  }
  // remove old and append
  const old = document.getElementById('averagesBlock'); if(old) old.remove();
  if(avgHtml){
    const container = document.querySelector('.summary') || document.body;
    const div = document.createElement('div'); div.innerHTML = avgHtml;
    container.appendChild(div.firstChild);
  }

  generateInsight();
}

// small perfColor used in average badges
function perfColor(code){
  if(code==='EE') return '#16a34a';
  if(code==='ME') return '#2563eb';
  if(code==='AE') return '#ea580c';
  return '#dc2626';
}

// ---------- Modal helper ----------
let modalResolve = null;
function showConfirmModal({title='Confirm', message='Are you sure?', options=['yes','no','cancel'], labels={yes:'Yes',no:'No',cancel:'Cancel'}}){
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  // show/hide buttons as needed
  confirmYes.style.display = options.includes('yes') ? 'inline-block' : 'none';
  confirmNo.style.display = options.includes('no') ? 'inline-block' : 'none';
  confirmCancel.style.display = options.includes('cancel') ? 'inline-block' : 'none';
  confirmYes.textContent = labels.yes || 'Yes';
  confirmNo.textContent = labels.no || 'No';
  confirmCancel.textContent = labels.cancel || 'Cancel';
  confirmModal.style.display = 'flex';
  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}
confirmYes.addEventListener('click', ()=>{ confirmModal.style.display='none'; if(modalResolve) modalResolve('yes'); });
confirmNo.addEventListener('click', ()=>{ confirmModal.style.display='none'; if(modalResolve) modalResolve('no'); });
confirmCancel.addEventListener('click', ()=>{ confirmModal.style.display='none'; if(modalResolve) modalResolve('cancel'); });

// ---------- Save with modal overwrite check ----------
function findExistingIndex(record){
  return records.findIndex(r =>
    r.teacherName === record.teacherName &&
    r.grade === record.grade &&
    r.subject === record.subject &&
    r.examType === record.examType &&
    r.term === record.term &&
    r.year === record.year
  );
}

async function saveRecord(){
  const teacherName = document.getElementById('teacherName').value.trim();
  const subject = document.getElementById('subject').value;
  const grade = document.getElementById('grade').value;
  const stream = document.getElementById('stream').value;
  const term = document.getElementById('term').value;
  const examType = document.getElementById('examType').value;
  const year = document.getElementById('year').value;
  const meanScoreVal = document.getElementById('meanScore').value;
  const meanScore = meanScoreVal==='' ? NaN : Number(meanScoreVal);

  if(!teacherName || !subject || !grade || !stream || !term || !examType || !year || isNaN(meanScore)){
    alert('⚠️ Please fill ALL fields correctly.');
    return;
  }
  const rec = {teacherName,subject,grade,stream,term,examType,year,meanScore,date:formatDateLong()};
  const idx = findExistingIndex(rec);
  if(idx > -1){
    // show modal: Overwrite?
    const choice = await showConfirmModal({
      title:'Record already exists',
      message:'A record already exists for this Teacher / Grade / Subject / Term / Exam Type / Year. Do you want to overwrite it?',
      options:['yes','no','cancel'],
      labels:{yes:'Overwrite', no:'Keep existing', cancel:'Cancel'}
    });
    if(choice === 'yes'){
      records[idx] = rec;
    } else if(choice === 'no'){
      // keep existing; maybe open edit? here we just abort
      return;
    } else {
      return;
    }
  } else {
    records.push(rec);
  }
  saveStorage();
  document.getElementById('meanScore').value = '';
  renderTable();
  alert('✅ Record saved.');
}

// ---------- PDF export (same as before but uses sorted + table) ----------
function downloadPDF(){
  if(!records.length) return alert('⚠️ No records to export.');
  if(!window.jspdf) return alert('PDF library not loaded.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  doc.setFontSize(14);
  doc.text('SmartScores — Teacher Mean Score Report', 105, 14, {align:'center'});
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDateLong()}`, 14, 22);

  const headers = ['Teacher','Grade','Subject','Exam','Term','Year','Mean','Perf'];
  const colW = [40,12,40,30,20,16,18,30];
  let x = 10; let y = 28;
  doc.setFontSize(9);
  // header
  for(let i=0;i<headers.length;i++){
    doc.setFillColor(230,235,255);
    doc.rect(x,y,colW[i],7,'F');
    doc.text(headers[i], x+1, y+5);
    x += colW[i];
  }
  y += 9;
  // rows
  const sorted = sortRecords(records);
  for(let r of sorted){
    if(y > 270){ doc.addPage(); y = 18; }
    x = 10;
    const cells = [r.teacherName, r.grade, r.subject, r.examType, r.term, r.year, Number(r.meanScore).toFixed(1), getPerf(Number(r.meanScore)).text];
    for(let i=0;i<cells.length;i++){
      doc.text(doc.splitTextToSize(String(cells[i]), colW[i]-2), x+1, y+4);
      x += colW[i];
    }
    y += 7;
  }

  // averages
  if(y > 240){ doc.addPage(); y = 18; }
  y += 8;
  const avgs = computeAverages(records);
  doc.setFontSize(11);
  doc.text('Averages (per Grade • Subject • Term)', 10, y); y += 6;
  const aCols = ['Grade','Subject','Term','Avg']; const aW=[24,80,30,22];
  x = 10;
  doc.setFontSize(9);
  for(let i=0;i<aCols.length;i++){ doc.rect(x,y,aW[i],7,'F'); doc.text(aCols[i], x+1, y+5); x+=aW[i]; }
  y += 9;
  for(let a of avgs){
    if(y > 270){ doc.addPage(); y = 18; }
    x = 10;
    const row = [a.grade, a.subject, a.term, a.avg.toFixed(1)];
    for(let i=0;i<row.length;i++){ doc.text(String(row[i]), x+1, y+4); x += aW[i]; }
    y += 7;
  }

  doc.setFontSize(9);
  doc.text('Kariuki 2025 — SmartScores v2.0', 105, 295, {align:'center'});
  doc.save(`SmartScores_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ---------- Export XLSX using SheetJS ----------
function exportXLSX(){
  if(!records.length) return alert('⚠️ No records to export.');
  if(!window.XLSX) return alert('XLSX library not loaded.');
  // prepare worksheet data
  const wsData = [
    ['Teacher','Subject','Grade','Stream','Term','Exam Type','Year','Mean Score','Date']
  ];
  const sorted = sortRecords(records);
  sorted.forEach(r => wsData.push([r.teacherName, r.subject, r.grade, r.stream, r.term, r.examType, r.year, Number(r.meanScore), r.date]));
  // averages sheet
  const avgs = computeAverages(records);
  const wsAvg = [['Grade','Subject','Term','Average']];
  avgs.forEach(a => wsAvg.push([a.grade, a.subject, a.term, Number(a.avg.toFixed(1))]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const ws2 = XLSX.utils.aoa_to_sheet(wsAvg);
  XLSX.utils.book_append_sheet(wb, ws, 'Records');
  XLSX.utils.book_append_sheet(wb, ws2, 'Averages');
  const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
  const blob = new Blob([wbout], {type:'application/octet-stream'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SmartScores_Backup_${new Date().toISOString().slice(0,10)}.xlsx`;
  a.click();
}

// ---------- Export JSON ----------
function exportJSON(){
  if(!records.length) return alert('⚠️ No records to export.');
  const payload = { exportedAt: new Date().toISOString(), records };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SmartScores_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

// ---------- Import (XLSX or JSON) ----------
function handleImportedObject(obj, mode='merge'){
  // obj: {records: [...] } OR array of records OR SheetJS workbook converted to rows
  let incoming = [];
  if(Array.isArray(obj)) incoming = obj;
  else if(obj && obj.records) incoming = obj.records;
  else {
    alert('Invalid import format.');
    return;
  }
  if(!incoming.length) { alert('No records to import.'); return; }
  if(mode === 'replace'){
    records = incoming;
  } else {
    // merge, avoid duplicates by unique key
    const existingKeys = new Set(records.map(r=>uniqueKey(r)));
    incoming.forEach(r=>{
      if(!existingKeys.has(uniqueKey(r))){
        records.push(r);
        existingKeys.add(uniqueKey(r));
      }
    });
  }
  saveStorage();
  renderTable();
  alert('Import completed.');
}

function uniqueKey(r){
  return `${r.teacherName}||${r.grade}||${r.subject}||${r.examType}||${r.term}||${r.year}||${r.meanScore}`;
}

function importFileHandler(file){
  const name = file.name.toLowerCase();
  const reader = new FileReader();
  if(name.endsWith('.json')){
    reader.onload = e => {
      try {
        const obj = JSON.parse(e.target.result);
        // ask replace/merge
        showConfirmModal({title:'Import JSON', message:'Do you want to REPLACE existing records or MERGE? Press Yes to REPLACE, No to MERGE.', options:['yes','no','cancel'], labels:{yes:'Replace',no:'Merge',cancel:'Cancel'}})
        .then(choice=>{
          if(choice==='yes') handleImportedObject(obj,'replace');
          else if(choice==='no') handleImportedObject(obj,'merge');
        });
      } catch(err){ alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
  } else if(name.endsWith('.xlsx') || name.endsWith('.xls')){
    if(!window.XLSX) return alert('XLSX library not loaded.');
    reader.onload = e=>{
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, {type:'array'});
      // assume first sheet is Records, second sheet optional Averages
      const firstName = wb.SheetNames[0];
      const ws = wb.Sheets[firstName];
      const arr = XLSX.utils.sheet_to_json(ws, {header:1});
      // find header row and map columns
      const header = arr[0].map(h => String(h).trim().toLowerCase());
      const rows = arr.slice(1).filter(r=>r && r.length);
      const incoming = rows.map(row=>{
        const obj = {};
        header.forEach((h,i)=>{
          const val = row[i];
          // normalize common columns
          if(/teacher/.test(h)) obj.teacherName = val || '';
          else if(/subject/.test(h)) obj.subject = val || '';
          else if(/grade/.test(h)) obj.grade = String(val || '');
          else if(/stream/.test(h)) obj.stream = val || '';
          else if(/term/.test(h)) obj.term = val || '';
          else if(/exam/.test(h)) obj.examType = val || '';
          else if(/year/.test(h)) obj.year = String(val || '');
          else if(/mean/.test(h) || /score/.test(h)) obj.meanScore = Number(val||0);
          else if(/date/.test(h)) obj.date = val || formatDateLong();
        });
        if(!obj.date) obj.date = formatDateLong();
        return obj;
      });
      showConfirmModal({title:'Import XLSX', message:'Do you want to REPLACE existing records or MERGE? Yes=REPLACE, No=MERGE.', options:['yes','no','cancel'], labels:{yes:'Replace',no:'Merge',cancel:'Cancel'}})
      .then(choice=>{
        if(choice==='yes') handleImportedObject({records: incoming}, 'replace');
        else if(choice==='no') handleImportedObject({records: incoming}, 'merge');
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Unsupported file type. Please import a .json or .xlsx file.');
  }
}

// hook file input to import button
importBtn && importBtn.addEventListener('click', ()=> importFileInput.click());
importFileInput && (importFileInput.onchange = (e)=>{
  const f = e.target.files[0];
  if(f) importFileHandler(f);
  e.target.value = '';
});

// event listeners
saveBtn && saveBtn.addEventListener('click', saveRecord);
pdfBtn && pdfBtn.addEventListener('click', downloadPDF);
exportXlsxBtn && exportXlsxBtn.addEventListener('click', exportXLSX);
exportJsonBtn && exportJsonBtn.addEventListener('click', exportJSON);
resetBtn && resetBtn.addEventListener('click', async ()=>{
  const choice = await showConfirmModal({title:'Reset App', message:'This will permanently delete all local records. Continue?', options:['yes','no'], labels:{yes:'Delete',no:'Cancel'}});
  if(choice==='yes'){ localStorage.removeItem(STORAGE_KEY); records=[]; renderTable(); }
});
if(aboutBtn){
  aboutBtn.addEventListener('click', ()=> {
    const modal = document.getElementById('aboutModal');
    if(modal) modal.style.display = 'flex';
  });
}

// service worker registration (index may also register)
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{/* ignore */});
}

// initial render
renderTable();
