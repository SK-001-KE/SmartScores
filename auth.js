/* =========================================================
   SMARTSCORES AUTHENTICATION v3.0
   Handles login, logout, and session management
========================================================= */

// Storage key for teacher name
const AUTH_KEYS = {
    TEACHER: 'teacherFullName',
    LAST_ACTIVITY: 'lastActivityTime'
};

// DOM Helper
const el = id => document.getElementById(id);

// Authentication state management
const auth = {
    // Check if user is authenticated
    isAuthenticated: function() {
        return !!localStorage.getItem(AUTH_KEYS.TEACHER);
    },
    
    // Get current teacher name
    getCurrentTeacher: function() {
        return localStorage.getItem(AUTH_KEYS.TEACHER) || 'Guest Teacher';
    },
    
    // Login function
    login: function(teacherName) {
        if (!teacherName || teacherName.trim() === '') {
            return false;
        }
        
        localStorage.setItem(AUTH_KEYS.TEACHER, teacherName.trim());
        localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, new Date().toISOString());
        return true;
    },
    
    // Logout function
    logout: function() {
        localStorage.removeItem(AUTH_KEYS.TEACHER);
        localStorage.removeItem(AUTH_KEYS.LAST_ACTIVITY);
        window.location.href = './login.html';
    },
    
    // Check authentication and redirect if needed
    checkAuth: function() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Allow access to login page without authentication
        if (currentPage === 'login.html') {
            // If already logged in and trying to access login page, redirect to dashboard
            if (this.isAuthenticated()) {
                window.location.href = './index.html';
            }
            return true;
        }
        
        // For all other pages, require authentication
        if (!this.isAuthenticated()) {
            window.location.href = './login.html';
            return false;
        }
        
        // Update last activity time
        this.updateActivityTime();
        return true;
    },
    
    // Update last activity timestamp
    updateActivityTime: function() {
        localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, new Date().toISOString());
    },
    
    // Check for session timeout (optional feature)
    checkSessionTimeout: function() {
        const lastActivity = localStorage.getItem(AUTH_KEYS.LAST_ACTIVITY);
        if (!lastActivity) return;
        
        const lastActivityTime = new Date(lastActivity);
        const currentTime = new Date();
        const timeDiff = (currentTime - lastActivityTime) / (1000 * 60); // Difference in minutes
        
        // Auto-logout after 8 hours of inactivity (optional)
        if (timeDiff > 480) { // 8 hours
            this.logout();
            alert('Session expired due to inactivity. Please login again.');
        }
    },
    
    // Initialize auth on page load
    init: function() {
        this.checkAuth();
        this.setupLogoutHandlers();
        this.updateUIWithTeacherName();
        
        // Set up activity tracking
        this.setupActivityTracking();
    },
    
    // Set up logout button handlers
    setupLogoutHandlers: function() {
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    this.logout();
                }
            });
        });
    },
    
    // Update UI with teacher name
    updateUIWithTeacherName: function() {
        const teacherNameElements = document.querySelectorAll('#teacherName, .teacher-name');
        const teacherName = this.getCurrentTeacher();
        
        teacherNameElements.forEach(element => {
            element.textContent = teacherName;
        });
        
        // Update page titles with teacher name on dashboard pages
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'login.html' && document.title.includes('SmartScores')) {
            document.title = `SmartScores - ${teacherName}`;
        }
    },
    
    // Track user activity for session management
    setupActivityTracking: function() {
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        activityEvents.forEach(eventName => {
            document.addEventListener(eventName, () => {
                this.updateActivityTime();
            });
        });
    },
    
    // Get login status for other parts of the app
    getAuthStatus: function() {
        return {
            isAuthenticated: this.isAuthenticated(),
            teacherName: this.getCurrentTeacher(),
            lastActivity: localStorage.getItem(AUTH_KEYS.LAST_ACTIVITY)
        };
    }
};

// ==================== LOGIN PAGE SPECIFIC FUNCTIONS ====================

