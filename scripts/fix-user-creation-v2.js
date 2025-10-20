import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛠️  Script de Corrección de Creación de Usuarios v2');
console.log('====================================================');

// Ruta al archivo auth.ts
const authFilePath = path.join(__dirname, '..', 'src', 'lib', 'auth.ts');

// Leer el archivo actual
console.log('\n📖 Leyendo archivo auth.ts...');
let authContent = fs.readFileSync(authFilePath, 'utf8');

// Buscar la sección del setDoc específicamente
const setDocRegex = /await setDoc\(userRef, \{([\s\S]*?)\}\);/;
const setDocMatch = authContent.match(setDocRegex);

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

// Buscar la posición correcta para insertar los campos (después de settings)
const lines = userDataObject.split('\n');
let settingsEndIndex = -1;
let lastNonEmptyLine = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('settings: {')) {
        // Encontrar el cierre de settings
        let braceCount = 0;
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) braceCount++;
            if (lines[j].includes('}')) braceCount--;
            if (braceCount === 0 && lines[j].includes('}')) {
                settingsEndIndex = j;
                break;
            }
        }
    }
    if (line.trim() && !line.includes('}')) {
        lastNonEmptyLine = i;
    }
}

console.log(`\n📍 Settings termina en línea: ${settingsEndIndex}`);
console.log(`📍 Última línea no vacía: ${lastNonEmptyLine}`);

// Crear el nuevo objeto con los campos faltantes
let newUserDataObject = userDataObject;

// Campos que necesitamos agregar
const fieldsToAdd = [];
if (!hasLikedUsers) fieldsToAdd.push('    likedUsers: []');
if (!hasSuperLikedUsers) fieldsToAdd.push('    superLikedUsers: []');
if (!hasReceivedSuperLikes) fieldsToAdd.push('    receivedSuperLikes: []');
if (!hasPassedUsers) fieldsToAdd.push('    passedUsers: []');

if (fieldsToAdd.length > 0) {
    // Agregar los campos después de settings
    if (settingsEndIndex >= 0) {
        // Agregar coma a la línea de cierre de settings si no tiene una
        const settingsEndLine = lines[settingsEndIndex];
        if (settingsEndLine.trim() && !settingsEndLine.trim().endsWith(',')) {
            lines[settingsEndIndex] = settingsEndLine + ',';
        }
        
        // Insertar los campos faltantes después de settings
        lines.splice(settingsEndIndex + 1, 0, ...fieldsToAdd);
        newUserDataObject = lines.join('\n');
    } else {
        console.log('⚠️  No se encontró el cierre de settings, agregando al final');
        // Agregar al final
        const lastLine = lines[lastNonEmptyLine];
        if (lastLine.trim() && !lastLine.trim().endsWith(',')) {
            lines[lastNonEmptyLine] = lastLine + ',';
        }
        lines.splice(lastNonEmptyLine + 1, 0, ...fieldsToAdd);
        newUserDataObject = lines.join('\n');
    }
}

console.log('\n📋 Nuevo objeto de datos:');
console.log('─'.repeat(50));
console.log('{' + newUserDataObject + '}');
console.log('─'.repeat(50));

// Crear el nuevo setDoc con el objeto corregido
const newSetDoc = `await setDoc(userRef, {${newUserDataObject}});`;

// Crear el nuevo contenido del archivo
const newAuthContent = authContent.replace(setDocMatch[0], newSetDoc);

// Crear backup del archivo original
const backupPath = authFilePath + '.backup.v2.' + Date.now();
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