Mercado Pago (MCP) API Endpoints

- `POST /api/mercadopago/create-preference`
  - Valida campos requeridos: `items[0].title`, `items[0].quantity`, `items[0].unit_price`, `items[0].currency_id`.
  - Registra advertencias (no bloqueantes) recomendadas por MCP: `items[0].id`, `items[0].description`, `items[0].category_id`, `back_urls`, `notification_url`, `payer` (email/first_name/last_name), `external_reference`, `statement_descriptor` (<=22), `binary_mode`, `date_of_expiration`.
  - Reenvía el body a `https://api.mercadopago.com/checkout/preferences` con `MERCADOPAGO_ACCESS_TOKEN`.
  - Si el token falta, responde `401` con `code: MCP_TOKEN_MISSING`.
  - Si faltan `notification_url` o `back_urls`, se completan por defecto con `MERCADOPAGO_WEBHOOK_URL` o `NEXT_PUBLIC_APP_URL`.

- `GET /api/mercadopago/payment-status/[paymentId]`
  - Consulta estado de pago en `https://api.mercadopago.com/v1/payments/{id}`.
  - Incluye cache simple, rate limit y reintentos con backoff.
  - Si el token falta, responde `500` con `code: MCP_TOKEN_MISSING`.

- `GET|POST /api/mercadopago/webhook`
  - `GET` responde `ok` para healthcheck/validación.
  - `POST` registra notificación y, para `topic=payment`, recupera estado del pago y envía eventos de analytics.
  - Si el token falta, responde `200` con `code: MCP_TOKEN_MISSING` (no bloquea recepción y firma).

Firma HMAC (opcional recomendado)

- Configura `MERCADOPAGO_WEBHOOK_SECRET` en tu entorno.
- El webhook valida la firma en `x-webhook-signature` (también acepta `x-hook-signature` o `x-signature`).
- Formatos aceptados: `sha256=<hex>` o solo `<hex>`.
- Si la firma falta o no coincide, responde `401`.

Configuración sugerida MCP

- `notification_url`: `https://<tu-dominio>/api/mercadopago/webhook`
- `back_urls`: incluir `success`, `failure`, `pending` en tu dominio.
- `statement_descriptor`: máximo 22 caracteres.
- `binary_mode`: `true` para evitar estados pendientes.
- `external_reference`: string único para correlacionar orden/pago.
- `date_of_expiration`: ISO string futura para cerrar preferencias.

Variables de entorno

- `MERCADOPAGO_ACCESS_TOKEN`: Access Token de tu cuenta/APP MCP (solo RUNTIME).
- `MERCADOPAGO_WEBHOOK_SECRET`: Secreto para verificar la firma HMAC del webhook (solo RUNTIME).
- `MERCADOPAGO_WEBHOOK_URL`: URL absoluta del webhook (ej: `https://gliter.com.ar/api/mercadopago/webhook`).
- `MERCADOPAGO_STATEMENT_DESCRIPTOR`: Descriptor corto (<=22 chars), ej: `GLITER`.
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: Clave pública para inicializar el SDK en el cliente (BUILD + RUNTIME).

`NEXT_PUBLIC_APP_URL` en producción

- Debe ser una URL pública y válida de tu dominio, con esquema `https`.
- No puede apuntar a `localhost` ni `127.0.0.1` en producción.
- Ejemplos válidos: `https://gliter.com.ar`, `https://app.gliter.com.ar`.
- Ejemplos inválidos: `http://localhost:3000`, `http://127.0.0.1:4000`, valores sin esquema o no parseables.

Alertas tempranas

- En tiempo de inicio, la app valida `NEXT_PUBLIC_APP_URL` y registra errores claros si está mal configurada en producción.
- Mensaje de corrección sugerido: "Configura NEXT_PUBLIC_APP_URL con tu dominio público y esquema HTTPS (ej: https://gliter.com.ar) en tu proveedor (Vercel/Netlify/Render) bajo Environment Variables".

Checklist de despliegue (Producción)

1) Variables de entorno (App Hosting -> Environment Variables):
   - MERCADOPAGO_ACCESS_TOKEN [RUNTIME]
   - MERCADOPAGO_WEBHOOK_SECRET [RUNTIME]
   - MERCADOPAGO_WEBHOOK_URL [RUNTIME]
   - MERCADOPAGO_STATEMENT_DESCRIPTOR [RUNTIME]
   - NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY [BUILD + RUNTIME]
   - NEXT_PUBLIC_APP_URL [BUILD + RUNTIME]

2) Despliegue:
   - `npm run deploy:apphosting`

3) Verificación post-despliegue:
   - `GET https://<dominio>/api/mercadopago/webhook` => `200 OK`
   - `GET https://<dominio>/api/mercadopago/health` => `ok: true`
   - Flujo Premium/Donación crea preferencia y redirige a `initPoint`.
   - Llegan webhooks con firma válida (si configuraste secreto).
