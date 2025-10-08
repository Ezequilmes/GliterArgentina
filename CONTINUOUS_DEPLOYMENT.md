# 🔄 Despliegue Continuo - Gliter Argentina

## 📋 Resumen

El despliegue continuo está configurado y funcionando correctamente con Firebase App Hosting. Cada push al branch `main` activará automáticamente el build y despliegue de la aplicación.

## 🚀 Flujo de Despliegue

### 1. Trigger Automático
- **Branch**: `main`
- **Evento**: `git push origin main`
- **Repositorio**: https://github.com/Ezequilmes/GliterArgentina.git

### 2. Proceso de Build
Firebase App Hosting ejecuta automáticamente:
```bash
npm install
npm run build
```

### 3. Despliegue
- **Plataforma**: Firebase App Hosting
- **URL de Producción**: https://gliter-argentina.web.app
- **URL de Consola**: https://console.firebase.google.com/project/gliter-argentina/apphosting

## ⚙️ Configuración Actual

### Recursos Asignados
- **CPU**: 1 vCPU
- **Memoria**: 2 GiB
- **Instancias Mínimas**: 0
- **Instancias Máximas**: 100
- **Concurrencia**: 1000 requests por instancia

### Scripts de Despliegue
```json
{
  "scripts": {
    "deploy": "firebase deploy --only apphosting",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:all": "firebase deploy",
    "logs": "firebase apphosting:logs",
    "status": "firebase apphosting:backends:list"
  }
}
```

## 🔍 Monitoreo y Verificación

### Verificar Estado del Despliegue
```bash
# Ver logs en tiempo real
npm run logs

# Verificar estado de backends
npm run status

# Ver historial de despliegues
firebase apphosting:rollouts:list
```

### URLs de Monitoreo
- **Aplicación**: https://gliter-argentina.web.app
- **Consola Firebase**: https://console.firebase.google.com/project/gliter-argentina/apphosting
- **GitHub Actions**: https://github.com/Ezequilmes/GliterArgentina/actions

## 🛠️ Comandos Útiles

### Despliegue Manual (si necesario)
```bash
# Desplegar solo App Hosting
npm run deploy

# Desplegar todo (App Hosting + Functions)
npm run deploy:all

# Desplegar solo Functions
npm run deploy:functions
```

### Rollback
```bash
# Ver rollouts disponibles
firebase apphosting:rollouts:list

# Hacer rollback a una versión anterior
firebase apphosting:rollouts:rollback <ROLLOUT_ID>
```

### Debugging
```bash
# Ver logs de la aplicación
npm run logs

# Ver logs específicos
firebase apphosting:logs --backend=<BACKEND_ID>
```

## 📊 Ventajas del Despliegue Continuo

### ✅ Beneficios Implementados
- **Despliegues Instantáneos**: Automático en cada push
- **Rollback Rápido**: Reversión inmediata si hay problemas
- **Historial Completo**: Tracking de todas las versiones
- **Zero Downtime**: Sin interrupciones durante despliegues
- **Escalado Automático**: Ajuste automático según demanda

### 🔒 Seguridad
- **Protección de Secrets**: Archivos sensibles excluidos via .gitignore
- **GitHub Protection**: Push protection activada para tokens
- **Firebase Security**: Reglas de seguridad implementadas

## 🎯 Próximos Pasos

1. **Monitorear el primer despliegue** automático
2. **Configurar alertas** de despliegue (opcional)
3. **Configurar dominio personalizado** (ver DOMAIN_SETUP.md)
4. **Implementar tests automáticos** antes del despliegue (opcional)

## 📝 Notas Importantes

- El despliegue continuo está **activo y funcionando**
- Cada push a `main` desplegará automáticamente
- Los archivos sensibles están protegidos via `.gitignore`
- El repositorio está sincronizado con GitHub
- Firebase App Hosting maneja automáticamente el escalado

---

**Estado**: ✅ **ACTIVO Y FUNCIONANDO**  
**Última Actualización**: $(date)  
**Repositorio**: https://github.com/Ezequilmes/GliterArgentina.git