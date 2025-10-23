const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'gliter-argentina'
  });
}

const db = admin.firestore();

async function checkUsersAndAddToken() {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...');
    
    // Get users from database
    const usersSnapshot = await db.collection('users').limit(10).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      console.log('💡 Necesitas crear un usuario primero para probar las notificaciones push');
      return;
    }
    
    console.log(`✅ Encontrados ${usersSnapshot.size} usuarios:`);
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        name: userData.name,
        fcmTokens: userData.fcmTokens || []
      });
      
      console.log(`  - ${userData.name || 'Sin nombre'} (${userData.email || 'Sin email'}) - Tokens: ${userData.fcmTokens?.length || 0}`);
    });
    
    // Add a test FCM token to the first user if they don't have any
    const firstUser = users[0];
    if (firstUser.fcmTokens.length === 0) {
      console.log(`\n🔧 Agregando token FCM de prueba al usuario: ${firstUser.name || firstUser.email}`);
      
      // This is a fake token for testing - in real scenario, this would come from the client
      const testToken = 'clyUfr1Af5tIE2lrs6Tmfm:APA91bFZXnlvKcQtVVi64ruADzSRkPsWKtRSvaB9l4olHSrZsv7DUmBwU_GHaFjuu-MPOdvVg4HXDanVPhCctNF7Gvd55gGpoWxsYOJjqJQsWL_rnzxfAbw';
      
      await db.collection('users').doc(firstUser.id).update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(testToken)
      });
      
      console.log('✅ Token FCM agregado exitosamente');
      console.log(`📱 Token: ${testToken.substring(0, 30)}...`);
      
      return { userId: firstUser.id, token: testToken };
    } else {
      console.log(`\n✅ El usuario ${firstUser.name || firstUser.email} ya tiene ${firstUser.fcmTokens.length} token(s) FCM`);
      return { userId: firstUser.id, token: firstUser.fcmTokens[0] };
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUsersAndAddToken()
  .then((result) => {
    if (result) {
      console.log('\n🎯 Listo para probar notificaciones push!');
      console.log(`   Usuario ID: ${result.userId}`);
      console.log(`   Token: ${result.token.substring(0, 30)}...`);
    }
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la verificación:', error);
    process.exit(1);
  });