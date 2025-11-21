// firebase-sync.js
import { db } from './firebase-config.js';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import firebaseAuth from './firebase-auth.js';

class FirebaseSyncService {
  constructor() {
    this.syncEnabled = true;
    this.syncQueue = [];
    this.isSyncing = false;
    this.setupOnlineListener();
  }

  setupOnlineListener() {
    // Listen for online/offline status
    window.addEventListener('online', () => {
      console.log('Device came online, syncing queued data...');
      this.trySyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Device went offline, using local storage only');
    });
  }

  // Enhanced save function - saves to both local and cloud
  async saveData(key, data, collectionName = 'userData') {
    const user = firebaseAuth.getCurrentUser();
    
    if (!user) {
      console.log('No user, saving to localStorage only');
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }

    // 1. Always save to localStorage first (immediate)
    console.log(`💾 Saving ${key} locally:`, data.length || data);
    localStorage.setItem(key, JSON.stringify(data));
    
    // 2. If user is cloud-authenticated and online, sync to Firebase
    if (this.shouldSyncToCloud(user)) {
      try {
        await this.syncToFirestore(user.uid, key, data, collectionName);
        console.log(`✅ Synced ${key} to cloud:`, data.length || data);
        return true;
      } catch (error) {
        console.log(`❌ Cloud sync failed for ${key}, data saved locally only:`, error);
        this.addToSyncQueue(user.uid, key, data, collectionName);
        return true; // Still successful because local save worked
      }
    } else {
      console.log(`📱 Saved ${key} locally only (offline or local user)`);
      return true;
    }
  }

  shouldSyncToCloud(user) {
    return user && user.uid !== 'local-user' && navigator.onLine && this.syncEnabled;
  }

  async syncToFirestore(userId, key, data, collectionName) {
    const docRef = doc(db, collectionName, userId, 'smartScores', key);
    await setDoc(docRef, {
      data: data,
      lastUpdated: new Date().toISOString(),
      syncVersion: Date.now(),
      recordCount: Array.isArray(data) ? data.length : null,
      dataType: this.getDataType(key)
    }, { merge: true });
  }

  // Helper to determine data type for better organization
  getDataType(key) {
    const typeMap = {
      'smartScoresRecords': 'scores',
      'smartScoresTargets': 'targets', 
      'teacherConfig': 'configuration',
      'learnerScores': 'learner_scores',
      'teacherFullName': 'profile'
    };
    return typeMap[key] || 'general';
  }

  addToSyncQueue(userId, key, data, collectionName) {
    this.syncQueue.push({ userId, key, data, collectionName, timestamp: Date.now() });
    console.log(`📦 Added to sync queue: ${key} (${this.syncQueue.length} items queued)`);
    
    // Try to sync queue when back online
    if (this.syncQueue.length === 1) {
      this.trySyncQueue();
    }
  }