// Enhanced login form handler
window.handleLogin = function(event) {
    if (event) event.preventDefault();
    
    const firstName = el('firstName')?.value?.trim();
    const lastName = el('lastName')?.value?.trim();
    
    if (!firstName || !lastName) {
        showLoginError('Please enter both first and last name');
        return false;
    }
    
    if (firstName.length < 2 || lastName.length < 2) {
        showLoginError('Names must be at least 2 characters long');
        return false;
    }
    
    const fullName = `${firstName} ${lastName}`;
    
    if (auth.login(fullName)) {
        showLoginSuccess(`Welcome ${fullName}! Redirecting to your dashboard...`);
        
        // Add slight delay for better UX
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1500);
    } else {
        showLoginError('Login failed. Please try again.');
    }
    
    return false;
};

// Login error display
function showLoginError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.login-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.login-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'login-error';
    errorDiv.style.cssText = `
        background: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 8px;
        margin: 15px 0;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    const form = el('loginForm');
    if (form) {
        form.insertBefore(errorDiv, form.querySelector('button'));
    }
    
    // Shake animation for error
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.borderColor = '#dc2626';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 600);
    });
}

// Login success display
function showLoginSuccess(message) {
    // Remove any existing messages
    const existingError = document.querySelector('.login-error');
    if (existingError) {
        existingError.remove();
    }
    
    const existingSuccess = document.querySelector('.login-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create and show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'login-success';
    successDiv.style.cssText = `
        background: #d1fae5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        padding: 12px 16px;
        border-radius: 8px;
        margin: 15px 0;
        font-weight: 500;
        text-align: center;
    `;
    successDiv.innerHTML = `✅ ${message}`;
    
    const form = el('loginForm');
    if (form) {
        form.insertBefore(successDiv, form.querySelector('button'));
    }
    
    // Disable form inputs after successful login
    const inputs = form.querySelectorAll('input, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

// ==================== SIDEBAR MANAGEMENT ====================

// ==================== SIDEBAR MANAGEMENT ====================

// Enhanced sidebar toggle function
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (!sidebar) return;
    
    // Check if we're on desktop (1024px or wider)
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
        // On desktop, sidebar should always be visible
        // We can optionally implement a collapsed/expanded state instead of hiding
        sidebar.classList.remove('closed');
        
        // Optional: Toggle between expanded and collapsed states on desktop
        // sidebar.classList.toggle('collapsed');
    } else {
        // On mobile, toggle the sidebar visibility
        sidebar.classList.toggle('closed');
        
        // Update toggle button text for mobile
        if (toggleBtn) {
            toggleBtn.textContent = sidebar.classList.contains('closed') ? '☰' : '✕';
        }
        
        // Setup click outside to close only on mobile when sidebar is open
        if (!sidebar.classList.contains('closed')) {
            setTimeout(() => {
                document.addEventListener('click', closeSidebarOnClickOutside);
            }, 100);
        } else {
            document.removeEventListener('click', closeSidebarOnClickOutside);
        }
    }
};

// Close sidebar when clicking outside (mobile only)
function closeSidebarOnClickOutside(event) {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (!sidebar || !toggleBtn) return;
    
    // Don't close on desktop
    if (window.innerWidth >= 1024) {
        document.removeEventListener('click', closeSidebarOnClickOutside);
        return;
    }
    
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnToggle = toggleBtn.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnToggle && !sidebar.classList.contains('closed')) {
        sidebar.classList.add('closed');
        document.removeEventListener('click', closeSidebarOnClickOutside);
        
        // Reset toggle button text
        if (toggleBtn) {
            toggleBtn.textContent = '☰';
        }
    }
}

// Auto-manage sidebar on window resize
function handleWindowResize() {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (!sidebar) return;
    
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
        // On desktop: ensure sidebar is visible
        sidebar.classList.remove('closed');
        
        // Remove mobile event listeners
        document.removeEventListener('click', closeSidebarOnClickOutside);
        
        // Hide toggle button or change its behavior
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }
    } else {
        // On mobile: ensure sidebar is hidden by default
        sidebar.classList.add('closed');
        
        // Show toggle button
        if (toggleBtn) {
            toggleBtn.style.display = 'block';
            toggleBtn.textContent = '☰';
        }
    }
}

// Setup sidebar auto-close on mobile when navigating
function setupSidebarAutoClose() {
    const sidebarLinks = document.querySelectorAll('.sidebar a:not(.logout-btn)');
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Only auto-close on mobile
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('sidebarMenu');
                if (sidebar && !sidebar.classList.contains('closed')) {
                    sidebar.classList.add('closed');
                    
                    // Reset toggle button
                    const toggleBtn = document.getElementById('sidebarToggle');
                    if (toggleBtn) {
                        toggleBtn.textContent = '☰';
                    }
                    
                    document.removeEventListener('click', closeSidebarOnClickOutside);
                }
            }
        });
    });
    
    // Handle logout buttons separately if needed
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Don't prevent default for logout buttons
            // Only handle sidebar closing
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('sidebarMenu');
                if (sidebar && !sidebar.classList.contains('closed')) {
                    sidebar.classList.add('closed');
                    
                    const toggleBtn = document.getElementById('sidebarToggle');
                    if (toggleBtn) {
                        toggleBtn.textContent = '☰';
                    }
                }
            }
        });
    });
}

// Initialize sidebar state on page load
function initializeSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (!sidebar) return;
    
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
        // Desktop: sidebar visible, no toggle button needed
        sidebar.classList.remove('closed');
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }
    } else {
        // Mobile: sidebar hidden, show toggle button
        sidebar.classList.add('closed');
        if (toggleBtn) {
            toggleBtn.style.display = 'block';
            toggleBtn.textContent = '☰';
        }
    }
    
    // Setup auto-close for mobile navigation
    setupSidebarAutoClose();
}
// ==================== SESSION MANAGEMENT ====================

// Auto-save draft data (optional enhancement)
function setupAutoSave() {
    const dataEntryForm = el('dataEntryForm');
    if (dataEntryForm) {
        const inputs = dataEntryForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                saveDraftData();
            });
        });
    }
}

function saveDraftData() {
    // Save form data to localStorage as draft
    const formData = {
        subject: el('subject')?.value,
        grade: el('grade')?.value,
        stream: el('stream')?.value,
        term: el('term')?.value,
        examType: el('examType')?.value,
        year: el('year')?.value,
        meanScore: el('meanScore')?.value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('draftFormData', JSON.stringify(formData));
}

function loadDraftData() {
    const draftData = localStorage.getItem('draftFormData');
    if (draftData) {
        const data = JSON.parse(draftData);
        
        // Only load draft if it's from today
        const draftDate = new Date(data.timestamp);
        const today = new Date();
        if (draftDate.toDateString() === today.toDateString()) {
            if (el('subject')) el('subject').value = data.subject || '';
            if (el('grade')) el('grade').value = data.grade || '';
            if (el('stream')) el('stream').value = data.stream || '';
            if (el('term')) el('term').value = data.term || '';
            if (el('examType')) el('examType').value = data.examType || '';
            if (el('year')) el('year').value = data.year || '';
            if (el('meanScore')) el('meanScore').value = data.meanScore || '';
        } else {
            // Clear old draft data
            localStorage.removeItem('draftFormData');
        }
    }
}

// ==================== INITIALIZATION ====================

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth system
    auth.init();
    
    // Setup sidebar auto-close on mobile
    setupSidebarAutoClose();
    
    // Setup auto-save for data entry (optional)
    if (window.location.pathname.includes('data-entry.html')) {
        loadDraftData();
        setupAutoSave();
    }
    
    // Setup login form if on login page
    const loginForm = el('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Auto-focus first name field
        const firstNameInput = el('firstName');
        if (firstNameInput) {
            setTimeout(() => firstNameInput.focus(), 100);
        }
        
        // Enter key support for login
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.id === 'lastName') {
                        handleLogin(e);
                    } else {
                        const nextInput = this.parentElement.nextElementSibling?.querySelector('input');
                        if (nextInput) nextInput.focus();
                    }
                }
            });
        });
    }
    
    // Check for session timeout every minute
    setInterval(() => {
        auth.checkSessionTimeout();
    }, 60000); // Check every minute
});

// ==================== GLOBAL EXPORTS ====================

// Make auth functions available globally
window.auth = auth;
window.logout = () => auth.logout();
window.getCurrentTeacher = () => auth.getCurrentTeacher();

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, AUTH_KEYS };
}
