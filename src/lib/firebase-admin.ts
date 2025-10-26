import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Variable para controlar si estamos en build time
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.FIREBASE_CONFIG;

// Función para inicializar Firebase Admin SDK
function initializeFirebaseAdmin() {
  // Si ya está inicializado, no hacer nada
  if (getApps().length > 0) {
    return true;
  }

  // Durante build time, no intentar inicializar
  if (isBuildTime) {
    console.log('🔧 Build time detectado, saltando inicialización de Firebase Admin');
    return false;
  }

  try {
    // Método 1: Usar GOOGLE_APPLICATION_CREDENTIALS (preferido)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔧 Inicializando Firebase Admin con GOOGLE_APPLICATION_CREDENTIALS');
      initializeApp();
      return true;
    }

    // Método 2: Usar GOOGLE_APPLICATION_CREDENTIALS_B64 (fallback)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_B64) {
      console.log('🔧 Inicializando Firebase Admin con GOOGLE_APPLICATION_CREDENTIALS_B64');
      const serviceAccountJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
      
      initializeApp({
        credential: cert(serviceAccount),
      });
      return true;
    }

    // Método 3: Usar variables individuales (fallback legacy)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('🔧 Inicializando Firebase Admin con variables individuales');
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID!,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
        private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL!,
        client_id: process.env.FIREBASE_CLIENT_ID!,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      } as ServiceAccount;
      
      initializeApp({
        credential: cert(serviceAccount),
      });
      return true;
    }

    // Si estamos en desarrollo y no hay credenciales, usar applicationDefault
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Inicializando Firebase Admin con applicationDefault (desarrollo)');
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gliter-argentina'
      });
      return true;
    }

    console.warn('⚠️ No se encontraron credenciales de Firebase Admin SDK');
    return false;
    
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    return false;
  }
}

// Función para obtener Firestore de forma lazy
function getDb() {
  if (!initializeFirebaseAdmin()) {
    throw new Error('Firebase Admin no está inicializado. Asegúrate de que las credenciales estén configuradas.');
  }
  return getFirestore();
}

// Función para obtener Messaging de forma lazy
function getMessagingService() {
  if (!initializeFirebaseAdmin()) {
    throw new Error('Firebase Admin no está inicializado. Asegúrate de que las credenciales estén configuradas.');
  }
  return getMessaging();
}

// Exportar funciones lazy en lugar de instancias directas
export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof getFirestore>];
  }
});

export const messaging = new Proxy({} as ReturnType<typeof getMessaging>, {
  get(target, prop) {
    return getMessagingService()[prop as keyof ReturnType<typeof getMessaging>];
  }
});

// Exportar función de inicialización por si se necesita llamar manualmente
export { initializeFirebaseAdmin };