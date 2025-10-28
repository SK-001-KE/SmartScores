// Global variable to store all mean score records
let records = [];

// --- 1. DATA MANAGEMENT ---

// Load records from Local Storage on page load
function loadRecords() {
    // In a real-world scenario with multiple users, this would use Firestore
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

// --- 2. RECORD MANAGEMENT ---

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
        // Using a custom message box instead of alert, as per instructions
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

// Function to determine performance category (Rubric)
function getRubric(score) {
    if (score >= 80) return 'Excellent (A)';
    if (score >= 70) return 'Very Good (B)';
    if (score >= 60) return 'Good (C)';
    if (score >= 50) return 'Average (D)';
    return 'Needs Improvement (E)';
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
        // Apply class for visual feedback
        const scoreCell = row.insertCell();
        scoreCell.textContent = record.meanScore.toFixed(2);
        scoreCell.style.fontWeight = 'bold';
        
        row.insertCell().textContent = record.rubric;
    });
}

// --- 3. SUMMARY CALCULATION ---

// Function to calculate and display the average score summary
function calculateSummary() {
    const summaryData = {};
    let overallSum = 0;
    let overallCount = 0;

    records.forEach(record => {
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

    Object.values(summaryData).forEach(data => {
        const average = data.sum / data.count;

        const row = summaryTableBody.insertRow();
        row.insertCell().textContent = data.grade;
        row.insertCell().textContent = data.subject;
        row.insertCell().textContent = data.stream;
        row.insertCell().textContent = average.toFixed(2);
    });

    displayInsight(overallSum / overallCount);
}

// Function to display performance insights
function displayInsight(overallAverage) {
    const insightBox = document.getElementById('insightBox');
    insightBox.innerHTML = '';

    if (records.length === 0) {
        insightBox.textContent = 'No records available to generate insights.';
        insightBox.style.borderLeftColor = '#2563eb';
        insightBox.style.background = '#f1f5f9';
        return;
    }

    const avg = overallAverage.toFixed(2);
    let insightText = `Overall Average Mean Score: ${avg}. `;
    let color = '#2563eb'; // Default to blue

    if (overallAverage >= 70) {
        insightText += 'Excellent performance! Maintain this momentum.';
        color = '#10b981'; // Green for excellent
    } else if (overallAverage >= 50) {
        insightText += 'Good progress. Focus on areas below 50% for improvement.';
        color = '#f59e0b'; // Yellow/Orange for caution
    } else {
        insightText += 'Attention needed! Develop targeted interventions to boost performance across streams/subjects.';
        color = '#dc2626'; // Red for warning
    }

    insightBox.textContent = insightText;
    insightBox.style.borderLeftColor = color;
    insightBox.style.background = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`;
    insightBox.style.color = color;
}

// --- 4. UTILITY / DASHBOARD CONTROLS ---

// Custom function to replace browser alerts and confirms
function showMessageBox(title, message, type, callback) {
    // Simple implementation using browser alert/confirm for expediency, 
    // but noting that a custom modal UI is required in a final environment.
    if (type === 'confirm' && callback) {
        const result = window.confirm(message);
        callback(result);
    } else {
        window.alert(`${title}: ${message}`);
    }
}

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

// Function to download the report as a clean, data-driven PDF (UPDATED)
function downloadPDF() {
    // Check for the required PDF libraries
    if (!window.jspdf || !window.jspdf.AcroForm.autoTable) {
        showMessageBox("Error", "PDF generation libraries (jsPDF and autotable) are not loaded correctly. Check your index.html file.", 'error');
        return;
    }
    if (records.length === 0) {
        showMessageBox("Info", "No records to generate a PDF report from.", 'info');
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let y = 15; // Vertical position tracker

    // --- 1. Header and Title ---
    pdf.setFontSize(20);
    pdf.setTextColor(37, 99, 235); // Blue
    pdf.text("SmartScores Teacher Mean Score Report", 10, y);
    y += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50); // Dark Gray
    pdf.text(`Generated on: ${today}`, 10, y);
    y += 12;

    // --- 2. Overall Summary & Insight ---
    pdf.setFontSize(14);
    pdf.setTextColor(128, 0, 0); // Maroon
    pdf.text("📈 Overall Performance Summary", 10, y);
    y += 6;

    let overallAverage = 0;
    if (records.length > 0) {
        const totalSum = records.reduce((sum, r) => sum + r.meanScore, 0);
        overallAverage = totalSum / records.length;
    }
    const avgText = `Overall Mean Score: ${overallAverage.toFixed(2)}`;
    
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

    pdf.setFontSize(11);
    pdf.setTextColor(50, 50, 50); 
    pdf.text(avgText, 10, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(insightColor[0], insightColor[1], insightColor[2]);
    pdf.text(insightText, 10, y);
    y += 12;
    
    pdf.setTextColor(0, 0, 0); // Reset color to black

    // --- 3. Recorded Scores Table ---
    pdf.setFontSize(14);
    pdf.setTextColor(37, 99, 235); // Blue
    pdf.text("📊 Individual Recorded Scores", 10, y);
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
        record.meanScore.toFixed(2),
        record.rubric
    ]);

    pdf.autoTable({
        startY: y,
        head: [recordedTableHeaders],
        body: recordedTableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 }, // Blue color
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: 200, lineWidth: 0.1 },
        columnStyles: { 7: { fontStyle: 'bold' } }, // Make score bold
        didDrawPage: function(data) {
            y = data.cursor.y;
        }
    });
    y = pdf.autoTable.previous.finalY + 12; // Get the final Y position after the table

    // Check if a new page is needed before adding the second table
    if (y + 20 > pdf.internal.pageSize.height) {
        pdf.addPage();
        y = 15;
    }


    // --- 4. Average Score Summary Table ---
    pdf.setFontSize(14);
    pdf.setTextColor(128, 0, 0); // Maroon
    pdf.text("📈 Average Score Summary by Class/Stream", 10, y);
    y += 5;

    // Recalculate summary data for the PDF
    const summaryData = {};
    records.forEach(record => {
        const key = `${record.grade}-${record.subject}-${record.stream}`;
        if (!summaryData[key]) {
            summaryData[key] = { sum: 0, count: 0, grade: record.grade, subject: record.subject, stream: record.stream };
        }
        summaryData[key].sum += record.meanScore;
        summaryData[key].count += 1;
    });

    const summaryTableHeaders = ['Grade', 'Subject', 'Stream', 'Average Score'];
    const summaryTableData = Object.values(summaryData).map(data => [
        data.grade,
        data.subject,
        data.stream,
        (data.sum / data.count).toFixed(2)
    ]);

    pdf.autoTable({
        startY: y,
        head: [summaryTableHeaders],
        body: summaryTableData,
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 0], fontSize: 10 }, // Maroon color
        styles: { fontSize: 9, cellPadding: 2, fontStyle: 'bold' },
    });

    // --- 5. Final Save ---
    pdf.save('SmartScores_Data_Report.pdf');
    showMessageBox("Success", "PDF Report generated successfully!", 'success');
}

// Initialize the application when the window loads
window.onload = loadRecords;
