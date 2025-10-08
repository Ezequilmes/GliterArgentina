import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

// Configurar logging de Firebase para evitar errores de logType
if (typeof window !== 'undefined') {
  // Suprimir warnings de Firebase logger que pueden causar errores
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('invalid logType') || message.includes('@firebase/logger')) {
      return; // Suprimir estos warnings específicos
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicializar Realtime Database con validación
let database: any = null;
try {
  if (firebaseConfig.databaseURL) {
    database = getDatabase(app);
    console.log('✅ Firebase Realtime Database initialized successfully');
  } else {
    console.error('❌ Firebase Database URL not configured');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Realtime Database:', error);
}

export { database };
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Inicializar Messaging (solo en el navegador)
export let messaging: any = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging not available:', error);
  }
}

// Inicializar Analytics (solo en el navegador y si está soportado)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Nota: Firebase In-App Messaging no está disponible para aplicaciones web
// Usamos un sistema personalizado de mensajes in-app para la web

// Variable para rastrear si los emuladores ya están conectados
let emulatorsConnected = false;

// Conectar a emuladores en desarrollo
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && typeof window !== 'undefined') {
  // Solo conectar una vez
  if (!emulatorsConnected) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectDatabaseEmulator(database, 'localhost', 9000);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      emulatorsConnected = true;
      console.log('🔥 Firebase emulators connected');
    } catch (error) {
      console.log('Emulators already connected or not available');
    }
  }
}

export default app;