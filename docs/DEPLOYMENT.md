# Guía de Despliegue

Esta guía resume la configuración necesaria para producción en Firebase App Hosting, con foco en credenciales de Mercado Pago.

## Variables de entorno (App Hosting)

- `MERCADOPAGO_ACCESS_TOKEN` (secreto)
  - Formato: comienza con `APP_USR-...`.
  - Disponibilidad: marcar `RUNTIME` y `BUILD`.
  - Uso: APIs server-side (`/api/mercadopago/*`). Nunca exponer en cliente.

- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (pública)
  - Uso: cliente (SDK/Checkout), se inyecta en el frontend.
  - Disponibilidad: marcar `RUNTIME` y `BUILD`.

- `NEXT_PUBLIC_APP_URL` (pública)
  - Uso: compone `back_urls` por defecto (`/payment/success`, `/payment/failure`, `/payment/pending`).
  - Dev ejemplo: `http://localhost:3000` (si usas `npm run dev`) o `http://localhost:8080` (si usas `next start -p 8080`).
  - Prod ejemplo: `https://www.gliter.com.ar`.

- `MERCADOPAGO_WEBHOOK_SECRET` (secreto)
  - Uso: validación HMAC de firmas en `/api/mercadopago/webhook`.
  - Disponibilidad: `RUNTIME` solamente.

- `MERCADOPAGO_WEBHOOK_URL`
  - Uso: se usa como `notification_url` por defecto si el body no lo provee.
  - Ejemplos: `https://www.gliter.com.ar/api/mercadopago/webhook` (prod), `http://localhost:3000/api/mercadopago/webhook` (dev).
  - Disponibilidad: `RUNTIME` y `BUILD`.

- `MERCADOPAGO_CLIENT_ID` y `MERCADOPAGO_CLIENT_SECRET` (opcionales)
  - Uso: OAuth/SDK avanzado si fuera necesario.
  - Disponibilidad: `RUNTIME`.

> Importante: No guardar secretos en `.env.production` ni en el repositorio. Configurar desde Firebase Console → App Hosting → Environment variables.

## Pasos para configurar en Firebase Console

1. Abrir Firebase Console → App Hosting → pestaña `Environment variables`.
2. Agregar variable `MERCADOPAGO_ACCESS_TOKEN` con tu token productivo.
3. Agregar `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` correspondiente.
4. Marcar ambas como disponibles en `RUNTIME` y `BUILD`.
5. Guardar cambios y `Deploy` de la app.

## Verificación en producción

- Healthcheck de token MCP: `https://<tu-dominio>/api/mercadopago/health`
  - Respuesta esperada válida: `{ ok: true, user_id, site_id }`
  - Si falta token: `{ ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' }`

- Crear preferencia: `POST https://<tu-dominio>/api/mercadopago/create-preference`
  - Si no envías `notification_url` en el body, se usará `MERCADOPAGO_WEBHOOK_URL` automáticamente.
  - Si no envías `back_urls` en el body, se componen desde `NEXT_PUBLIC_APP_URL`.
  - La llamada incluye header `Authorization: Bearer <MERCADOPAGO_ACCESS_TOKEN>`.
  - Si falta token, devuelve `500` con `{ error: 'Access token de Mercado Pago no configurado', code: 'MCP_TOKEN_MISSING' }`.

## Secrets requeridos

Estos secretos son obligatorios para que la integración de Mercado Pago funcione correctamente en producción. Configúralos en tu proveedor de hosting (Firebase App Hosting / Vercel / Render) y nunca los incluyas en el repositorio.

