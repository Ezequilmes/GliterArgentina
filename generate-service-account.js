#!/usr/bin/env node

/**
 * Script para generar las credenciales del service account de Firebase
 * Este script crea un service account temporal para Firebase Admin SDK
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'gliter-argentina';
const BACKEND_ID = 'my-web-app';
const LOCATION = 'us-central1';
const SERVICE_ACCOUNT_NAME = 'gliter-app-hosting';
const SERVICE_ACCOUNT_EMAIL = `${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com`;
const KEY_FILE = path.join(__dirname, 'service-account-key.json');

console.log('🔐 Generando credenciales del service account para Firebase Admin SDK...');
console.log(`📍 Proyecto: ${PROJECT_ID}`);
console.log(`👤 Service Account: ${SERVICE_ACCOUNT_EMAIL}`);

function runCommand(command, description) {
  try {
    console.log(`\n⚡ ${description}`);
    console.log(`   Comando: ${command}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Éxito');
    return result;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    return null;
  }
}

async function generateServiceAccount() {
  // Verificar si ya existe el service account
  console.log('\n🔍 Verificando service accounts existentes...');
  const existingAccounts = runCommand(
    `gcloud iam service-accounts list --project=${PROJECT_ID} --format="value(email)"`,
    'Listando service accounts'
  );

  if (existingAccounts && existingAccounts.includes(SERVICE_ACCOUNT_EMAIL)) {
    console.log(`✅ Service account ${SERVICE_ACCOUNT_EMAIL} ya existe`);
  } else {
    // Crear service account
    runCommand(
      `gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} --project=${PROJECT_ID} --display-name="Gliter App Hosting Service Account"`,
      'Creando service account'
    );

    // Asignar roles necesarios
    const roles = [
      'roles/firebase.admin',
      'roles/datastore.user',
      'roles/storage.admin'
    ];

    for (const role of roles) {
      runCommand(
        `gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" --role="${role}"`,
        `Asignando rol ${role}`
      );
    }
  }

  // Generar clave del service account
  runCommand(
    `gcloud iam service-accounts keys create "${KEY_FILE}" --iam-account="${SERVICE_ACCOUNT_EMAIL}" --project=${PROJECT_ID}`,
    'Generando clave del service account'
  );

  // Leer y parsear la clave
  if (fs.existsSync(KEY_FILE)) {
    const serviceAccountKey = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
    
    console.log('\n🔑 Credenciales generadas exitosamente:');
    console.log(`FIREBASE_PROJECT_ID: ${serviceAccountKey.project_id}`);
    console.log(`FIREBASE_PRIVATE_KEY_ID: ${serviceAccountKey.private_key_id}`);
    console.log(`FIREBASE_CLIENT_EMAIL: ${serviceAccountKey.client_email}`);
    console.log(`FIREBASE_CLIENT_ID: ${serviceAccountKey.client_id}`);
    console.log(`FIREBASE_PRIVATE_KEY: [CLAVE PRIVADA - ${serviceAccountKey.private_key.length} caracteres]`);
    
    // Configurar el contenido del archivo de clave como un único secreto en Firebase App Hosting.
    // El SDK de Firebase Admin buscará automáticamente la variable GOOGLE_APPLICATION_CREDENTIALS.
    console.log('\n🔐 Configurando secreto GOOGLE_APPLICATION_CREDENTIALS en Firebase App Hosting...');
    const keyFileContent = fs.readFileSync(KEY_FILE, 'utf8');
    const command = `echo '${keyFileContent}' | firebase apphosting:secrets:set GOOGLE_APPLICATION_CREDENTIALS --project=${PROJECT_ID} --backend=${BACKEND_ID} --location=${LOCATION} --data-file=-`;
    
    runCommand(
      command,
      'Configurando GOOGLE_APPLICATION_CREDENTIALS'
    );

    // Limpiar archivo de clave temporal
    fs.unlinkSync(KEY_FILE);
    console.log('🧹 Archivo temporal de clave eliminado');

    return serviceAccountKey;
  } else {
    throw new Error('No se pudo generar el archivo de clave del service account');
  }
}

// Ejecutar generación
if (require.main === module) {
  generateServiceAccount().catch(console.error);
}

module.exports = { generateServiceAccount };