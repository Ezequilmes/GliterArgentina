const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, getDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "gliter-argentina.firebaseapp.com",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

async function testLogin() {
  try {
    console.log('🔐 Probando login de usuario...');
    
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    // Iniciar sesión
    const { user } = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    console.log('✅ Login exitoso:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('👤 Nombre:', user.displayName);

    // Obtener datos del usuario desde Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('✅ Datos del usuario obtenidos desde Firestore:');
      console.log('  - Nombre:', userData.name);
      console.log('  - Edad:', userData.age);
      console.log('  - Género:', userData.gender);
      console.log('  - Rol sexual:', userData.sexualRole);
      console.log('  - Ciudad:', userData.location?.city);
      console.log('  - Bio:', userData.bio);
      console.log('  - Intereses:', userData.interests);
      console.log('  - Verificado:', userData.isVerified);
      console.log('  - Premium:', userData.isPremium);
      console.log('  - En línea:', userData.isOnline);
    } else {
      console.log('❌ No se encontraron datos del usuario en Firestore');
    }

    console.log('🎉 Login y carga de datos completados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en el login:', error);
  }
}

testLogin();