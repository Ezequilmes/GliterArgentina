# 🌟 Gliter Argentina

Una aplicación moderna de citas con sistema de In-App Messaging integrado y pagos con Mercado Pago.

## 🚀 Características Principales

- **💬 Sistema de In-App Messaging**: Notificaciones contextuales inteligentes
- **💳 Integración con Mercado Pago**: Pagos seguros y confiables
- **🎯 Segmentación Avanzada**: Mensajes personalizados por usuario
- **📊 Analytics Integrado**: Seguimiento de interacciones y conversiones
- **🔒 Seguridad Robusta**: Validación de webhooks y protección CSRF
- **📱 Responsive Design**: Optimizado para móviles y desktop

## 🛠️ Tecnologías

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Pagos**: Mercado Pago SDK
- **Testing**: Jest + Testing Library
- **Deployment**: Vercel (recomendado)

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Mercado Pago (para pagos)

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <tu-repositorio>
   cd gliter-argentina
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales:
   ```env
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key
   MERCADOPAGO_ACCESS_TOKEN=tu_access_token
   WEBHOOK_SECRET=tu_webhook_secret
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## 🧪 Testing

### Ejecutar todas las pruebas:
```bash
npm test
```

### Ejecutar pruebas con cobertura:
```bash
npm run test:coverage
```

### Ejecutar pruebas del sistema de In-App Messaging:
```bash
npm run test:inapp
```

### Ejecutar script de pruebas personalizado:
```bash
node scripts/run-tests.js
```

## 📁 Estructura del Proyecto

```
gliter-argentina/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── api/               # Endpoints de API
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── health/        # Health check
│   │   │   ├── in-app-messages/ # Sistema de mensajería
│   │   │   ├── mercadopago/   # Integración de pagos
│   │   │   └── webhooks/      # Webhooks de Mercado Pago
│   │   ├── components/        # Componentes React
│   │   ├── lib/              # Utilidades y configuración
│   │   └── styles/           # Estilos globales
├── __tests__/                 # Archivos de prueba
├── scripts/                   # Scripts de utilidad
├── public/                    # Archivos estáticos
├── DEPLOYMENT.md             # Guía de despliegue
└── README.md                 # Este archivo
```

## 🔧 API Endpoints

### Health Check
- `GET /api/health` - Verificar estado del servidor

### Autenticación
- `GET /api/auth/status` - Estado de autenticación

### In-App Messages
- `GET /api/in-app-messages/config` - Configuración del sistema
- `GET /api/in-app-messages/messages` - Obtener mensajes
- `POST /api/in-app-messages/messages` - Crear mensaje
- `POST /api/in-app-messages/analytics/:messageId` - Enviar analytics

### Mercado Pago
- `POST /api/mercadopago/create-payment` - Crear pago
- `GET /api/mercadopago/payment/:id` - Obtener estado del pago

### Webhooks
- `POST /api/webhooks/mercadopago` - Webhook de Mercado Pago

## 🌐 Despliegue

### Vercel (Recomendado)

1. **Conectar repositorio**:
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno**:
   - Añade todas las variables del archivo `.env.example`
   - Usa credenciales de producción de Mercado Pago

3. **Desplegar**:
   - Vercel desplegará automáticamente desde tu rama principal

### Otras opciones

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas de:
- Docker + Cloud Providers
- AWS Amplify/EC2
- Google Cloud Platform
- Azure

## 🔒 Seguridad

- **Validación de Webhooks**: Todos los webhooks son validados con firma HMAC
- **CORS Configurado**: Políticas de origen cruzado apropiadas
- **CSP Headers**: Content Security Policy implementado
- **Variables de Entorno**: Credenciales nunca expuestas en el cliente

## 📊 Monitoreo

### Métricas Disponibles:
- Tasa de apertura de mensajes in-app
- Conversiones de pagos
- Errores de API
- Performance de endpoints

### Logs:
- Todos los eventos importantes son registrados
- Errores enviados a servicio de tracking (configurable)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run test` - Ejecutar pruebas
- `npm run test:watch` - Pruebas en modo watch
- `npm run test:coverage` - Pruebas con cobertura
- `npm run lint` - Linter de código

## 🐛 Troubleshooting

### Problemas Comunes:

1. **Error de CORS**:
   - Verificar configuración en `next.config.js`
   - Confirmar dominio en variables de entorno

2. **Errores de Mercado Pago**:
   - Verificar credenciales de producción/sandbox
   - Confirmar configuración de webhooks

3. **Problemas de Build**:
   - Limpiar caché: `rm -rf .next`
   - Reinstalar dependencias: `rm -rf node_modules && npm install`

## 📞 Soporte

- **Documentación**: [Next.js](https://nextjs.org/docs)
- **Mercado Pago**: [API Docs](https://www.mercadopago.com.ar/developers)
- **Issues**: Crear un issue en este repositorio

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para Gliter Argentina**
