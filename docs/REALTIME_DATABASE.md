# 🔥 Configuración de Firebase Realtime Database

## 📋 Resumen

Firebase Realtime Database ha sido configurado exitosamente en el proyecto Gliter Argentina para manejar funcionalidades en tiempo real como:

- ✅ Presencia de usuarios (online/offline/away/busy)
- ✅ Estados de escritura (typing indicators)
- ✅ Notificaciones instantáneas
- ✅ Sincronización en tiempo real

## 🛠️ Configuración Realizada

### 1. Variables de Entorno

Se agregó la siguiente variable en `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://gliter-argentina-default-rtdb.firebaseio.com/
```

### 2. Configuración de Firebase

**Archivo:** `src/lib/firebase.ts`

```typescript
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Inicialización
export const database = getDatabase(app);

// Configuración del emulador (desarrollo)
if (process.env.NODE_ENV === 'development' && !database._delegate._repoInternal) {
  connectDatabaseEmulator(database, 'localhost', 9000);
}
```

### 3. Reglas de Seguridad

**Archivo:** `database.rules.json`

Las reglas implementadas incluyen:
- Autenticación requerida para todas las operaciones
- Validación de estructura de datos
- Permisos específicos por tipo de dato (usuarios, chats, mensajes, etc.)
- Roles de administrador para operaciones especiales

### 4. Configuración de Emuladores

**Archivo:** `firebase.json`

```json
{
  "emulators": {
    "database": {
      "port": 9000
    }
  }
}
```

## 🚀 Servicios Implementados

### RealtimeService

**Archivo:** `src/services/realtimeService.ts`

Proporciona métodos para:

#### Presencia de Usuarios
```typescript
// Configurar presencia
await realtimeService.setUserPresence(userId, 'online');

// Escuchar cambios de presencia
const unsubscribe = realtimeService.onUserPresence(userIds, (presence) => {
  console.log('Presencia actualizada:', presence);
});
```

#### Estados de Escritura
```typescript
// Configurar estado de escritura
await realtimeService.setTypingStatus(chatId, userId, true);

// Escuchar estados de escritura
const unsubscribe = realtimeService.onTypingStatus(chatId, (typing) => {
  console.log('Usuarios escribiendo:', typing);
});
```

#### Notificaciones Instantáneas
```typescript
// Enviar notificación
await realtimeService.sendInstantNotification(userId, {
  type: 'message',
  title: 'Nuevo mensaje',
  body: 'Tienes un nuevo mensaje',
  data: { chatId: 'chat123' }
});
```

### Hook useRealtime

**Archivo:** `src/hooks/useRealtime.ts`

Hook personalizado para usar en componentes React:

```typescript
const {
  isConnected,
  userPresence,
  setPresence,
  setTyping,
  notifications
} = useRealtime({
  enablePresence: true,
  enableTyping: true,
  enableNotifications: true
});
```

## 🧪 Pruebas

### Componente de Prueba

Se creó un componente de prueba completo en:
- **Archivo:** `src/components/test/RealtimeTest.tsx`
- **Página:** `/test/realtime`

### Ejecutar Pruebas

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Navega a: `http://localhost:3000/test/realtime`

3. Ejecuta las pruebas disponibles:
   - ✅ Operaciones básicas
   - ✅ Presencia en tiempo real
   - ✅ Estados de conexión

## 📊 Estructura de Datos

### Presencia de Usuarios
```json
{
  "presence": {
    "userId123": {
      "isOnline": true,
      "lastSeen": 1640995200000,
      "status": "online"
    }
  }
}
```

### Estados de Escritura
```json
{
  "typing": {
    "chatId123": {
      "userId456": {
        "isTyping": true,
        "timestamp": 1640995200000
      }
    }
  }
}
```

### Notificaciones
```json
{
  "notifications": {
    "userId123": {
      "notificationId": {
        "type": "message",
        "title": "Nuevo mensaje",
        "body": "Contenido de la notificación",
        "timestamp": 1640995200000,
        "read": false,
        "data": {}
      }
    }
  }
}
```

## 🔧 Comandos Útiles

### Desplegar Reglas
```bash
firebase deploy --only database
```

### Iniciar Emuladores
```bash
firebase emulators:start
```

### Verificar Configuración
```bash
firebase projects:list
firebase use --list
```

## 🚨 Consideraciones Importantes

### Seguridad
- ✅ Todas las operaciones requieren autenticación
- ✅ Validación de estructura de datos implementada
- ✅ Permisos granulares por tipo de operación

### Performance
- ⚡ Listeners optimizados con cleanup automático
- ⚡ Batching de operaciones cuando es posible
- ⚡ Desconexión automática en caso de inactividad

### Desarrollo vs Producción
- 🔧 **Desarrollo:** Usa emulador local (puerto 9000)
- 🌐 **Producción:** Conecta a Firebase Realtime Database

## 📝 Próximos Pasos

1. **Integración en Componentes Existentes:**
   - Agregar presencia en lista de usuarios
   - Implementar typing indicators en chats
   - Mostrar notificaciones en tiempo real

2. **Optimizaciones:**
   - Implementar paginación para notificaciones
   - Agregar cache local para presencia
   - Optimizar listeners para mejor performance

3. **Monitoreo:**
   - Configurar métricas de uso
   - Implementar logging de errores
   - Agregar alertas de performance

## 🆘 Troubleshooting

### Error de Conexión
```bash
# Verificar que el emulador esté corriendo
firebase emulators:start --only database

# Verificar configuración
firebase projects:list
```

### Error de Permisos
- Verificar que el usuario esté autenticado
- Revisar las reglas en `database.rules.json`
- Comprobar la estructura de datos

### Error de Variables de Entorno
- Verificar que `.env.local` contenga `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- Reiniciar el servidor de desarrollo después de cambios

---

**✅ Estado:** Configuración completada y probada exitosamente
**📅 Fecha:** ${new Date().toLocaleDateString('es-ES')}
**👨‍💻 Configurado por:** Asistente AI