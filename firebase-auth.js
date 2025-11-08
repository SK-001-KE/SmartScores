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

  // METHOD 1: Google Sign In
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;
      
      // Create/update teacher profile in Firestore
      await setDoc(doc(db, 'teachers', user.uid), {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        authMethod: 'google',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      // Store user info locally
      localStorage.setItem('teacherFullName', user.displayName);
      localStorage.setItem('teacherEmail', user.email);
      localStorage.setItem('teacherUID', user.uid);
      localStorage.setItem('authMethod', 'google');
      if (user.photoURL) {
        localStorage.setItem('teacherPhoto', user.photoURL);
      }
      
      this.updateUI(true, user.displayName);
      return { success: true, user };
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      return { success: false, error: error.message };
    }
  }

  // METHOD 2: Email & Password Registration
  async registerWithEmail(email, password, firstName, lastName, school) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create teacher profile in Firestore
      await setDoc(doc(db, 'teachers', user.uid), {
        name: `${firstName} ${lastName}`,
        email: user.email,
        school: school || 'Unknown School',
        authMethod: 'email',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      // Also store locally
      localStorage.setItem('teacherFullName', `${firstName} ${lastName}`);
      localStorage.setItem('teacherEmail', email);
      localStorage.setItem('teacherUID', user.uid);
      localStorage.setItem('teacherSchool', school || 'Unknown School');
      localStorage.setItem('authMethod', 'email');
      
      this.updateUI(true, `${firstName} ${lastName}`);
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // METHOD 3: Email & Password Sign In
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await setDoc(doc(db, 'teachers', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      // Get user profile to display name
      const userDoc = await getDoc(doc(db, 'teachers', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
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

  // METHOD 4: Local Only (No Firebase)
  loginLocalOnly(firstName, lastName) {
    localStorage.setItem('teacherFullName', `${firstName} ${lastName}`);
    localStorage.setItem('teacherEmail', 'local@user.com');
    localStorage.setItem('teacherUID', 'local-user');
    localStorage.setItem('authMethod', 'local');
    
    this.updateUI(true, `${firstName} ${lastName}`);
    return { success: true, local: true };
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      this.clearLocalStorage();
      window.location.href = './login.html';
    }
  }

  clearLocalStorage() {
    const keysToKeep = ['smartScoresRecords', 'smartScoresTargets']; // Keep your data!
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
        uid: 'local-user',
        email: localStorage.getItem('teacherEmail') || 'local@user.com',
        name: localStorage.getItem('teacherFullName'),
        authMethod: 'local'
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
export default firebaseAuth;
