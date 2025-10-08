import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, addDoc, setDoc } from 'firebase/firestore';

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

console.log('🔥 Firebase inicializado para pruebas simples de chat');

// Función para probar operaciones básicas de chat
async function testBasicChatOperations(userId) {
  console.log('\n💬 === PROBANDO OPERACIONES BÁSICAS DE CHAT ===');
  console.log('👤 Usuario ID:', userId);
  
  try {
    // 1. Probar crear un chat simple
    console.log('\n➕ 1. Probando crear chat simple...');
    const testChatId = 'test-chat-' + Date.now();
    const testChat = {
      participants: [userId, 'test-user-2'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      lastMessageTime: new Date(),
      isActive: true
    };
    
    const chatRef = doc(db, 'chats', testChatId);
    await setDoc(chatRef, testChat);
    console.log('✅ Chat creado exitosamente con ID:', testChatId);
    
    // 2. Probar leer el chat creado
    console.log('\n📖 2. Probando leer chat creado...');
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      console.log('✅ Chat leído exitosamente:', chatDoc.data());
    } else {
      console.log('❌ Chat no encontrado');
    }
    
    // 3. Probar crear un mensaje simple
    console.log('\n✍️ 3. Probando crear mensaje simple...');
    const testMessage = {
      chatId: testChatId,
      senderId: userId,
      text: 'Mensaje de prueba simple - ' + new Date().toISOString(),
      timestamp: new Date(),
      type: 'text',
      isRead: false
    };
    
    const messageRef = await addDoc(collection(db, 'messages'), testMessage);
    console.log('✅ Mensaje creado exitosamente con ID:', messageRef.id);
    
    // 4. Probar leer el mensaje creado
    console.log('\n📖 4. Probando leer mensaje creado...');
    const messageDoc = await getDoc(messageRef);
    if (messageDoc.exists()) {
      console.log('✅ Mensaje leído exitosamente:', messageDoc.data());
    } else {
      console.log('❌ Mensaje no encontrado');
    }
    
    console.log('\n🎉 Todas las operaciones básicas completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error en operaciones básicas:', {
      code: error.code,
      message: error.message
    });
  }
}

// Función principal
async function runSimpleChatTests() {
  try {
    console.log('🔐 Iniciando sesión...');
    const userCredential = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    const user = userCredential.user;
    
    console.log('✅ Usuario autenticado:', user.uid);
    
    // Ejecutar pruebas básicas de chat
    await testBasicChatOperations(user.uid);
    
    console.log('\n🎉 Pruebas simples de chat completadas');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
  }
}

// Ejecutar las pruebas
runSimpleChatTests();