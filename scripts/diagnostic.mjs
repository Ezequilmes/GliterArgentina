import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

async function runDiagnostic() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE ESTRUCTURA DE USUARIOS...\n');
  
  try {
    // Buscar usuarios existentes
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isOnline', '==', true));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Se encontraron ${querySnapshot.size} usuarios online`);
    
    if (querySnapshot.empty) {
      console.log('⚠️  No se encontraron usuarios online, buscando cualquier usuario...');
      
      // Intentar obtener cualquier usuario
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      if (allUsersSnapshot.empty) {
        console.log('❌ No se encontraron usuarios en la base de datos');
        return;
      }
      
      console.log(`📊 Se encontraron ${allUsersSnapshot.size} usuarios en total`);
      
      // Analizar el primer usuario
      const firstUser = allUsersSnapshot.docs[0];
      const userData = firstUser.data();
      
      console.log('\n🔍 Analizando estructura del primer usuario:');
      analyzeUserStructure(firstUser.id, userData);
      
    } else {
      // Analizar el primer usuario online
      const firstUser = querySnapshot.docs[0];
      const userData = firstUser.data();
      
      console.log('\n🔍 Analizando estructura del primer usuario online:');
      analyzeUserStructure(firstUser.id, userData);
    }
    
    console.log('\n🏁 Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
  }
}

function analyzeUserStructure(userId, userData) {
  console.log(`- ID: ${userId}`);
  console.log(`- Nombre: ${userData.name || 'Sin nombre'}`);
  console.log(`- Email: ${userData.email || 'Sin email'}`);
  console.log(`- Edad: ${userData.age || 'Sin edad'}`);
  console.log(`- Género: ${userData.gender || 'Sin género'}`);
  console.log(`- Sexual Role: ${userData.sexualRole || 'Sin rol'}`);
  console.log(`- Fotos: ${Array.isArray(userData.photos) ? userData.photos.length : 0}`);
  console.log(`- Online: ${userData.isOnline}`);
  console.log(`- Verificado: ${userData.isVerified}`);
  console.log(`- Premium: ${userData.isPremium}`);
  
  // Verificar campos críticos para funcionalidad
  console.log('\n⚠️  Verificando campos críticos para CHAT:');
  
  const criticalChatFields = [
    'id', 'isOnline', 'lastSeen', 'createdAt', 'updatedAt'
  ];
  
  criticalChatFields.forEach(field => {
    const hasField = userData.hasOwnProperty(field);
    const value = userData[field];
    console.log(`- ${field}: ${hasField ? '✅' : '❌'} ${hasField ? (value === undefined ? 'undefined' : value) : 'FALTANTE'}`);
  });
  
  // Verificar campos para LIKES
  console.log('\n💚 Verificando campos para LIKES:');
  const likeFields = ['likedUsers', 'superLikedUsers', 'receivedSuperLikes'];
  
  likeFields.forEach(field => {
    const hasField = userData.hasOwnProperty(field);
    const value = userData[field];
    console.log(`- ${field}: ${hasField ? '✅' : '⚠️'} ${hasField ? (Array.isArray(value) ? `[${value.length} items]` : typeof value) : 'NO EXISTE'}`);
  });
  
  // Verificar campos de seguridad
  console.log('\n🔒 Verificando campos de seguridad:');
  const securityFields = ['blockedUsers', 'favoriteUsers'];
  
  securityFields.forEach(field => {
    const hasField = userData.hasOwnProperty(field);
    const value = userData[field];
    console.log(`- ${field}: ${hasField ? '✅' : '⚠️'} ${hasField ? (Array.isArray(value) ? `[${value.length} items]` : typeof value) : 'NO EXISTE'}`);
  });
  
  // Verificar configuración
  console.log('\n⚙️  Verificando configuración:');
  if (userData.settings) {
    console.log('- settings: ✅ Existe');
    if (userData.settings.notifications) {
      console.log(`  - notifications.messages: ${userData.settings.notifications.messages}`);
      console.log(`  - notifications.matches: ${userData.settings.notifications.matches}`);
      console.log(`  - notifications.likes: ${userData.settings.notifications.likes}`);
    } else {
      console.log('  - notifications: ❌ No existe');
    }
  } else {
    console.log('- settings: ❌ No existe');
  }
  
  // Verificar ubicación
  console.log('\n📍 Verificando ubicación:');
  if (userData.location) {
    console.log('- location: ✅ Existe');
    console.log(`  - latitude: ${userData.location.latitude}`);
    console.log(`  - longitude: ${userData.location.longitude}`);
    console.log(`  - city: ${userData.location.city || 'Sin ciudad'}`);
    console.log(`  - country: ${userData.location.country || 'Sin país'}`);
  } else {
    console.log('- location: ❌ No existe');
  }
  
  // Listar todas las propiedades del usuario
  console.log('\n📋 TODAS LAS PROPIEDADES DEL USUARIO:');
  console.log('=====================================');
  const allProperties = Object.keys(userData).sort();
  allProperties.forEach(prop => {
    const value = userData[prop];
    const valueType = Array.isArray(value) ? 'array' : typeof value;
    const valuePreview = valueType === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : 
                        valueType === 'array' ? `[${value.length} items]` : 
                        value;
    console.log(`- ${prop}: ${valueType} = ${valuePreview}`);
  });
}

// Ejecutar diagnóstico
runDiagnostic().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});