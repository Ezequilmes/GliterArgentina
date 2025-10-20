import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 ANALIZANDO ESTRUCTURA DE USUARIOS EN EL CÓDIGO...\n');

// Leer archivos clave
const authFile = readFileSync(join(process.cwd(), 'src/lib/auth.ts'), 'utf8');
const firestoreFile = readFileSync(join(process.cwd(), 'src/lib/firestore.ts'), 'utf8');
const authContextFile = readFileSync(join(process.cwd(), 'src/contexts/AuthContext.tsx'), 'utf8');

console.log('📋 ANÁLISIS DE FUNCIONES DE CREACIÓN DE USUARIOS:');
console.log('==================================================');

// Buscar función createUserProfile
const createUserProfileMatch = authFile.match(/export\s+async\s+function\s+createUserProfile[\s\S]*?^}/m);
if (createUserProfileMatch) {
  console.log('✅ Función createUserProfile encontrada en auth.ts');
  
  // Extraer campos creados
  const fields = [];
  const lines = createUserProfileMatch[0].split('\n');
  
  lines.forEach(line => {
    // Buscar asignaciones de campos
    const fieldMatch = line.match(/(\w+):\s*([^,\n]+)/);
    if (fieldMatch && !line.includes('if') && !line.includes('await')) {
      fields.push({
        name: fieldMatch[1].trim(),
        value: fieldMatch[2].trim()
      });
    }
  });
  
  console.log('\n📋 Campos creados por createUserProfile:');
  fields.forEach(field => {
    console.log(`- ${field.name}: ${field.value}`);
  });
} else {
  console.log('❌ Función createUserProfile no encontrada');
}

// Buscar función userService.createUser
const createUserServiceMatch = firestoreFile.match(/createUser\s*:\s*async[\s\S]*?^\s*}/m);
if (createUserServiceMatch) {
  console.log('\n✅ Función userService.createUser encontrada en firestore.ts');
  
  const lines = createUserServiceMatch[0].split('\n');
  const fields = [];
  
  lines.forEach(line => {
    const fieldMatch = line.match(/(\w+):\s*([^,\n]+)/);
    if (fieldMatch && !line.includes('if') && !line.includes('await') && !line.includes('const')) {
      fields.push({
        name: fieldMatch[1].trim(),
        value: fieldMatch[2].trim()
      });
    }
  });
  
  console.log('\n📋 Campos creados por userService.createUser:');
  fields.forEach(field => {
    console.log(`- ${field.name}: ${field.value}`);
  });
} else {
  console.log('❌ Función userService.createUser no encontrada');
}

// Buscar función loadUserData en AuthContext
const loadUserDataMatch = authContextFile.match(/async\s+function\s+loadUserData[\s\S]*?^}/m);
if (loadUserDataMatch) {
  console.log('\n✅ Función loadUserData encontrada en AuthContext.tsx');
  
  // Buscar el objeto User por defecto
  const defaultUserMatch = loadUserDataMatch[0].match(/const\s+userData\s*=\s*{[\s\S]*?^\s*}/m);
  if (defaultUserMatch) {
    console.log('\n📋 Campos del usuario por defecto (cuando falla la carga):');
    
    const lines = defaultUserMatch[0].split('\n');
    lines.forEach(line => {
      const fieldMatch = line.match(/(\w+):\s*([^,\n]+)/);
      if (fieldMatch && !line.includes('const')) {
        console.log(`- ${fieldMatch[1].trim()}: ${fieldMatch[2].trim()}`);
      }
    });
  }
} else {
  console.log('❌ Función loadUserData no encontrada');
}

console.log('\n🔍 ANÁLISIS DE TIPOS DE USUARIO:');
console.log('=============================');

// Buscar definición de tipo User
const userTypeMatch = authContextFile.match(/interface\s+User\s*{[\s\S]*?^}/m);
if (userTypeMatch) {
  console.log('✅ Tipo User encontrado');
  
  const lines = userTypeMatch[0].split('\n');
  console.log('\n📋 Propiedades del tipo User:');
  lines.forEach(line => {
    const propMatch = line.match(/(\w+)\?:?\s*(\w+[\[\]\s\w]*)/);
    if (propMatch && !line.includes('interface')) {
      console.log(`- ${propMatch[1]}: ${propMatch[2].trim()}`);
    }
  });
} else {
  console.log('❌ Tipo User no encontrado');
}

console.log('\n⚠️  POSIBLES PROBLEMAS IDENTIFICADOS:');
console.log('====================================');

// Verificar si los arrays de likes están inicializados
if (createUserServiceMatch) {
  const content = createUserServiceMatch[0];
  
  if (!content.includes('likedUsers')) {
    console.log('⚠️  El campo likedUsers no se inicializa en createUser');
  }
  
  if (!content.includes('superLikedUsers')) {
    console.log('⚠️  El campo superLikedUsers no se inicializa en createUser');
  }
  
  if (!content.includes('receivedSuperLikes')) {
    console.log('⚠️  El campo receivedSuperLikes no se inicializa en createUser');
  }
  
  if (!content.includes('blockedUsers')) {
    console.log('⚠️  El campo blockedUsers no se inicializa en createUser');
  }
  
  if (!content.includes('favoriteUsers')) {
    console.log('⚠️  El campo favoriteUsers no se inicializa en createUser');
  }
}

console.log('\n💡 RECOMENDACIONES:');
console.log('==================');
console.log('1. Asegúrate de que todos los campos necesarios estén inicializados');
console.log('2. Verifica que los arrays estén inicializados como [] y no como undefined');
console.log('3. Compara la estructura con usuarios antiguos que sí funcionan');
console.log('4. Revisa las reglas de Firestore para asegurarte de que no bloqueen campos faltantes');

console.log('\n🏁 Análisis completado');