// Test de configuración de Realtime Database
import { database } from '../lib/firebase';
import { ref, set, get, onValue, off } from 'firebase/database';

// Función de prueba para verificar la conexión
export async function testRealtimeDatabase() {
  try {
    console.log('🔥 Probando conexión a Realtime Database...');
    
    // Crear una referencia de prueba
    const testRef = ref(database, 'test/connection');
    
    // Escribir datos de prueba
    await set(testRef, {
      timestamp: Date.now(),
      message: 'Conexión exitosa a Realtime Database',
      status: 'connected'
    });
    
    console.log('✅ Escritura exitosa en Realtime Database');
    
    // Leer datos de prueba
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('✅ Lectura exitosa:', snapshot.val());
    } else {
      console.log('❌ No se encontraron datos');
    }
    
    // Configurar listener en tiempo real
    const unsubscribe = onValue(testRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('🔄 Datos actualizados en tiempo real:', snapshot.val());
      }
    });
    
    // Limpiar listener después de 2 segundos
    setTimeout(() => {
      off(testRef);
      console.log('🧹 Listener limpiado');
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('❌ Error en Realtime Database:', error);
    return false;
  }
}

// Funciones de utilidad para el chat en tiempo real
export const realtimeUtils = {
  // Configurar presencia de usuario
  setUserPresence: (userId: string, isOnline: boolean) => {
    const presenceRef = ref(database, `presence/${userId}`);
    return set(presenceRef, {
      online: isOnline,
      lastSeen: Date.now()
    });
  },
  
  // Escuchar presencia de usuarios
  listenToUserPresence: (userId: string, callback: (isOnline: boolean) => void) => {
    const presenceRef = ref(database, `presence/${userId}`);
    return onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      callback(data?.online || false);
    });
  },
  
  // Configurar estado de escritura
  setTypingStatus: (chatId: string, userId: string, isTyping: boolean) => {
    const typingRef = ref(database, `typing/${chatId}/${userId}`);
    if (isTyping) {
      return set(typingRef, Date.now());
    } else {
      return set(typingRef, null);
    }
  },
  
  // Escuchar estado de escritura
  listenToTyping: (chatId: string, callback: (typingUsers: string[]) => void) => {
    const typingRef = ref(database, `typing/${chatId}`);
    return onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      const typingUsers = data ? Object.keys(data) : [];
      callback(typingUsers);
    });
  }
};