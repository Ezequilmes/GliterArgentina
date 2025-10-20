/**
 * Script de corrección para el problema de creación de usuarios
 * 
 * PROBLEMA IDENTIFICADO:
 * La función createUserProfile en src/lib/auth.ts no inicializa arrays importantes
 * como likedUsers, superLikedUsers, receivedSuperLikes, passedUsers
 * 
 * ESTO CAUSA:
 * - Errores al intentar usar likes/super likes
 * - Problemas con el chat
 * - Fallos al subir fotos
 * - Funcionalidades rotas para usuarios nuevos
 * 
 * SOLUCIÓN:
 * Agregar la inicialización de estos arrays vacíos en createUserProfile
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛠️  Script de Corrección de Creación de Usuarios');
console.log('==================================================');

// Ruta al archivo auth.ts
const authFilePath = path.join(__dirname, '..', 'src', 'lib', 'auth.ts');

// Leer el archivo actual
console.log('\n📖 Leyendo archivo auth.ts...');
let authContent = fs.readFileSync(authFilePath, 'utf8');

// Buscar la función createUserProfile (más flexible)
let functionMatch = authContent.match(/const createUserProfile = async \([^}]+\{[\s\S]*?await setDoc\(userRef, \{[\s\S]*?\}\);[\s\S]*?\}\s*\}\s*\};/);

if (!functionMatch) {
    // Intentar con una expresión más simple
    const simpleMatch = authContent.match(/const createUserProfile = async \([\s\S]*?await setDoc\([\s\S]*?\}\);[\s\S]*?\}\s*\};/);
    if (simpleMatch) {
        functionMatch = simpleMatch;
    }
}

if (!functionMatch) {
    console.error('❌ No se encontró la función createUserProfile');
    process.exit(1);
}

const currentFunction = functionMatch[0];
console.log('\n📋 Función createUserProfile encontrada');

// Buscar el objeto de datos del usuario dentro de setDoc
const setDocRegex = /await setDoc\(userRef, \{([\s\S]*?)\}\);/;
const setDocMatch = currentFunction.match(setDocRegex);

if (!setDocMatch) {
    console.error('❌ No se encontró el objeto de datos en setDoc');
    process.exit(1);
}

const userDataObject = setDocMatch[1];
console.log('\n📋 Objeto de datos actual:');
console.log('─'.repeat(50));
console.log('{' + userDataObject + '}');
console.log('─'.repeat(50));

// Verificar qué campos faltan
const hasLikedUsers = userDataObject.includes('likedUsers:');
const hasSuperLikedUsers = userDataObject.includes('superLikedUsers:');
const hasReceivedSuperLikes = userDataObject.includes('receivedSuperLikes:');
const hasPassedUsers = userDataObject.includes('passedUsers:');

console.log('\n🔍 Análisis de campos faltantes:');
console.log(`- likedUsers: ${hasLikedUsers ? '✅ Presente' : '❌ Faltante'}`);
console.log(`- superLikedUsers: ${hasSuperLikedUsers ? '✅ Presente' : '❌ Faltante'}`);
console.log(`- receivedSuperLikes: ${hasReceivedSuperLikes ? '✅ Presente' : '❌ Faltante'}`);
console.log(`- passedUsers: ${hasPassedUsers ? '✅ Presente' : '❌ Faltante'}`);

// Si todos los campos están presentes, no hay nada que arreglar
if (hasLikedUsers && hasSuperLikedUsers && hasReceivedSuperLikes && hasPassedUsers) {
    console.log('\n✅ Todos los campos están presentes. No se requiere corrección.');
    process.exit(0);
}

// Crear el nuevo objeto con los campos faltantes
let newUserDataObject = userDataObject;

// Campos que necesitamos agregar
const fieldsToAdd = [];
if (!hasLikedUsers) fieldsToAdd.push('    likedUsers: []');
if (!hasSuperLikedUsers) fieldsToAdd.push('    superLikedUsers: []');
if (!hasReceivedSuperLikes) fieldsToAdd.push('    receivedSuperLikes: []');
if (!hasPassedUsers) fieldsToAdd.push('    passedUsers: []');

// Agregar los campos faltantes al objeto
if (fieldsToAdd.length > 0) {
    // Buscar la última línea del objeto (antes del cierre)
    const lines = newUserDataObject.split('\n');
    
    // Encontrar la última línea que no esté vacía
    let lastLineIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() !== '' && !lines[i].includes('}')) {
            lastLineIndex = i;
            break;
        }
    }
    
    if (lastLineIndex >= 0) {
        // Agregar coma a la última línea si no tiene una
        const lastLine = lines[lastLineIndex];
        if (lastLine.trim() && !lastLine.trim().endsWith(',')) {
            lines[lastLineIndex] = lastLine + ',';
        }
        
        // Insertar los campos faltantes después de la última línea
        lines.splice(lastLineIndex + 1, 0, ...fieldsToAdd);
        newUserDataObject = lines.join('\n');
    }
}

console.log('\n📋 Nuevo objeto de datos:');
console.log('─'.repeat(50));
console.log('{' + newUserDataObject + '}');
console.log('─'.repeat(50));

// Crear el nuevo setDoc con el objeto corregido
const newSetDoc = `await setDoc(userRef, {${newUserDataObject}});`;

// Crear la nueva función completa
const newFunction = currentFunction.replace(setDocMatch[0], newSetDoc);

// Crear el nuevo contenido del archivo
const newAuthContent = authContent.replace(currentFunction, newFunction);

// Crear backup del archivo original
const backupPath = authFilePath + '.backup.' + Date.now();
console.log(`\n💾 Creando backup en: ${backupPath}`);
fs.writeFileSync(backupPath, authContent);

// Escribir el archivo corregido
console.log('\n✏️  Aplicando corrección...');
fs.writeFileSync(authFilePath, newAuthContent);

console.log('\n✅ Corrección aplicada exitosamente!');
console.log('\n📋 Resumen de cambios:');
console.log(`- Archivo modificado: ${authFilePath}`);
console.log(`- Backup creado: ${backupPath}`);
console.log(`- Campos agregados: ${fieldsToAdd.length}`);

if (fieldsToAdd.length > 0) {
    console.log('\n📝 Campos agregados:');
    fieldsToAdd.forEach(field => {
        console.log(`  - ${field.trim()}`);
    });
}

console.log('\n🔄 Próximos pasos:');
console.log('1. Reiniciar el servidor de desarrollo');
console.log('2. Probar crear un nuevo usuario');
console.log('3. Verificar que los likes y chat funcionen correctamente');
console.log('4. Si todo está bien, eliminar el archivo de backup');

console.log('\n⚠️  IMPORTANTE:');
console.log('   • Esta corrección solo afecta a nuevos usuarios');
console.log('   • Los usuarios existentes con problemas necesitarán una migración');
console.log('   • Los cambios se aplican inmediatamente al archivo auth.ts');

console.log('\n🎯 Verificación rápida:');
console.log('Después de aplicar esta corrección, los nuevos usuarios podrán:');
console.log('  - Enviar y recibir likes sin errores');
console.log('  - Usar super likes correctamente');
console.log('  - Crear chats cuando hay match');
console.log('  - Subir fotos sin problemas de permisos');