// Global variable to store all mean score records
let records = [];

// --- 1. DATA MANAGEMENT ---

// Load records from Local Storage on page load
function loadRecords() {
    const storedRecords = localStorage.getItem('meanScoreRecords');
    if (storedRecords) {
        records = JSON.parse(storedRecords);
    }
    displayRecords();
    calculateSummary();
}

// Save records to Local Storage
function saveToLocalStorage() {
    localStorage.setItem('meanScoreRecords', JSON.stringify(records));
}

// --- 2. UTILITY & UI FUNCTIONS ---

// Function to replace browser alerts and confirms with a custom modal UI
function showMessageBox(title, message, type = 'info', callback = () => {}) {
    // Ensure existing message box is removed
    let existingBox = document.getElementById('customMessageBox');
    if (existingBox) existingBox.remove();

    // Create dark overlay
    const overlay = document.createElement('div');
    overlay.id = 'customMessageBoxOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); z-index: 9999;
    `;
    document.body.appendChild(overlay);

    const box = document.createElement('div');
    box.id = 'customMessageBox';
    box.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 10000; max-width: 350px; text-align: center;
        font-family: 'Segoe UI', Tahoma, sans-serif;
        border-top: 5px solid ${type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#1e40af'};
    `;

    const closeBox = (result) => {
        box.remove();
        overlay.remove();
        if (type === 'confirm') {
            callback(result);
        }
    };

    box.innerHTML = `
        <h3 style="margin-top: 0; color: ${type === 'error' ? '#dc2626' : '#222'};">${title}</h3>
        <p style="margin-bottom: 20px;">${message}</p>
        <div>
            ${type === 'confirm' ? `
                <button id="confirmYes" style="background: #10b981; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-weight: bold;">Yes</button>
                <button id="confirmNo" style="background: #dc2626; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Cancel</button>
            ` : `
                <button id="alertClose" style="background: #1e40af; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">OK</button>
            `}
        </div>
    `;

    document.body.appendChild(box);

    if (type === 'confirm') {
        document.getElementById('confirmYes').onclick = () => closeBox(true);
        document.getElementById('confirmNo').onclick = () => closeBox(false);
    } else {
        document.getElementById('alertClose').onclick = () => closeBox();
    }
}

// Function to determine performance category (Rubric)
function getRubric(score) {
    if (score >= 80) return 'Excellent (A)';
    if (score >= 70) return 'Very Good (B)';
    if (score >= 60) return 'Good (C)';
    if (score >= 50) return 'Average (D)';
    return 'Needs Improvement (E)';
}

// --- 3. RECORD MANAGEMENT ---

// Function to save a new score record
function saveRecord() {
    const teacherName = document.getElementById('teacherName').value.trim();
    const subject = document.getElementById('subject').value;
    const grade = document.getElementById('grade').value;
    const stream = document.getElementById('stream').value;
    const term = document.getElementById('term').value;
    const examType = document.getElementById('examType').value;
    const year = document.getElementById('year').value.trim();
    const meanScoreInput = document.getElementById('meanScore');
    const meanScore = parseFloat(meanScoreInput.value);

    // Basic Validation
    if (!teacherName || !subject || !grade || !stream || !term || !examType || !year || isNaN(meanScore) || meanScore < 0 || meanScore > 100) {
        showMessageBox("Error", "Please fill in all fields correctly. Mean Score must be between 0 and 100.", 'error');
        return;
    }

    const newRecord = {
        teacher: teacherName,
        subject: subject,
        grade: grade,
        stream: stream,
        term: term,
        examType: examType,
        year: year,
        meanScore: meanScore,
        rubric: getRubric(meanScore)
    };

    records.push(newRecord);
    saveToLocalStorage();

    // Clear form inputs after saving
    document.getElementById('teacherName').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('stream').value = '';
    document.getElementById('term').value = '';
    document.getElementById('examType').value = '';
    document.getElementById('year').value = '';
    meanScoreInput.value = '';

    displayRecords();
    calculateSummary();
    showMessageBox("Success", "Record saved successfully!", 'success');
}

// Function to display records in the table
function displayRecords() {
    const tableBody = document.querySelector('#recordsTable tbody');
    tableBody.innerHTML = '';

    records.forEach((record) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = record.teacher;
        row.insertCell().textContent = record.subject;
        row.insertCell().textContent = record.grade;
        row.insertCell().textContent = record.stream;
        row.insertCell().textContent = record.term;
        row.insertCell().textContent = record.examType;
        row.insertCell().textContent = record.year;
        
        // Apply styling for visual feedback based on score
        const scoreCell = row.insertCell();
        scoreCell.textContent = record.meanScore.toFixed(2);
        scoreCell.style.fontWeight = 'bold';
        
        // Conditional styling based on Rubric
        let color = '#333';
        if (record.meanScore >= 80) color = '#10b981'; // Green
        else if (record.meanScore >= 50) color = '#f59e0b'; // Orange
        else color = '#dc2626'; // Red
        scoreCell.style.color = color;

        row.insertCell().textContent = record.rubric;
    });
}

