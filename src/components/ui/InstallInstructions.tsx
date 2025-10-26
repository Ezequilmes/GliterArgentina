'use client';

import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Share, 
  MoreVertical, 
  Chrome,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Home,
  ChevronRight
} from 'lucide-react';

interface InstallInstructionsProps {
  className?: string;
  showAsModal?: boolean;
  onClose?: () => void;
}

export function InstallInstructions({ 
  className = '', 
  showAsModal = false,
  onClose 
}: InstallInstructionsProps) {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [browserType, setBrowserType] = useState<'safari' | 'chrome' | 'firefox' | 'other'>('other');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detectar dispositivo
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/windows|mac|linux/.test(userAgent)) {
      setDeviceType('desktop');
    }

    // Detectar navegador
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      setBrowserType('safari');
    } else if (/chrome/.test(userAgent)) {
      setBrowserType('chrome');
    } else if (/firefox/.test(userAgent)) {
      setBrowserType('firefox');
    }
  }, []);

  const IOSInstructions = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Instalar en iPhone/iPad</h3>
          <p className="text-sm text-muted-foreground">Agrega Gliter a tu pantalla de inicio</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            1
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Abre el menú de compartir
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Toca el ícono de compartir en la parte inferior de Safari
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Share className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Compartir</span>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            2
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Selecciona "Agregar a pantalla de inicio"
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Busca esta opción en el menú de compartir
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Plus className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Agregar a pantalla de inicio</span>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            3
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Confirma la instalación
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Toca "Agregar" en la esquina superior derecha
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Home className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">¡Listo! Gliter estará en tu pantalla de inicio</span>
            </div>
          </div>
        </div>
      </div>

      {browserType !== 'safari' && deviceType === 'ios' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Chrome className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-amber-800 font-medium">
              Importante: Debes usar Safari para instalar la app en iOS
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const AndroidInstructions = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Instalar en Android</h3>
          <p className="text-sm text-muted-foreground">Agrega Gliter como una app nativa</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            1
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Abre el menú del navegador
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Toca los tres puntos en la esquina superior derecha
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <MoreVertical className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-muted-foreground">Menú</span>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            2
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Selecciona "Agregar a pantalla de inicio" o "Instalar app"
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              La opción puede variar según tu navegador
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Download className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Instalar aplicación</span>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            3
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Confirma la instalación
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Toca "Instalar" o "Agregar" cuando aparezca el diálogo
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Home className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">¡Perfecto! Gliter se instalará como una app</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Chrome className="w-4 h-4 text-blue-600" />
          <p className="text-xs text-blue-800 font-medium">
            Funciona mejor en Chrome, Firefox o Samsung Internet
          </p>
        </div>
      </div>
    </div>
  );

  const DesktopInstructions = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Instalar en Escritorio</h3>
          <p className="text-sm text-muted-foreground">Usa Gliter como una aplicación de escritorio</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            1
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Busca el ícono de instalación
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              En la barra de direcciones, busca el ícono de instalación
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Download className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Instalar Gliter</span>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
            2
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Haz clic en "Instalar"
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Confirma la instalación en el diálogo que aparece
            </p>
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Home className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Gliter se abrirá como una app independiente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <div className={`${className}`}>
      <div className="space-y-6">
        {showAsModal && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Instalar Gliter Argentina
            </h2>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {!showAsModal && (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent-end rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Instala Gliter en tu dispositivo
            </h2>
            <p className="text-muted-foreground">
              Accede más rápido y recibe notificaciones instalando nuestra app
            </p>
          </div>
        )}

        <div className="space-y-4">
          {deviceType === 'ios' && <IOSInstructions />}
          {deviceType === 'android' && <AndroidInstructions />}
          {deviceType === 'desktop' && <DesktopInstructions />}
          
          {deviceType === 'unknown' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Selecciona tu dispositivo para ver las instrucciones específicas:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setDeviceType('ios')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>iPhone/iPad</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeviceType('android')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Android</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeviceType('desktop')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Escritorio</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent-end/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-2">¿Por qué instalar la app?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-primary" />
              <span>Acceso más rápido desde tu pantalla de inicio</span>
            </li>
            <li className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-primary" />
              <span>Notificaciones push para nuevos mensajes y matches</span>
            </li>
            <li className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-primary" />
              <span>Experiencia de app nativa sin ocupar espacio extra</span>
            </li>
            <li className="flex items-center space-x-2">
              <ChevronRight className="w-3 h-3 text-primary" />
              <span>Funciona sin conexión para algunas funciones</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card padding="lg">
      {content}
    </Card>
  );
}