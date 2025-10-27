// Configuración de Firebase - Valores hardcodeados para producción estable
// Esta configuración garantiza que Firebase funcione correctamente en todos los entornos

// Configuración de Firebase con valores fijos para evitar errores de variables de entorno
export const firebaseConfig = {
  apiKey: 'AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0',
  authDomain: 'gliter-argentina.firebaseapp.com',
  databaseURL: 'https://gliter-argentina-default-rtdb.firebaseio.com/',
  projectId: 'gliter-argentina',
  storageBucket: 'gliter-argentina.firebasestorage.app',
  messagingSenderId: '1084162955705',
  appId: '1:1084162955705:web:25bb32180d1bdaf724fe68',
  measurementId: 'G-MMFQWWFCJD'
};

// Log de configuración solo en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase Config Loaded:', {
    apiKey: '✅ Set',
    authDomain: '✅ Set',
    projectId: '✅ Set',
    storageBucket: '✅ Set',
  });
}