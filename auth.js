// auth.js — Global login enforcement + sidebar helper - FIXED VERSION
(function () {
    "use strict";

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function () {
        console.log('Auth.js: Initializing...');
        
        // Auth guard: Redirect if not logged in and not on login page
        const currentPage = window.location.pathname.split("/").pop();
        const allowedPage = currentPage === "login.html";
        const teacher = localStorage.getItem("teacherFullName");

        console.log('Current page:', currentPage, 'Teacher:', teacher);

        if (!teacher && !allowedPage) {
            console.log('Redirecting to login...');
            window.location.replace("./login.html");
            return;
        }

        // If user is on login page but already logged in, redirect to dashboard
        if (teacher && allowedPage) {
            console.log('Already logged in, redirecting to dashboard...');
            window.location.replace("./index.html");
            return;
        }

        // Initialize sidebar toggle if it exists
        initializeSidebar();
        
        // Initialize logout buttons
        initializeLogoutButtons();
    });

    // Global sidebar toggle function
    window.toggleSidebar = function () {
        console.log('Toggle sidebar called');
        const sidebar = document.getElementById('sidebarMenu');
        const toggleBtn = document.getElementById('sidebarToggle');
        
        if (sidebar) {
            sidebar.classList.toggle('closed');
            console.log('Sidebar closed:', sidebar.classList.contains('closed'));
            
            // Update ARIA attributes for accessibility
            if (toggleBtn) {
                const isClosed = sidebar.classList.contains('closed');
                toggleBtn.setAttribute('aria-expanded', !isClosed);
            }
        } else {
            console.log('Sidebar element not found');
        }
    };

    // Initialize sidebar functionality
    function initializeSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const toggleBtn = document.getElementById('sidebarToggle');
        
        console.log('Initializing sidebar:', { sidebar: !!sidebar, toggleBtn: !!toggleBtn });

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

    // Initialize logout buttons
    function initializeLogoutButtons() {
        const logoutButtons = document.querySelectorAll('.logout-btn');
        console.log('Found logout buttons:', logoutButtons.length);
        
        logoutButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                console.log('Logout button clicked');
                window.logout();
            });
        });
    }

    // Global logout function - FIXED
    window.logout = function () {
        console.log('Logout function called');
        if (confirm('Are you sure you want to logout?')) {
            console.log('User confirmed logout');
            localStorage.removeItem('teacherFullName');
            // Also clear other user-specific data if needed
            localStorage.removeItem('smartScoresRecords');
            localStorage.removeItem('smartScoresTargets');
            window.location.href = "./login.html";
        } else {
            console.log('User cancelled logout');
        }
    };

    console.log('Auth.js loaded successfully');

})();
