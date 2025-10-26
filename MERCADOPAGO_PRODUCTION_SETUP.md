# 🔐 Configuración de Credenciales de Producción - MercadoPago

## 📋 Resumen

Este documento contiene las instrucciones para configurar las credenciales de producción de MercadoPago en Firebase App Hosting para el proyecto **Gliter Argentina**.

## ⚠️ ESTADO ACTUAL

**PROBLEMA IDENTIFICADO:** Las credenciales de producción NO están configuradas en Firebase App Hosting.

**IMPACTO:** Los pagos fallarán en el entorno de producción hasta que se configuren las credenciales correctas.

## 🔑 Credenciales de Producción

Las siguientes credenciales deben configurarse en Firebase Console:

```
Public Key:     APP_USR-eef5b234-f79b-46ab-aa28-ffd2369f8060
Access Token:   APP_USR-2100654215920021-090302-fcde5bf150a88e7b9f2223ca0dd2a1e0-93900446
Client ID:      2100654215920021
Client Secret:  XZo9vgAxYEmGKD1XiWzv2keT7DT5nOvh
```

## 🚀 Pasos para Configurar

### 1. Acceder a Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar el proyecto **"gliter-argentina"**
3. En el menú lateral, ir a **"App Hosting"**
4. Seleccionar el backend **"my-web-app"**
5. Ir a la pestaña **"Environment Variables"**

### 2. Configurar Variables de Entorno

Agregar o actualizar las siguientes variables:

| Variable | Valor |
|----------|-------|
| `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-2100654215920021-090302-fcde5bf150a88e7b9f2223ca0dd2a1e0-93900446` |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | `APP_USR-eef5b234-f79b-46ab-aa28-ffd2369f8060` |

### 3. Verificar Configuración

Después de configurar las variables, ejecutar el script de verificación:

```bash
# En el directorio del proyecto
node scripts/verify-mercadopago-credentials.js
```

### 4. Redesplegar la Aplicación

Una vez configuradas las variables, redesplegar la aplicación para que tome los nuevos valores:

```bash
# Desde Firebase CLI
firebase apphosting:backends:deploy my-web-app
```

## 🔍 Verificación Manual

### Verificar en Firebase Console

1. En Firebase Console → App Hosting → Environment Variables
2. Confirmar que las variables estén configuradas con los valores correctos
3. Verificar que no haya espacios en blanco al inicio o final

### Verificar en la Aplicación

1. Acceder a la aplicación en producción: https://gliter.com.ar
2. Intentar realizar una compra de plan premium
3. Verificar que el checkout de MercadoPago se abra correctamente
4. Confirmar que no aparezcan errores de credenciales

## 🛠️ Solución de Problemas

### Error: "Access token de Mercado Pago no configurado"

**Causa:** La variable `MERCADOPAGO_ACCESS_TOKEN` no está configurada o está vacía.

**Solución:**
1. Verificar que la variable esté configurada en Firebase Console
2. Confirmar que el valor sea exactamente: `APP_USR-2100654215920021-090302-fcde5bf150a88e7b9f2223ca0dd2a1e0-93900446`
3. Redesplegar la aplicación

### Error: "Invalid credentials" o 401/403

**Causa:** Las credenciales son incorrectas o están mal formateadas.

**Solución:**
1. Verificar que las credenciales coincidan exactamente con las proporcionadas
2. Confirmar que no haya espacios en blanco
3. Verificar que sean credenciales de producción (no empiecen con "TEST-")

### Error: "Preference creation failed"

**Causa:** Problema con la configuración de la preferencia o credenciales.

**Solución:**
1. Verificar logs en Firebase Console → Functions → Logs
2. Ejecutar el script de verificación
3. Confirmar que la API de MercadoPago esté disponible

## 📊 Checklist de Verificación

- [ ] Variables configuradas en Firebase Console
- [ ] Valores exactos sin espacios en blanco
- [ ] Script de verificación ejecutado exitosamente
- [ ] Aplicación redesplegada
- [ ] Checkout de prueba funciona correctamente
- [ ] No hay errores en los logs de producción

## 🔒 Seguridad

**IMPORTANTE:** 
- Nunca commitear credenciales de producción al repositorio
- Las credenciales solo deben configurarse en Firebase Console
- Mantener las credenciales de sandbox en `.env.local` para desarrollo
- Rotar credenciales periódicamente según políticas de seguridad

## 📞 Contacto

Si hay problemas con la configuración, contactar:
- **Desarrollador:** Ezequiel Mazzera
- **Proyecto:** Gliter Argentina
- **Fecha:** $(date)

---

**Estado del documento:** ✅ Actualizado
**Última verificación:** Pendiente de configuración inicial