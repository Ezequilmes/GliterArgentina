import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

console.log('✅ Connected to Firebase production');

async function debugPermissionError() {
  try {
    console.log('🔍 Starting permission error debug...');
    
    // Test 1: Check current authentication
    console.log('\n1. Checking authentication...');
    const currentUser = auth.currentUser;
    console.log('Current user:', currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    } : 'No user authenticated');
    
    if (!currentUser) {
      console.log('❌ No user authenticated. Attempting to sign in...');
      
      // Try to sign in with a test user
      const testEmail = 'test@example.com';
      const testPassword = 'password123';
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('✅ Signed in as:', userCredential.user.email);
      } catch (signInError) {
        console.log('❌ Failed to sign in:', signInError.message);
        console.log('Please sign in manually in the browser and run this script again.');
        return;
      }
    }
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ Still no authenticated user. Exiting.');
      return;
    }
    
    console.log('✅ Authenticated user:', {
      uid: user.uid,
      email: user.email
    });
    
    // Test 2: Test chat queries
    console.log('\n2. Testing chat queries...');
    
    // Test participantIds query
    console.log('Testing participantIds query...');
    const chatsRef = collection(db, 'chats');
    const qParticipantIds = query(
      chatsRef,
      where('participantIds', 'array-contains', user.uid)
    );
    
    let participantIdsError = null;
    let participantIdsSuccess = false;
    
    const unsubscribe1 = onSnapshot(
      qParticipantIds,
      (snapshot) => {
        participantIdsSuccess = true;
        console.log('✅ participantIds query successful. Found', snapshot.size, 'chats');
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log('  Chat:', doc.id, {
            participantIds: data.participantIds,
            participants: data.participants,
            isActive: data.isActive
          });
        });
      },
      (error) => {
        participantIdsError = error;
        console.log('❌ participantIds query failed:', {
          code: error.code,
          message: error.message
        });
      }
    );
    
    // Wait a bit for the query to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    unsubscribe1();
    
    // Test participants query if participantIds failed
    if (participantIdsError && !participantIdsSuccess) {
      console.log('\nTesting participants query...');
      const qParticipants = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );
      
      const unsubscribe2 = onSnapshot(
        qParticipants,
        (snapshot) => {
          console.log('✅ participants query successful. Found', snapshot.size, 'chats');
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log('  Chat:', doc.id, {
              participantIds: data.participantIds,
              participants: data.participants,
              isActive: data.isActive
            });
          });
        },
        (error) => {
          console.log('❌ participants query failed:', {
            code: error.code,
            message: error.message
          });
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      unsubscribe2();
    }
    
    // Test 3: Test message query for a specific chat
    console.log('\n3. Testing message queries...');
    
    // First get a chat ID to test with
    try {
      const testChatId = 'test-chat-id'; // We'll need to get a real chat ID
      const messagesRef = collection(db, 'chats', testChatId, 'messages');
      
      const unsubscribe3 = onSnapshot(
        messagesRef,
        (snapshot) => {
          console.log('✅ messages query successful. Found', snapshot.size, 'messages');
        },
        (error) => {
          console.log('❌ messages query failed:', {
            code: error.code,
            message: error.message,
            chatId: testChatId
          });
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      unsubscribe3();
    } catch (error) {
      console.log('❌ Error testing messages query:', error.message);
    }
    
    console.log('\n🔍 Debug complete. Check the logs above for permission errors.');
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugPermissionError().then(() => {
  console.log('Debug script finished');
  process.exit(0);
}).catch(error => {
  console.error('Debug script failed:', error);
  process.exit(1);
});