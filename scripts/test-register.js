const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = require('firebase/firestore');

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

async function testRegister() {
  try {
    console.log('🧪 Probando registro de usuario...');
    
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Usuario de Prueba',
      age: 25,
      gender: 'male',
      sexualRole: 'versatile'
    };

    // Crear usuario en Auth
    const { user } = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password);
    console.log('✅ Usuario creado en Auth:', user.uid);

    // Actualizar perfil
    await updateProfile(user, {
      displayName: testUser.name
    });
    console.log('✅ Perfil actualizado');

    // Crear documento en Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      id: user.uid,
      name: testUser.name,
      email: testUser.email,
      age: testUser.age,
      gender: testUser.gender,
      sexualRole: testUser.sexualRole,
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        city: 'Buenos Aires',
        country: 'Argentina'
      },
      bio: 'Usuario de prueba para testing',
      interests: ['testing', 'desarrollo'],
      photos: [],
      isOnline: true,
      isActive: true,
      isVerified: false,
      isPremium: false,
      blockedUsers: [],
      favoriteUsers: [],
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Documento creado en Firestore');

    console.log('🎉 Registro completado exitosamente!');
    console.log('📧 Email:', testUser.email);
    console.log('🆔 UID:', user.uid);
    
  } catch (error) {
    console.error('❌ Error en el registro:', error);
  }
}

testRegister();