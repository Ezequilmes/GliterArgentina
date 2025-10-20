// Script para verificar si el usuario existe en Firestore (con autenticación)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, collection, getDocs } from 'firebase/firestore';

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

async function checkFirestoreUser() {
  try {
    // Primero autenticarse
    console.log('🔐 Autenticándose...');
    await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    console.log('✅ Autenticación exitosa');
    
    console.log('🔍 Verificando usuarios en Firestore...');
    
    // 1. Buscar específicamente el usuario de prueba
    console.log('1️⃣ Buscando usuario específico...');
    const testUserId = 'RAAIknmmTjoHHHdD0lIynmU1C56x'; // UID del usuario de prueba
    const userDocRef = doc(db, 'users', testUserId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('✅ Usuario de prueba encontrado!');
      const userData = userDoc.data();
      console.log('📋 Datos del usuario:', {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        age: userData.age,
        location: userData.location,
        isOnline: userData.isOnline
      });
    } else {
      console.log('❌ Usuario de prueba no encontrado en Firestore');
    }
    
    // 2. Intentar listar algunos usuarios (limitado)
    console.log('2️⃣ Intentando listar usuarios...');
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      console.log(`📊 Total de usuarios encontrados: ${usersSnapshot.size}`);
      
      if (usersSnapshot.size > 0) {
        let count = 0;
        usersSnapshot.forEach((doc) => {
          if (count < 3) { // Solo mostrar los primeros 3
            const userData = doc.data();
            console.log(`👤 Usuario ID: ${doc.id}`);
            console.log(`📧 Email: ${userData.email}`);
            console.log(`👤 Nombre: ${userData.name}`);
            console.log('---');
            count++;
          }
        });
        if (usersSnapshot.size > 3) {
          console.log(`... y ${usersSnapshot.size - 3} usuarios más`);
        }
      }
    } catch (listError) {
      console.log('⚠️ No se pudo listar usuarios (puede ser por reglas de seguridad)');
    }
    
  } catch (error) {
    console.error('❌ Error verificando Firestore:', error.message);
    console.error('📋 Detalles del error:', error);
  }
}

checkFirestoreUser();