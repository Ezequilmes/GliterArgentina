const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, connectFirestoreEmulator } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "gliter-argentina.firebaseapp.com",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar a emuladores
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

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

async function testDiscover() {
  try {
    console.log('🔍 Probando funcionalidad de discover...');
    
    // Login con el usuario de prueba
    const { user } = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log('✅ Usuario logueado:', user.email);

    // Obtener datos del usuario actual
    const currentUserRef = doc(db, 'users', user.uid);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data();
    
    console.log('📍 Ubicación del usuario:', currentUserData.location.city);

    // Obtener todos los usuarios
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log('👥 Total de usuarios en la base de datos:', usersSnapshot.size);

    // Filtrar usuarios para discover
    const nearbyUsers = [];
    const maxDistance = 50; // km
    const currentLocation = currentUserData.location;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Excluir al usuario actual
      if (userData.id === user.uid) return;
      
      // Excluir usuarios inactivos
      if (!userData.isActive) return;
      
      // Calcular distancia
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        userData.location.latitude,
        userData.location.longitude
      );
      
      if (distance <= maxDistance) {
        nearbyUsers.push({
          user: userData,
          distance: Math.round(distance)
        });
      }
    });

    // Ordenar por distancia
    nearbyUsers.sort((a, b) => a.distance - b.distance);

    console.log('🎯 Usuarios cercanos encontrados:', nearbyUsers.length);
    
    nearbyUsers.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.user.name} (${item.user.age} años) - ${item.distance}km - ${item.user.location.city}`);
    });

    // Probar funcionalidad de like
    if (nearbyUsers.length > 0) {
      const targetUser = nearbyUsers[0].user;
      console.log(`\n💖 Dando like a ${targetUser.name}...`);
      
      await updateDoc(currentUserRef, {
        likedUsers: arrayUnion(targetUser.id)
      });
      
      console.log('✅ Like enviado exitosamente');

      // Verificar si es un match
      const targetUserRef = doc(db, 'users', targetUser.id);
      const targetUserSnap = await getDoc(targetUserRef);
      const targetUserData = targetUserSnap.data();
      
      if (targetUserData.likedUsers && targetUserData.likedUsers.includes(user.uid)) {
        console.log('🎉 ¡Es un match!');
      } else {
        console.log('⏳ Esperando respuesta del otro usuario');
      }
    }

    console.log('\n🎉 Prueba de discover completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en discover:', error);
  }
}

testDiscover();