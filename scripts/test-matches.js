const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, collection, addDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');

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
const db = getFirestore(app);

// Conectar a emuladores
connectFirestoreEmulator(db, 'localhost', 8080);

async function createTestLikesAndMatches() {
  console.log('💕 Creando likes y matches de prueba...');
  
  try {
    // Obtener todos los usuarios
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`👥 Encontrados ${users.length} usuarios`);
    
    if (users.length < 2) {
      console.log('❌ Se necesitan al menos 2 usuarios para crear matches');
      return;
    }

    // Crear algunos likes unidireccionales
    const likesRef = collection(db, 'likes');
    const matchesRef = collection(db, 'matches');
    
    // Usuario principal (eventos3.0@hotmail.com) recibe likes
    const mainUser = users.find(u => u.email === 'eventos3.0@hotmail.com');
    if (!mainUser) {
      console.log('❌ No se encontró el usuario principal');
      return;
    }

    console.log(`\n👤 Usuario principal: ${mainUser.name} (${mainUser.id})`);

    // Crear likes hacia el usuario principal
    const likers = users.filter(u => u.id !== mainUser.id).slice(0, 4);
    
    for (const liker of likers) {
      // Crear like
      await addDoc(likesRef, {
        fromUserId: liker.id,
        toUserId: mainUser.id,
        createdAt: serverTimestamp(),
        type: Math.random() > 0.7 ? 'super_like' : 'like'
      });
      
      console.log(`💖 ${liker.name} le dio like a ${mainUser.name}`);
    }

    // Crear algunos matches mutuos
    const matchPartners = users.filter(u => u.id !== mainUser.id).slice(0, 2);
    
    for (const partner of matchPartners) {
      // Crear likes mutuos
      await addDoc(likesRef, {
        fromUserId: mainUser.id,
        toUserId: partner.id,
        createdAt: serverTimestamp(),
        type: 'like'
      });
      
      await addDoc(likesRef, {
        fromUserId: partner.id,
        toUserId: mainUser.id,
        createdAt: serverTimestamp(),
        type: 'like'
      });

      // Crear match
      await addDoc(matchesRef, {
        user1Id: mainUser.id,
        user2Id: partner.id,
        createdAt: serverTimestamp(),
        isActive: true,
        lastActivity: serverTimestamp()
      });

      console.log(`🎉 Match creado entre ${mainUser.name} y ${partner.name}`);
    }

    // Crear algunos likes entre otros usuarios
    for (let i = 0; i < 5; i++) {
      const randomUser1 = users[Math.floor(Math.random() * users.length)];
      const randomUser2 = users[Math.floor(Math.random() * users.length)];
      
      if (randomUser1.id !== randomUser2.id) {
        await addDoc(likesRef, {
          fromUserId: randomUser1.id,
          toUserId: randomUser2.id,
          createdAt: serverTimestamp(),
          type: Math.random() > 0.8 ? 'super_like' : 'like'
        });
        
        console.log(`💝 ${randomUser1.name} le dio like a ${randomUser2.name}`);
      }
    }

    // Crear notificaciones de prueba
    const notificationsRef = collection(db, 'notifications');
    
    for (const liker of likers.slice(0, 2)) {
      await addDoc(notificationsRef, {
        userId: mainUser.id,
        type: 'like',
        fromUserId: liker.id,
        fromUserName: liker.name,
        fromUserPhoto: liker.photos?.[0],
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    for (const partner of matchPartners) {
      await addDoc(notificationsRef, {
        userId: mainUser.id,
        type: 'match',
        fromUserId: partner.id,
        fromUserName: partner.name,
        fromUserPhoto: partner.photos?.[0],
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    console.log('\n✅ Likes, matches y notificaciones de prueba creados exitosamente!');
    console.log('📱 Ahora puedes explorar la aplicación con actividad real');
    
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
}

createTestLikesAndMatches();