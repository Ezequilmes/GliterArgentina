// Script para hacer login automático en la aplicación web
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';

// Configuración de Firebase (debe coincidir con la de la app)
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

// Conectar al emulador de Auth
connectAuthEmulator(auth, 'http://localhost:9099');

async function loginToWeb() {
  try {
    console.log('🔐 Intentando hacer login en la aplicación web...');
    
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'eventos3.0@hotmail.com', 
      'Amarilla15'
    );
    
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    
    // Obtener el token de autenticación
    const token = await userCredential.user.getIdToken();
    console.log('🎫 Token obtenido (primeros 50 caracteres):', token.substring(0, 50) + '...');
    
  } catch (error) {
    console.error('❌ Error en login:', error.message);
  }
}

loginToWeb();