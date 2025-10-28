# API de Notificaciones Administrativas

## Resumen

La API `/api/admin/send-notification` permite a los administradores enviar notificaciones push masivas a través de Firebase Cloud Messaging (FCM). Soporta dos modos de operación: **modo test** para pruebas con tokens específicos y **modo admin** para envío masivo a diferentes grupos de usuarios.

## Endpoint

```
POST /api/admin/send-notification
```

## Descripción General

Esta API proporciona un sistema robusto para el envío de notificaciones push con las siguientes características principales:

### Modos de Operación

1. **Modo Test** (`isTest: true`):
   - Permite enviar notificaciones a un token FCM específico
   - Ideal para pruebas y desarrollo
   - No requiere autorización de administrador
   - Valida el formato del token FCM

2. **Modo Admin** (`isTest: false` o no especificado):
   - Envío masivo a grupos de usuarios
   - Requiere autorización de administrador
   - Soporta múltiples tipos de destinatarios
   - Registra el historial de notificaciones enviadas

### Tipos de Destinatarios (targetType)

- `all`: Todos los usuarios registrados
- `premium`: Solo usuarios con suscripción premium
- `specific`: Lista específica de usuarios (requiere `targetUsers`)

## Lógica de Autorización

### Modo Test
- No requiere autorización especial
- Cualquier usuario puede enviar notificaciones de prueba

### Modo Admin
- **Email autorizado**: `ezequielmazzera@gmail.com`
- Retorna error 403 (No autorizado) para otros emails
- Validación estricta del campo `adminEmail`

## Cuerpo de la Petición (Request Body)

| Campo | Tipo | Requerido | Modo | Descripción |
|-------|------|-----------|------|-------------|
| `title` | `string` | ✅ | Ambos | Título de la notificación |
| `message` | `string` | ✅ | Ambos | Cuerpo del mensaje de la notificación |
| `token` | `string` | ✅ | Test | Token FCM específico para modo test |
| `targetType` | `string` | ✅ | Admin | Tipo de destinatarios: `all`, `premium`, `specific` |
| `targetUsers` | `string[]` | ⚠️ | Admin | Array de IDs de usuarios (requerido si `targetType` es `specific`) |
| `adminEmail` | `string` | ✅ | Admin | Email del administrador (debe ser autorizado) |
| `icon` | `string` | ❌ | Ambos | URL del icono (default: `/logo.svg`) |
| `link` | `string` | ❌ | Ambos | URL de destino al hacer clic en la notificación |
| `userId` | `string` | ❌ | Test | ID del usuario para modo test (opcional) |
| `isTest` | `boolean` | ❌ | Ambos | Indica si es modo test (default: `false`) |

### Validación de Tokens FCM

La API incluye validación estricta de tokens FCM con los siguientes criterios:

- **Longitud**: Entre 100-200 caracteres
- **Formato**: Solo caracteres alfanuméricos, guiones, guiones bajos y dos puntos
- **Patrón Firebase**: Debe contener `:APA91b` (identificador típico de Firebase)
- **Tipo**: Debe ser string válido

## Flujo de Operación

### 1. Inicialización y Validación
1. Verifica que Firebase Admin esté inicializado
2. Parsea el cuerpo de la petición JSON
3. Valida la autorización según el modo
4. Verifica campos requeridos según el modo

### 2. Obtención de Tokens FCM

#### Modo Test
- Valida el token FCM proporcionado
- Usa directamente el token si es válido

#### Modo Admin
- **`targetType: "all"`**: 
  - Consulta la colección `fcm_tokens`
  - Extrae todos los tokens de todos los usuarios
  - Filtra tokens válidos usando `isValidFCMToken()`

- **`targetType: "premium"`**:
  - Consulta usuarios con `isPremium: true`
  - Obtiene tokens FCM de cada usuario premium
  - Filtra tokens válidos

- **`targetType: "specific"`**:
  - Itera sobre los `targetUsers` proporcionados
  - Obtiene tokens FCM de cada usuario específico
  - Filtra tokens válidos

### 3. Procesamiento de Tokens
- Elimina tokens duplicados usando `Set`
- Valida que existan tokens válidos
- Proporciona diagnósticos detallados si no hay tokens

### 4. Envío de Notificaciones
- Construye el payload de notificación con configuración web push
- Envía usando `messaging.sendEachForMulticast()`
- Maneja tokens fallidos y registra errores

### 5. Registro y Respuesta
- Guarda el registro en la colección `admin_notifications`
- Retorna estadísticas de envío
- Incluye contadores de éxito y fallos

## Respuestas

### Éxito (200 OK)

```json
{
  "success": true,
  "message": "Notificación enviada exitosamente",
  "stats": {
    "totalTokens": 150,
    "successCount": 147,
    "failureCount": 3
  }
}
```

