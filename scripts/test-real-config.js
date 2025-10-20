// Script para probar con la configuración real de Firebase de la aplicación web
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';

// Configuración REAL de Firebase (misma que .env.local)
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:25bb32180d1bdaf724fe68"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores (exactamente como la aplicación web)
let emulatorsConnected = false;
if (!emulatorsConnected) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    emulatorsConnected = true;
    console.log('🔥 Firebase emulators connected (real config)');
  } catch (error) {
    console.log('⚠️ Emulators already connected or not available');
  }
}

async function testRealConfig() {
  try {
    console.log('🧪 Probando con configuración REAL de Firebase...');
    console.log('📋 Project ID:', firebaseConfig.projectId);
    console.log('🌐 Auth Domain:', firebaseConfig.authDomain);
    console.log('');
    
    // 1. Verificar estado inicial
    console.log('1️⃣ Estado inicial de autenticación...');
    console.log('👤 Usuario actual:', auth.currentUser ? auth.currentUser.email : 'null');
    
    // 2. Configurar listener
    console.log('');
    console.log('2️⃣ Configurando listener de autenticación...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔔 Auth state changed: Usuario detectado -', user.email);
      } else {
        console.log('🔔 Auth state changed: No hay usuario');
      }
    });
    
    // 3. Intentar login
    console.log('');
    console.log('3️⃣ Intentando login con credenciales de prueba...');
    const { user } = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    console.log('✅ Login exitoso con configuración real');
    console.log('👤 Usuario:', user.email);
    console.log('🆔 UID:', user.uid);
    
    // 4. Verificar datos en Firestore
    console.log('');
    console.log('4️⃣ Verificando datos en Firestore...');
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Datos encontrados en Firestore');
      console.log('👤 Nombre:', userData.name);
      console.log('📧 Email:', userData.email);
      console.log('📍 Ubicación:', userData.location?.city, userData.location?.country);
    } else {
      console.log('❌ No se encontraron datos en Firestore');
    }
    
    // 5. Verificar token
    console.log('');
    console.log('5️⃣ Verificando token...');
    const token = await user.getIdToken();
    console.log('🎫 Token obtenido (longitud):', token.length, 'caracteres');
    
    // 6. Verificar persistencia
    console.log('');
    console.log('6️⃣ Verificando persistencia...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('👤 Usuario después de espera:', auth.currentUser ? auth.currentUser.email : 'null');
    
    console.log('');
    console.log('🎉 Test completado con configuración real!');
    console.log('📝 La aplicación web debería funcionar ahora');
    console.log('🔗 Prueba en: http://localhost:3001/auth/login');
    
    // Limpiar
    setTimeout(() => {
      unsubscribe();
      console.log('🧹 Listener limpiado');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error('📋 Detalles:', error);
  }
}

testRealConfig();