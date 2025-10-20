// Script para crear el usuario de prueba en el proyecto REAL de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

// Configuración REAL de Firebase (misma que .env.local)
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:25bb32180d1bdaf724fe68"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
let emulatorsConnected = false;
if (!emulatorsConnected) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    emulatorsConnected = true;
    console.log('🔥 Firebase emulators connected (real project)');
  } catch (error) {
    console.log('⚠️ Emulators already connected or not available');
  }
}

async function createUserInRealProject() {
  try {
    console.log('👤 Creando usuario de prueba en proyecto REAL...');
    console.log('📋 Project ID:', firebaseConfig.projectId);
    console.log('');
    
    // Datos del usuario de prueba
    const userData = {
      email: 'eventos3.0@hotmail.com',
      password: 'Amarilla15',
      name: 'Usuario de Prueba',
      age: 28,
      gender: 'male',
      sexualRole: 'versatile',
      bio: 'Usuario de prueba para desarrollo de la aplicación Gliter Argentina.',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        city: 'Buenos Aires',
        country: 'Argentina'
      },
      interests: ['tecnología', 'desarrollo', 'testing', 'música'],
      photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
      isVerified: true,
      isPremium: false,
      isOnline: true,
      isActive: true,
      privacySettings: {
        showAge: true,
        showLocation: true,
        showOnlineStatus: true
      },
      notificationSettings: {
        messages: true,
        matches: true,
        likes: true,
        marketing: false
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    };
    
    // 1. Crear usuario en Firebase Auth
    console.log('1️⃣ Creando usuario en Firebase Auth...');
    const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    console.log('✅ Usuario creado en Auth');
    console.log('🆔 UID:', user.uid);
    console.log('📧 Email:', user.email);
    
    // 2. Crear perfil en Firestore
    console.log('');
    console.log('2️⃣ Creando perfil en Firestore...');
    const userRef = doc(db, 'users', user.uid);
    
    // Remover password del objeto antes de guardarlo en Firestore
    const { password, ...userProfile } = userData;
    userProfile.uid = user.uid;
    
    await setDoc(userRef, userProfile);
    console.log('✅ Perfil creado en Firestore');
    
    // 3. Verificar que se creó correctamente
    console.log('');
    console.log('3️⃣ Verificando creación...');
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const savedData = userDoc.data();
      console.log('✅ Verificación exitosa');
      console.log('👤 Nombre:', savedData.name);
      console.log('📧 Email:', savedData.email);
      console.log('📍 Ubicación:', savedData.location.city, savedData.location.country);
      console.log('🎯 Intereses:', savedData.interests.join(', '));
    } else {
      console.log('❌ Error: No se encontró el perfil creado');
    }
    
    console.log('');
    console.log('🎉 Usuario de prueba creado exitosamente en proyecto real!');
    console.log('📝 Credenciales:');
    console.log('   📧 Email: eventos3.0@hotmail.com');
    console.log('   🔑 Password: Amarilla15');
    console.log('   🆔 UID:', user.uid);
    console.log('');
    console.log('🌐 Ahora puedes probar el login en: http://localhost:3001/auth/login');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('');
      console.log('ℹ️ El usuario ya existe. Intentando hacer login...');
      
      try {
        const { user } = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
        console.log('✅ Login exitoso con usuario existente');
        console.log('🆔 UID:', user.uid);
        
        // Verificar si tiene perfil en Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          console.log('✅ Perfil encontrado en Firestore');
          const userData = userDoc.data();
          console.log('👤 Nombre:', userData.name);
        } else {
          console.log('⚠️ Usuario existe en Auth pero no tiene perfil en Firestore');
        }
        
      } catch (loginError) {
        console.error('❌ Error en login:', loginError.message);
      }
    }
  }
}

createUserInRealProject();