Mercado Pago (MCP) API Endpoints

- `POST /api/mercadopago/create-preference`
  - Valida campos requeridos: `items[0].title`, `items[0].quantity`, `items[0].unit_price`, `items[0].currency_id`.
  - Registra advertencias (no bloqueantes) recomendadas por MCP: `items[0].id`, `items[0].description`, `items[0].category_id`, `back_urls`, `notification_url`, `payer` (email/first_name/last_name), `external_reference`, `statement_descriptor` (<=22), `binary_mode`, `date_of_expiration`.
  - Reenvía el body a `https://api.mercadopago.com/checkout/preferences` con `MERCADOPAGO_ACCESS_TOKEN`.
  - Si el token falta, responde `500` con `code: MCP_TOKEN_MISSING`.

- `GET /api/mercadopago/payment-status/[paymentId]`
  - Consulta estado de pago en `https://api.mercadopago.com/v1/payments/{id}`.
  - Incluye cache simple, rate limit y reintentos con backoff.
  - Si el token falta, responde `500` con `code: MCP_TOKEN_MISSING`.

- `GET|POST /api/mercadopago/webhook`
  - `GET` responde `ok` para healthcheck/validación.
  - `POST` registra notificación y, para `topic=payment`, recupera estado del pago y envía eventos de analytics.
  - Si el token falta, responde `500` con `code: MCP_TOKEN_MISSING`.

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

- `MERCADOPAGO_ACCESS_TOKEN`: Access Token de tu cuenta/APP MCP.
- `MERCADOPAGO_WEBHOOK_SECRET`: Secreto para verificar la firma HMAC del webhook.
