#!/usr/bin/env node

/**
 * Script para diagnosticar y limpiar listeners de Firestore problemáticos
 * que causan el error "Target ID already exists"
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin
const serviceAccount = require('./gliter-argentina-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function diagnoseFirestoreListeners() {
  console.log('🔍 Diagnosticando listeners de Firestore...');
  
  try {
    // Obtener información sobre las colecciones activas
    const collections = ['chats', 'users', 'fcm_tokens', 'notifications'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        console.log(`✅ Colección ${collectionName}: accesible (${snapshot.size} documentos)`);
      } catch (error) {
        console.log(`❌ Error accediendo a ${collectionName}:`, error.message);
      }
    }
    
    // Verificar si hay problemas con índices compuestos
    console.log('\n🔍 Verificando índices compuestos...');
    
    // Intentar una consulta que requiera índice compuesto
    try {
      const testQuery = await db
        .collection('chats')
        .where('participants', 'array-contains', 'test-user-id')
        .orderBy('lastActivity', 'desc')
        .limit(1)
        .get();
      
      console.log('✅ Índices compuestos funcionando correctamente');
    } catch (error) {
      console.log('⚠️  Posible problema con índices compuestos:', error.message);
      if (error.code === 'failed-precondition') {
        console.log('📋 Se necesita crear un índice compuesto para esta consulta');
      }
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

async function cleanupStaleListeners() {
  console.log('\n🧹 Limpiando listeners antiguos...');
  
  try {
    // En un entorno real, aquí iría la lógica para limpiar listeners
    // Como esto es en el cliente, el cleanup debe hacerse en el código
    console.log('💡 Sugerencia: Implementa un cleanup adecuado en el código del cliente');
    console.log('💡 Usa unsubscribe() correctamente cuando cambies de chat o te desconectes');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar el diagnóstico
diagnoseFirestoreListeners()
  .then(() => cleanupStaleListeners())
  .then(() => {
    console.log('\n🎉 Proceso de diagnóstico y limpieza completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });