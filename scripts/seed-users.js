const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const { connectFirestoreEmulator } = require('firebase/firestore');

// Firebase config (usando variables de entorno del proyecto)
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "gliter-argentina.firebaseapp.com",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, 'localhost', 8080);

// Usuarios de prueba
const testUsers = [
  {
    id: 'user1',
    name: 'Carlos Mendoza',
    email: 'carlos@test.com',
    age: 28,
    gender: 'male',
    sexualRole: 'versatile',
    bio: 'Amante del fútbol y la buena comida. Busco conexiones genuinas.',
    location: {
      city: 'Buenos Aires',
      country: 'Argentina',
      latitude: -34.6037,
      longitude: -58.3816
    },
    interests: ['fútbol', 'cocina', 'viajes', 'música'],
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    ],
    isVerified: true,
    isPremium: false,
    isOnline: true,
    isActive: true
  },
  {
    id: 'user2',
    name: 'Alejandro Silva',
    email: 'alejandro@test.com',
    age: 32,
    gender: 'male',
    sexualRole: 'active',
    bio: 'Ingeniero de software, gym enthusiast. Me gusta la tecnología y el fitness.',
    location: {
      city: 'Córdoba',
      country: 'Argentina',
      latitude: -31.4201,
      longitude: -64.1888
    },
    interests: ['tecnología', 'gym', 'programación', 'cine'],
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
    ],
    isVerified: false,
    isPremium: true,
    isOnline: false,
    isActive: true
  },
  {
    id: 'user3',
    name: 'Diego Fernández',
    email: 'diego@test.com',
    age: 25,
    gender: 'male',
    sexualRole: 'passive',
    bio: 'Artista y diseñador. Busco alguien con quien compartir aventuras creativas.',
    location: {
      city: 'Rosario',
      country: 'Argentina',
      latitude: -32.9442,
      longitude: -60.6505
    },
    interests: ['arte', 'diseño', 'fotografía', 'café'],
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400'
    ],
    isVerified: true,
    isPremium: false,
    isOnline: true,
    isActive: true
  },
  {
    id: 'user4',
    name: 'Matías Rodriguez',
    email: 'matias@test.com',
    age: 30,
    gender: 'male',
    sexualRole: 'versatile',
    bio: 'Chef profesional, amante de la naturaleza. Siempre listo para una nueva aventura.',
    location: {
      city: 'Mendoza',
      country: 'Argentina',
      latitude: -32.8895,
      longitude: -68.8458
    },
    interests: ['cocina', 'naturaleza', 'vino', 'senderismo'],
    photos: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400'
    ],
    isVerified: false,
    isPremium: false,
    isOnline: true,
    isActive: true
  },
  {
    id: 'user5',
    name: 'Lucas Morales',
    email: 'lucas@test.com',
    age: 26,
    gender: 'male',
    sexualRole: 'active',
    bio: 'Médico, runner, y amante de los libros. Busco conversaciones profundas.',
    location: {
      city: 'La Plata',
      country: 'Argentina',
      latitude: -34.9215,
      longitude: -57.9545
    },
    interests: ['medicina', 'running', 'lectura', 'ciencia'],
    photos: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400'
    ],
    isVerified: true,
    isPremium: true,
    isOnline: false,
    isActive: true
  }
];

async function seedUsers() {
  console.log('🌱 Iniciando seed de usuarios...');
  
  try {
    for (const userData of testUsers) {
      const userRef = doc(db, 'users', userData.id);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        blockedUsers: [],
        favoriteUsers: []
      });
      console.log(`✅ Usuario creado: ${userData.name}`);
    }
    
    console.log('🎉 Seed completado exitosamente!');
    console.log(`📊 Total de usuarios creados: ${testUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  }
}

// Ejecutar el seed
seedUsers().then(() => {
  console.log('🏁 Proceso finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});