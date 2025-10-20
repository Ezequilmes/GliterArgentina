// Script para hacer login en la aplicación web y navegar
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Configuración de Firebase (misma que la aplicación)
const firebaseConfig = {
  apiKey: "AIzaSyBqJZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
  authDomain: "gliter-app.firebaseapp.com",
  projectId: "gliter-app",
  storageBucket: "gliter-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
try {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔥 Conectado a emuladores de Firebase');
} catch (error) {
  console.log('⚠️ Emuladores ya conectados');
}

async function loginAndTest() {
  try {
    console.log('🔐 Iniciando sesión...');
    
    // Configurar listener de estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Usuario autenticado detectado:', user.email);
        console.log('🆔 UID:', user.uid);
        console.log('🎫 Token disponible:', !!user.accessToken);
      } else {
        console.log('❌ No hay usuario autenticado');
      }
    });
    
    // Hacer login
    const userCredential = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    
    // Obtener token
    const token = await userCredential.user.getIdToken();
    console.log('🎫 Token obtenido (primeros 50 caracteres):', token.substring(0, 50) + '...');
    
    // Verificar persistencia
    console.log('🔄 Verificando persistencia de sesión...');
    setTimeout(() => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('✅ Sesión persistente confirmada');
        console.log('👤 Usuario actual:', currentUser.email);
        console.log('🆔 UID actual:', currentUser.uid);
      } else {
        console.log('❌ Sesión no persistente');
      }
      
      // Limpiar listener
      unsubscribe();
      
      console.log('');
      console.log('🌐 Ahora puedes navegar a http://localhost:3001/discover');
      console.log('📝 La sesión debería estar activa en la aplicación web');
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error en login:', error.message);
  }
}

loginAndTest();