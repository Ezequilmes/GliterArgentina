const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, connectAuthEmulator, updateProfile } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, 'localhost', 8080);

async function createTestUser(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Actualizar perfil
    await updateProfile(user, {
      displayName: userData.name
    });
    
    // Crear documento en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      id: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // Usuario ya existe, intentar iniciar sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    }
    throw error;
  }
}

async function testChatFunctionality() {
  try {
    console.log('🧪 Iniciando pruebas de chat/mensajes...\n');

    // 1. Crear/obtener usuarios de prueba
    console.log('1. Creando usuarios de prueba...');
    
    const user1Data = {
      name: 'Ana García',
      email: 'ana@test.com',
      age: 28,
      gender: 'female',
      sexualRole: 'versatile',
      bio: 'Usuario de prueba para chat',
      location: {
        city: 'Buenos Aires',
        country: 'Argentina',
        coordinates: {
          latitude: -34.6037,
          longitude: -58.3816
        }
      },
      isActive: true,
      isOnline: true
    };

    const user2Data = {
      name: 'Miguel Torres',
      email: 'miguel@test.com',
      age: 32,
      gender: 'male',
      sexualRole: 'top',
      bio: 'Otro usuario de prueba para chat',
      location: {
        city: 'Buenos Aires',
        country: 'Argentina',
        coordinates: {
          latitude: -34.6118,
          longitude: -58.3960
        }
      },
      isActive: true,
      isOnline: true
    };

    const user1 = await createTestUser('ana@test.com', 'password123', user1Data);
    console.log(`✅ Usuario 1 creado/obtenido: ${user1.email}`);

    const user2 = await createTestUser('miguel@test.com', 'password123', user2Data);
    console.log(`✅ Usuario 2 creado/obtenido: ${user2.email}`);

    // 2. Iniciar sesión con el primer usuario
    console.log('\n2. Iniciando sesión con Ana...');
    const userCredential = await signInWithEmailAndPassword(auth, 'ana@test.com', 'password123');
    const currentUser = userCredential.user;
    console.log(`✅ Usuario logueado: ${currentUser.email}`);

    // 3. Obtener datos del usuario actual
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    console.log(`📱 Usuario actual: ${currentUserData.name}`);

    // 4. Obtener datos del segundo usuario para el chat
    console.log('\n3. Obteniendo datos del segundo usuario...');
    const otherUserDoc = await getDoc(doc(db, 'users', user2.uid));
    const otherUser = { id: user2.uid, ...otherUserDoc.data() };
    console.log(`👤 Usuario para chat: ${otherUser.name}`);

    // 5. Crear o buscar chat existente
    console.log('\n4. Creando/buscando chat...');
    const chatsRef = collection(db, 'chats');
    
    // Buscar chat existente
    const existingChatQuery = query(
      chatsRef,
      where('participantIds', 'array-contains', currentUser.uid)
    );
    
    const existingChatsSnapshot = await getDocs(existingChatQuery);
    let chatId = null;
    
    existingChatsSnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participantIds && chatData.participantIds.includes(otherUser.id)) {
        chatId = doc.id;
      }
    });

    if (!chatId) {
      // Crear nuevo chat
      console.log('📝 Creando nuevo chat...');
      const newChatRef = await addDoc(chatsRef, {
        participantIds: [currentUser.uid, otherUser.id],
        participants: [
          {
            id: currentUser.uid,
            name: currentUserData.name,
            avatar: currentUserData.avatar || null
          },
          {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.avatar || null
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUser.id]: 0
        }
      });
      chatId = newChatRef.id;
      console.log(`✅ Chat creado con ID: ${chatId}`);
    } else {
      console.log(`✅ Chat existente encontrado: ${chatId}`);
    }

    // 6. Enviar mensaje de prueba
    console.log('\n5. Enviando mensaje de prueba...');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    const messageData = {
      chatId: chatId,
      senderId: currentUser.uid,
      content: '¡Hola! Este es un mensaje de prueba desde el script de testing 🚀',
      type: 'text',
      createdAt: serverTimestamp(),
      timestamp: serverTimestamp(),
      readBy: [currentUser.uid]
    };

    const messageRef = await addDoc(messagesRef, messageData);
    console.log(`✅ Mensaje enviado con ID: ${messageRef.id}`);

    // 6. Actualizar último mensaje del chat
    const chatRef = doc(db, 'chats', chatId);
    const { updateDoc, Timestamp } = require('firebase/firestore');
    
    await updateDoc(chatRef, {
      lastMessage: {
        id: messageRef.id,
        ...messageData,
        timestamp: Timestamp.now()
      },
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Chat actualizado con último mensaje');

    // 7. Verificar mensajes del chat
    console.log('\n6. Verificando mensajes del chat...');
    const messagesQuery = query(messagesRef);
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log(`📨 Total de mensajes en el chat: ${messagesSnapshot.size}`);
    
    messagesSnapshot.forEach((doc) => {
      const message = doc.data();
      console.log(`  - ${message.content} (${message.type})`);
    });

    console.log('\n🎉 ¡Pruebas de chat completadas exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Chat ID: ${chatId}`);
    console.log(`   - Participantes: ${currentUserData.name} y ${otherUser.name}`);
    console.log(`   - Mensajes: ${messagesSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error en las pruebas de chat:', error);
  }
}

// Ejecutar pruebas
testChatFunctionality();