import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBJGKJJGKJJGKJJGKJJGKJJGKJJGKJJGKJ',
  authDomain: 'gliter-argentina.firebaseapp.com',
  projectId: 'gliter-argentina',
  storageBucket: 'gliter-argentina.firebasestorage.app',
  messagingSenderId: '1084162955705',
  appId: '1:1084162955705:web:362b67d495109dff24fe68'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkChatStructure() {
  try {
    console.log('🔍 Verificando estructura de chats...');
    
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, limit(5));
    const snapshot = await getDocs(q);
    
    console.log(`📊 Total de chats encontrados: ${snapshot.size}`);
    console.log('=== ESTRUCTURA DE CHATS ===\n');
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Chat ${index + 1} (ID: ${doc.id}):`);
      console.log('- participants:', data.participants);
      console.log('- participantIds:', data.participantIds);
      console.log('- participants type:', typeof data.participants);
      console.log('- participantIds type:', typeof data.participantIds);
      console.log('- participants is array:', Array.isArray(data.participants));
      console.log('- participantIds is array:', Array.isArray(data.participantIds));
      
      if (data.participants && typeof data.participants === 'object' && !Array.isArray(data.participants)) {
        console.log('- participants keys:', Object.keys(data.participants));
      }
      
      if (data.participantIds && typeof data.participantIds === 'object' && !Array.isArray(data.participantIds)) {
        console.log('- participantIds keys:', Object.keys(data.participantIds));
      }
      
      console.log('- isActive:', data.isActive);
      console.log('- lastActivity:', data.lastActivity);
      console.log('---\n');
    });
    
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

checkChatStructure();