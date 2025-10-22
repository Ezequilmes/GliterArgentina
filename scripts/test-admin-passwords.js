const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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

async function testAdminPasswords() {
  const adminEmail = 'admin@gliter.com.ar';
  const possiblePasswords = [
    'Admin123',
    'admin123',
    'Amarilla15',
    'amarilla15',
    'Gliter123',
    'gliter123',
    'password123',
    'Password123',
    '123456',
    'admin',
    'Admin',
    'gliter',
    'Gliter'
  ];

  console.log('🔍 Probando contraseñas para:', adminEmail);
  console.log('');

  for (const password of possiblePasswords) {
    try {
      console.log(`🔑 Probando contraseña: "${password}"`);
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, password);
      console.log('✅ ¡ÉXITO! Contraseña correcta encontrada:', password);
      console.log('👤 Usuario UID:', userCredential.user.uid);
      console.log('📧 Email:', userCredential.user.email);
      console.log('🕒 Último login:', userCredential.user.metadata.lastSignInTime);
      return password;
    } catch (error) {
      console.log(`❌ Falló: ${error.code}`);
    }
  }

  console.log('');
  console.log('❌ Ninguna de las contraseñas probadas funcionó');
  console.log('💡 El usuario administrador podría no existir o usar una contraseña diferente');
}

testAdminPasswords().catch(console.error);