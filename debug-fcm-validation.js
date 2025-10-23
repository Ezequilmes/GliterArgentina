#!/usr/bin/env node

/**
 * Script para depurar la validación de tokens FCM
 */

// Función isValidFCMToken copiada del endpoint de administración
function isValidFCMToken(token) {
  if (!token || typeof token !== 'string') {
    console.log('❌ Token inválido: no es string o está vacío');
    return false;
  }
  
  // Los tokens FCM reales tienen características específicas:
  // - Longitud típica entre 140-180 caracteres (incluyendo 152)
  // - Contienen caracteres alfanuméricos, guiones y guiones bajos
  // - Comienzan con patrones específicos de Firebase
  const fcmTokenPattern = /^[A-Za-z0-9_:-]+$/;
  
  if (!fcmTokenPattern.test(token)) {
    console.log('❌ Token inválido: no cumple el patrón alfanumérico');
    console.log('   Token:', token);
    console.log('   Caracteres inválidos encontrados:', token.match(/[^A-Za-z0-9_-]/g));
    return false;
  }
  
  // Verificar longitud mínima y máxima razonable
  if (token.length < 100 || token.length > 200) {
    console.log('❌ Token inválido: longitud fuera de rango');
    console.log('   Longitud:', token.length);
    return false;
  }
  
  // Verificar que contenga el patrón típico de Firebase (starts with device ID:APA91b...)
  if (!token.includes(':APA91b')) {
    console.log('❌ Token inválido: no contiene :APA91b');
    return false;
  }
  
  console.log('✅ Token válido');
  return true;
}

// Tokens reales de Firestore
const realTokens = [
  "clyUfr1Af5tIE2lrs6Tmfm:APA91bFZXnlvKcQtVVi64ruADzSRkPsWKtRSvaB9l4olHSrZsv7DUmBwU_GHaFjuu-MPOdvVg4HXDanVPhCctNF7Gvd55gGpoWxsYOJjqJQsWL_rnzxfAbw",
  "eAAyjRj5e2zNiRGx205ujq:APA91bHPlC-_0FpkVdW70c1_ezGZJ6Z1PLLwpt3zY5Yoj-urvTzp053CQoAM3uuCU9-oJQmcb_8zsTQigdDGafmw35fMD-iXbuWYx1HjdXqoC8nWG6a3u5k"
];

console.log('🔍 Depurando validación de tokens FCM...\n');

realTokens.forEach((token, index) => {
  console.log(`\n📋 Token ${index + 1}:`);
  console.log(`   Token completo: ${token}`);
  console.log(`   Longitud: ${token.length}`);
  console.log(`   Contiene ':APA91b': ${token.includes(':APA91b')}`);
  console.log(`   Resultado validación:`);
  
  const isValid = isValidFCMToken(token);
  console.log(`   ✅/❌: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
});

// Simular el proceso de filtrado como lo hace el endpoint
console.log('\n\n🔍 Simulando proceso de filtrado del endpoint:');

const mockUserTokens = [
  "clyUfr1Af5tIE2lrs6Tmfm:APA91bFZXnlvKcQtVVi64ruADzSRkPsWKtRSvaB9l4olHSrZsv7DUmBwU_GHaFjuu-MPOdvVg4HXDanVPhCctNF7Gvd55gGpoWxsYOJjqJQsWL_rnzxfAbw",
  "eAAyjRj5e2zNiRGx205ujq:APA91bHPlC-_0FpkVdW70c1_ezGZJ6Z1PLLwpt3zY5Yoj-urvTzp053CQoAM3uuCU9-oJQmcb_8zsTQigdDGafmw35fMD-iXbuWYx1HjdXqoC8nWG6a3u5k"
];

console.log('Tokens del usuario:', mockUserTokens);
console.log('Filtrando tokens válidos...');

const validTokens = mockUserTokens.filter(isValidFCMToken);

console.log('Tokens válidos encontrados:', validTokens.length);
console.log('Tokens válidos:', validTokens);
console.log('Tokens filtrados (inválidos):', mockUserTokens.length - validTokens.length);