// Script para probar la autenticación web y verificar la conexión a emuladores
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

// Conectar a emuladores
try {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔥 Conectado a emuladores de Firebase');
} catch (error) {
  console.log('⚠️ Emuladores ya conectados o no disponibles');
}

async function testWebAuth() {
  console.log('🧪 Iniciando prueba de autenticación web...');
  
  try {
    // 1. Probar login
    console.log('1️⃣ Probando login...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'eventos3.0@hotmail.com', 
      'Amarilla15'
    );
    
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    
    // 2. Probar obtener perfil de Firestore
    console.log('2️⃣ Probando obtener perfil de Firestore...');
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('✅ Perfil encontrado en Firestore!');
      const userData = userDoc.data();
      console.log('📋 Datos del usuario:', {
        name: userData.name,
        email: userData.email,
        location: userData.location,
        isOnline: userData.isOnline
      });
    } else {
      console.log('❌ Perfil no encontrado en Firestore');
    }
    
    // 3. Probar listener de auth state
    console.log('3️⃣ Probando listener de auth state...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Auth state listener detectó usuario:', user.email);
      } else {
        console.log('❌ Auth state listener no detectó usuario');
      }
      unsubscribe(); // Desuscribir después de la primera llamada
    });
    
    // 4. Obtener token
    console.log('4️⃣ Obteniendo token de autenticación...');
    const token = await userCredential.user.getIdToken();
    console.log('🎫 Token obtenido (primeros 50 caracteres):', token.substring(0, 50) + '...');
    
    console.log('🎉 Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('📋 Detalles del error:', error);
  }
}

testWebAuth();