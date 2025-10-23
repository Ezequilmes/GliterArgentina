# Guía de Solución de Problemas

## Problema: APIs devuelven 500 en desarrollo después de build exitoso

### Síntomas
- Las APIs devuelven error 500 en desarrollo
- Logs muestran errores como:
  - `Cannot find module './5611.js'`
  - `TypeError: Cannot read properties of undefined (reading '/_app')`
  - Errores de webpack runtime

### Causa
Caché corrupta de Next.js que causa problemas con los módulos compilados y el webpack runtime.

### Solución
1. **Detener el servidor de desarrollo**
   ```bash
   # Ctrl+C en el terminal donde corre npm run dev
   ```

2. **Limpiar completamente la caché de Next.js**
   ```bash
   # En PowerShell
   Remove-Item -Recurse -Force .next
   
   # En bash/zsh
   rm -rf .next
   ```

3. **Reiniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

### Prevención
- Si experimentas errores extraños después de cambios significativos en el código, considera limpiar la caché
- Después de cambios en configuración de Next.js (`next.config.ts`), siempre limpia la caché
- Si el build falla con errores de módulos faltantes, limpia la caché antes de investigar otros problemas

### Notas Adicionales
- Este problema puede ocurrir especialmente después de:
  - Cambios en `next.config.ts`
  - Actualizaciones de dependencias
  - Cambios en la estructura de archivos
  - Problemas de red durante la instalación de dependencias

### Verificación
Después de aplicar la solución, verifica que:
- [ ] Las APIs responden correctamente (no 500)
- [ ] La aplicación se carga sin errores en el navegador
- [ ] Los logs del servidor no muestran errores de módulos faltantes

---
*Documentado el: ${new Date().toLocaleDateString('es-AR')}*