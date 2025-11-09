# Recursos de Tienda (Google Play)

## Ícono (512×512)
- Formato: `PNG` o `WEBP`.
- Sin transparencia (fondo sólido obligatorio).
- Plantilla: `public/store-assets/store_icon.svg`.
- Exportación recomendada:
  - Resolución: `512×512`.
  - Fondo: mantén el rectángulo sólido para evitar transparencia.
  - Peso: intenta < 1024 KB.
  - Compresión: usa `PNG` optimizado (p. ej. TinyPNG) o `WEBP` calidad 80–90.

## Feature graphic (1024×500)
- Formato: `PNG` o `JPG` (también se admite `WEBP`).
- Plantilla: `public/store-assets/feature_graphic.svg`.
- Reglas visuales:
  - Evita texto muy pequeño.
  - Mantén contenido clave en área segura (~64 px de margen interno).
  - Usa colores de marca (`#FF6B6B` y morados complementarios).

## Screenshots de teléfono (3–8)
- Dispositivos recomendados: Pixel 6/7/8 (1080×2400), o equivalentes.
- Orientación: retrato.
- Páginas sugeridas:
  1. Home (CTA “Comenzar Gratis”).
  2. Discover cerca (mostrar prompt de ubicación si aplica).
  3. Perfil (edición/visualización).
  4. Chat (conversación real, sin datos sensibles).
  5. Matches / Dashboard.
  6. Notificaciones / Ajustes.
- Limpieza: evita datos personales, usa cuentas demo.
- Captura (emulador o dispositivo real):
  - Emulador: `Capturar pantalla` desde Android Studio.
  - ADB dispositivo real:
    - `adb shell screencap -p /sdcard/screen.png`
    - `adb pull /sdcard/screen.png ./screenshots/`
- Post-proceso:
  - Recorta si hay barras del sistema (status/nav bars) para mantener foco en UI.
  - Comprime (`PNG` optimizado o `WEBP` calidad 80–90).

## Nombres y organización
- Coloca exportados en `public/store-assets/exports/`:
  - `icon-512.png` (o `.webp`).
  - `feature-1024x500.png`.
  - `phone-01.png` ... `phone-08.png`.

## Consejos de contenido
- Sin “promesas” de resultados; enfócate en funcionalidad y valor real.
- Evita claims de salud/seguridad sin soporte; resalta moderación y privacidad.
- Texto breve y legible; alto contraste sobre el fondo.

## Publicación en Play Console
- Sección `Store presence`:
  - Sube `icon 512×512` y `feature graphic 1024×500`.
  - Sube 3–8 `phone screenshots`.
  - Completa `short` y `full description`.
  - Revisa `categoría` y `contacto`.

