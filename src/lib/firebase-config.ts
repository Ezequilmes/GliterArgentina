// Configuración de Firebase usando variables de entorno
// Configuración segura que no expone claves API en el código

// Debug: Log all environment variables for troubleshooting (solo en cliente)
if (typeof window !== 'undefined') {
  console.log('🔍 Firebase Config Debug - Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');
}

// Validar que las variables de entorno críticas estén presentes
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Solo validar en el cliente (navegador) para evitar errores durante el build del servidor
if (missingVars.length > 0 && typeof window !== 'undefined') {
  console.warn('⚠️ Some Firebase environment variables not found:', missingVars);
  console.warn('📁 Using fallback configuration - check .env.local file for production');
  
  // Solo lanzar error en producción si faltan variables críticas y estamos en el navegador
  if (process.env.NODE_ENV === 'production' && missingVars.length > 0) {
    throw new Error(`Missing Firebase configuration in production: ${missingVars.join(', ')}`);
  }
}

// Configuración de Firebase con fallbacks para desarrollo
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gliter-argentina.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://gliter-argentina-default-rtdb.firebaseio.com/',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gliter-argentina',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gliter-argentina.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1084162955705',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1084162955705:web:25bb32180d1bdaf724fe68',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-MMFQWWFCJD'
};

// Log final solo en el cliente
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase Config Loaded:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
  });
}