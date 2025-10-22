// Usar Firebase client SDK en lugar de admin SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Configuración de Firebase (misma que en firebase-config.ts)
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
const db = getFirestore(app);
const auth = getAuth(app);

async function createAdminUserDocument() {
  try {
    console.log('🔧 Autenticándose como administrador...');
    
    const adminUID = 'T7PCdPxn5sdCEVC3Tns90zL0I7U2';
    const adminEmail = 'admin@gliter.com.ar';
    const adminPassword = 'Amarilla15';
    
    // Autenticarse como administrador
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('✅ Autenticación exitosa');
    
    console.log('🔧 Creando documento del usuario administrador...');
    
    // Datos del usuario administrador
    const adminUserData = {
      email: adminEmail,
      displayName: 'Administrador Gliter',
      role: 'admin',
      isAdmin: true,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      isOnline: false,
      permissions: [
        'manage_exclusives',
        'manage_promo_codes', 
        'manage_users',
        'view_analytics'
      ],
      // Datos adicionales requeridos por la app
      age: 30,
      location: 'Buenos Aires, Argentina',
      bio: 'Administrador del sistema Gliter',
      photos: [],
      preferences: {
        ageRange: { min: 18, max: 65 },
        maxDistance: 100,
        showMe: 'everyone'
      },
      subscription: {
        type: 'premium',
        status: 'active',
        expiresAt: Timestamp.fromDate(new Date('2025-12-31'))
      },
      stats: {
        likes: 0,
        matches: 0,
        superLikes: 0
      }
    };

    // Crear el documento en Firestore
    const userDocRef = doc(db, 'users', adminUID);
    await setDoc(userDocRef, adminUserData);
    
    console.log('✅ Documento del usuario administrador creado exitosamente');
    console.log('📧 Email:', adminEmail);
    console.log('🆔 UID:', adminUID);
    console.log('🔑 Rol:', adminUserData.role);
    
    // Verificar que se creó correctamente
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      console.log('✅ Verificación: El documento existe en Firestore');
      console.log('📄 Datos:', JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log('❌ Error: El documento no se pudo crear');
    }
    
  } catch (error) {
    console.error('❌ Error al crear el documento del administrador:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
createAdminUserDocument();