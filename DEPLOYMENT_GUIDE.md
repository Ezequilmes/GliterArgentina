# Guía de Despliegue - Gliter Argentina

## Resumen del Proceso de Despliegue

Esta aplicación Next.js se despliega en Firebase App Hosting, que proporciona soporte completo para aplicaciones Next.js con SSR (Server-Side Rendering) y rutas dinámicas.

## Configuración Actual

### Next.js Configuration (`next.config.js`)
```javascript
const nextConfig = {
  // Configuración para Firebase Hosting con App Hosting
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}
```

### Firebase Configuration (`firebase.json`)
```json
{
  "hosting": {
    "source": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "frameworksBackend": {
      "region": "us-central1"
    }
  }
}
```

## Proceso de Despliegue

### 1. Construcción Local
```bash
npm run build
```

### 2. Despliegue a Firebase
```bash
firebase deploy --only hosting
```

## Características del Despliegue

### ✅ Funcionalidades Soportadas
- **SSR (Server-Side Rendering)**: Todas las páginas se renderizan en el servidor
- **Rutas Dinámicas**: `/chat/[id]`, `/profile/[id]`, `/api/mercadopago/payment-status/[paymentId]`
- **API Routes**: Todas las rutas API funcionan correctamente
- **Static Assets**: Imágenes, CSS, JS se sirven optimizadamente
- **Environment Variables**: Variables de entorno se cargan correctamente

### 🔧 Configuraciones Especiales
- **Cloud Functions**: Se despliega automáticamente una función `ssrgliterargentina` para manejar el SSR
- **Region**: us-central1 (configurable en firebase.json)
- **Node.js Version**: 20 (2nd Gen Cloud Functions)

## Estructura de Archivos Desplegados

```
.firebase/
├── gliter-argentina/
│   ├── functions/          # Cloud Function para SSR
│   └── hosting/           # Archivos estáticos
```

## URLs de la Aplicación

- **Producción**: https://gliter-argentina.web.app
- **Dominio Personalizado**: gliter.com.ar (pendiente de configuración)

## Monitoreo y Logs

### Firebase Console
- **Hosting**: https://console.firebase.google.com/project/gliter-argentina/hosting
- **Functions**: https://console.firebase.google.com/project/gliter-argentina/functions
- **Analytics**: https://console.firebase.google.com/project/gliter-argentina/analytics

### Comandos Útiles
```bash
# Ver logs de las funciones
firebase functions:log

# Ver estado del hosting
firebase hosting:sites:list

# Rollback a versión anterior
firebase hosting:rollback
```

## Configuración de Dominio Personalizado

### Pasos para configurar gliter.com.ar:

1. **En Firebase Console**:
   - Ir a Hosting > Dominios personalizados
   - Agregar dominio personalizado: `gliter.com.ar`
   - Seguir las instrucciones de verificación DNS

2. **Configuración DNS**:
   - Agregar registros A/AAAA proporcionados por Firebase
   - Configurar registro CNAME para www

3. **Verificación**:
   - Esperar propagación DNS (24-48 horas)
   - Firebase generará certificado SSL automáticamente

## Troubleshooting

### Errores Comunes

1. **Build Failures**:
   - Verificar que todas las dependencias estén instaladas
   - Revisar errores de TypeScript/ESLint (actualmente ignorados)

2. **Function Deployment Timeout**:
   - El primer despliegue puede tomar 10-15 minutos
   - Verificar que todas las APIs de Google Cloud estén habilitadas

3. **Environment Variables**:
   - Verificar que `.env.production` esté configurado correctamente
   - Las variables se cargan automáticamente en Cloud Functions

## Próximos Pasos

- [ ] Completar configuración de dominio personalizado
- [ ] Configurar monitoreo y alertas
- [ ] Implementar CI/CD pipeline
- [ ] Optimizar performance y caching