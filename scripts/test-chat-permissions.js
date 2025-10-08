import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';

// Configuración de Firebase
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

console.log('🔥 Firebase inicializado para pruebas de chat');

// Función para probar consultas de chat
async function testChatQueries(userId) {
  console.log('\n💬 === PROBANDO CONSULTAS DE CHAT ===');
  console.log('👤 Usuario ID:', userId);
  
  try {
    // 1. Probar consulta de chats del usuario
    console.log('\n📋 1. Probando consulta de chats del usuario...');
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc'),
      limit(10)
    );
    
    console.log('📋 Ejecutando consulta de chats...');
    const chatsSnapshot = await getDocs(chatsQuery);
    console.log('✅ Consulta de chats exitosa. Chats encontrados:', chatsSnapshot.size);
    
    const chats = [];
    chatsSnapshot.forEach((doc) => {
      const chatData = doc.data();
      chats.push({
        id: doc.id,
        participants: chatData.participants,
        lastMessage: chatData.lastMessage?.text || 'Sin mensaje',
        lastMessageTime: chatData.lastMessageTime?.toDate?.() || 'Sin fecha'
      });
    });
    
    console.log('📋 Chats del usuario:', chats);
    
    // 2. Si hay chats, probar consulta de mensajes
    if (chats.length > 0) {
      const firstChatId = chats[0].id;
      console.log('\n📨 2. Probando consulta de mensajes para chat:', firstChatId);
      
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', firstChatId),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      console.log('📨 Ejecutando consulta de mensajes...');
      const messagesSnapshot = await getDocs(messagesQuery);
      console.log('✅ Consulta de mensajes exitosa. Mensajes encontrados:', messagesSnapshot.size);
      
      const messages = [];
      messagesSnapshot.forEach((doc) => {
        const messageData = doc.data();
        messages.push({
          id: doc.id,
          senderId: messageData.senderId,
          text: messageData.text,
          timestamp: messageData.timestamp?.toDate?.() || 'Sin fecha'
        });
      });
      
      console.log('📨 Mensajes del chat:', messages);
      
      // 3. Probar escribir un mensaje de prueba
      console.log('\n✍️ 3. Probando escribir mensaje de prueba...');
      try {
        const testMessage = {
          chatId: firstChatId,
          senderId: userId,
          text: 'Mensaje de prueba - ' + new Date().toISOString(),
          timestamp: new Date(),
          type: 'text',
          isRead: false
        };
        
        console.log('✍️ Intentando crear mensaje...');
        const messageRef = await addDoc(collection(db, 'messages'), testMessage);
        console.log('✅ Mensaje creado exitosamente con ID:', messageRef.id);
        
        // 4. Probar actualizar el chat con el último mensaje
        console.log('\n🔄 4. Probando actualizar chat con último mensaje...');
        const chatRef = doc(db, 'chats', firstChatId);
        await updateDoc(chatRef, {
          lastMessage: {
            text: testMessage.text,
            senderId: userId,
            timestamp: testMessage.timestamp
          },
          lastMessageTime: testMessage.timestamp,
          updatedAt: new Date()
        });
        console.log('✅ Chat actualizado exitosamente');
        
      } catch (writeError) {
        console.error('❌ Error escribiendo mensaje:', {
          code: writeError.code,
          message: writeError.message
        });
      }
    } else {
      console.log('ℹ️ No se encontraron chats para este usuario');
      
      // Probar crear un chat de prueba
      console.log('\n➕ Probando crear chat de prueba...');
      try {
        const testChat = {
          participants: [userId, 'test-user-id'],
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: null,
          lastMessageTime: new Date(),
          isActive: true
        };
        
        const chatRef = await addDoc(collection(db, 'chats'), testChat);
        console.log('✅ Chat de prueba creado con ID:', chatRef.id);
      } catch (createError) {
        console.error('❌ Error creando chat:', {
          code: createError.code,
          message: createError.message
        });
      }
    }
    
    // 5. Probar consulta de typing status
    console.log('\n⌨️ 5. Probando consulta de typing status...');
    try {
      const typingQuery = query(
        collection(db, 'typing'),
        where('userId', '==', userId)
      );
      
      const typingSnapshot = await getDocs(typingQuery);
      console.log('✅ Consulta de typing exitosa. Registros encontrados:', typingSnapshot.size);
    } catch (typingError) {
      console.error('❌ Error consultando typing:', {
        code: typingError.code,
        message: typingError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error general en pruebas de chat:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Función principal
async function runChatTests() {
  try {
    console.log('🔐 Iniciando sesión...');
    const userCredential = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    const user = userCredential.user;
    
    console.log('✅ Usuario autenticado:', user.uid);
    
    // Ejecutar pruebas de chat
    await testChatQueries(user.uid);
    
    console.log('\n🎉 Pruebas de chat completadas');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
  }
}

// Ejecutar las pruebas
runChatTests();