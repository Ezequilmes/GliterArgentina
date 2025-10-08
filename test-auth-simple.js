import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Configuración de Firebase (producción)
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:362b67d495109dff24fe68"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🚀 Iniciando prueba de autenticación...');

// Escuchar cambios de estado de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Usuario autenticado:', {
      uid: user.uid,
      email: user.email
    });
    
    // Probar acceso a mensajes
    testMessagesAccess(user.uid);
  } else {
    console.log('❌ Usuario no autenticado');
  }
});

async function testMessagesAccess(userId) {
  console.log('🔍 Probando acceso a mensajes para chat 7TwwxXFiRFRQYhoe5KMM...');
  
  try {
    const chatId = '7TwwxXFiRFRQYhoe5KMM';
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('✅ Mensajes obtenidos:', snapshot.size);
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📝 Mensaje:', {
            id: doc.id,
            senderId: data.senderId,
            content: data.content?.substring(0, 50) + '...',
            type: data.type
          });
        });
        unsubscribe(); // Desuscribirse después de la primera carga
      },
      (error) => {
        console.error('❌ Error accediendo a mensajes:', error);
      }
    );
  } catch (error) {
    console.error('❌ Error en testMessagesAccess:', error);
  }
}

// Intentar autenticación automática si hay un usuario guardado
console.log('⏳ Esperando estado de autenticación...');

// Timeout para evitar espera infinita
setTimeout(() => {
  if (!auth.currentUser) {
    console.log('⏰ Timeout: No se detectó usuario autenticado');
    console.log('💡 Sugerencia: Inicia sesión en la aplicación web primero');
  }
}, 5000);