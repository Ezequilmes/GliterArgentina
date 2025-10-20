// Script para simular el proceso de login de la aplicación web
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

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

// Función para actualizar estado online (como en auth.ts)
async function updateUserOnlineStatus(uid, isOnline) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isOnline: isOnline,
      lastSeen: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log(`✅ Estado online actualizado: ${isOnline}`);
  } catch (error) {
    console.error('❌ Error actualizando estado online:', error.message);
  }
}

// Función para cargar datos del usuario (como en AuthContext)
async function loadUserData(authUser) {
  try {
    console.log('📋 Cargando datos del usuario desde Firestore...');
    const userRef = doc(db, 'users', authUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Datos del usuario cargados exitosamente');
      console.log('👤 Nombre:', userData.name);
      console.log('📧 Email:', userData.email);
      console.log('📍 Ubicación:', userData.location?.city, userData.location?.country);
      return userData;
    } else {
      console.log('❌ No se encontraron datos del usuario en Firestore');
      return null;
    }
  } catch (error) {
    console.error('❌ Error cargando datos del usuario:', error.message);
    return null;
  }
}

// Función de login (simulando signIn de auth.ts)
async function signIn(data) {
  try {
    console.log('🔐 Iniciando sesión con Firebase Auth...');
    const { user } = await signInWithEmailAndPassword(auth, data.email, data.password);
    
    // Actualizar estado online
    await updateUserOnlineStatus(user.uid, true);
    
    console.log('✅ Autenticación exitosa');
    return user;
  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);
    throw error;
  }
}

// Función principal de login (simulando login de AuthContext)
async function login(data) {
  try {
    console.log('🚀 Iniciando proceso de login...');
    
    const authUser = await signIn({
      email: data.email,
      password: data.password
    });
    
    const userData = await loadUserData(authUser);
    
    if (userData) {
      console.log('🎉 Login completado exitosamente!');
      console.log('👤 Usuario autenticado:', authUser.email);
      console.log('🆔 UID:', authUser.uid);
      console.log('📋 Perfil cargado:', userData.name);
      
      // Verificar token
      const token = await authUser.getIdToken();
      console.log('🎫 Token obtenido (primeros 50 caracteres):', token.substring(0, 50) + '...');
      
      return { authUser, userData };
    } else {
      throw new Error('No se pudieron cargar los datos del usuario');
    }
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

// Configurar listener de estado de autenticación
function setupAuthListener() {
  console.log('👂 Configurando listener de estado de autenticación...');
  
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('🔔 Auth state changed: Usuario detectado');
      console.log('👤 Email:', user.email);
      console.log('🆔 UID:', user.uid);
    } else {
      console.log('🔔 Auth state changed: No hay usuario');
    }
  });
  
  return unsubscribe;
}

// Ejecutar simulación
async function simulateWebLogin() {
  try {
    console.log('🧪 Simulando proceso de login de la aplicación web...');
    console.log('');
    
    // Configurar listener
    const unsubscribe = setupAuthListener();
    
    // Simular login con las credenciales del usuario de prueba
    const result = await login({
      email: 'eventos3.0@hotmail.com',
      password: 'Amarilla15'
    });
    
    console.log('');
    console.log('✅ Simulación completada exitosamente!');
    console.log('📝 La aplicación web debería funcionar correctamente ahora');
    console.log('🌐 Puedes navegar a http://localhost:3001/auth/login para probar');
    
    // Limpiar listener después de un tiempo
    setTimeout(() => {
      unsubscribe();
      console.log('🧹 Listener de autenticación limpiado');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en simulación:', error.message);
  }
}

simulateWebLogin();