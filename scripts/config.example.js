/**
 * Archivo de configuración de ejemplo para credenciales sensibles
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo como 'config.js' en el mismo directorio
 * 2. Reemplaza los valores de ejemplo con tus credenciales reales
 * 3. NUNCA commitees el archivo 'config.js' al repositorio
 */

module.exports = {
  // Credenciales de MercadoPago
  mercadoPago: {
    production: {
      accessToken: 'APP_USR-YOUR_PRODUCTION_ACCESS_TOKEN_HERE',
      publicKey: 'APP_USR-YOUR_PRODUCTION_PUBLIC_KEY_HERE'
    },
    sandbox: {
      accessToken: 'TEST-YOUR_SANDBOX_ACCESS_TOKEN_HERE',
      publicKey: 'TEST-YOUR_SANDBOX_PUBLIC_KEY_HERE'
    }
  },

  // Credenciales de administrador (solo para scripts de desarrollo)
  admin: {
    email: 'admin@example.com',
    password: 'YOUR_SECURE_PASSWORD_HERE',
    uid: 'YOUR_ADMIN_UID_HERE'
  },

  // Tokens FCM de prueba (solo para desarrollo)
  fcm: {
    testToken: 'YOUR_TEST_FCM_TOKEN_HERE'
  }
};