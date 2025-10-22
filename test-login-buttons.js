// Script para hacer login automático y probar los botones
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase (debe coincidir con la de la app)
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

console.log('🚀 Iniciando test de login y botones...');

async function testLoginAndButtons() {
  try {
    console.log('🔐 Haciendo login con usuario de prueba...');
    
    // Login con el usuario de prueba
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'eventos3.0@hotmail.com', 
      'Amarilla15'
    );
    
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    
    // Esperar a que el estado de auth se propague
    console.log('⏳ Esperando propagación del estado de auth...');
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('✅ Estado de auth confirmado:', user.email);
          console.log('🎯 Ahora puedes probar los botones en la página /discover');
          console.log('📝 Los botones deberían funcionar porque el usuario está autenticado');
          unsubscribe();
          resolve(user);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

testLoginAndButtons()
  .then(() => {
    console.log('🎉 Test completado. Ve a http://localhost:3000/discover y prueba los botones');
  })
  .catch(console.error);