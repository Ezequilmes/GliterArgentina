# 💬 Sistema de In-App Messaging Personalizado

Un sistema completo de mensajería in-app para aplicaciones Next.js con Firebase, diseñado para mostrar mensajes contextuales y promocionales a los usuarios.

## 🌟 Características

- ✅ **Mensajes personalizados** con título, cuerpo y acciones
- ✅ **Segmentación de usuarios** por audiencia y condiciones
- ✅ **Priorización de mensajes** (alta, normal, baja)
- ✅ **Control de frecuencia** (límites por sesión y día)
- ✅ **Analytics integrado** con Google Analytics 4
- ✅ **Configuración remota** en tiempo real
- ✅ **API REST completa** para gestión de mensajes
- ✅ **Interfaz de pruebas** para desarrollo
- ✅ **Soporte para producción** con optimizaciones

## 🚀 Inicio Rápido

### Desarrollo

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.local.example .env.local
   # Editar .env.local con tus credenciales de Firebase
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Probar el sistema**
   - Visita `http://localhost:3000`
   - Usa el componente de pruebas en la interfaz
   - O ejecuta: `npm run test:inapp http://localhost:3000`

### Producción

1. **Configurar para producción**
   ```bash
   npm run setup:production
   ```

2. **Build de producción**
   ```bash
   npm run build:production
   ```

3. **Verificar despliegue**
   ```bash
   npm run verify:deployment https://tu-dominio.com
   ```

## 📁 Estructura del Proyecto

```
src/
├── services/
│   └── inAppMessagingService.ts     # Servicio principal
├── hooks/
│   └── useInAppMessaging.ts         # Hook de React
├── components/
│   └── notifications/
│       ├── InAppMessageHandler.tsx  # Manejador de mensajes
│       └── InAppMessageTester.tsx   # Componente de pruebas
├── app/
│   ├── layout.tsx                   # Integración en layout
│   └── api/
│       └── in-app-messages/
│           ├── config/route.ts      # API de configuración
│           ├── messages/route.ts    # API de mensajes
│           └── analytics/
│               ├── message-displayed/route.ts
│               └── action-clicked/route.ts
scripts/
├── setup-production.js             # Script de configuración
├── test-inapp-messaging.js         # Script de pruebas
└── verify-deployment.js            # Verificación de despliegue
docs/
└── IN_APP_MESSAGING_PRODUCTION.md  # Documentación detallada
```

## 🔧 Configuración

### Variables de Entorno

#### Desarrollo (.env.local)
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

#### Producción (.env.production)
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_produccion
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
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
```

## 💻 Uso del Sistema

### Hook useInAppMessaging

```typescript
import { useInAppMessaging } from '@/hooks/useInAppMessaging';

function MyComponent() {
  const {
    simulateMessage,
    onMessage,
    onAction,
    getStatus,
    fetchMessages,
    updateConfig
  } = useInAppMessaging();

  // Escuchar mensajes
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      console.log('Nuevo mensaje:', message);
    });
    return unsubscribe;
  }, [onMessage]);

  // Simular mensaje (desarrollo)
  const handleSimulate = () => {
    simulateMessage({
      messageId: 'welcome_001',
      title: '¡Bienvenido!',
      body: 'Gracias por usar nuestra aplicación',
      actions: [{
        label: 'Comenzar',
        actionUrl: '/dashboard'
      }]
    });
  };

  return (
    <button onClick={handleSimulate}>
      Simular Mensaje
    </button>
  );
}
```

### API Endpoints

#### Obtener Configuración
```bash
GET /api/in-app-messages/config
```

#### Obtener Mensajes
```bash
GET /api/in-app-messages/messages
```

#### Crear Mensaje
```bash
POST /api/in-app-messages/messages
Content-Type: application/json

{
  "title": "Nuevo Feature",
  "body": "Descubre las nuevas funcionalidades",
  "priority": "high",
  "actions": [{
    "label": "Ver más",
    "actionUrl": "/features"
  }],
  "targetAudience": ["premium_users"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

## 📊 Analytics

El sistema envía automáticamente eventos a Google Analytics 4:

### Eventos Tracked

1. **message_displayed**
   - `messageId`: ID del mensaje
   - `campaignName`: Nombre de la campaña
   - `timestamp`: Momento de visualización

2. **action_clicked**
   - `messageId`: ID del mensaje
   - `actionLabel`: Texto del botón
   - `actionUrl`: URL de destino
   - `timestamp`: Momento del clic

### Configurar GA4

1. Obtén tu `GA4_API_SECRET` desde Google Analytics
2. Configúralo en tus variables de entorno
3. Los eventos se enviarán automáticamente

## 🧪 Pruebas

### Pruebas Locales
```bash
# Probar en desarrollo
npm run test:inapp http://localhost:3000

# Probar endpoints específicos
curl http://localhost:3000/api/in-app-messages/config
```

### Pruebas de Producción
```bash
# Verificar despliegue
npm run verify:deployment https://tu-dominio.com

# Probar funcionalidad completa
npm run test:inapp https://tu-dominio.com
```

## 🔒 Seguridad

### Autenticación de APIs

Para endpoints administrativos, implementa verificación JWT:

```typescript
// middleware/auth.ts
export async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Token requerido');
  }
  
  return jwt.verify(token, process.env.JWT_SECRET!);
}
```

### Validación de Datos

Todos los endpoints incluyen validación:

```typescript
// Validar mensaje
if (!messageData.title || !messageData.body) {
  return NextResponse.json(
    { error: 'Campos requeridos: title, body' },
    { status: 400 }
  );
}
```

## 🚀 Despliegue

### Plataformas Soportadas

- **Firebase App Hosting** (recomendado)
- **Vercel**
- **Netlify**
- **Railway**
- **AWS Amplify**
- **Google Cloud Run**

### Pasos de Despliegue

1. **Configurar variables de entorno**
   ```bash
   npm run setup:production
   ```

2. **Build y desplegar**
   ```bash
   npm run build:production
   # Seguir instrucciones de tu plataforma
   ```

3. **Verificar funcionamiento**
   ```bash
   npm run verify:deployment https://tu-dominio.com
   ```

## 📚 Documentación Adicional

- [Guía de Producción](docs/IN_APP_MESSAGING_PRODUCTION.md)
- [API Reference](docs/API_REFERENCE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- 📧 Email: soporte@tu-dominio.com
- 💬 Discord: [Tu servidor de Discord]
- 📖 Documentación: [docs.tu-dominio.com]

---

**¡Gracias por usar nuestro sistema de In-App Messaging!** 🎉