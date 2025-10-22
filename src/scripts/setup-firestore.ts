#!/usr/bin/env node

import { initializeFirestoreCollections } from '../lib/firestore-setup';

async function main() {
  try {
    console.log('🚀 Iniciando configuración de Firestore...');
    await initializeFirestoreCollections();
    console.log('✅ Configuración de Firestore completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la configuración de Firestore:', error);
    process.exit(1);
  }
}

main();