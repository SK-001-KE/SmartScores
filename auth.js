// auth.js — global login enforcement
(function () {
  "use strict";

  // Fix: Use filename only (works in root or subfolder)
  const currentPage = window.location.pathname.split("/").pop();
  const allowedPage = currentPage === "login.html";
  const teacher = localStorage.getItem("teacherFullName");

  // Original: Redirect if not logged in and not on login page
  if (!teacher && !allowedPage) {
    window.location.replace("login.html"); // Prevents back-button loop
  }

  // Original: Toggle sidebar open/closed
  // Fixed: Exposed globally so onclick="toggleSidebar()" works
  window.toggleSidebar = function () {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open");
      sidebar.classList.toggle("closed");
    }
  };
})();
