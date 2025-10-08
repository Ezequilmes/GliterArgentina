import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuración de Firebase (usando las credenciales del .env.local)
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:362b67d495109dff24fe68"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ El usuario ya existe. Puedes usar las credenciales:');
      console.log('📧 Email: eventos3.0@hotmail.com');
      console.log('🔑 Password: Amarilla15');
    } else {
      console.error('❌ Error creando usuario:', error.message);
    }
  }
}

createTestUser();