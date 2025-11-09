# Build Android (APK) – Gliter Argentina

Esta guía cubre el proceso completo para generar un APK Android usando Trusted Web Activity (TWA), optimizar la UI para pantallas táctiles, configurar permisos y probar en dispositivos/emuladores modernos.

## 1) Configurar entorno de compilación Android

- Instalar Java (JDK 17):
  - Winget: `winget install Microsoft.OpenJDK.17`
  - Verificar: `java -version`
- Instalar Android Studio (incluye SDK y Gradle):
  - Winget: `winget install Google.AndroidStudio`
  - Asegurar SDK Platform para API 34 (Android 14) y Build-Tools recientes.
- Instalar Bubblewrap CLI:
  - `npm i -g @bubblewrap/cli`

> Alternativa: compilar desde Android Studio abriendo el proyecto generado por Bubblewrap.

## 2) Optimización UI móvil

- Se han añadido mejoras táctiles en `src/app/globals.css`:
  - `-webkit-tap-highlight-color: transparent`
  - `touch-action: manipulation`
  - Utilidades para evitar selección accidental (`user-select: none`)
  - Ajustes de padding en pantallas pequeñas
- El layout ya define `viewport` móvil y `viewportFit: 'cover'` para notches.

## 3) Permisos necesarios

Para TWA (Chrome):
- `INTERNET` y `ACCESS_NETWORK_STATE` se gestionan desde el proyecto Android generado.
- Geolocalización, cámara y notificaciones se solicitan vía APIs Web (Chrome) y Service Worker.
- Para delegación de notificaciones y verificación de orígenes confiables, configurar `assetlinks.json`.

Archivo plantilla: `public/.well-known/assetlinks.json` (completar con tu SHA256 del certificado y packageId).

## 4) Generar proyecto Android (TWA)

1. Ejecutar el script de setup:
   ```powershell
   .\setup-android-twa.ps1 \
     -ManifestPath "c:\\Users\\Admin\\Documents\\trae_projects\\Gliter Argentina\\public\\manifest.json" \
     -ProjectDir "twa" \
     -PackageId "com.gliter.argentina" \
     -AppName "Gliter Argentina" \
     -AppVersionName "1.0.0" \
     -AppVersionCode 1
   ```
2. Abrir `twa/` en Android Studio si no se compila por línea de comandos.

## 5) Compilar APK

- Línea de comandos (si Gradle/JDK/SDK listos):
  ```powershell
  cd twa
  .\gradlew assembleRelease
  ```
- Android Studio:
  - Build > Generate Signed Bundle/APK…
  - Seleccionar APK y firmar con tu keystore (para distribución).

Salida esperada:
- `twa/app/build/outputs/apk/release/app-release.apk`

> Nota: si sólo ves `app-release-unsigned.apk`, debes firmarlo antes de instalarlo en dispositivos.

### Firma rápida con `apksigner`

- Ubicación del keystore: `c:\Users\Admin\Documents\trae_projects\Gliter Argentina\twa\android.keystore`
- SDK Build-Tools: `C:\Users\Admin\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat`
- Comando (reemplaza `<KS_PASS>`):
  ```powershell
  "C:\Users\Admin\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat" sign \
    --ks "c:\Users\Admin\Documents\trae_projects\Gliter Argentina\twa\android.keystore" \
    --ks-key-alias gliter \
    --ks-pass pass:<KS_PASS> \
    --out "c:\Users\Admin\Documents\trae_projects\Gliter Argentina\twa\app\build\outputs\apk\release\app-release.apk" \
    "c:\Users\Admin\Documents\trae_projects\Gliter Argentina\twa\app\build\outputs\apk\release\app-release-unsigned.apk"
  ```
  Luego instala con `adb install -r`.

## 6) Pruebas en dispositivos Android

- Emulador (Android Studio):
  - Crear AVD: Pixel 6/7, API 34
  - Instalar APK y validar: navegación, login, notificaciones (si configuradas), geolocalización, performance.
- Dispositivo físico:
  - Activar “Orígenes desconocidos” y ADB
  - `adb install app-release.apk`

Checklist de pruebas:
- UI responsiva, gestos fluidos, touch targets adecuados
- Inicio de sesión y flujos principales (chat, discover, matches, pagos)
- Notificaciones y service worker (Chrome)
- Geolocalización (permiso y precisión)
- Rendimiento: tiempo de carga, scroll, transiciones

## 7) Consideraciones de producción

- `assetlinks.json` debe estar disponible en `https://tu-dominio/.well-known/assetlinks.json` para eliminar barras de seguridad en TWA y habilitar delegaciones.
- HTTPS obligatorio y PWA con service worker estable.
- Configurar versiones: `versionCode` y `versionName` para releases.
- Firmar con keystore de producción y preparar AAB para Play Store.

## 9) Troubleshooting: emulador y dependencias

- GFXSTREAM / libGLES (emulador): mensajes como carga de `libGLESv1_CM_emulation.so` o negociación EGL suelen ser “ruido” no fatal y no indican crash por sí mismos.
- HWUI / EGL: fallos al elegir configs con `EGL_SWAP_BEHAVIOR_PRESERVED` en emulador no implican excepción fatal; si hay un config válido, la app continúa.
- Crash `NoSuchMethodError` en `TrustedWebActivityIntentBuilder.setLaunchHandlerClientMode`:
  - Causa: versión de `androidbrowserhelper` que requiere `androidx.browser >= 1.9.0` y compilar con `compileSdk 36`.
  - Solución aplicada: `compileSdk/targetSdk 34`, `androidx.browser:browser 1.8.0` y `com.google.androidbrowserhelper:androidbrowserhelper 2.5.0`.
  - Verificación: compilar con `gradlew assembleRelease` y generar APK sin crash.

## 8) Alternativa: Capacitor

Si necesitas permisos nativos adicionales (cámara, archivos, background tasks) o notificaciones nativas:
- Integrar Capacitor (`@capacitor/android`) y plugins.
- Apuntar `webDir` a una build estática o usar host remoto.
- Compilar con Android Studio.

## Referencias

- Bubblewrap/TWA: https://github.com/GoogleChromeLabs/bubblewrap
- Asset Links: https://developer.android.com/training/sign-in/digital-asset-links
- Next.js PWA y Service Workers