// --- 4. SUMMARY CALCULATION ---

// Function to calculate and display the average score summary
function calculateSummary() {
    const summaryData = {};
    let overallSum = 0;
    let overallCount = 0;

    records.forEach(record => {
        // Group by Grade, Subject, and Stream
        const key = `${record.grade}-${record.subject}-${record.stream}`;
        if (!summaryData[key]) {
            summaryData[key] = {
                sum: 0,
                count: 0,
                grade: record.grade,
                subject: record.subject,
                stream: record.stream
            };
        }
        summaryData[key].sum += record.meanScore;
        summaryData[key].count += 1;
        
        overallSum += record.meanScore;
        overallCount += 1;
    });

    const summaryTableBody = document.querySelector('#summaryTable tbody');
    summaryTableBody.innerHTML = '';

    // Sort summary data by Grade then Subject
    const sortedSummary = Object.values(summaryData).sort((a, b) => {
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        return a.subject.localeCompare(b.subject);
    });


    sortedSummary.forEach(data => {
        const average = data.sum / data.count;

        const row = summaryTableBody.insertRow();
        row.insertCell().textContent = data.grade;
        row.insertCell().textContent = data.subject;
        row.insertCell().textContent = data.stream;
        
        const avgCell = row.insertCell();
        avgCell.textContent = average.toFixed(2);
        avgCell.style.fontWeight = 'bold';
        if (average >= 70) avgCell.style.color = '#059669'; // Dark Green
        else if (average >= 50) avgCell.style.color = '#ca8a04'; // Dark Yellow
        else avgCell.style.color = '#dc2626'; // Red
    });

    displayInsight(overallSum / overallCount);
}

