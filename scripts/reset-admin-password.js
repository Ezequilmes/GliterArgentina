const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'gliter-argentina'
    });
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error.message);
  process.exit(1);
}

async function resetAdminPassword() {
  const adminUID = 'T7PCdPxn5sdCEVC3Tns90zL0I7U2';
  const adminEmail = 'admin@gliter.com.ar';
  const newPassword = 'Admin123';
  
  console.log('🔧 Reseteando contraseña del administrador...');
  console.log('UID:', adminUID);
  console.log('Email:', adminEmail);
  console.log('Nueva contraseña:', newPassword);
  console.log('');
  
  try {
    // Actualizar la contraseña del usuario
    await admin.auth().updateUser(adminUID, {
      password: newPassword,
      emailVerified: true
    });
    
    console.log('✅ Contraseña del administrador actualizada exitosamente');
    console.log('🔑 Nueva contraseña:', newPassword);
    console.log('📧 Email verificado: true');
    console.log('');
    
    // Verificar que el usuario existe y está actualizado
    const userRecord = await admin.auth().getUser(adminUID);
    console.log('✅ Verificación del usuario:');
    console.log('  - UID:', userRecord.uid);
    console.log('  - Email:', userRecord.email);
    console.log('  - Email verificado:', userRecord.emailVerified);
    console.log('  - Último login:', userRecord.metadata.lastSignInTime);
    console.log('  - Creado:', userRecord.metadata.creationTime);
    console.log('  - Custom claims:', userRecord.customClaims);
    console.log('');
    console.log('🎉 El administrador ahora puede hacer login con:');
    console.log('   Email: ' + adminEmail);
    console.log('   Contraseña: ' + newPassword);
    
  } catch (error) {
    console.error('❌ Error al resetear la contraseña:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 El usuario no existe en Firebase Auth');
    } else if (error.code === 'auth/invalid-password') {
      console.log('💡 La contraseña no cumple con los requisitos de seguridad');
    } else if (error.code === 'permission-denied') {
      console.log('💡 Error de permisos. Verifica las credenciales de Firebase Admin');
    }
  }
}

resetAdminPassword().catch(console.error);