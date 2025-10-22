const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin SDK
// Nota: Este script requiere credenciales de administrador válidas
try {
  // Intentar inicializar con credenciales por defecto o variables de entorno
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'gliter-argentina'
    });
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error.message);
  console.log('💡 Este script requiere credenciales de Firebase Admin SDK');
  console.log('   Configura GOOGLE_APPLICATION_CREDENTIALS o usa firebase login');
  process.exit(1);
}

const db = admin.firestore();

async function createAdminDocument() {
  const adminUID = 'T7PCdPxn5sdCEVC3Tns90zL0I7U2';
  const adminEmail = 'admin@gliter.com.ar';
  
  console.log('🔧 Creando documento del administrador...');
  console.log('UID:', adminUID);
  console.log('Email:', adminEmail);
  
  const adminDocument = {
    id: adminUID,
    name: 'Administrador Gliter',
    email: adminEmail,
    role: 'admin',
    permissions: [
      'manage_exclusives',
      'manage_promo_codes', 
      'manage_users',
      'view_analytics'
    ],
    age: 30,
    gender: 'admin',
    sexualRole: 'admin',
    location: {
      latitude: -34.6037,
      longitude: -58.3816,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Administrador del sistema Gliter Argentina',
    isVerified: true,
    isPremium: true,
    photos: [],
    blockedUsers: [],
    isActive: true,
    passedUsers: [],
    settings: {
      showAge: false,
      genderPreference: 'all',
      showOnlineStatus: false,
      notifications: {
        matches: false,
        marketing: false,
        messages: true,
        likes: false
      },
      showDistance: false,
      maxDistance: 100,
      ageRange: {
        min: 18,
        max: 99
      },
      privacy: {
        showDistance: false,
        showOnline: false,
        showAge: false
      }
    },
    interests: ['Administración', 'Moderación'],
    receivedSuperLikes: [],
    matches: [],
    superLikes: 999,
    receivedLikes: [],
    likedUsers: [],
    superLikedUsers: [],
    isOnline: false,
    emailVerified: true,
    verificationLevel: 'verified',
    createdAt: admin.firestore.Timestamp.now(),
    lastActive: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    lastSeen: admin.firestore.Timestamp.now(),
    lastVerificationUpdate: admin.firestore.Timestamp.now()
  };

  try {
    // Crear el documento en Firestore
    await db.collection('users').doc(adminUID).set(adminDocument);
    
    console.log('✅ Documento del administrador creado exitosamente');
    console.log('📍 Path: users/' + adminUID);
    console.log('👤 Nombre:', adminDocument.name);
    console.log('📧 Email:', adminDocument.email);
    console.log('🔑 Role:', adminDocument.role);
    console.log('🛡️ Permissions:', adminDocument.permissions);
    
    // Verificar que el documento se creó correctamente
    const doc = await db.collection('users').doc(adminUID).get();
    if (doc.exists) {
      console.log('✅ Verificación: Documento existe en Firestore');
      const data = doc.data();
      console.log('📊 Datos verificados:', {
        email: data.email,
        role: data.role,
        isVerified: data.isVerified,
        isPremium: data.isPremium
      });
    } else {
      console.log('❌ Error: El documento no se encontró después de la creación');
    }
    
  } catch (error) {
    console.error('❌ Error al crear el documento:', error);
    
    if (error.code === 'permission-denied') {
      console.log('💡 Error de permisos. Verifica las reglas de Firestore');
    } else if (error.code === 'unauthenticated') {
      console.log('💡 Error de autenticación. Verifica las credenciales de Firebase Admin');
    }
  }
}

createAdminDocument().catch(console.error);