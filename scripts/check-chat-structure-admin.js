import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gliter-argentina'
  });
}

const db = admin.firestore();

async function checkChatStructure() {
  try {
    console.log('🔍 Verificando estructura de chats con Admin SDK...');
    
    const chatsRef = db.collection('chats');
    const snapshot = await chatsRef.limit(5).get();
    
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
        console.log('- participants values:', Object.values(data.participants));
      }
      
      if (data.participantIds && typeof data.participantIds === 'object' && !Array.isArray(data.participantIds)) {
        console.log('- participantIds keys:', Object.keys(data.participantIds));
        console.log('- participantIds values:', Object.values(data.participantIds));
      }
      
      console.log('- isActive:', data.isActive);
      console.log('- lastActivity:', data.lastActivity);
      console.log('- createdAt:', data.createdAt);
      console.log('- chatType:', data.chatType);
      console.log('---\n');
    });
    
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

checkChatStructure();