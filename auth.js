// auth.js — global login enforcement
(function () {
  const allowedPage = window.location.pathname.includes("login.html");
  const teacher = localStorage.getItem("teacherFullName");

  if (!teacher && !allowedPage) {
    window.location.href = "login.html";
  }
  function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("open");
  sidebar.classList.toggle("closed");
}

})();
