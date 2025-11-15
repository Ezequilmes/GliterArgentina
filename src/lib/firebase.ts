import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
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
    return false;
  }
  
  return true;
}

// Inicializar Firebase solo si estamos en el cliente y la configuración es válida
let app: any = null;
let auth: any = null;
let db: any = null;

if (typeof window !== 'undefined' && validateFirebaseConfig()) {
  // Verificar si ya existe una app inicializada
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Inicializar servicios
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true,
  });
} else if (typeof window === 'undefined') {
  // En el servidor, crear objetos mock para evitar errores
  console.log('🔄 Running on server - Firebase services will be initialized on client');
}

export { auth, db };

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

  // Inicializar Messaging solo si está soportado por el navegador
  try {
    isMessagingSupported()
      .then((supported) => {
        if (supported) {
          try {
            messaging = getMessaging(app);
          } catch (e) {
            console.warn('Firebase Messaging initialization failed:', e);
          }
        } else {
          console.warn('Firebase Messaging not supported in this browser');
        }
      })
      .catch((e) => {
        console.warn('Firebase Messaging support check failed:', e);
      });
  } catch (error) {
    console.warn('Firebase Messaging setup skipped due to environment:', error);
  }

  // Inicializar Analytics con manejo de errores y diagnóstico
  isAnalyticsSupported()
    .then((supported) => {
      if (!supported) {
        console.warn('Firebase Analytics not supported in this environment');
        return;
      }
      try {
        console.log('🔎 Analytics init: projectId=%s appId=%s measurementId=%s',
          firebaseConfig.projectId,
          firebaseConfig.appId,
          firebaseConfig.measurementId
        );
        analytics = getAnalytics(app);
      } catch (error: any) {
        const msg = error?.message || String(error);
        console.error('❌ Error initializing Firebase Analytics:', msg);
        if (msg.includes('config-fetch-failed') || msg.includes('App not found') || msg.includes('measurement ID')) {
          console.warn('⚠️ Analytics dynamic config fetch failed. Falling back to local measurementId:', firebaseConfig.measurementId);
          console.warn('⚙️ Verify Firebase Console: app registration, Analytics enabled, and appId/measurementId match');
        }
      }
    })
    .catch((e) => {
      console.warn('Firebase Analytics support check failed:', e);
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
    } catch {
      console.log('Emulators already connected or not available');
    }
  }
}

export default app;

/**
 * Check whether Firebase client SDK and Realtime Database are initialized.
 * Ensures readiness before triggering data flows depending on Firebase.
 */
export function isFirebaseClientReady(): boolean {
  return typeof window !== 'undefined' && !!app && !!auth && !!database;
}
