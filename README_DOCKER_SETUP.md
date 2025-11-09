# Guía de Configuración Local para Gliter Argentina

## 📋 Resumen de la Configuración

Se ha completado la configuración del entorno local de desarrollo con el siguiente progreso:

✅ **Entorno de desarrollo configurado** - El proyecto está listo para ejecutarse localmente
✅ **Dependencias instaladas** - Todas las dependencias de Node.js están instaladas
✅ **Variables de entorno configuradas** - Archivo `.env.local` creado con valores predeterminados
✅ **Configuración de Firebase** - Proyecto Firebase configurado para desarrollo local
⚠️ **Docker pendiente** - Requiere instalación de Docker Desktop

## 🚀 Configuración Completada

### 1. Dependencias del Proyecto
- ✅ Node.js y npm configurados
- ✅ Todas las dependencias instaladas (`npm install` completado)
- ✅ TypeScript y Next.js configurados

### 2. Variables de Entorno
Se ha creado el archivo `.env.local` con configuraciones predeterminadas para:
- **Firebase**: API keys, project ID, measurement ID, etc.
- **Mercado Pago**: Claves públicas y privadas (placeholders)
- **In-App Messaging**: Configuración de mensajería
- **Analytics**: Configuración de Google Analytics 4
- **JWT**: Secret para autenticación

### 3. Configuración de Firebase
- ✅ Proyecto Firebase configurado (`gliter-argentina`)
- ✅ Emuladores configurados para desarrollo local
- ✅ Firestore, Realtime Database, Storage, y Functions habilitados

## 🐳 Configuración de Docker (Pendiente)

### Pasos para completar la configuración de Docker:

1. **Instalar Docker Desktop**
   ```powershell
   # Opción 1: Usar winget (recomendado)
   winget install Docker.DockerDesktop
   
   # Opción 2: Descargar manualmente
   # Visitar: https://www.docker.com/products/docker-desktop/
   ```

2. **Ejecutar el script de configuración de Docker**
   ```powershell
   # Después de instalar Docker Desktop, ejecutar:
   .\setup-docker.ps1
   ```

3. **Verificar la descarga del contenedor**
   El script descargará:
   - Imagen: `us-central1-docker.pkg.dev/gliter-argentina/firebaseapphosting-images/my-web-app`
   - Tag: `build-2025-11-04-002`
   - Digest SHA256: `d9340705d299fca5ae8fb01646317279b4061d0caa1548c2ba960039d2dc1303`

4. **Extraer el sistema de archivos**
   El script extraerá todos los layers del contenedor a la carpeta `docker-extraction/`

## 🏃‍♂️ Iniciar Desarrollo Local

### Opción 1: Desarrollo con Firebase Emuladores
```bash
# Iniciar emuladores de Firebase
npm run firebase:emulators

# En otra terminal, iniciar el servidor de desarrollo
npm run dev
```

### Opción 2: Desarrollo directo
```bash
# Iniciar servidor de desarrollo
npm run dev
```

### Opción 3: Construir y ejecutar
```bash
# Construir el proyecto
npm run build

# Iniciar servidor de producción local
npm start
```

## 📁 Estructura del Proyecto

```
gliter-app/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # Componentes React
│   ├── hooks/                  # Custom Hooks
│   ├── services/               # Servicios y APIs
│   └── lib/                    # Utilidades y configuraciones
├── public/                     # Archivos estáticos
├── scripts/                    # Scripts de utilidad
├── docs/                       # Documentación
├── .env.local                  # Variables de entorno (creado)
├── firebase.json               # Configuración Firebase
├── next.config.ts              # Configuración Next.js
├── setup-docker.ps1            # Script Docker (creado)
└── README_DOCKER_SETUP.md      # Esta guía
```

## 🔧 Solución de Problemas

### Problemas comunes:

1. **Puertos en uso**
   ```bash
   # Verificar puertos
   netstat -ano | findstr :3000
   netstat -ano | findstr :8080
   netstat -ano | findstr :9099
   ```

2. **Firebase emuladores no inician**
   ```bash
   # Limpiar caché de emuladores
   firebase emulators:exec --project gliter-argentina "echo 'Emuladores listos'"
   ```

3. **Variables de entorno no cargan**
   ```bash
   # Verificar archivo .env.local
   cat .env.local
   # Reiniciar el servidor
   npm run dev
   ```

## 📊 Verificación de Integridad

Una vez completado el setup de Docker, puedes verificar:

1. **Layers del contenedor**: El script mostrará todos los layers descargados
2. **Checksums**: Se verificarán los hashes SHA256
3. **Metadatos**: Se preservarán todos los metadatos del contenedor
4. **Estructura de archivos**: Se extraerá la estructura completa

## 🎯 Próximos Pasos

1. **Instalar Docker Desktop** (si aún no está instalado)
2. **Ejecutar el script de Docker**: `.\setup-docker.ps1`
3. **Verificar la extracción**: Revisar la carpeta `docker-extraction/`
4. **Comenzar desarrollo**: Usar `npm run dev` para iniciar

## 📞 Soporte

Si encuentras problemas:
1. Verifica los logs en `firebase-debug.log`
2. Revisa la configuración en `.env.local`
3. Consulta la documentación en `docs/`
4. Ejecuta los tests: `npm test`

---

**Estado actual**: ✅ Entorno local configurado y listo para desarrollo
**Docker**: ⏳ Pendiente de instalación de Docker Desktop