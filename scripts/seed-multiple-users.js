const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Configuración de Firebase para emuladores
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "gliter-argentina",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

// Datos de usuarios de prueba
const testUsers = [
  {
    email: 'carlos.mendez@gmail.com',
    password: 'Test123456',
    name: 'Carlos Mendez',
    age: 28,
    gender: 'male',
    sexualRole: 'top',
    location: {
      latitude: -34.6118,
      longitude: -58.3960,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Amante del fitness y los viajes. Busco conexiones auténticas.',
    interests: ['fitness', 'viajes', 'música', 'cocina'],
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400']
  },
  {
    email: 'sofia.rodriguez@gmail.com',
    password: 'Test123456',
    name: 'Sofia Rodriguez',
    age: 25,
    gender: 'female',
    sexualRole: 'versatile',
    location: {
      latitude: -34.6037,
      longitude: -58.3816,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Artista y diseñadora. Me encanta la vida nocturna y el arte.',
    interests: ['arte', 'diseño', 'música electrónica', 'fotografía'],
    photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400']
  },
  {
    email: 'martin.garcia@gmail.com',
    password: 'Test123456',
    name: 'Martin Garcia',
    age: 32,
    gender: 'male',
    sexualRole: 'bottom',
    location: {
      latitude: -34.5875,
      longitude: -58.3974,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Profesional en tecnología. Busco algo serio y duradero.',
    interests: ['tecnología', 'lectura', 'cine', 'deportes'],
    photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400']
  },
  {
    email: 'lucia.fernandez@gmail.com',
    password: 'Test123456',
    name: 'Lucia Fernandez',
    age: 29,
    gender: 'female',
    sexualRole: 'top',
    location: {
      latitude: -34.6158,
      longitude: -58.3731,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Médica y yogui. Busco alguien con quien compartir aventuras.',
    interests: ['yoga', 'medicina', 'naturaleza', 'meditación'],
    photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400']
  },
  {
    email: 'diego.lopez@gmail.com',
    password: 'Test123456',
    name: 'Diego Lopez',
    age: 26,
    gender: 'male',
    sexualRole: 'versatile',
    location: {
      latitude: -34.6092,
      longitude: -58.3842,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Músico y productor. La música es mi pasión y mi vida.',
    interests: ['música', 'producción', 'conciertos', 'guitarra'],
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400']
  },
  {
    email: 'valentina.torres@gmail.com',
    password: 'Test123456',
    name: 'Valentina Torres',
    age: 24,
    gender: 'female',
    sexualRole: 'bottom',
    location: {
      latitude: -34.6025,
      longitude: -58.3975,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Estudiante de psicología. Me fascina entender la mente humana.',
    interests: ['psicología', 'libros', 'café', 'teatro'],
    photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400']
  },
  {
    email: 'alejandro.morales@gmail.com',
    password: 'Test123456',
    name: 'Alejandro Morales',
    age: 30,
    gender: 'male',
    sexualRole: 'top',
    location: {
      latitude: -34.6144,
      longitude: -58.3686,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Chef profesional. Cocinar es mi arte y mi pasión.',
    interests: ['cocina', 'gastronomía', 'vinos', 'restaurantes'],
    photos: ['https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400']
  },
  {
    email: 'camila.santos@gmail.com',
    password: 'Test123456',
    name: 'Camila Santos',
    age: 27,
    gender: 'female',
    sexualRole: 'versatile',
    location: {
      latitude: -34.5989,
      longitude: -58.3731,
      city: 'Buenos Aires',
      country: 'Argentina'
    },
    bio: 'Bailarina profesional. El movimiento es mi lenguaje.',
    interests: ['danza', 'ballet', 'teatro', 'expresión corporal'],
    photos: ['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400']
  }
];

async function createMultipleUsers() {
  console.log('🔥 Creando múltiples usuarios de prueba...');
  
  for (let i = 0; i < testUsers.length; i++) {
    const userData = testUsers[i];
    
    try {
      console.log(`\n👤 Creando usuario ${i + 1}/${testUsers.length}: ${userData.name}`);
      
      // Crear usuario en Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      console.log(`✅ Usuario creado en Auth: ${user.uid}`);

      // Crear perfil en Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        name: userData.name,
        email: userData.email,
        photos: userData.photos,
        age: userData.age,
        gender: userData.gender,
        sexualRole: userData.sexualRole,
        location: userData.location,
        bio: userData.bio,
        interests: userData.interests,
        isOnline: Math.random() > 0.5, // Algunos usuarios online aleatoriamente
        lastSeen: new Date(Date.now() - Math.random() * 86400000), // Última vez visto en las últimas 24h
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: Math.random() > 0.7, // 30% verificados
        isPremium: Math.random() > 0.8, // 20% premium
        settings: {
          showAge: true,
          showDistance: true,
          showOnlineStatus: true,
          maxDistance: 50,
          ageRange: { min: 18, max: 99 },
          genderPreference: 'all',
          notifications: {
            messages: true,
            matches: true,
            likes: true,
            marketing: false
          }
        }
      });

      console.log(`✅ Perfil creado en Firestore para ${userData.name}`);
      
    } catch (error) {
      console.error(`❌ Error creando usuario ${userData.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 ¡Todos los usuarios de prueba han sido creados!');
  console.log('📱 Ahora puedes explorar la aplicación con más perfiles disponibles.');
}

createMultipleUsers();