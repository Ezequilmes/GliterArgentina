import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

console.log('✅ Connected to Firebase production');

function checkAuthAndTestQueries() {
  console.log('🔍 Checking authentication status...');
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ User authenticated:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      // Test chat queries with the authenticated user
      testChatQueries(user.uid);
    } else {
      console.log('❌ No user authenticated');
      console.log('Please sign in through the web application first');
      process.exit(1);
    }
  });
}

function testChatQueries(userId) {
  console.log('\n🧪 Testing chat queries...');
  
  // Test 1: Query chats by participantIds (array)
  console.log('1. Testing participantIds query...');
  const participantIdsQuery = query(
    collection(db, 'chats'),
    where('participantIds', 'array-contains', userId)
  );
  
  const unsubscribe1 = onSnapshot(
    participantIdsQuery,
    (snapshot) => {
      console.log('✅ participantIds query successful:', snapshot.size, 'chats found');
      unsubscribe1();
      
      // Test 2: Query chats by participants (map)
      console.log('2. Testing participants query...');
      const participantsQuery = query(
        collection(db, 'chats'),
        where(`participants.${userId}`, '==', true)
      );
      
      const unsubscribe2 = onSnapshot(
        participantsQuery,
        (snapshot) => {
          console.log('✅ participants query successful:', snapshot.size, 'chats found');
          unsubscribe2();
          
          // Test 3: Query messages (if we have a chat)
          if (snapshot.size > 0) {
            const chatId = snapshot.docs[0].id;
            console.log('3. Testing messages query for chat:', chatId);
            
            const messagesQuery = query(collection(db, 'chats', chatId, 'messages'));
            const unsubscribe3 = onSnapshot(
              messagesQuery,
              (snapshot) => {
                console.log('✅ messages query successful:', snapshot.size, 'messages found');
                unsubscribe3();
                console.log('\n🎉 All queries successful! No permission errors detected.');
                process.exit(0);
              },
              (error) => {
                console.error('❌ Messages query failed:', {
                  code: error.code,
                  message: error.message,
                  chatId: chatId,
                  userId: userId,
                  timestamp: new Date().toISOString()
                });
                unsubscribe3();
                process.exit(1);
              }
            );
          } else {
            console.log('ℹ️ No chats found, skipping messages test');
            console.log('\n🎉 Chat queries successful! No permission errors detected.');
            process.exit(0);
          }
        },
        (error) => {
          console.error('❌ Participants query failed:', {
            code: error.code,
            message: error.message,
            userId: userId,
            timestamp: new Date().toISOString()
          });
          unsubscribe2();
          process.exit(1);
        }
      );
    },
    (error) => {
      console.error('❌ ParticipantIds query failed:', {
        code: error.code,
        message: error.message,
        userId: userId,
        timestamp: new Date().toISOString()
      });
      unsubscribe1();
      process.exit(1);
    }
  );
}

// Start the check
checkAuthAndTestQueries();

// Keep the script running for a few seconds to allow auth state to be checked
setTimeout(() => {
  console.log('⏰ Timeout reached, exiting...');
  process.exit(1);
}, 10000);