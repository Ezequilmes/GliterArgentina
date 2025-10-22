const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:25bb32180d1bdaf724fe68",
  measurementId: "G-MMFQWWFCJD"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAdminLogin() {
  const adminEmail = 'admin@gliter.com.ar';
  const adminPassword = 'Admin123';
  
  console.log('🔐 Probando login del administrador...');
  console.log('Email:', adminEmail);
  console.log('Contraseña:', adminPassword);
  console.log('');
  
  try {
    // Intentar hacer login
    console.log('🔑 Intentando autenticación...');
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('✅ Autenticación exitosa!');
    console.log('👤 Usuario UID:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('✉️ Email verificado:', user.emailVerified);
    console.log('🕒 Último login:', user.metadata.lastSignInTime);
    console.log('');
    
    // Obtener el documento del usuario de Firestore
    console.log('📄 Obteniendo documento de Firestore...');
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Documento de Firestore encontrado!');
      console.log('👤 Nombre:', userData.name);
      console.log('📧 Email:', userData.email);
      console.log('🔑 Role:', userData.role);
      console.log('🛡️ Permissions:', userData.permissions);
      console.log('✅ Verificado:', userData.isVerified);
      console.log('💎 Premium:', userData.isPremium);
      console.log('🎯 Activo:', userData.isActive);
      console.log('');
      
      // Verificar permisos específicos de administrador
      if (userData.role === 'admin' && userData.permissions && userData.permissions.length > 0) {
        console.log('🎉 ¡LOGIN DE ADMINISTRADOR COMPLETAMENTE EXITOSO!');
        console.log('✅ El usuario tiene acceso completo como administrador');
        console.log('🔧 Permisos disponibles:');
        userData.permissions.forEach(permission => {
          console.log('   - ' + permission);
        });
      } else {
        console.log('⚠️ El usuario no tiene permisos de administrador configurados');
      }
      
    } else {
      console.log('❌ Documento de Firestore no encontrado');
      console.log('💡 El usuario existe en Auth pero no en Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error en el login:', error.code);
    
    switch (error.code) {
      case 'auth/invalid-credential':
        console.log('💡 Credenciales inválidas. Verifica email y contraseña');
        break;
      case 'auth/user-not-found':
        console.log('💡 Usuario no encontrado en Firebase Auth');
        break;
      case 'auth/wrong-password':
        console.log('💡 Contraseña incorrecta');
        break;
      case 'auth/too-many-requests':
        console.log('💡 Demasiados intentos fallidos. Espera un momento');
        break;
      default:
        console.log('💡 Error desconocido:', error.message);
    }
  }
}

testAdminLogin().catch(console.error);