  async trySyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0 || !navigator.onLine) return;
    
    this.isSyncing = true;
    console.log(`🔄 Syncing ${this.syncQueue.length} queued items...`);
    
    // Create a copy of the queue to avoid modification during iteration
    const queueCopy = [...this.syncQueue];
    
    for (const item of queueCopy) {
      try {
        await this.syncToFirestore(item.userId, item.key, item.data, item.collectionName);
        // Remove successful item from the actual queue
        this.syncQueue = this.syncQueue.filter(q => q.timestamp !== item.timestamp);
        console.log('✅ Synced queued item:', item.key);
      } catch (error) {
        console.log('❌ Failed to sync queued item, will retry later:', error);
        break;
      }
    }
    
    this.isSyncing = false;
    console.log(`✅ Sync queue completed. ${this.syncQueue.length} items remaining.`);
  }

  // Load data - tries cloud first, falls back to local
  async loadData(key, defaultValue = []) {
    const user = firebaseAuth.getCurrentUser();
    
    // If cloud user and online, try to load from cloud
    if (this.shouldLoadFromCloud(user)) {
      try {
        const cloudData = await this.loadFromFirestore(user.uid, key);
        if (cloudData) {
          console.log(`☁️ Loaded ${key} from cloud:`, cloudData.length || cloudData);
          // Update localStorage with cloud data
          localStorage.setItem(key, JSON.stringify(cloudData));
          return cloudData;
        }
      } catch (error) {
        console.log(`❌ Cloud load failed for ${key}, using local data:`, error);
      }
    }
    
    // Fallback to local storage
    try {
      const data = localStorage.getItem(key);
      const parsedData = data ? JSON.parse(data) : defaultValue;
      console.log(`📱 Loaded ${key} locally:`, parsedData.length || parsedData);
      return parsedData;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultValue;
    }
  }

  shouldLoadFromCloud(user) {
    return user && user.uid !== 'local-user' && navigator.onLine && this.syncEnabled;
  }

  async loadFromFirestore(userId, key) {
    const docRef = doc(db, 'userData', userId, 'smartScores', key);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.data;
    }
    return null;
  }

  // NEW: Update teacher name in existing records
  async updateTeacherNameInRecords(newFullName) {
    try {
        const records = await this.loadRecords();
        let updated = false;
        
        // Update teacher name in all records
        const updatedRecords = records.map(record => {
            if (record.teacher && record.teacher !== newFullName) {
                updated = true;
                return {
                    ...record,
                    teacher: newFullName
                };
            }
            return record;
        });
        
        if (updated) {
            await this.saveRecords(updatedRecords);
            console.log('✅ Updated teacher name in all records');
        }
        
        return updated;
    } catch (error) {
        console.error('❌ Error updating teacher name in records:', error);
        return false;
    }
  }

  // NEW: Sync teacher configuration specifically
  async syncTeacherConfig(config) {
    return await this.saveData('teacherConfig', config);
  }

  // NEW: Load teacher configuration specifically
  async loadTeacherConfig(defaultConfig = {}) {
    return await this.loadData('teacherConfig', defaultConfig);
  }

  // Enhanced versions of your existing functions
  async loadRecords() {
    return await this.loadData('smartScoresRecords', []);
  }

  async saveRecords(records) {
    return await this.saveData('smartScoresRecords', records);
  }

  async loadTargets() {
    return await this.loadData('smartScoresTargets', []);
  }

  async saveTargets(targets) {
    return await this.saveData('smartScoresTargets', targets);
  }

  // Sync all existing local data to cloud (for migration) - UPDATED
  async syncExistingDataToCloud() {
    const user = firebaseAuth.getCurrentUser();
    if (!this.shouldSyncToCloud(user)) return;

    try {
        console.log('🔄 Syncing existing local data to cloud...');
        
        // Update teacher name in existing records if needed
        const currentTeacherName = localStorage.getItem('teacherFullName');
        if (currentTeacherName) {
            await this.updateTeacherNameInRecords(currentTeacherName);
        }
        
        // Sync records
        const localRecords = localStorage.getItem('smartScoresRecords');
        if (localRecords) {
            const records = JSON.parse(localRecords);
            if (records.length > 0) {
                await this.saveRecords(records);
            }
        }
        
        // Sync targets
        const localTargets = localStorage.getItem('smartScoresTargets');
        if (localTargets) {
            const targets = JSON.parse(localTargets);
            if (targets.length > 0) {
                await this.saveTargets(targets);
            }
        }

        // Sync teacher configuration
        const localConfig = localStorage.getItem('teacherConfig');
        if (localConfig) {
            const config = JSON.parse(localConfig);
            await this.syncTeacherConfig(config);
        }
        
        console.log('✅ Existing data sync completed');
    } catch (error) {
        console.error('❌ Existing data sync failed:', error);
    }
  }

  // NEW: Check if user has cloud data available
  async checkCloudDataAvailability() {
    const user = firebaseAuth.getCurrentUser();
    if (!this.shouldLoadFromCloud(user)) return false;

    try {
      const keys = ['smartScoresRecords', 'smartScoresTargets', 'teacherConfig'];
      for (const key of keys) {
        const data = await this.loadFromFirestore(user.uid, key);
        if (data) return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking cloud data availability:', error);
      return false;
    }
  }

  // Get sync status
  getSyncStatus() {
    const user = firebaseAuth.getCurrentUser();
    return {
      isOnline: navigator.onLine,
      isCloudUser: user && user.uid !== 'local-user',
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      syncEnabled: this.syncEnabled,
      userId: user ? user.uid : null
    };
  }

  // NEW: Force sync all data
  async forceSyncAll() {
    console.log('🔄 Force syncing all data to cloud...');
    
    // Sync records
    const records = await this.loadRecords();
    await this.saveRecords(records);
    
    // Sync targets  
    const targets = await this.loadTargets();
    await this.saveTargets(targets);
    
    // Sync teacher config
    const config = localStorage.getItem('teacherConfig');
    if (config) {
      await this.syncTeacherConfig(JSON.parse(config));
    }
    
    console.log('✅ Force sync completed');
  }
}
// Add this method to your FirebaseSyncService class in firebase-sync.js
async clearAllUserData() {
  const user = firebaseAuth.getCurrentUser();
  
  try {
    // Clear local storage
    localStorage.removeItem('smartScoresRecords');
    localStorage.removeItem('smartScoresTargets');
    localStorage.removeItem('teacherConfig');
    localStorage.removeItem('learnerScores');
    
    console.log('✅ Cleared local data');
    
    // Clear cloud data if user exists and is cloud user
    if (this.shouldSyncToCloud(user)) {
      try {
        // Save empty arrays to cloud
        await this.saveRecords([]);
        await this.saveTargets([]);
        await this.syncTeacherConfig({});
        
        console.log('✅ Cleared cloud data');
        return { success: true, cloudCleared: true };
      } catch (cloudError) {
        console.error('Error clearing cloud data:', cloudError);
        return { success: true, cloudCleared: false, error: cloudError };
      }
    }
    
    return { success: true, cloudCleared: false };
  } catch (error) {
    console.error('Error in clearAllUserData:', error);
    return { success: false, error: error };
  }
}
// Create and export singleton instance
const firebaseSync = new FirebaseSyncService();
export default firebaseSync;