// Function to display performance insights
function displayInsight(overallAverage) {
    const insightBox = document.getElementById('insightBox');
    insightBox.innerHTML = '';

    if (records.length === 0 || isNaN(overallAverage)) {
        insightBox.textContent = 'No records available to generate insights.';
        insightBox.style.borderLeftColor = '#2563eb';
        insightBox.style.background = '#e8f0fe';
        insightBox.style.color = '#1e40af';
        return;
    }

    const avg = overallAverage.toFixed(2);
    let insightText = `Overall Average Mean Score: ${avg}. `;
    let color = '#2563eb'; // Default to blue

    if (overallAverage >= 70) {
        insightText += 'Excellent performance! The overall trend is strong. Focus on maintaining or slightly increasing scores.';
        color = '#059669'; // Green for excellent
    } else if (overallAverage >= 50) {
        insightText += 'Good progress. Consider targeted interventions for subjects/streams with averages below 50% to boost overall performance.';
        color = '#ca8a04'; // Yellow/Orange for caution
    } else {
        insightText += 'Attention needed! Develop specific, urgent interventions to boost performance across all streams and subjects.';
        color = '#dc2626'; // Red for warning
    }

    insightBox.textContent = insightText;
    insightBox.style.borderLeftColor = color;
    // Set background color to a very light shade of the insight color
    const lightBg = color.replace('#', '') + '30'; // Adds a light alpha layer (approx 18%)
    insightBox.style.background = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`;
    insightBox.style.color = color;
}

// --- 5. DATA UTILITY / DASHBOARD CONTROLS ---

// Function to reset all data
function resetData() {
    showMessageBox("Confirm Reset", "Are you sure you want to delete ALL saved mean score data? This action cannot be undone.", 'confirm', (isConfirmed) => {
        if (isConfirmed) {
            localStorage.removeItem('meanScoreRecords');
            records = [];
            displayRecords();
            calculateSummary();
            showMessageBox("Success", "All data has been reset.", 'success');
        }
    });
}

// Function to export data as JSON backup
function exportExcel() {
    if (records.length === 0) {
        showMessageBox("Info", "No data to export.", 'info');
        return;
    }

    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartScores_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessageBox("Success", "Data exported successfully.", 'success');
}

// Function to import data from JSON backup
function importExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedRecords = JSON.parse(e.target.result);
            if (!Array.isArray(importedRecords)) {
                showMessageBox("Error", "Invalid JSON file format. Expected an array.", 'error');
                return;
            }

            showMessageBox("Data Import", "Do you want to REPLACE current records with the imported data? (Cancel to append)", 'confirm', (isConfirmed) => {
                if (isConfirmed) {
                    records = importedRecords;
                } else {
                    records = records.concat(importedRecords);
                }

                saveToLocalStorage();
                displayRecords();
                calculateSummary();
                showMessageBox("Success", `Successfully imported ${importedRecords.length} records.`, 'success');
            });


        } catch (error) {
            showMessageBox("Error", "Error reading or parsing file: " + error.message, 'error');
        }
    };
    reader.readAsText(file);
    // Clear file input to allow re-importing the same file
    event.target.value = ''; 
}


// Function to download the report as a clean, data-driven PDF
function downloadPDF() {
    // Check for the required PDF libraries using the correct global object access
    if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.AcroForm.autoTable) {
        showMessageBox("Error", "PDF generation libraries (jsPDF and autotable) are not loaded correctly. Please check the script tags in your HTML file.", 'error');
        return;
    }

    if (records.length === 0) {
        showMessageBox("Info", "No records to generate a PDF report from.", 'info');
        return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let y = 15; // Vertical position tracker

    // --- 1. Header and Title ---
    pdf.setFontSize(22);
    pdf.setTextColor(37, 99, 235); // Blue
    pdf.text("SmartScores Teacher Mean Score Report", 10, y);
    y += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50); // Dark Gray
    pdf.text(`Generated on: ${today}`, 10, y);
    y += 12;

    // --- 2. Overall Summary & Insight ---
    pdf.setFontSize(16);
    pdf.setTextColor(128, 0, 0); // Maroon
    pdf.text("📈 Overall Performance Summary", 10, y);
    y += 7;

    let overallAverage = 0;
    if (records.length > 0) {
        const totalSum = records.reduce((sum, r) => sum + r.meanScore, 0);
        overallAverage = totalSum / records.length;
    }
    const avgText = `Overall Mean Score: ${overallAverage.toFixed(2)}%`;
    
    let insightText = '';
    let insightColor = [37, 99, 235];
    
    if (overallAverage >= 70) {
        insightText = 'Insight: Excellent performance! Maintain this momentum.';
        insightColor = [16, 185, 129]; // Green
    } else if (overallAverage >= 50) {
        insightText = 'Insight: Good progress. Focus on areas below 50% for improvement.';
        insightColor = [245, 158, 11]; // Orange
    } else {
        insightText = 'Insight: Attention needed! Develop targeted interventions.';
        insightColor = [220, 38, 38]; // Red
    }

    pdf.setFontSize(12);
    pdf.setTextColor(50, 50, 50); 
    pdf.text(avgText, 10, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(insightColor[0], insightColor[1], insightColor[2]);
    pdf.text(insightText, 10, y);
    y += 12;
    
    pdf.setTextColor(0, 0, 0); // Reset color to black

    // --- 3. Average Score Summary Table ---
    pdf.setFontSize(16);
    pdf.setTextColor(37, 99, 235); // Blue
    pdf.text("📊 Average Score Summary by Class/Stream", 10, y);
    y += 5;

    // Recalculate summary data for the PDF (reusing logic from calculateSummary)
    const summaryData = {};
    records.forEach(record => {
        const key = `${record.grade}-${record.subject}-${record.stream}`;
        if (!summaryData[key]) {
            summaryData[key] = { sum: 0, count: 0, grade: record.grade, subject: record.subject, stream: record.stream };
        }
        summaryData[key].sum += record.meanScore;
        summaryData[key].count += 1;
    });

    // Sort summary data by Grade then Subject
    const summaryTableData = Object.values(summaryData).sort((a, b) => {
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        return a.subject.localeCompare(b.subject);
    }).map(data => [
        data.grade,
        data.subject,
        data.stream,
        (data.sum / data.count).toFixed(2) + '%'
    ]);
    
    const summaryTableHeaders = ['Grade', 'Subject', 'Stream', 'Average Score'];
    
    pdf.autoTable({
        startY: y,
        head: [summaryTableHeaders],
        body: summaryTableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], fontSize: 10 }, // Blue color
        styles: { fontSize: 9, cellPadding: 2, fontStyle: 'bold' },
    });
    y = pdf.autoTable.previous.finalY + 12;

    // --- 4. Recorded Scores Table ---
    pdf.setFontSize(16);
    pdf.setTextColor(128, 0, 0); // Maroon
    pdf.text("📜 Detailed Recorded Scores", 10, y);
    y += 5;

    const recordedTableHeaders = [
        'Teacher', 'Subject', 'Grade', 'Stream', 'Term', 'Exam Type', 'Year', 'Score', 'Rubric'
    ];
    const recordedTableData = records.map(record => [
        record.teacher,
        record.subject,
        record.grade,
        record.stream,
        record.term,
        record.examType,
        record.year,
        record.meanScore.toFixed(2) + '%',
        record.rubric
    ]);

    pdf.autoTable({
        startY: y,
        head: [recordedTableHeaders],
        body: recordedTableData,
        theme: 'striped',
        headStyles: { fillColor: [128, 0, 0], fontSize: 9 }, // Maroon color
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: 200, lineWidth: 0.1 },
        columnStyles: { 7: { fontStyle: 'bold' } }, // Make score bold
        didDrawPage: function(data) {
             // Add page number to the bottom
            pdf.setFontSize(8);
            pdf.text('Page ' + data.pageNumber, data.settings.margin.left, pdf.internal.pageSize.height - 10);
        }
    });

    // --- 5. Final Save ---
    pdf.save('SmartScores_Data_Report.pdf');
    showMessageBox("Success", "PDF Report generated successfully!", 'success');
}

// Initialize the application when the window loads
window.onload = loadRecords;
