// Test script to trigger authentication and see debug logs
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase configuration from .env.local (real credentials)
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:362b67d495109dff24fe68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🚀 [TEST] Starting authentication test...');
console.log('🔧 [TEST] Firebase initialized with project:', firebaseConfig.projectId);

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  console.log('🔔 [TEST] Auth state changed:', {
    hasUser: !!user,
    uid: user?.uid,
    email: user?.email,
    timestamp: new Date().toISOString()
  });

  if (user) {
    console.log('✅ [TEST] User authenticated, testing Firestore access...');
    
    try {
      // Test accessing user document
      const userRef = doc(db, 'users', user.uid);
      console.log('📄 [TEST] Attempting to get user document...');
      
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log('✅ [TEST] User document exists and accessible');
        console.log('📊 [TEST] User data preview:', {
          id: userSnap.id,
          name: userSnap.data().name,
          email: userSnap.data().email
        });
      } else {
        console.log('❌ [TEST] User document does not exist');
      }
    } catch (error) {
      console.error('💥 [TEST] Error accessing Firestore:', {
        error: error,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    console.log('❌ [TEST] No user authenticated');
    console.log('ℹ️ [TEST] To test with a real user, please login through the web app first');
  }
});

console.log('🏁 [TEST] Test script setup completed. Waiting for auth state...');

// Keep the script running for a few seconds to catch auth state
setTimeout(() => {
  console.log('⏰ [TEST] Test completed after 3 seconds');
  process.exit(0);
}, 3000);