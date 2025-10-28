// Test script para verificar variables de entorno con dotenv
require('dotenv').config({ path: '.env.local' });

console.log('=== DEBUGGING ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

// Variables de Firebase que deberían estar disponibles
const firebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

console.log('=== FIREBASE VARIABLES (after dotenv) ===');
firebaseVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`, value ? `"${value}"` : 'UNDEFINED');
  if (value) {
    console.log(`  Length: ${value.length}, First 10 chars: "${value.substring(0, 10)}"`);
  }
});

console.log('');
console.log('=== CHECKING FOR HIDDEN CHARACTERS ===');
const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('NEXT_PUBLIC_FIREBASE_API_KEY')) {
    console.log(`Line ${index + 1}: "${line}"`);
    console.log(`Hex: ${Buffer.from(line, 'utf8').toString('hex')}`);
    console.log(`Length: ${line.length}`);
  }
});