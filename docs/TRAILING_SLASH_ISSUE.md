# Problema de Trailing Slash en Rutas de API

## Descripción del Problema

Durante el despliegue en Firebase App Hosting, se identificó un problema con las rutas de API que no respondían correctamente. El problema estaba relacionado con la configuración `trailingSlash: true` en `next.config.ts`.

## Síntomas

- Las rutas de API como `/api/health` devolvían errores 404 o "Page not found"
- Los endpoints no respondían cuando se accedían sin barra al final
- La aplicación mostraba errores de conectividad en el navegador

## Causa Raíz

La configuración `trailingSlash: true` en `next.config.ts` requiere que todas las rutas, incluyendo las rutas de API, terminen con una barra diagonal (`/`).

```typescript
// next.config.ts
const nextConfig = {
  trailingSlash: true, // Esta configuración causa el problema
  // ... otras configuraciones
};
```

## Solución

### Opción 1: Usar rutas con barra al final (Implementada)

Acceder a las rutas de API con barra al final:

```bash
# ❌ No funciona
curl https://gliter.com.ar/api/health

# ✅ Funciona correctamente
curl https://gliter.com.ar/api/health/
```

### Opción 2: Remover trailingSlash (Alternativa)

Si se prefiere mantener las rutas sin barra al final, se puede modificar `next.config.ts`:

```typescript
const nextConfig = {
  trailingSlash: false, // o remover esta línea completamente
  // ... otras configuraciones
};
```

## Verificación

Para verificar que las rutas de API funcionan correctamente:

```bash
# Endpoint de salud
curl https://gliter.com.ar/api/health/

# Otros endpoints de API
curl https://gliter.com.ar/api/in-app-messages/config/
curl https://gliter.com.ar/api/auth/status/
```

## Impacto en el Desarrollo

### Frontend
- Asegurarse de que todas las llamadas a API incluyan la barra al final
- Actualizar los servicios y hooks que hacen llamadas a la API

### Testing
- Actualizar los tests para usar rutas con barra al final
- Verificar que los mocks de API usen las rutas correctas

### Documentación
- Actualizar la documentación de API para incluir la barra al final
- Informar al equipo sobre esta convención

## Recomendaciones

1. **Consistencia**: Mantener la configuración `trailingSlash: true` para consistencia con el resto de la aplicación
2. **Documentación**: Documentar claramente que todas las rutas de API deben terminar con `/`
3. **Linting**: Considerar agregar reglas de linting para verificar que las rutas de API terminen con `/`
4. **Testing**: Incluir tests que verifiquen que las rutas de API funcionan correctamente

## Estado Actual

✅ **Resuelto**: La aplicación funciona correctamente con rutas de API que terminan en `/`
✅ **Verificado**: El endpoint `/api/health/` responde correctamente
✅ **Desplegado**: La configuración está funcionando en producción

## Fecha de Resolución

21 de Octubre, 2025 - 19:36 UTC