// Initialize elements
const teacherInput = document.getElementById('teacher-name');
const form = document.getElementById('record-form');
const recordList = document.getElementById('record-list');

// Load records from localStorage
let records = JSON.parse(localStorage.getItem("smartScoresRecords") || "[]");

// Function to save records to localStorage
function saveRecords() {
  localStorage.setItem("smartScoresRecords", JSON.stringify(records));
}

// Function to render records
function renderRecords() {
  recordList.innerHTML = ''; // Clear existing records
  records.forEach((record, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.teacher}</td>
      <td>
        <button class="del" onclick="deleteRecord(${index})">Delete</button>
      </td>
    `;
    recordList.appendChild(row);
  });
}

// Delete a record
function deleteRecord(index) {
  records.splice(index, 1); // Remove record from array
  saveRecords(); // Save updated records
  renderRecords(); // Re-render the list
}

// Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const teacher = teacherInput.value.trim();
  if (!teacher) return alert('Please enter the teacher name.');

  const record = {
    teacher,
    // Add other fields here if needed
  };

  // Save the record to records array
  records.push(record);

  // Save to localStorage
  saveRecords();

  // Retain the teacher name in the input field
  const savedTeacher = record.teacher;
  form.reset();
  teacherInput.value = savedTeacher; // Keep the teacher name after saving

  renderRecords(); // Re-render the list of records
});

// Render the records when the app is loaded
renderRecords();
