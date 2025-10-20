import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';

// Configuración de Firebase para emuladores
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "gliter-argentina",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Conectar a emuladores
connectAuthEmulator(auth, 'http://localhost:9099');

async function autoLogin() {
  try {
    console.log('🔐 Iniciando sesión automáticamente...');
    
    // Credenciales del usuario de prueba
    const email = 'eventos3.0@hotmail.com';
    const password = 'Amarilla15';

    // Iniciar sesión
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login exitoso:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('👤 Nombre:', user.displayName);
    
  } catch (error) {
    console.error('❌ Error en login:', error.message);
  }
}

autoLogin();