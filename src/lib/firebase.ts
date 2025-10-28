import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, disableNetwork, enableNetwork, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import { firebaseConfig } from './firebase-config';

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

// Función para validar la configuración de Firebase
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase configuration fields:', missingFields);
    console.error('Current config:', firebaseConfig);
    return false;
  }
  
  console.log('✅ Firebase configuration validated successfully');
  console.log('Project ID:', firebaseConfig.projectId);
  return true;
}

// Inicializar Firebase
let app: any = null;
let auth: any = null;
let db: any = null;
let isFirebaseInitialized = false;

// Función para inicializar Firebase de manera asíncrona
async function initializeFirebaseApp() {
  if (isFirebaseInitialized || typeof window === 'undefined') {
    return { app, auth, db };
  }

  try {
    if (validateFirebaseConfig()) {
      // Verificar si ya existe una app inicializada
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      console.log('✅ Firebase App initialized successfully');
      console.log('App name:', app.name);
      console.log('Project ID:', app.options.projectId);
      
      // Inicializar servicios
      auth = getAuth(app);
      
      // Inicializar Firestore con persistencia moderna
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache size
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('✅ Firebase Auth and Firestore initialized');
      console.log('✅ Firestore offline persistence enabled (modern API)');
      
      isFirebaseInitialized = true;
    } else {
      console.error('❌ Firebase configuration validation failed');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
  
  return { app, auth, db };
}

// Inicializar Firebase inmediatamente en el cliente
if (typeof window !== 'undefined') {
  initializeFirebaseApp();
} else {
  // En el servidor, crear objetos mock para evitar errores
  console.log('🔄 Running on server - Firebase services will be initialized on client');
}

export { auth, db, app, initializeFirebaseApp };

// Inicializar otros servicios solo en el cliente
let database: any = null;
let storage: any = null;
let functions: any = null;
let messaging: any = null;
let analytics: any = null;

if (typeof window !== 'undefined' && app) {
  // Inicializar Realtime Database con validación
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

  // Inicializar Storage
  try {
    storage = getStorage(app);
  } catch (error) {
    console.error('❌ Error initializing Firebase Storage:', error);
  }

  // Inicializar Functions
  try {
    functions = getFunctions(app);
  } catch (error) {
    console.error('❌ Error initializing Firebase Functions:', error);
  }

  // Inicializar Messaging
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging not available:', error);
  }

  // Inicializar Analytics
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.error('❌ Error initializing Firebase Analytics:', error);
      }
    }
  });
}

export { database, storage, functions, messaging, analytics };

// Nota: Firebase In-App Messaging no está disponible para aplicaciones web
// Usamos un sistema personalizado de mensajes in-app para la web

// Variable para rastrear si los emuladores ya están conectados
let emulatorsConnected = false;

// Conectar a emuladores en desarrollo
if (false && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && typeof window !== 'undefined' && app && auth && db) {
  // Solo conectar una vez
  if (!emulatorsConnected) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      if (database) connectDatabaseEmulator(database, 'localhost', 9000);
      if (storage) connectStorageEmulator(storage, 'localhost', 9199);
      if (functions) connectFunctionsEmulator(functions, 'localhost', 5001);
      emulatorsConnected = true;
      console.log('🔥 Firebase emulators connected');
    } catch (error) {
      console.log('Emulators already connected or not available');
    }
  }
}

export default app;