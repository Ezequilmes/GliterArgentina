"use client";

import React from "react";
import { Card } from "@/components/ui";

export interface IosInstallSectionProps {
  /** Clases tailwind opcionales para ajustar el contenedor. */
  className?: string;
}

/**
 * IosInstallSection
 * Bloque compacto con instrucciones simples para instalar la PWA en iPhone.
 * Se recomienda Safari y usar "Agregar a Inicio". Incluye enlace a /help para guía detallada.
 */
export const IosInstallSection: React.FC<IosInstallSectionProps> = ({ className }) => {
  return (
    <Card padding="lg" className={className || ""}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-black">Instalar en iPhone</h3>
        <p className="text-sm text-black leading-relaxed">
          Abre este sitio en Safari, toca el botón Compartir y luego &quot;Agregar a Inicio&quot;. 
          Abre la app desde tu pantalla de inicio. Para Web Push, se requiere iOS 16.4+ y aceptar permisos de notificaciones.
        </p>
        <div className="text-sm">
          <a href="/help" className="text-primary hover:underline">
            Ver más ayuda y guías en /help
          </a>
        </div>
      </div>
    </Card>
  );
};

export default IosInstallSection;
