// firebase-auth.js
import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

class FirebaseAuthService {
  constructor() {
    this.isInitialized = false;
    this.googleProvider = new GoogleAuthProvider();
    this.init();
  }

  init() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User signed in:', user.email);
        this.updateUI(true, user.displayName || user.email);
      } else {
        console.log('User signed out');
        this.updateUI(false);
      }
      this.isInitialized = true;
    });
  }

  // METHOD 1: Google Sign In - FIXED VERSION
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;
      
      // Store user info locally FIRST (immediate feedback)
      localStorage.setItem('teacherFullName', user.displayName || 'Teacher');
      localStorage.setItem('teacherEmail', user.email);
      localStorage.setItem('teacherUID', user.uid);
      localStorage.setItem('authMethod', 'google');
      if (user.photoURL) {
        localStorage.setItem('teacherPhoto', user.photoURL);
      }
      
      // THEN try to create/update Firestore profile (non-blocking)
      try {
        await setDoc(doc(db, 'teachers', user.uid), {
          name: user.displayName || 'Teacher',
          email: user.email,
          photoURL: user.photoURL,
          authMethod: 'google',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Teacher profile updated in Firestore');
      } catch (firestoreError) {
        console.log('⚠️ Firestore update failed, but login continues:', firestoreError);
        // Continue with login even if Firestore fails
      }
      
      this.updateUI(true, user.displayName || user.email);
      return { success: true, user };
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      // Clear local storage on failure
      this.clearLocalStorage();
      return { success: false, error: error.message };
    }
  }

  // METHOD 2: Email & Password Registration - FIXED VERSION
  async registerWithEmail(email, password, firstName, lastName, school) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store locally FIRST
      const fullName = `${firstName} ${lastName}`;
      localStorage.setItem('teacherFullName', fullName);
      localStorage.setItem('teacherEmail', email);
      localStorage.setItem('teacherUID', user.uid);
      localStorage.setItem('authMethod', 'email');
      if (school) {
        localStorage.setItem('teacherSchool', school);
      }
      
      // THEN try Firestore (non-blocking)
      try {
        await setDoc(doc(db, 'teachers', user.uid), {
          name: fullName,
          email: user.email,
          school: school || 'Unknown School',
          authMethod: 'email',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Teacher profile created in Firestore');
      } catch (firestoreError) {
        console.log('⚠️ Firestore update failed, but registration continues:', firestoreError);
        // Continue with registration even if Firestore fails
      }
      
      this.updateUI(true, fullName);
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      // Clear local storage on failure
      this.clearLocalStorage();
      return { success: false, error: error.message };
    }
  }

  // METHOD 3: Email & Password Sign In - FIXED VERSION
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login in Firestore (non-blocking)
      try {
        await setDoc(doc(db, 'teachers', user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreError) {
        console.log('Firestore update failed:', firestoreError);
      }
      
      // Get user profile to display name
      let userData = null;
      try {
        const userDoc = await getDoc(doc(db, 'teachers', user.uid));
        userData = userDoc.exists() ? userDoc.data() : null;
      } catch (error) {
        console.log('Failed to fetch user profile:', error);
      }
      
      // Store locally
      localStorage.setItem('teacherFullName', userData?.name || user.email);
      localStorage.setItem('teacherEmail', user.email);
      localStorage.setItem('teacherUID', user.uid);
      localStorage.setItem('authMethod', 'email');
      if (userData?.school) {
        localStorage.setItem('teacherSchool', userData.school);
      }
      
      this.updateUI(true, userData?.name || user.email);
      return { success: true, user };
    } catch (error) {
      console.error('Email login failed:', error);
      return { success: false, error: error.message };
    }
  }

  // METHOD 4: Local Only (No Firebase) - FIXED VERSION
  loginLocalOnly(firstName, lastName) {
    try {
      const fullName = `${firstName} ${lastName}`;
      localStorage.setItem('teacherFullName', fullName);
      localStorage.setItem('teacherEmail', 'local@user.com');
      localStorage.setItem('teacherUID', 'local-user');
      localStorage.setItem('authMethod', 'local');
      
      this.updateUI(true, fullName);
      return { success: true, local: true };
    } catch (error) {
      console.error('Local login failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout - FIXED VERSION
  async logout() {
    try {
      // Try Firebase logout if user is cloud user
      const user = this.getCurrentUser();
      if (user && user.uid !== 'local-user') {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Firebase logout error:', error);
    } finally {
      // Always clear local storage
      this.clearLocalStorage();
      window.location.href = './login.html';
    }
  }

  clearLocalStorage() {
    const keysToKeep = ['smartScoresRecords', 'smartScoresTargets', 'themeMode']; // Keep your data!
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  updateUI(isLoggedIn, userName = '') {
    // Update teacher name display across the app
    const teacherNameElements = document.querySelectorAll('#teacherName, .teacher-name');
    const teacherPhoto = localStorage.getItem('teacherPhoto');
    
    teacherNameElements.forEach(element => {
      if (isLoggedIn && userName) {
        if (teacherPhoto && element.id === 'teacherName') {
          element.innerHTML = `<img src="${teacherPhoto}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">${userName}`;
        } else {
          element.textContent = userName;
        }
      } else {
        element.textContent = 'Guest Teacher';
      }
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return auth.currentUser || localStorage.getItem('teacherFullName');
  }

  getCurrentUser() {
    if (auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: localStorage.getItem('teacherFullName') || 'Teacher',
        photoURL: auth.currentUser.photoURL,
        authMethod: localStorage.getItem('authMethod') || 'email'
      };
    } else if (localStorage.getItem('teacherFullName')) {
      return {
        uid: localStorage.getItem('teacherUID') || 'local-user',
        email: localStorage.getItem('teacherEmail') || 'local@user.com',
        name: localStorage.getItem('teacherFullName'),
        authMethod: localStorage.getItem('authMethod') || 'local'
      };
    }
    return null;
  }

  // Check if user is using cloud auth
  isCloudUser() {
    const user = this.getCurrentUser();
    return user && user.uid !== 'local-user';
  }
}

// Create and export singleton instance
const firebaseAuth = new FirebaseAuthService();

// Make it available globally for HTML files
window.firebaseAuth = firebaseAuth;

export default firebaseAuth;
