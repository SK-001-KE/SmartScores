// auth.js — Global login enforcement + sidebar helper
(function () {
    "use strict";

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function () {
        // Auth guard: Redirect if not logged in and not on login page
        const currentPage = window.location.pathname.split("/").pop();
        const allowedPage = currentPage === "login.html";
        const teacher = localStorage.getItem("teacherFullName");

        if (!teacher && !allowedPage) {
            window.location.replace("./login.html");
            return;
        }

        // If user is on login page but already logged in, redirect to dashboard
        if (teacher && allowedPage) {
            window.location.replace("./index.html");
            return;
        }

        // Initialize sidebar toggle if it exists
        initializeSidebar();
    });

    // Global sidebar toggle function
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebarMenu');
        const toggleBtn = document.getElementById('sidebarToggle');
        
        if (sidebar) {
            sidebar.classList.toggle('closed');
            
            // Update ARIA attributes for accessibility
            if (toggleBtn) {
                const isClosed = sidebar.classList.contains('closed');
                toggleBtn.setAttribute('aria-expanded', !isClosed);
            }
        }
    };

    // Initialize sidebar functionality
    function initializeSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const toggleBtn = document.getElementById('sidebarToggle');
        
        if (!sidebar || !toggleBtn) return;

        // Set initial ARIA state
        const isInitiallyClosed = sidebar.classList.contains('closed');
        toggleBtn.setAttribute('aria-expanded', !isInitiallyClosed);
        
        // Close sidebar when clicking on a link (mobile)
        if (window.innerWidth < 1024) {
            const sidebarLinks = sidebar.querySelectorAll('a');
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    sidebar.classList.add('closed');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Close sidebar when clicking outside (mobile)
        document.addEventListener('click', function (event) {
            if (window.innerWidth >= 1024) return;
            
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = toggleBtn.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && !sidebar.classList.contains('closed')) {
                sidebar.classList.add('closed');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Global logout function
    window.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('teacherFullName');
            window.location.href = './login.html';
        }
    };

})();
