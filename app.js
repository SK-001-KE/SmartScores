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
    const meanScore = parseFloat(document.getElementById('meanScore').value);

    // Basic Validation
    if (!teacherName || !subject || !grade || !stream || !term || !examType || !year || isNaN(meanScore) || meanScore < 0 || meanScore > 100) {
        alert("Please fill in all fields correctly. Mean Score must be between 0 and 100.");
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
    document.getElementById('meanScore').value = '';


    displayRecords();
    calculateSummary();
    alert("Record saved successfully!");
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
        row.insertCell().textContent = record.meanScore.toFixed(2);
        row.insertCell().textContent = record.rubric;
    });
}

// --- 3. SUMMARY CALCULATION ---

// Function to calculate and display the average score summary
function calculateSummary() {
    const summaryData = {};

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
    });

    const summaryTableBody = document.querySelector('#summaryTable tbody');
    summaryTableBody.innerHTML = '';
    let overallSum = 0;
    let overallCount = 0;

    Object.values(summaryData).forEach(data => {
        const average = data.sum / data.count;
        overallSum += data.sum;
        overallCount += data.count;

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
        return;
    }

    const avg = overallAverage.toFixed(2);
    let insightText = `Overall Average Mean Score: ${avg}. `;

    if (avg >= 70) {
        insightText += 'Excellent performance! Maintain this momentum.';
    } else if (avg >= 50) {
        insightText += 'Good progress. Focus on areas below 50% for improvement.';
    } else {
        insightText += 'Attention needed! Develop targeted interventions to boost performance across streams/subjects.';
    }

    insightBox.textContent = insightText;
}

// --- 4. UTILITY / DASHBOARD CONTROLS ---

// Function to reset all data
function resetData() {
    if (confirm("Are you sure you want to delete ALL saved mean score data? This action cannot be undone.")) {
        localStorage.removeItem('meanScoreRecords');
        records = [];
        displayRecords();
        calculateSummary();
        alert("All data has been reset.");
    }
}

// Function to export data as JSON backup
function exportExcel() {
    if (records.length === 0) {
        alert("No data to export.");
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
                alert("Invalid JSON file format. Expected an array.");
                return;
            }

            // Optional: Ask user if they want to overwrite or append
            if (records.length > 0 && !confirm("Do you want to REPLACE current records with the imported data? (Cancel to append)")) {
                records = records.concat(importedRecords);
            } else {
                records = importedRecords;
            }

            saveToLocalStorage();
            displayRecords();
            calculateSummary();
            alert(`Successfully imported ${importedRecords.length} records.`);

        } catch (error) {
            alert("Error reading or parsing file: " + error.message);
        }
    };
    reader.readAsText(file);
}

// Function to download the report as a PDF
function downloadPDF() {
    // Check for the PDF libraries; this is the key to preventing the original error.
    if (!window.jspdf || typeof html2canvas !== 'function') {
        alert("PDF generation libraries (html2canvas and jsPDF) are not loaded correctly. Check your index.html file.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const element = document.querySelector('main'); // Capture the main content area

    // Temporarily hide action buttons for a cleaner PDF capture
    const dashboardControls = document.querySelector('.dashboard-controls');
    dashboardControls.style.display = 'none';

    // Capture the HTML element as an image (canvas)
    html2canvas(element, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for units, 'a4' size
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add the first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Handle multi-page content
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save('SmartScores_Report.pdf');

        // Restore the action buttons
        dashboardControls.style.display = 'flex'; // Changed to 'flex' to match your inline style in HTML
    });
}


// Initialize the application when the window loads
window.onload = loadRecords;
