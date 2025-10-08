const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, collection, addDoc, serverTimestamp, doc, setDoc } = require('firebase/firestore');

// Configuración de Firebase para emuladores
const firebaseConfig = {
  projectId: 'gliter-argentina',
  authDomain: 'gliter-argentina.firebaseapp.com',
  storageBucket: 'gliter-argentina.firebasestorage.app',
  messagingSenderId: '1084162955705',
  appId: '1:1084162955705:web:362b67d495109dff24fe68'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Conectar a emulador de Firestore
connectFirestoreEmulator(db, 'localhost', 8080);

async function createTestChats() {
  try {
    console.log('🚀 Creando chats de prueba...');

    // IDs de usuarios (basados en los usuarios creados anteriormente)
    const users = [
      'eventos3.0@hotmail.com', // Usuario principal
      'sofia.martinez@email.com',
      'carlos.rodriguez@email.com', 
      'ana.garcia@email.com',
      'miguel.lopez@email.com',
      'lucia.fernandez@email.com',
      'diego.sanchez@email.com',
      'valentina.torres@email.com',
      'sebastian.morales@email.com'
    ];

    const mainUser = users[0];
    const chatPromises = [];

    // Crear chats entre el usuario principal y otros usuarios
    for (let i = 1; i < users.length; i++) {
      const otherUser = users[i];
      
      // Crear chat
      const chatData = {
        participants: [mainUser, otherUser],
        lastActivity: serverTimestamp(),
        isActive: true,
        unreadCount: {
          [mainUser]: 0,
          [otherUser]: Math.floor(Math.random() * 3) // 0-2 mensajes no leídos
        }
      };

      const chatPromise = addDoc(collection(db, 'chats'), chatData)
        .then(async (chatRef) => {
          console.log(`✅ Chat creado entre ${mainUser} y ${otherUser}: ${chatRef.id}`);
          
          // Crear algunos mensajes de prueba
          const messages = [
            {
              chatId: chatRef.id,
              senderId: otherUser,
              receiverId: mainUser,
              content: `¡Hola! Me encanta tu perfil 😊`,
              type: 'text',
              timestamp: serverTimestamp(),
              read: false
            },
            {
              chatId: chatRef.id,
              senderId: mainUser,
              receiverId: otherUser,
              content: `¡Hola! Gracias, el tuyo también está genial`,
              type: 'text',
              timestamp: serverTimestamp(),
              read: true
            }
          ];

          // Solo algunos chats tendrán mensajes adicionales
          if (Math.random() > 0.5) {
            messages.push({
              chatId: chatRef.id,
              senderId: otherUser,
              receiverId: mainUser,
              content: `¿Te gustaría que nos conozcamos mejor?`,
              type: 'text',
              timestamp: serverTimestamp(),
              read: false
            });
          }

          // Agregar mensajes al chat
          const messagePromises = messages.map(message => 
            addDoc(collection(db, 'chats', chatRef.id, 'messages'), message)
          );

          await Promise.all(messagePromises);

          // Actualizar último mensaje del chat
          const lastMessage = messages[messages.length - 1];
          await setDoc(doc(db, 'chats', chatRef.id), {
            ...chatData,
            lastMessage: {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              timestamp: lastMessage.timestamp,
              type: lastMessage.type
            }
          });

          console.log(`📝 ${messages.length} mensajes agregados al chat ${chatRef.id}`);
        });

      chatPromises.push(chatPromise);
    }

    await Promise.all(chatPromises);

    console.log('🎉 ¡Chats de prueba creados exitosamente!');
    console.log(`📊 Total de chats creados: ${users.length - 1}`);
    console.log('💬 Cada chat incluye mensajes de prueba');
    console.log('🔔 Algunos mensajes están marcados como no leídos');

  } catch (error) {
    console.error('❌ Error creando chats de prueba:', error);
  }
}

// Ejecutar el script
createTestChats();