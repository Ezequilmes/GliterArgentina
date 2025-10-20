const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

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
  console.log('🔍 INICIANDO DIAGNÓSTICO SIMPLIFICADO...\n');
  
  try {
    // Buscar usuarios existentes
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isOnline', '==', true));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Se encontraron ${querySnapshot.size} usuarios online`);
    
    if (querySnapshot.empty) {
      console.log('⚠️  No se encontraron usuarios online');
      return;
    }
    
    // Obtener primer usuario como referencia
    const firstUser = querySnapshot.docs[0];
    const userData = firstUser.data();
    
    console.log('\n🔍 Analizando estructura del primer usuario:');
    console.log(`- ID: ${firstUser.id}`);
    console.log(`- Nombre: ${userData.name || 'Sin nombre'}`);
    console.log(`- Email: ${userData.email || 'Sin email'}`);
    console.log(`- Edad: ${userData.age || 'Sin edad'}`);
    console.log(`- Género: ${userData.gender || 'Sin género'}`);
    console.log(`- Sexual Role: ${userData.sexualRole || 'Sin rol'}`);
    console.log(`- Fotos: ${Array.isArray(userData.photos) ? userData.photos.length : 0}`);
    console.log(`- Online: ${userData.isOnline}`);
    console.log(`- Verificado: ${userData.isVerified}`);
    console.log(`- Premium: ${userData.isPremium}`);
    
    // Verificar campos críticos
    console.log('\n⚠️  Verificando campos críticos:');
    
    const criticalFields = [
      'id', 'name', 'email', 'age', 'gender', 'sexualRole', 
      'location', 'photos', 'isOnline', 'lastSeen', 'createdAt', 'updatedAt'
    ];
    
    criticalFields.forEach(field => {
      const hasField = userData.hasOwnProperty(field);
      const value = userData[field];
      console.log(`- ${field}: ${hasField ? '✅' : '❌'} ${hasField ? (Array.isArray(value) ? `[${value.length} items]` : value) : 'FALTANTE'}`);
    });
    
    // Verificar arrays importantes
    console.log('\n📋 Verificando arrays:');
    const arrayFields = ['likedUsers', 'superLikedUsers', 'receivedSuperLikes', 'blockedUsers', 'favoriteUsers'];
    
    arrayFields.forEach(field => {
      const hasField = userData.hasOwnProperty(field);
      const value = userData[field];
      console.log(`- ${field}: ${hasField ? '✅' : '⚠️'} ${hasField ? (Array.isArray(value) ? `[${value.length} items]` : 'NO ES ARRAY') : 'NO EXISTE'}`);
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
    
    console.log('\n🏁 Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
  }
  
  process.exit(0);
}

// Ejecutar diagnóstico
runDiagnostic().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});