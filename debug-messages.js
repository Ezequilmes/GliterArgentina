import admin from 'firebase-admin';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'gliter-argentina'
  });
}

const db = admin.firestore();

async function debugMessages() {
  const chatId = '7TwwxXFiRFRQYhoe5KMM';
  
  try {
    console.log('🔍 Verificando chat:', chatId);
    
    // Verificar que el chat existe
    const chatDoc = await db.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      console.log('❌ El chat no existe');
      return;
    }
    
    console.log('✅ Chat encontrado:', chatDoc.data());
    
    // Verificar mensajes en la subcolección
    console.log('\n🔍 Buscando mensajes...');
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    
    // Obtener todos los mensajes
    const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get();
    
    console.log(`📊 Total de mensajes encontrados: ${messagesSnapshot.size}`);
    
    if (messagesSnapshot.empty) {
      console.log('❌ No hay mensajes en este chat');
      
      // Verificar si hay documentos sin ordenar
      const allMessagesSnapshot = await messagesRef.get();
      console.log(`📊 Total de documentos en la colección (sin ordenar): ${allMessagesSnapshot.size}`);
      
      if (!allMessagesSnapshot.empty) {
        console.log('⚠️ Hay documentos pero no se pueden ordenar por timestamp');
        allMessagesSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`- Mensaje ID: ${doc.id}`, {
            content: data.content,
            timestamp: data.timestamp,
            senderId: data.senderId,
            type: data.type
          });
        });
      }
    } else {
      console.log('✅ Mensajes encontrados:');
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${doc.id}:`, {
          content: data.content,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
          senderId: data.senderId,
          type: data.type,
          read: data.read
        });
      });
    }
    
    // Verificar permisos de lectura
    console.log('\n🔍 Verificando permisos...');
    try {
      const testQuery = await messagesRef.limit(1).get();
      console.log('✅ Permisos de lectura OK');
    } catch (permError) {
      console.log('❌ Error de permisos:', permError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugMessages().then(() => {
  console.log('\n✅ Depuración completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en depuración:', error);
  process.exit(1);
});