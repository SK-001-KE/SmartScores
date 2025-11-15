// firebase-auth.js
import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,         // <-- ADDED: For setting display name
  sendEmailVerification, // <-- ADDED: For email verification
  sendPasswordResetEmail // <-- ADDED: For password reset
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


class FirebaseAuthService {
  constructor() {
    this.isInitialized = false;
    // this.googleProvider = new GoogleAuthProvider(); // REMOVED Google provider
    this.init();
  }

  init() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Cloud user signed in:', user.email);
        this.updateUI(true, user.displayName || user.email);
        
        // Update local storage on sign-in event (e.g., after verification link click)
        if (user.displayName) {
          localStorage.setItem('teacherFullName', user.displayName);
        }
      } else {
        console.log('Cloud user signed out');
        this.updateUI(false);
      }
      this.isInitialized = true;
    });
  }

  // Helper to update local storage and UI after a successful login (or registration)
  async handleSignInSuccess(user, fullName) {
    // Store user data locally
    localStorage.setItem('teacherFullName', fullName);
    localStorage.setItem('teacherEmail', user.email);
    localStorage.setItem('authMethod', 'email');
    localStorage.setItem('lastActivityTime', new Date().toISOString());
    this.updateUI(true, fullName);

    // Ensure Firestore profile is up to date
    await setDoc(doc(db, 'teachers', user.uid), {
      name: fullName,
      email: user.email,
      emailVerified: user.emailVerified,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  }

  // REMOVED: METHOD 1: loginWithGoogle

  // METHOD 2: Email/Password Registration (UPDATED for Name & Verification)
  async registerWithEmail(email, password, fullName) { 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. Set the user's display name in Firebase Auth
      await updateProfile(user, {
          displayName: fullName
      });

      // 2. CRITICAL STEP: Send the verification email
      await sendEmailVerification(user);

      // 3. Create/update teacher profile in Firestore
      await setDoc(doc(db, 'teachers', user.uid), {
        name: fullName, 
        email: user.email,
        emailVerified: user.emailVerified, // Will be false initially
        createdAt: new Date().toISOString()
      });
      
      // We do NOT call handleSignInSuccess here as the user must verify first.

      return { success: true, user: user };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // METHOD 3: Email/Password Login (UPDATED for Verification Check)
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // CRITICAL CHECK: Ensure email is verified
      if (!user.emailVerified) {
        // 1. Force the user out
        await signOut(auth);
        
        // 2. Return an error message and resend verification link
        await sendEmailVerification(user);
        return { 
          success: false, 
          error: `Your email address has not been verified. A new verification link has been sent to ${email}.`
        };
      }
      
      // If verified, continue the normal sign-in process
      const fullName = user.displayName || 'Teacher';

      await this.handleSignInSuccess(user, fullName);

      return { success: true, user: this.getCurrentUser() }; // Return the local user object
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // METHOD 4: Password Reset (NEW)
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout function
  async logout() {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch(e) {
      console.error("Error signing out of Firebase:", e);
    }
    
    // Clear all local data regardless of Firebase status
    localStorage.removeItem('teacherFullName');
    localStorage.removeItem('teacherEmail');
    localStorage.removeItem('authMethod');
    localStorage.removeItem('lastActivityTime');
    localStorage.removeItem('teacherPhoto');
    window.location.href = './login.html';
  }

  // UI update helper (Retained)
  updateUI(isLoggedIn, userName) {
    const teacherNameElements = document.querySelectorAll('.teacher-name, #teacherName');
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

  // Check if user is authenticated (Retained)
  isAuthenticated() {
    // Check local storage for local/cloud login
    return !!localStorage.getItem('teacherFullName'); 
  }

  // Get current user data (Retained)
  getCurrentUser() {
    if (auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: localStorage.getItem('teacherFullName') || auth.currentUser.displayName || 'Teacher',
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

  // Check if user is using cloud auth (Retained)
  isCloudUser() {
    const user = this.getCurrentUser();
    return user && user.uid !== 'local-user';
  }
}

// Create and export singleton instance
const firebaseAuth = new FirebaseAuthService();
export default firebaseAuth;
