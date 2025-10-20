/**
 * Script de Verificación de Permisos de Usuario
 * 
 * Este script verifica si un usuario tiene UID válido y permisos correctos
 * Ejecutar en la consola del navegador o como script independiente
 */

// Función para verificar el estado de autenticación
async function verifyUserAuthentication() {
  console.log('🔍 Verificando estado de autenticación...');
  
  // Verificar si Firebase está disponible
  if (typeof firebase === 'undefined' && typeof window.firebase === 'undefined') {
    console.error('❌ Firebase no está disponible');
    return false;
  }
  
  const auth = firebase?.auth?.() || window.firebase?.auth?.();
  if (!auth) {
    console.error('❌ Firebase Auth no está inicializado');
    return false;
  }
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No hay usuario autenticado');
    return false;
  }
  
  console.log('✅ Usuario autenticado:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified
  });
  
  return user;
}

// Función para verificar el documento del usuario en Firestore
async function verifyUserDocument(uid) {
  console.log('🔍 Verificando documento de usuario en Firestore...');
  
  try {
    const db = firebase?.firestore?.() || window.firebase?.firestore?.();
    if (!db) {
      console.error('❌ Firestore no está disponible');
      return false;
    }
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.error('❌ Documento de usuario no existe en Firestore');
      return false;
    }
    
    const userData = userDoc.data();
    console.log('✅ Documento de usuario encontrado:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      createdAt: userData.createdAt,
      isOnline: userData.isOnline,
      hasRequiredFields: {
        likedUsers: Array.isArray(userData.likedUsers),
        passedUsers: Array.isArray(userData.passedUsers),
        settings: typeof userData.settings === 'object'
      }
    });
    
    return userData;
  } catch (error) {
    console.error('❌ Error al verificar documento de usuario:', error);
    return false;
  }
}

// Función para probar permisos de escritura
async function testWritePermissions(uid) {
  console.log('🔍 Probando permisos de escritura...');
  
  try {
    const db = firebase?.firestore?.() || window.firebase?.firestore?.();
    
    // Probar actualización del perfil de usuario
    await db.collection('users').doc(uid).update({
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Permisos de escritura en /users funcionan');
    
    // Probar creación de un chat de prueba
    const testChatRef = await db.collection('chats').add({
      participants: [uid, 'test-user-id'],
      participantIds: [uid, 'test-user-id'],
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      unreadCount: { [uid]: 0, 'test-user-id': 0 },
      isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      chatType: 'direct'
    });
    
    console.log('✅ Permisos de creación de chat funcionan');
    
    // Limpiar el chat de prueba
    await testChatRef.delete();
    console.log('✅ Chat de prueba eliminado');
    
    return true;
  } catch (error) {
    console.error('❌ Error en permisos de escritura:', error);
    return false;
  }
}

// Función para probar marcado de mensajes como leídos
async function testMarkMessagesAsRead(uid) {
  console.log('🔍 Probando función de marcar mensajes como leídos...');
  
  try {
    const db = firebase?.firestore?.() || window.firebase?.firestore?.();
    
    // Buscar un chat existente del usuario
    const chatsQuery = await db.collection('chats')
      .where('participantIds', 'array-contains', uid)
      .limit(1)
      .get();
    
    if (chatsQuery.empty) {
      console.log('⚠️ No se encontraron chats para probar');
      return true;
    }
    
    const chatDoc = chatsQuery.docs[0];
    const chatId = chatDoc.id;
    
    console.log('📝 Probando con chat:', chatId);
    
    // Buscar mensajes no leídos
    const messagesQuery = await db.collection('chats').doc(chatId).collection('messages')
      .where('receiverId', '==', uid)
      .where('read', '==', false)
      .limit(1)
      .get();
    
    if (messagesQuery.empty) {
      console.log('✅ No hay mensajes no leídos para probar');
      return true;
    }
    
    const messageDoc = messagesQuery.docs[0];
    
    // Intentar marcar como leído
    await messageDoc.ref.update({
      read: true,
      readBy: firebase.firestore.FieldValue.arrayUnion(uid)
    });
    
    console.log('✅ Mensaje marcado como leído exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error al marcar mensaje como leído:', error);
    return false;
  }
}

// Función principal de verificación
async function runFullVerification() {
  console.log('🚀 Iniciando verificación completa de permisos...');
  console.log('=====================================');
  
  const user = await verifyUserAuthentication();
  if (!user) return;
  
  const userData = await verifyUserDocument(user.uid);
  if (!userData) return;
  
  const writePermissions = await testWritePermissions(user.uid);
  const readPermissions = await testMarkMessagesAsRead(user.uid);
  
  console.log('=====================================');
  console.log('📊 RESUMEN DE VERIFICACIÓN:');
  console.log('✅ Autenticación:', !!user);
  console.log('✅ Documento de usuario:', !!userData);
  console.log('✅ Permisos de escritura:', writePermissions);
  console.log('✅ Marcar mensajes como leídos:', readPermissions);
  
  if (user && userData && writePermissions && readPermissions) {
    console.log('🎉 ¡Todos los permisos funcionan correctamente!');
  } else {
    console.log('⚠️ Se encontraron problemas de permisos');
  }
}

// Exportar funciones para uso en consola
if (typeof window !== 'undefined') {
  window.verifyUserPermissions = {
    runFullVerification,
    verifyUserAuthentication,
    verifyUserDocument,
    testWritePermissions,
    testMarkMessagesAsRead
  };
  
  console.log('🔧 Funciones de verificación disponibles en window.verifyUserPermissions');
  console.log('💡 Ejecuta: window.verifyUserPermissions.runFullVerification()');
}

// Auto-ejecutar si se carga como script
if (typeof window !== 'undefined' && window.location) {
  // Esperar a que Firebase esté disponible
  setTimeout(() => {
    if (typeof firebase !== 'undefined' || typeof window.firebase !== 'undefined') {
      runFullVerification();
    } else {
      console.log('⚠️ Firebase no está disponible. Ejecuta manualmente: window.verifyUserPermissions.runFullVerification()');
    }
  }, 2000);
}