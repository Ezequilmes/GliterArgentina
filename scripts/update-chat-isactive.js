import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gliter-argentina'
  });
}

const db = admin.firestore();

async function updateChatIsActive() {
  try {
    console.log('🔄 Actualizando chat con isActive...');
    
    const chatId = '7TwwxXFiRFRQYhoe5KMM';
    const chatRef = db.collection('chats').doc(chatId);
    
    // Verificar si el chat existe
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      console.error('❌ Chat no encontrado:', chatId);
      return;
    }
    
    console.log('📄 Chat encontrado, datos actuales:', chatDoc.data());
    
    // Actualizar el chat con isActive: true
    await chatRef.update({
      isActive: true,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Chat actualizado exitosamente con isActive: true');
    
    // Verificar la actualización
    const updatedDoc = await chatRef.get();
    console.log('📄 Datos actualizados:', updatedDoc.data());
    
  } catch (error) {
    console.error('❌ Error actualizando chat:', error);
  }
}

// Ejecutar la función
updateChatIsActive()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en el proceso:', error);
    process.exit(1);
  });