- `MERCADOPAGO_ACCESS_TOKEN`
  - Tipo: secreto.
  - Formato típico: `APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
  - Uso: autenticación de las rutas server-side de MCP (`/api/mercadopago/*`).
  - Disponibilidad: marcar en `RUNTIME` y `BUILD` (según el proveedor).

- `MERCADOPAGO_WEBHOOK_SECRET`
  - Tipo: secreto.
  - Uso: validación HMAC de firmas en el webhook (`/api/mercadopago/webhook`).
  - Disponibilidad: `RUNTIME` solamente.

- `MERCADOPAGO_CLIENT_ID` y `MERCADOPAGO_CLIENT_SECRET` (si usas OAuth/flows avanzados)
  - Tipo: secretos.
  - Uso: OAuth / integraciones avanzadas.
  - Disponibilidad: `RUNTIME`.

Variables públicas relacionadas (no son secretos pero deben estar correctamente configuradas):

- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
  - Tipo: pública.
  - Uso: SDK/Checkout en el cliente.
  - Disponibilidad: `RUNTIME` y `BUILD`.

- `NEXT_PUBLIC_APP_URL`
  - Tipo: pública.
  - Uso: composición de `back_urls` por defecto y `notification_url` cuando se derive del dominio.
  - Ejemplos: `https://www.gliter.com.ar` en producción; `http://localhost:3000` o `http://localhost:8080` en desarrollo.

- `MERCADOPAGO_WEBHOOK_URL`
  - Tipo: pública (no contiene secretos).
  - Uso: `notification_url` por defecto si el body no lo provee.
  - Ejemplos: `https://www.gliter.com.ar/api/mercadopago/webhook` (prod), `http://localhost:3000/api/mercadopago/webhook` (dev).

> Nota: En producción, `.env.local` no aplica. Debes definir estas variables en el panel del proveedor y redeploy para que el runtime las lea.

## Checklist post-deploy

Ejecuta este checklist inmediatamente después de cada despliegue para asegurar que la integración MCP quedó funcional:

- Health MCP: visita `https://<tu-dominio>/api/mercadopago/health`
  - Esperado: `{ ok: true, user_id, site_id }`.
  - Si falla: revisar que `MERCADOPAGO_ACCESS_TOKEN` esté definido y con formato `APP_USR-...`.

- Crear preferencia de prueba
  - Realiza un `POST` a `/api/mercadopago/create-preference` con un body mínimo válido.
  - Espera `200` con `init_point` (sandbox_init_point si aplica).
  - Si ves `500 MCP_TOKEN_MISSING`: el token no está en runtime; vuelve a configurar y redeploy.

- Verificar `back_urls` y `notification_url`
  - Confirmar que `back_urls` apuntan a tu dominio (`/payment/...` o `/donation/...` según tu flujo).
  - Confirmar que `notification_url` apunta a tu webhook (`/api/mercadopago/webhook`).

- Revisar logs del servidor
  - Busca entradas con el prefijo `[mp_...]` en las rutas MCP para diagnosticar errores.
  - Si hay errores de firma en webhook: valida `MERCADOPAGO_WEBHOOK_SECRET` y el runtime `nodejs` de Next.

- Confirmar variables
  - `NEXT_PUBLIC_APP_URL` = `https://<tu-dominio>`.
  - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` corresponde a la misma cuenta.
  - `MERCADOPAGO_WEBHOOK_URL` (si se usa) apunta al dominio correcto.

## Buenas prácticas adicionales

- Marca secretos como requeridos en tu proveedor para evitar despliegues sin variables críticas.
- Automatiza el healthcheck en tu pipeline y alerta si responde con error.
- No uses secretos en código cliente; mantén cualquier validación sensible en rutas server-side.

## Webhook MCP (opcional recomendado)

- `notification_url`: `https://<tu-dominio>/api/mercadopago/webhook`
- Para validar firma, configurar `MERCADOPAGO_WEBHOOK_SECRET` (solo `RUNTIME`).

## Checklist rápido de autenticación MCP

- Token `MERCADOPAGO_ACCESS_TOKEN` pertenece a la cuenta correcta y país (MLA, MLB...).
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` corresponde al mismo proyecto/cuenta.
- Token activo y sin expiración/rotación pendiente.
- Permisos suficientes para `checkout/preferences` y `v1/payments`.

## Troubleshooting

- Error `MCP_TOKEN_MISSING`: variable no disponible en runtime. Revisar App Hosting env vars y redeploy.
- `401/403` desde MCP: token inválido o permisos insuficientes.
- `500` en webhook: revisar firma y secreto cuando la validación esté activada.
 - `Firma inválida` en webhook: confirma que `MERCADOPAGO_WEBHOOK_SECRET` coincide con el valor configurado y que el cuerpo crudo se recibe sin modificaciones (Next.js runtime `nodejs`).
