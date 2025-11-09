# Guía de Despliegue - In-App Messaging en Producción

## 📋 Resumen

Esta guía detalla cómo desplegar y configurar el sistema de In-App Messaging personalizado en un entorno de producción.

## 🚀 Configuración de Producción

### 1. Variables de Entorno

Copia el archivo `.env.production.example` y configura las siguientes variables:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_produccion
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

# In-App Messaging
INAPP_MESSAGING_ENABLED=true
INAPP_MAX_MESSAGES_PER_SESSION=3
INAPP_DISPLAY_INTERVAL=30000

# Analytics
GA4_API_SECRET=tu_ga4_api_secret

# Mercado Pago (cliente)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key

# Web Push (opcional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_vapid_public_key
```

Sugerencia: ejecuta `npm run setup:production` para generar `.env.production` de forma interactiva.

### 2. Configuración de Firebase

Asegúrate de que tu proyecto Firebase esté configurado correctamente:

- **Firestore**: Para almacenar mensajes y configuraciones
- **Analytics**: Para tracking de eventos
- **Authentication**: Para segmentación de usuarios

### 3. Configuración de Google Analytics 4

Para habilitar el tracking de eventos de In-App Messaging:

1. Ve a tu propiedad de GA4
2. Navega a Admin > Data Streams > [Tu stream] > Measurement Protocol API secrets
3. Crea un nuevo API secret
4. Añade el secret a tu variable de entorno `GA4_API_SECRET`

## 📊 Endpoints de API

El sistema incluye los siguientes endpoints:

### Configuración
- `GET /api/in-app-messages/config` - Obtener configuración
- `POST /api/in-app-messages/config` - Actualizar configuración (admin)

### Mensajes
- `GET /api/in-app-messages/messages` - Obtener mensajes para el usuario
- `POST /api/in-app-messages/messages` - Crear nuevo mensaje (admin)

### Analytics
- `POST /api/in-app-messages/analytics/message-displayed` - Tracking de mensaje mostrado
- `POST /api/in-app-messages/analytics/action-clicked` - Tracking de acción clickeada

## 🔧 Configuración del Servicio

### Configuración Automática

El servicio se configura automáticamente basándose en el entorno:

```typescript
// Configuración de producción
{
  enabled: true,
  maxMessagesPerSession: 3,
  displayInterval: 30000, // 30 segundos
  debugMode: false,
  apiEndpoint: "https://tu-dominio.com/api/in-app-messages"
}
```

### Configuración Manual

Puedes actualizar la configuración en tiempo de ejecución:

```typescript
const { updateConfig } = useInAppMessaging();

updateConfig({
  maxMessagesPerSession: 5,
  displayInterval: 60000
});
```

## 📱 Uso en Producción

### 1. Obtener Mensajes del Servidor

```typescript
const { fetchMessages } = useInAppMessaging();

// Obtener mensajes para el usuario actual
const messages = await fetchMessages();
```

### 2. Mostrar Mensajes

```typescript
const { onMessage } = useInAppMessaging();

useEffect(() => {
  const unsubscribe = onMessage((message) => {
    // Mostrar mensaje al usuario
    showInAppMessage(message);
  });

  return unsubscribe;
}, []);
```

### 3. Tracking de Acciones

```typescript
const { onAction } = useInAppMessaging();

useEffect(() => {
  const unsubscribe = onAction((action) => {
    // Manejar acción del usuario
    if (action.actionUrl) {
      router.push(action.actionUrl);
    }
  });

  return unsubscribe;
}, []);
```

## 🎯 Segmentación de Usuarios

### Condiciones de Display

Los mensajes pueden configurarse con condiciones específicas:

```typescript
{
  messageId: "welcome_msg",
  title: "¡Bienvenido!",
  body: "Gracias por unirte a nuestra plataforma",
  displayConditions: {
    minSessionTime: 5000,      // Mostrar después de 5 segundos
    maxDisplaysPerDay: 1,      // Máximo 1 vez por día
    requiresAuth: true         // Solo usuarios autenticados
  },
  targetAudience: ["new_users"], // Segmentación específica
  expiresAt: new Date("2024-12-31") // Fecha de expiración
}
```

### Prioridades

Los mensajes se ordenan por prioridad:
- `high`: Mensajes críticos (bienvenida, alertas)
- `normal`: Mensajes estándar (promociones, features)
- `low`: Mensajes informativos

## 📈 Analytics y Métricas

### Eventos Tracked

1. **message_displayed**: Cuando se muestra un mensaje
2. **action_clicked**: Cuando el usuario hace clic en una acción

### Datos Enviados

```typescript
// Mensaje mostrado
{
  messageId: "msg_001",
  campaignName: "welcome_campaign",
  timestamp: "2024-01-15T10:30:00Z",
  userAgent: "Mozilla/5.0..."
}

// Acción clickeada
{
  messageId: "msg_001",
  actionLabel: "Ver más",
  actionUrl: "/dashboard",
  timestamp: "2024-01-15T10:31:00Z"
}
```

## 🔒 Seguridad

### Autenticación de APIs

Para endpoints administrativos, implementa verificación de JWT:

```typescript
// Ejemplo de middleware de autenticación
async function verifyAdminAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  return decoded;
}
```

### Validación de Datos

Todos los endpoints incluyen validación de datos de entrada:

```typescript
// Validación de mensaje
if (!messageData.title || !messageData.body) {
  return NextResponse.json(
    { error: 'Missing required fields: title, body' },
    { status: 400 }
  );
}
```

## 🚀 Despliegue

### 1. Build de Producción

```bash
npm run build
```

### 2. Variables de Entorno

Configura todas las variables necesarias en tu plataforma de hosting:

- Firebase App Hosting: Firebase Console > App Hosting > Environment Variables
- Netlify: Site Settings > Environment Variables
- Railway: Variables tab

### 3. Verificación

Después del despliegue, verifica:

1. ✅ Los endpoints de API responden correctamente
2. ✅ Los mensajes se cargan desde el servidor
3. ✅ Los analytics se envían correctamente
4. ✅ La configuración remota funciona

Puedes usar el script de verificación:

```bash
npm run verify:deployment -- https://tu-dominio.com
```

### 4. Monitoreo

Configura alertas para:

- Errores en endpoints de API
- Fallos en envío de analytics
- Problemas de conectividad con servicios externos

## 🔧 Troubleshooting

### Problemas Comunes

1. **Mensajes no se muestran**
   - Verificar `INAPP_MESSAGING_ENABLED=true`
   - Comprobar límites de sesión
   - Revisar condiciones de display

2. **Analytics no se envían**
   - Verificar `GA4_API_SECRET` configurado
   - Comprobar conectividad de red
   - Revisar logs de errores

3. **Configuración remota no carga**
   - Verificar endpoint `/api/in-app-messages/config`
   - Comprobar variables de entorno
   - Revisar permisos de API

### Logs de Debug

En desarrollo, habilita logs detallados:

```typescript
const status = getStatus();
console.log('In-App Messaging Status:', status);
```

## 📚 Recursos Adicionales

- [Documentación de Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Google Analytics 4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🆘 Soporte

Para problemas o preguntas:

1. Revisar esta documentación
2. Comprobar logs de la aplicación
3. Verificar configuración de variables de entorno
4. Contactar al equipo de desarrollo
