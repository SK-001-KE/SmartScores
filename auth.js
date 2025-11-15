/* =========================================================
   SMARTSCORES AUTHENTICATION v3.0
   Handles login, logout, and session management
========================================================= */

// Storage key for teacher name - UPDATED FOR CONSISTENCY
const AUTH_KEYS = {
    TEACHER_FULL_NAME: 'teacherFullName',
    TEACHER_FIRST_NAME: 'teacherFirstName', 
    TEACHER_LAST_NAME: 'teacherLastName',
    TEACHER_EMAIL: 'teacherEmail',
    LAST_ACTIVITY: 'lastActivityTime'
};

// DOM Helper
const el = id => document.getElementById(id);

// Authentication state management
const auth = {
    // Check if user is authenticated
    isAuthenticated: function() {
        return !!localStorage.getItem(AUTH_KEYS.TEACHER_FULL_NAME);
    },
    
    // Get current teacher name - UPDATED
    getCurrentTeacher: function() {
        return localStorage.getItem(AUTH_KEYS.TEACHER_FULL_NAME) || 'Guest Teacher';
    },
    
    // Get teacher first name - NEW
    getTeacherFirstName: function() {
        return localStorage.getItem(AUTH_KEYS.TEACHER_FIRST_NAME) || 
               this.getCurrentTeacher().split(' ')[0] || 
               'Teacher';
    },
    
    // Get teacher last name - NEW
    getTeacherLastName: function() {
        return localStorage.getItem(AUTH_KEYS.TEACHER_LAST_NAME) || 
               this.getCurrentTeacher().split(' ').slice(1).join(' ') || 
               '';
    },
    
    // Login function (used by local login) - UPDATED
    login: function(teacherName) {
        if (!teacherName || teacherName.trim() === '') {
            return false;
        }
        
        const firstName = teacherName.split(' ')[0] || '';
        const lastName = teacherName.split(' ').slice(1).join(' ') || '';
        
        localStorage.setItem(AUTH_KEYS.TEACHER_FULL_NAME, teacherName.trim());
        localStorage.setItem(AUTH_KEYS.TEACHER_FIRST_NAME, firstName);
        localStorage.setItem(AUTH_KEYS.TEACHER_LAST_NAME, lastName);
        localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, new Date().toISOString());
        return true;
    },
    
    // Logout function - UPDATED
    logout: function() {
        // Clear all teacher data
        localStorage.removeItem(AUTH_KEYS.TEACHER_FULL_NAME);
        localStorage.removeItem(AUTH_KEYS.TEACHER_FIRST_NAME);
        localStorage.removeItem(AUTH_KEYS.TEACHER_LAST_NAME);
        localStorage.removeItem(AUTH_KEYS.TEACHER_EMAIL);
        localStorage.removeItem(AUTH_KEYS.LAST_ACTIVITY);
        // Do not redirect here, the caller (firebase-auth.js) will handle it.
    },
    
    // Check authentication and redirect if needed
    checkAuth: function() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Allow access to login/signup/privacy page without authentication
        if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'privacy.html') {
            return;
        }
        
        // Redirect to login if not authenticated
        if (!this.isAuthenticated()) {
            window.location.href = './login.html';
        }
    },
    
    // NEW METHOD: Check for session timeout
    checkSessionTimeout: function() {
        const lastActivity = localStorage.getItem(AUTH_KEYS.LAST_ACTIVITY);
        if (!lastActivity || !this.isAuthenticated()) return;

        const timeoutMinutes = 60; // Set timeout to 60 minutes
        const currentTime = new Date().getTime();
        const lastActivityTime = new Date(lastActivity).getTime();
        const elapsedTime = (currentTime - lastActivityTime) / 1000 / 60; // Time in minutes

        if (elapsedTime > timeoutMinutes) {
            console.log('Session timed out. Logging out.');
            // Use the full window.logout for proper redirection and full cleanup
            window.logout(); 
            // Use a standard browser alert since the custom alerts might not be available on every page load
            alert('You have been logged out due to 60 minutes of inactivity.');
        }
    }
};

// NEW: Activity tracking event listeners
const updateActivityTime = () => {
    if (auth.isAuthenticated()) {
        localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, new Date().toISOString());
    }
};

document.addEventListener('mousemove', updateActivityTime);
document.addEventListener('keypress', updateActivityTime);
document.addEventListener('scroll', updateActivityTime);
document.addEventListener('click', updateActivityTime);

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    auth.checkAuth();
    
    // Update teacher name display on all pages
    const teacherNameElements = document.querySelectorAll('.teacher-name, #teacherName');
    const teacherFullName = auth.getCurrentTeacher();
    
    teacherNameElements.forEach(element => {
        element.textContent = teacherFullName;
    });
    
    // Check for session timeout every minute
    setInterval(() => {
        auth.checkSessionTimeout();
    }, 60000); // Check every minute
});

// ==================== GLOBAL EXPORTS ====================

// Make auth functions available globally
window.auth = auth;
// Redirect to index.html after the cloud logout completes its work
window.logout = async () => {
    // If firebaseAuth is available (on pages with the module script) use it.
    if (window.firebaseAuth && window.firebaseAuth.logout) {
        await window.firebaseAuth.logout();
    } else {
        auth.logout();
        window.location.href = './login.html';
    }
}; 
window.getCurrentTeacher = () => auth.getCurrentTeacher();
window.getTeacherFirstName = () => auth.getTeacherFirstName();
window.getTeacherLastName = () => auth.getTeacherLastName();
