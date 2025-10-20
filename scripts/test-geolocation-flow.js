// Script para probar el flujo completo de geolocalización y descubrimiento
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

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
    console.log('🔥 Firebase emulators connected (real config)');
  } catch (error) {
    console.log('⚠️ Emulators already connected or not available');
  }
}

// Simular geolocalización (Buenos Aires)
const mockLocation = {
  latitude: -34.6037,
  longitude: -58.3816,
  accuracy: 10,
  timestamp: Date.now()
};

async function testGeolocationFlow() {
  try {
    console.log('🧪 Probando flujo completo de geolocalización y descubrimiento...');
    console.log('📋 Project ID:', firebaseConfig.projectId);
    console.log('');
    
    // 1. Login
    console.log('1️⃣ Haciendo login...');
    const { user } = await signInWithEmailAndPassword(auth, 'eventos3.0@hotmail.com', 'Amarilla15');
    console.log('✅ Login exitoso');
    console.log('🆔 UID:', user.uid);
    console.log('📧 Email:', user.email);
    
    // 2. Obtener datos del usuario actual
    console.log('');
    console.log('2️⃣ Obteniendo datos del usuario actual...');
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ No se encontraron datos del usuario');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ Datos del usuario obtenidos');
    console.log('👤 Nombre:', userData.name);
    console.log('📧 Email:', userData.email);
    console.log('📍 Ubicación guardada:', userData.location);
    
    // 3. Simular obtención de geolocalización
    console.log('');
    console.log('3️⃣ Simulando obtención de geolocalización...');
    console.log('📍 Ubicación simulada:', mockLocation);
    
    // 4. Actualizar ubicación del usuario
    console.log('');
    console.log('4️⃣ Actualizando ubicación del usuario...');
    await updateDoc(userRef, {
      location: {
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        city: 'Buenos Aires',
        country: 'Argentina'
      },
      lastSeen: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Ubicación actualizada en Firestore');
    
    // 5. Buscar usuarios cercanos
    console.log('');
    console.log('5️⃣ Buscando usuarios cercanos...');
    
    // Función para calcular distancia
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    
    // Buscar todos los usuarios activos
    const usersQuery = query(
      collection(db, 'users'),
      where('isActive', '==', true),
      limit(50)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const allUsers = [];
    
    usersSnapshot.forEach((doc) => {
      if (doc.id !== user.uid) { // Excluir al usuario actual
        const userData = doc.data();
        if (userData.location && userData.location.latitude && userData.location.longitude) {
          const distance = calculateDistance(
            mockLocation.latitude,
            mockLocation.longitude,
            userData.location.latitude,
            userData.location.longitude
          );
          
          if (distance <= 50) { // Dentro de 50km
            allUsers.push({
              user: { id: doc.id, ...userData },
              distance: Math.round(distance * 100) / 100
            });
          }
        }
      }
    });
    
    // Ordenar por distancia
    allUsers.sort((a, b) => a.distance - b.distance);
    
    console.log('✅ Búsqueda completada');
    console.log('👥 Usuarios encontrados:', allUsers.length);
    
    if (allUsers.length > 0) {
      console.log('');
      console.log('📋 Usuarios cercanos:');
      allUsers.slice(0, 5).forEach((userWithDistance, index) => {
        const u = userWithDistance.user;
        console.log(`   ${index + 1}. ${u.name} (${u.age} años) - ${userWithDistance.distance}km`);
        console.log(`      📧 ${u.email}`);
        console.log(`      📍 ${u.location.city}, ${u.location.country}`);
        console.log(`      🟢 Online: ${u.isOnline ? 'Sí' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️ No se encontraron usuarios cercanos');
    }
    
    // 6. Verificar que el flujo funciona
    console.log('6️⃣ Verificando flujo completo...');
    console.log('✅ Login: OK');
    console.log('✅ Datos de usuario: OK');
    console.log('✅ Geolocalización: OK (simulada)');
    console.log('✅ Actualización de ubicación: OK');
    console.log('✅ Búsqueda de usuarios: OK');
    
    console.log('');
    console.log('🎉 Flujo de geolocalización y descubrimiento completado!');
    console.log('📝 La aplicación web debería funcionar ahora');
    console.log('🔗 Pasos para probar:');
    console.log('   1. Ve a: http://localhost:3001/auth/login');
    console.log('   2. Inicia sesión con: eventos3.0@hotmail.com / Amarilla15');
    console.log('   3. Ve a: http://localhost:3001/discover');
    console.log('   4. Haz clic en "Obtener Ubicación" cuando el navegador lo solicite');
    console.log('   5. Permite el acceso a la ubicación');
    console.log('   6. Deberías ver usuarios cercanos');
    
  } catch (error) {
    console.error('❌ Error en el flujo:', error.message);
    console.error('📋 Detalles:', error);
  }
}

testGeolocationFlow();