### Errores

#### 400 Bad Request - Datos Faltantes (Modo Test)
```json
{
  "error": "Modo test requiere: token, title, message"
}
```

#### 400 Bad Request - Datos Faltantes (Modo Admin)
```json
{
  "error": "Faltan datos requeridos: title, message, targetType"
}
```

#### 400 Bad Request - Token FCM Inválido
```json
{
  "error": "Token FCM inválido para testing"
}
```

#### 400 Bad Request - Sin Tokens Válidos
```json
{
  "error": "No se encontraron tokens FCM válidos para los destinatarios seleccionados.",
  "suggestions": [
    "Los usuarios deben autenticarse en la aplicación (los tokens se generan automáticamente)",
    "Los usuarios deben permitir notificaciones cuando el navegador lo solicite",
    "Verificar que el Service Worker esté funcionando correctamente"
  ],
  "debug": {
    "hasUsers": true,
    "validTokensFound": 0,
    "totalTokensInDB": 25,
    "invalidTokensFiltered": 25,
    "targetType": "all"
  }
}
```

#### 403 Forbidden - No Autorizado
```json
{
  "error": "No autorizado"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

#### 503 Service Unavailable - Firebase No Disponible
```json
{
  "error": "Firebase Admin no está disponible"
}
```

## Ejemplos de Uso

### Ejemplo 1: Notificación de Prueba (Modo Test)

```bash
curl -X POST https://gliter-argentina.web.app/api/admin/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "isTest": true,
    "token": "deviceId:APA91bHxvMQQxyz123...",
    "title": "Prueba de Notificación",
    "message": "Esta es una notificación de prueba desde la API",
    "icon": "/logo.svg",
    "link": "https://gliter-argentina.web.app/dashboard"
  }'
```

### Ejemplo 2: Notificación a Todos los Usuarios (Modo Admin)

```bash
curl -X POST https://gliter-argentina.web.app/api/admin/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "adminEmail": "ezequielmazzera@gmail.com",
    "title": "¡Nueva Funcionalidad Disponible!",
    "message": "Descubre las nuevas características de Gliter Argentina",
    "targetType": "all",
    "icon": "/logo.svg",
    "link": "https://gliter-argentina.web.app/discover"
  }'
```

### Ejemplo 3: Notificación a Usuarios Premium

```bash
curl -X POST https://gliter-argentina.web.app/api/admin/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "adminEmail": "ezequielmazzera@gmail.com",
    "title": "Beneficio Exclusivo Premium",
    "message": "Accede a tu nuevo beneficio como usuario premium",
    "targetType": "premium",
    "icon": "/icons/premium-notification.svg",
    "link": "https://gliter-argentina.web.app/premium"
  }'
```

### Ejemplo 4: Notificación a Usuarios Específicos

```bash
curl -X POST https://gliter-argentina.web.app/api/admin/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "adminEmail": "ezequielmazzera@gmail.com",
    "title": "Mensaje Personalizado",
    "message": "Tienes una actualización importante en tu perfil",
    "targetType": "specific",
    "targetUsers": ["user123", "user456", "user789"],
    "icon": "/logo.svg"
  }'
```

## Características Técnicas

### Validación de Tokens FCM
- Implementa función `isValidFCMToken()` para filtrar tokens inválidos
- Previene errores de envío por tokens malformados
- Mejora la tasa de entrega exitosa

### Manejo de Errores Robusto
- Diagnósticos detallados cuando no hay tokens válidos
- Sugerencias específicas para resolver problemas
- Información de debug para troubleshooting

### Registro de Auditoría
- Todas las notificaciones se registran en `admin_notifications`
- Incluye estadísticas de envío y tokens fallidos
- Permite rastrear el historial de notificaciones

### Configuración Web Push
- Soporte completo para notificaciones web
- Configuración de vibración, iconos y badges
- Soporte para acciones y enlaces personalizados

## Consideraciones de Seguridad

1. **Autorización Estricta**: Solo el email autorizado puede usar el modo admin
2. **Validación de Entrada**: Todos los campos son validados antes del procesamiento
3. **Filtrado de Tokens**: Solo se procesan tokens FCM válidos
4. **Registro de Auditoría**: Todas las acciones quedan registradas
5. **Manejo Seguro de Errores**: No se expone información sensible en los errores

## Dependencias

- **Firebase Admin SDK**: Para envío de notificaciones FCM
- **Firestore**: Para almacenamiento de tokens y registros
- **Next.js**: Framework de la aplicación
- **TypeScript**: Tipado estático

## Notas de Implementación

- La API utiliza importación lazy de Firebase Admin para optimizar el rendimiento
- Los tokens duplicados se eliminan automáticamente
- Se implementa retry automático para tokens fallidos a través de FCM
- La validación de tokens previene el spam y mejora la eficiencia