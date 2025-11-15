/* =========================================================
   SMARTSCORES AUTHENTICATION v3.0
   Handles login, logout, and session management
========================================================= */

// Storage key for teacher name
const AUTH_KEYS = {
    TEACHER: 'teacherFullName',
    LAST_ACTIVITY: 'lastActivityTime' // Used for session timeout
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
    
    // Login function (used by local login)
    login: function(teacherName) {
        if (!teacherName || teacherName.trim() === '') {
            return false;
        }
        
        localStorage.setItem(AUTH_KEYS.TEACHER, teacherName.trim());
        localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, new Date().toISOString()); // <-- Update activity time
        return true;
    },
    
    // Logout function
    logout: function() {
        // We only clear local storage here, the firebaseAuth.logout handles cloud sign out
        localStorage.removeItem(AUTH_KEYS.TEACHER);
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
    
    // REMOVED old login form setup logic, as it is now handled in login.html / signup.html
    
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
