import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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

async function checkUserChats() {
  try {
    console.log('🔥 Firebase inicializado para verificar chats del usuario');
    
    // Sign in with test user
    console.log('🔐 Iniciando sesión...');
    const userCredential = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    const user = userCredential.user;
    console.log('✅ Usuario autenticado:', user.uid);
    
    console.log('\n👤 Usuario ID:', user.uid);
    
    // Check all chats collection to see what exists
    console.log('\n📋 1. Verificando todos los chats en la colección...');
    try {
      const allChatsSnapshot = await getDocs(collection(db, 'chats'));
      console.log('📊 Total de chats en la colección:', allChatsSnapshot.size);
      
      if (allChatsSnapshot.size > 0) {
        console.log('\n📝 Chats encontrados:');
        allChatsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`  - Chat ID: ${doc.id}`);
          console.log(`    Participantes:`, data.participantIds || data.participants || [data.user1Id, data.user2Id]);
          console.log(`    Último mensaje:`, data.lastMessage?.text || 'Sin mensajes');
          console.log('');
        });
      } else {
        console.log('❌ No se encontraron chats en la colección');
      }
    } catch (error) {
      console.log('❌ Error al consultar todos los chats:', error.code, error.message);
    }
    
    // Try to query chats where user is participant (different approaches)
    console.log('\n📋 2. Probando consultas específicas para el usuario...');
    
    // Approach 1: participantIds array
    try {
      console.log('🔍 Consultando por participantIds...');
      const q1 = query(collection(db, 'chats'), where('participantIds', 'array-contains', user.uid));
      const snapshot1 = await getDocs(q1);
      console.log('📊 Chats encontrados (participantIds):', snapshot1.size);
    } catch (error) {
      console.log('❌ Error en consulta participantIds:', error.code, error.message);
    }
    
    // Approach 2: user1Id
    try {
      console.log('🔍 Consultando por user1Id...');
      const q2 = query(collection(db, 'chats'), where('user1Id', '==', user.uid));
      const snapshot2 = await getDocs(q2);
      console.log('📊 Chats encontrados (user1Id):', snapshot2.size);
    } catch (error) {
      console.log('❌ Error en consulta user1Id:', error.code, error.message);
    }
    
    // Approach 3: user2Id
    try {
      console.log('🔍 Consultando por user2Id...');
      const q3 = query(collection(db, 'chats'), where('user2Id', '==', user.uid));
      const snapshot3 = await getDocs(q3);
      console.log('📊 Chats encontrados (user2Id):', snapshot3.size);
    } catch (error) {
      console.log('❌ Error en consulta user2Id:', error.code, error.message);
    }
    
    console.log('\n🎉 Verificación de chats completada');
    
  } catch (error) {
    console.error('❌ Error general en verificación de chats:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test
checkUserChats();