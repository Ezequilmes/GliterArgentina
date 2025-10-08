import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, addDoc } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  projectId: 'gliter-argentina',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Conectar al emulador
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function importTestData() {
  try {
    console.log('🔄 Importando datos de prueba al emulador...');
    
    const chatId = '7TwwxXFiRFRQYhoe5KMM';
    const userId1 = 'user1';
    const userId2 = 'user2';
    
    // Crear el chat
    await setDoc(doc(db, 'chats', chatId), {
      participants: [userId1, userId2],
      lastMessage: 'Hola, ¿cómo estás?',
      lastMessageTimestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Chat creado');
    
    // Crear algunos mensajes de prueba
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    await addDoc(messagesRef, {
      senderId: userId1,
      content: 'Hola, ¿cómo estás?',
      type: 'text',
      timestamp: new Date(Date.now() - 60000), // 1 minuto atrás
      isRead: false
    });
    
    await addDoc(messagesRef, {
      senderId: userId2,
      content: '¡Hola! Todo bien, ¿y tú?',
      type: 'text',
      timestamp: new Date(Date.now() - 30000), // 30 segundos atrás
      isRead: false
    });
    
    await addDoc(messagesRef, {
      senderId: userId1,
      content: 'Muy bien, gracias por preguntar',
      type: 'text',
      timestamp: new Date(), // Ahora
      isRead: false
    });
    
    console.log('✅ Mensajes de prueba creados');
    console.log('🎉 Datos de prueba importados exitosamente');
    
  } catch (error) {
    console.error('❌ Error importando datos:', error);
  }
}

importTestData();