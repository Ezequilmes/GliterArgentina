// Script para crear el perfil del usuario de prueba en Firestore
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, Timestamp } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqJZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
  authDomain: "gliter-app.firebaseapp.com",
  projectId: "gliter-app",
  storageBucket: "gliter-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
try {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔥 Conectado a emuladores de Firebase');
} catch (error) {
  console.log('⚠️ Emuladores ya conectados o no disponibles');
}

async function createFirestoreProfile() {
  try {
    // Autenticarse con el usuario de prueba
    console.log('🔐 Autenticándose...');
    const userCredential = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    console.log('✅ Autenticación exitosa');
    console.log('👤 UID:', userCredential.user.uid);
    
    // Crear el perfil en Firestore
    console.log('📝 Creando perfil en Firestore...');
    const userRef = doc(db, 'users', userCredential.user.uid);
    
    const userProfile = {
      id: userCredential.user.uid,
      name: 'Usuario de Prueba',
      email: 'eventos3.0@hotmail.com',
      photos: [],
      age: 25,
      gender: 'male',
      sexualRole: 'versatile',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        city: 'Buenos Aires',
        country: 'Argentina'
      },
      bio: 'Usuario de prueba para testing de la aplicación',
      interests: ['música', 'deportes', 'viajes', 'tecnología'],
      isOnline: true,
      lastSeen: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isVerified: false,
      isPremium: false,
      settings: {
        notifications: {
          messages: true,
          matches: true,
          marketing: false
        },
        privacy: {
          showOnline: true,
          showDistance: true,
          showAge: true
        },
        searchPreferences: {
          maxDistance: 50,
          ageRange: { min: 18, max: 99 },
          genders: ['male', 'female', 'other'],
          sexualRoles: ['active', 'passive', 'versatile']
        }
      },
      matches: [],
      receivedSuperLikes: []
    };
    
    await setDoc(userRef, userProfile);
    console.log('✅ Perfil creado exitosamente en Firestore!');
    
    // Verificar que se creó correctamente
    console.log('🔍 Verificando perfil creado...');
    const { getDoc } = await import('firebase/firestore');
    const createdDoc = await getDoc(userRef);
    
    if (createdDoc.exists()) {
      console.log('✅ Verificación exitosa - Perfil encontrado');
      const data = createdDoc.data();
      console.log('📋 Datos del perfil:', {
        name: data.name,
        email: data.email,
        age: data.age,
        location: data.location,
        interests: data.interests
      });
    } else {
      console.log('❌ Error: Perfil no encontrado después de la creación');
    }
    
  } catch (error) {
    console.error('❌ Error creando perfil:', error.message);
    console.error('📋 Detalles del error:', error);
  }
}

createFirestoreProfile();