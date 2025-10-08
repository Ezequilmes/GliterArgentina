# 🚀 Guía de Despliegue - Gliter Argentina

## 📋 Resumen del Proyecto

**Gliter Argentina** es una aplicación Next.js 15 con sistema de In-App Messaging integrado con Mercado Pago, diseñada para proporcionar notificaciones contextuales y gestión de pagos.

### 🛠️ Tecnologías Utilizadas
- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Pagos**: Mercado Pago SDK
- **Base de Datos**: Configuración para PostgreSQL/MongoDB
- **Testing**: Jest con Testing Library

---

## 🌐 Opciones de Despliegue

### 1. 🔥 Vercel (Recomendado)

Vercel es la plataforma oficial de Next.js y ofrece la mejor experiencia para aplicaciones Next.js.

#### Pasos para Desplegar en Vercel:

1. **Preparar el repositorio**:
   ```bash
   git add .
   git commit -m "feat: sistema completo de in-app messaging con Mercado Pago"
   git push origin main
   ```

2. **Conectar con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub/GitLab/Bitbucket
   - Importa tu repositorio

3. **Configurar variables de entorno**:
   ```env
   # Mercado Pago
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
   MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
   
   # Base de datos (si usas una)
   DATABASE_URL=tu_database_url_aqui
   
   # Configuración de la app
   NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
   
   # Webhooks
   WEBHOOK_SECRET=tu_webhook_secret_aqui
   ```

4. **Configurar dominio personalizado** (opcional):
   - En el dashboard de Vercel, ve a Settings > Domains
   - Añade tu dominio personalizado

#### ✅ Ventajas de Vercel:
- Despliegue automático desde Git
- CDN global
- Optimizaciones automáticas para Next.js
- Escalado automático
- SSL gratuito
- Preview deployments

---

### 2. 🐳 Docker + Cloud Provider

#### Dockerfile:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=${NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY}
      - MERCADOPAGO_ACCESS_TOKEN=${MERCADOPAGO_ACCESS_TOKEN}
    restart: unless-stopped
```

---

### 3. ☁️ Otras Opciones de Cloud

#### AWS (Amplify/EC2):
- **AWS Amplify**: Similar a Vercel, optimizado para aplicaciones frontend
- **AWS EC2**: Más control, requiere configuración manual

#### Google Cloud Platform:
- **Cloud Run**: Contenedores serverless
- **App Engine**: Plataforma como servicio

#### Azure:
- **Static Web Apps**: Para aplicaciones estáticas
- **App Service**: Para aplicaciones completas

---

## 🔧 Configuración de Variables de Entorno

### Variables Requeridas:

```env
# === MERCADO PAGO ===
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# === APLICACIÓN ===
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NODE_ENV=production

# === WEBHOOKS ===
WEBHOOK_SECRET=tu_secreto_super_seguro_aqui

# === BASE DE DATOS (Opcional) ===
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# === CONFIGURACIÓN DE IN-APP MESSAGING ===
NEXT_PUBLIC_INAPP_MAX_MESSAGES_PER_SESSION=5
NEXT_PUBLIC_INAPP_CACHE_DURATION=300000
```

### Variables Opcionales:

```env
# === ANALYTICS ===
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=xxxxxxx

# === CONFIGURACIÓN AVANZADA ===
NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com
NEXT_PUBLIC_DEBUG_MODE=false

# === SEGURIDAD ===
NEXTAUTH_SECRET=tu_nextauth_secret_aqui
NEXTAUTH_URL=https://tu-dominio.com
```

---

## 🔒 Configuración de Seguridad

### 1. Configurar CORS:
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://tu-dominio.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 2. Configurar CSP (Content Security Policy):
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.mercadopago.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.mercadopago.com;"
          },
        ],
      },
    ]
  },
}
```

---

## 📊 Monitoreo y Analytics

### 1. Configurar Webhooks de Mercado Pago:
```javascript
// En tu dashboard de Mercado Pago
const webhookConfig = {
  url: 'https://tu-dominio.com/api/webhooks/mercadopago',
  events: ['payment', 'merchant_order']
}
```

### 2. Configurar Logging:
```javascript
// utils/logger.js
export const logger = {
  info: (message, data) => {
    if (process.env.NODE_ENV === 'production') {
      // Enviar a servicio de logging (Datadog, LogRocket, etc.)
    } else {
      console.log(message, data);
    }
  },
  error: (message, error) => {
    if (process.env.NODE_ENV === 'production') {
      // Enviar a servicio de error tracking (Sentry, Bugsnag, etc.)
    } else {
      console.error(message, error);
    }
  }
}
```

---

## 🧪 Testing en Producción

### 1. Ejecutar pruebas antes del despliegue:
```bash
npm run test
npm run test:coverage
npm run build
```

### 2. Verificar endpoints en producción:
```bash
# Verificar health check
curl https://tu-dominio.com/api/health

# Verificar configuración de in-app messages
curl https://tu-dominio.com/api/in-app-messages/config
```

---

## 🚀 Checklist de Despliegue

### Pre-despliegue:
- [ ] Todas las pruebas pasan
- [ ] Variables de entorno configuradas
- [ ] Credenciales de Mercado Pago válidas
- [ ] Build exitoso localmente
- [ ] Configuración de CORS correcta

### Post-despliegue:
- [ ] Verificar que la aplicación carga correctamente
- [ ] Probar endpoints de API
- [ ] Verificar integración con Mercado Pago
- [ ] Probar sistema de In-App Messaging
- [ ] Configurar monitoreo y alertas
- [ ] Configurar backups (si aplica)

---

## 🆘 Troubleshooting

### Problemas Comunes:

1. **Error de CORS**:
   - Verificar configuración en `next.config.js`
   - Asegurar que el dominio esté en la whitelist

2. **Errores de Mercado Pago**:
   - Verificar que las credenciales sean de producción
   - Confirmar que la cuenta esté activada

3. **Problemas de Build**:
   - Verificar que todas las dependencias estén instaladas
   - Revisar errores de TypeScript

4. **Problemas de Performance**:
   - Activar compresión gzip
   - Optimizar imágenes
   - Configurar caché apropiado

---

## 📞 Soporte

Para soporte técnico:
- **Documentación**: [Next.js Docs](https://nextjs.org/docs)
- **Mercado Pago**: [Documentación de API](https://www.mercadopago.com.ar/developers)
- **Vercel**: [Documentación de Despliegue](https://vercel.com/docs)

---

*Última actualización: $(date)*