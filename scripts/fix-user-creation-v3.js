import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛠️  Script de Corrección de Creación de Usuarios v3');
console.log('====================================================');
console.log('Este script mueve los arrays del objeto settings al nivel principal');

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

// Verificar si los campos están dentro de settings (problema actual)
const lines = userDataObject.split('\n');
let settingsStart = -1;
let settingsEnd = -1;
let arrayFields = [];

// Encontrar el rango de settings y los arrays que están dentro
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'settings: {') {
        settingsStart = i;
    }
    
    if (settingsStart >= 0 && line === '}') {
        // Buscar el cierre de settings (debe haber un } que cierre el objeto settings)
        let braceCount = 0;
        for (let j = settingsStart; j <= i; j++) {
            if (lines[j].includes('{')) braceCount++;
            if (lines[j].includes('}')) braceCount--;
            if (braceCount === 0) {
                settingsEnd = j;
                break;
            }
        }
        if (settingsEnd >= 0) break;
    }
}

console.log(`\n📍 Settings encontrado: líneas ${settingsStart} - ${settingsEnd}`);

// Extraer los campos de arrays que están dentro de settings
if (settingsStart >= 0 && settingsEnd >= 0) {
    for (let i = settingsStart; i <= settingsEnd; i++) {
        const line = lines[i].trim();
        if (line.match(/^(likedUsers|superLikedUsers|receivedSuperLikes|passedUsers): \[\]/)) {
            arrayFields.push(line);
            lines[i] = ''; // Eliminar del objeto settings
        }
    }
}

console.log(`\n📋 Campos de arrays encontrados en settings: ${arrayFields.length}`);
arrayFields.forEach(field => console.log(`  - ${field}`));

// Si no hay campos para mover, salir
if (arrayFields.length === 0) {
    console.log('\n✅ No hay campos de arrays dentro de settings. No se requiere corrección.');
    process.exit(0);
}

// Limpiar líneas vacías y crear el nuevo objeto
const cleanLines = lines.filter(line => line.trim() !== '');

// Encontrar la posición para insertar los campos (después de settings)
let insertPosition = -1;
for (let i = 0; i < cleanLines.length; i++) {
    if (cleanLines[i].trim() === '}' && cleanLines[i-1] && cleanLines[i-1].includes('}')) {
        // Este es el cierre de settings
        insertPosition = i;
        break;
    }
}

if (insertPosition >= 0) {
    // Agregar coma a la línea anterior si no tiene
    const prevLine = cleanLines[insertPosition];
    if (prevLine.trim() && !prevLine.trim().endsWith(',')) {
        cleanLines[insertPosition] = prevLine + ',';
    }
    
    // Insertar los campos después de settings
    cleanLines.splice(insertPosition + 1, 0, ...arrayFields);
}

// Reconstruir el objeto
const newUserDataObject = cleanLines.join('\n');

console.log('\n📋 Nuevo objeto de datos:');
console.log('─'.repeat(50));
console.log('{' + newUserDataObject + '}');
console.log('─'.repeat(50));

// Crear el nuevo setDoc con el objeto corregido
const newSetDoc = `await setDoc(userRef, {${newUserDataObject}});`;

// Crear el nuevo contenido del archivo
const newAuthContent = authContent.replace(setDocMatch[0], newSetDoc);

// Crear backup del archivo original
const backupPath = authFilePath + '.backup.v3.' + Date.now();
console.log(`\n💾 Creando backup en: ${backupPath}`);
fs.writeFileSync(backupPath, authContent);

// Escribir el archivo corregido
console.log('\n✏️  Aplicando corrección...');
fs.writeFileSync(authFilePath, newAuthContent);

console.log('\n✅ Corrección aplicada exitosamente!');
console.log('\n📋 Resumen de cambios:');
console.log(`- Archivo modificado: ${authFilePath}`);
console.log(`- Backup creado: ${backupPath}`);
console.log(`- Campos movidos: ${arrayFields.length}`);

console.log('\n📝 Campos movidos al nivel principal:');
arrayFields.forEach(field => {
    console.log(`  - ${field.trim()}`);
});

console.log('\n🔄 Próximos pasos:');
console.log('1. Reiniciar el servidor de desarrollo');
console.log('2. Probar crear un nuevo usuario');
console.log('3. Verificar que los likes y chat funcionen correctamente');
console.log('4. Si todo está bien, eliminar el archivo de backup');

console.log('\n⚠️  IMPORTANTE:');
console.log('   • Esta corrección solo afecta a nuevos usuarios');
console.log('   • Los usuarios existentes con problemas necesitarán una migración');
console.log('   • Los arrays ahora están al nivel principal del objeto usuario');