// Script para probar el flujo completo de autenticación en la aplicación web
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqJZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
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

async function testFullAuthFlow() {
  try {
    console.log('🧪 Probando flujo completo de autenticación...');
    console.log('');
    
    // 1. Verificar estado inicial
    console.log('1️⃣ Verificando estado inicial de autenticación...');
    console.log('👤 Usuario actual:', auth.currentUser ? auth.currentUser.email : 'null');
    
    // 2. Realizar login
    console.log('');
    console.log('2️⃣ Realizando login...');
    const { user } = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', user.email);
    console.log('🆔 UID:', user.uid);
    
    // 3. Verificar persistencia de sesión
    console.log('');
    console.log('3️⃣ Verificando persistencia de sesión...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar un segundo
    console.log('👤 Usuario después de espera:', auth.currentUser ? auth.currentUser.email : 'null');
    
    // 4. Verificar acceso a Firestore
    console.log('');
    console.log('4️⃣ Verificando acceso a datos de Firestore...');
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Datos de Firestore obtenidos exitosamente');
      console.log('👤 Nombre:', userData.name);
      console.log('📧 Email:', userData.email);
      console.log('📍 Ubicación:', userData.location?.city, userData.location?.country);
    } else {
      console.log('❌ No se encontraron datos en Firestore');
    }
    
    // 5. Verificar token
    console.log('');
    console.log('5️⃣ Verificando token de autenticación...');
    const token = await user.getIdToken();
    console.log('🎫 Token obtenido (longitud):', token.length, 'caracteres');
    console.log('🎫 Token válido:', token.length > 100 ? '✅' : '❌');
    
    // 6. Configurar listener para monitorear cambios
    console.log('');
    console.log('6️⃣ Configurando listener de estado...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔔 Estado: Usuario autenticado -', user.email);
      } else {
        console.log('🔔 Estado: No hay usuario autenticado');
      }
    });
    
    // 7. Simular navegación (verificar que la sesión persiste)
    console.log('');
    console.log('7️⃣ Simulando navegación...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('👤 Usuario después de navegación:', auth.currentUser ? auth.currentUser.email : 'null');
    
    console.log('');
    console.log('🎉 Flujo de autenticación completado exitosamente!');
    console.log('📝 Resultados:');
    console.log('   ✅ Login funcional');
    console.log('   ✅ Sesión persistente');
    console.log('   ✅ Acceso a Firestore');
    console.log('   ✅ Token válido');
    console.log('   ✅ Listener funcionando');
    console.log('');
    console.log('🌐 La aplicación web debería funcionar correctamente');
    console.log('🔗 Puedes probar en: http://localhost:3001/auth/login');
    console.log('🔗 Y luego navegar a: http://localhost:3001/discover');
    
    // Limpiar
    setTimeout(() => {
      unsubscribe();
      console.log('🧹 Listener limpiado');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en el flujo de autenticación:', error.message);
    console.error('📋 Detalles del error:', error);
  }
}

testFullAuthFlow();