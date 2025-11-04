#!/bin/bash

# Script para aplicar mejoras seguras desde el build actual al estable
# Este script aplica solo cambios de código que no afectan la configuración de despliegue

echo "🚀 Aplicando mejoras seguras al build estable..."

# 1. Servicios nuevos o mejorados (seguros)
echo "📋 Aplicando mejoras de servicios..."
git checkout HEAD -- src/services/loggingService.ts 2>/dev/null || echo "ℹ️ loggingService.ts no existe en HEAD"

# 2. Mejoras de UI/UX (seguras)
echo "🎨 Aplicando mejoras de interfaz..."
git checkout HEAD -- src/components/ui/Toast.tsx 2>/dev/null || echo "ℹ️ Toast.tsx no tiene cambios"

# 3. Optimizaciones de hooks (seguras con validación)
echo "⚡ Aplicando optimizaciones de hooks..."
git checkout HEAD -- src/hooks/useNetworkStatus.ts 2>/dev/null || echo "ℹ️ useNetworkStatus.ts sin cambios"

# 4. Utilidades y helpers (seguros)
echo "🔧 Aplicando utilidades..."
git checkout HEAD -- src/utils/ 2>/dev/null || echo "ℹ️ Sin cambios en utils"

echo "✅ Mejoras seguras aplicadas correctamente"
echo ""
echo "⚠️  IMPORTANTE: Los siguientes cambios NO se aplicaron por seguridad:"
echo "   - Configuración de Firebase App Hosting"
echo "   - Cambios en dependencias (package.json)"
echo "   - Cambios en FCM Service (requiere validación)"
echo "   - Cambios en Service Worker (requiere testing)"
echo ""
echo "🔍 Para aplicar cambios adicionales, indica específicamente cuáles deseas."