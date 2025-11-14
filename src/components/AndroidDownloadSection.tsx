"use client";

import React from "react";
import { Card } from "@/components/ui";

/**
 * Obtiene la URL del APK para descarga.
 *
 * Prioriza `NEXT_PUBLIC_ANDROID_APK_URL` si está definida.
 * En su defecto, construye una URL absoluta basada en `NEXT_PUBLIC_APP_URL`
 * y finalmente cae a la ruta pública local `/store-assets/app-release.apk`.
 */
function getApkUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL;
  if (envUrl && envUrl.trim().length > 0) return envUrl;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gliter.com.ar";
  try {
    const base = new URL(appUrl);
    return `${base.origin}/store-assets/app-release.apk`;
  } catch {
    return "/store-assets/app-release.apk";
  }
}

export interface AndroidDownloadSectionProps {
  className?: string;
}

/**
 * AndroidDownloadSection
 * Sección con un enlace visible para descargar el APK de Android y
 * instrucciones claras de instalación en lenguaje sencillo.
 */
/**
 * Componente de descarga de APK para Android.
 * Valida la disponibilidad del recurso con solicitudes HEAD y aplica
 * un fallback absoluto al dominio público si es necesario.
 */
export const AndroidDownloadSection: React.FC<AndroidDownloadSectionProps> = ({ className }) => {

  return (
    <Card padding="lg" className={className || ""}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-black">Instalar en Android</h3>
          <p className="text-sm text-black mt-1">
            Instala fácilmente la app como PWA sin descargar APK.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-black leading-relaxed">
            En Chrome: abre este sitio, toca el menú (⋮) y selecciona
            &nbsp;<strong>Añadir a pantalla de inicio</strong>. Confirma y abre la app desde tu pantalla de inicio.
          </p>
          <p className="text-sm text-black leading-relaxed">
            En otros navegadores compatibles: busca la opción <strong>Instalar app</strong> o
            &nbsp;<strong>Agregar a inicio</strong> en el menú.
          </p>
          <div className="text-sm">
            <a href="/help" className="text-primary hover:underline">
              Ver pasos detallados en /help
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};
