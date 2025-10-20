import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator, serverTimestamp } from 'firebase/firestore';

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

async function createTestUser() {
  try {
    console.log('🔥 Creando usuario de prueba...');
    
    // Datos del usuario de prueba
    const userData = {
      email: 'eventos3.0@hotmail.com',
      password: 'Amarilla15',
      name: 'Usuario de Prueba',
      age: 25,
      gender: 'male',
      sexualRole: 'versatile',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        city: 'Buenos Aires',
        country: 'Argentina'
      },
      bio: 'Usuario de prueba para testing',
      interests: ['música', 'deportes', 'viajes']
    };

    // Crear usuario en Firebase Auth
    const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    console.log('✅ Usuario creado en Auth:', user.uid);

    // Crear perfil en Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      id: user.uid,
      name: userData.name,
      email: userData.email,
      photos: [],
      age: userData.age,
      gender: userData.gender,
      sexualRole: userData.sexualRole,
      location: userData.location,
      bio: userData.bio,
      interests: userData.interests,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      isPremium: false,
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

    console.log('✅ Perfil creado en Firestore');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password:', userData.password);
    console.log('🎉 Usuario de prueba listo para usar!');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
  }
}

createTestUser();