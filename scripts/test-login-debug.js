import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Configuración de Firebase (usando las credenciales del .env.local)
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

console.log('🔥 Firebase inicializado para proyecto:', firebaseConfig.projectId);

// Función para simular getUserProfile con logging
async function testGetUserProfile(userId) {
  console.log('📋 [getUserProfile] Iniciando obtención de perfil para usuario:', userId);
  
  try {
    console.log('📋 [getUserProfile] Creando referencia del documento...');
    const userRef = doc(db, 'users', userId);
    
    console.log('📋 [getUserProfile] Intentando buscar en Firestore...');
    const userSnap = await getDoc(userRef);
    
    console.log('📋 [getUserProfile] Resultado de búsqueda - Existe:', userSnap.exists());
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('📋 [getUserProfile] Documento tiene datos:', !!userData);
      console.log('📋 [getUserProfile] Campos del documento:', Object.keys(userData || {}));
      console.log('✅ [getUserProfile] Perfil recuperado exitosamente');
      return { id: userId, ...userData };
    } else {
      console.log('❌ [getUserProfile] No se encontró el documento del usuario');
      return null;
    }
  } catch (error) {
    console.error('❌ [getUserProfile] Error:', {
      message: error.message,
      code: error.code,
      details: error
    });
    throw error;
  }
}

// Función para probar el login
async function testLogin() {
  console.log('🔐 Iniciando prueba de login...');
  
  const testCredentials = {
    email: 'eventos3.0@hotmail.com',
    password: 'Amarilla15'
  };
  
  try {
    console.log('🔐 Intentando login con:', testCredentials.email);
    const userCredential = await signInWithEmailAndPassword(auth, testCredentials.email, testCredentials.password);
    const user = userCredential.user;
    
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario autenticado:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName
    });
    
    // Probar obtener el perfil del usuario
    console.log('\n📋 Probando obtención de perfil...');
    const userProfile = await testGetUserProfile(user.uid);
    
    if (userProfile) {
      console.log('✅ Perfil obtenido exitosamente:', {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        hasPhotos: userProfile.photos?.length > 0,
        isOnline: userProfile.isOnline,
        isPremium: userProfile.isPremium
      });
    }
    
    return user;
    
  } catch (error) {
    console.error('❌ Error en login:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

// Configurar listener de cambios de estado de autenticación
console.log('👂 [onAuthStateChange] Configurando listener de cambios de estado...');

onAuthStateChanged(auth, async (user) => {
  console.log('\n🔄 [onAuthStateChange] Cambio de estado de autenticación detectado');
  console.log('👤 [onAuthStateChange] Usuario:', {
    hasUser: !!user,
    uid: user?.uid,
    email: user?.email,
    emailVerified: user?.emailVerified
  });
  
  if (user) {
    console.log('✅ [onAuthStateChange] Usuario autenticado:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // Probar obtener perfil cuando el usuario se autentica
    try {
      console.log('\n📋 [onAuthStateChange] Obteniendo perfil del usuario...');
      const profile = await testGetUserProfile(user.uid);
      if (profile) {
        console.log('✅ [onAuthStateChange] Perfil obtenido en listener:', profile.name);
      }
    } catch (error) {
      console.error('❌ [onAuthStateChange] Error obteniendo perfil:', error.message);
    }
  } else {
    console.log('❌ [onAuthStateChange] No hay usuario autenticado');
  }
});

// Ejecutar la prueba de login
console.log('\n🚀 Iniciando prueba de autenticación...');
testLogin()
  .then(() => {
    console.log('\n✅ Prueba de autenticación completada');
    console.log('📝 Mantener script ejecutándose para observar logs...');
    
    // Mantener el script ejecutándose
    setTimeout(() => {
      console.log('⏰ Script finalizado después de 30 segundos');
      process.exit(0);
    }, 30000);
  })
  .catch((error) => {
    console.error('\n❌ Prueba de autenticación falló:', error.message);
    process.exit(1);
  });