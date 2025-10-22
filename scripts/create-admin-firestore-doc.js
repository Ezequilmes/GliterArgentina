// Script para crear el documento del administrador en Firestore usando el MCP
// Este script crea el documento con el UID correcto obtenido de Firebase Auth

const adminUID = 'T7PCdPxn5sdCEVC3Tns90zL0I7U2';
const adminEmail = 'admin@gliter.com.ar';

// Estructura del documento administrador
const adminDocument = {
  // Información básica del usuario
  id: adminUID,
  name: 'Administrador Gliter',
  email: adminEmail,
  
  // Campos específicos de administrador
  role: 'admin',
  permissions: [
    'manage_exclusives',
    'manage_promo_codes', 
    'manage_users',
    'view_analytics'
  ],
  
  // Campos requeridos para compatibilidad con la app
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
  
  // Configuraciones por defecto
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
  verificationLevel: 'verified'
};

console.log('📋 Documento del administrador preparado:');
console.log('UID:', adminUID);
console.log('Email:', adminEmail);
console.log('Role:', adminDocument.role);
console.log('Permissions:', adminDocument.permissions);
console.log('');
console.log('🔧 Para crear este documento, usa el MCP de Firebase:');
console.log('Path: users/' + adminUID);
console.log('');
console.log('✅ Documento listo para ser creado en Firestore');

// Exportar para uso en otros scripts
module.exports = {
  adminUID,
  adminEmail,
  adminDocument
};