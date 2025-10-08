# Notas para Producción - Gliter Argentina

## ⚠️ IMPORTANTE: Tareas antes del despliegue

### 1. Eliminar Usuarios de Prueba
- **Ubicación**: `test-chat.js` en la raíz del proyecto
- **Acción**: Eliminar o comentar el script completo antes del despliegue
- **Razón**: Contiene usuarios de prueba (Ana García, Miguel Torres) que no deben existir en producción

### 2. Limpiar Base de Datos de Firestore
Antes del despliegue, ejecutar las siguientes acciones en la consola de Firebase:
- Eliminar todos los documentos de la colección `users` que sean de prueba
- Eliminar todos los chats y mensajes asociados a usuarios de prueba
- Verificar que no existan datos de desarrollo en las colecciones

### 3. Configuración de Ambiente
- Verificar que las variables de entorno estén configuradas para producción
- Actualizar las reglas de seguridad de Firestore si es necesario
- Configurar dominios autorizados en Firebase Authentication

### 4. Verificaciones de Seguridad
- Revisar reglas de Firestore para asegurar que sean apropiadas para producción
- Verificar que no haya claves API expuestas en el código
- Confirmar que las reglas de Storage estén configuradas correctamente

### 5. Testing Final
- Probar registro de usuarios reales
- Verificar funcionalidad de discover con usuarios reales
- Confirmar que el sistema de matching funcione correctamente
- Probar chat en tiempo real entre usuarios reales

## Archivos a Revisar Antes del Despliegue
- `test-chat.js` (ELIMINAR)
- `firestore.rules` (revisar reglas de seguridad)
- `.env.local` (configurar para producción)
- `firebase.json` (verificar configuración)

## Funcionalidades Implementadas y Listas
✅ Sistema de autenticación
✅ Perfiles de usuario
✅ Sistema de discover/swipe
✅ Chat en tiempo real
✅ Sistema de matches
✅ Navegación completa
✅ UI/UX responsiva

## Funcionalidades Pendientes (Post-MVP)
- Páginas de soporte (premium, notifications, privacy, help)
- Sistema de pagos completo
- Notificaciones push
- Sistema de verificación de perfiles
- Funcionalidades premium avanzadas