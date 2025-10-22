'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Smartphone } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isMobile?: boolean;
  errorId?: string;
}

// Función para detectar dispositivos móviles
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobileUA || (isTouchDevice && isSmallScreen);
}

// Función para generar ID único de error
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Función para enviar error a logging service
function logErrorToService(errorId: string, error: Error, errorInfo: ErrorInfo, isMobile: boolean) {
  try {
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isMobile,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      // Información específica para móviles
      ...(isMobile && {
        orientation: screen.orientation?.type || 'unknown',
        touchPoints: navigator.maxTouchPoints,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      })
    };

    // Log detallado en consola
    console.group(`🚨 ERROR BOUNDARY ACTIVATED - ${errorId}`);
    console.error('📱 Device Type:', isMobile ? 'Mobile' : 'Desktop');
    console.error('🔥 Error:', error);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    console.error('🌐 User Agent:', navigator.userAgent);
    console.error('📏 Viewport:', `${window.innerWidth}x${window.innerHeight}`);
    if (isMobile) {
      console.error('📱 Mobile Info:', {
        orientation: screen.orientation?.type,
        touchPoints: navigator.maxTouchPoints,
        connection: (navigator as any).connection?.effectiveType
      });
    }
    console.groupEnd();

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar con servicio de logging (Sentry, LogRocket, etc.)
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(err => console.error('Failed to send error to logging service:', err));
    }
  } catch (loggingError) {
    console.error('Error in error logging:', loggingError);
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = generateErrorId();
    const isMobile = isMobileDevice();
    
    return {
      hasError: true,
      error,
      isMobile,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();
    const isMobile = this.state.isMobile ?? isMobileDevice();
    
    this.setState({
      error,
      errorInfo,
      isMobile,
      errorId
    });

    // Log detallado del error
    logErrorToService(errorId, error, errorInfo, isMobile);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    console.log('🔄 User attempting to retry after error:', this.state.errorId);
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  handleGoHome = () => {
    console.log('🏠 User navigating to home after error:', this.state.errorId);
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorId, isMobile } = this.state;
    const reportData = {
      errorId,
      message: error?.message || 'Unknown error',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      isMobile
    };
    
    // Copiar información del error al clipboard
    navigator.clipboard?.writeText(JSON.stringify(reportData, null, 2))
      .then(() => alert('Información del error copiada al portapapeles'))
      .catch(() => alert(`Error ID: ${errorId}\nPor favor, reporta este ID al soporte.`));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, isMobile } = this.state;
      
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI específica para móviles
      if (isMobile) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 px-4">
            <div className="max-w-sm w-full text-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
                    <Smartphone className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Error en dispositivo móvil
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  Se detectó un problema específico en tu dispositivo móvil. Estamos trabajando para solucionarlo.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>ID del Error:</strong> {errorId}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="w-full flex items-center justify-center space-x-2"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reintentar</span>
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2"
                    size="sm"
                  >
                    <Home className="w-4 h-4" />
                    <span>Ir al inicio</span>
                  </Button>

                  <Button
                    onClick={this.handleReportError}
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    Reportar error
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // UI para desktop (original)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ¡Oops! Algo salió mal
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página o vuelve al inicio.
              </p>

              {errorId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    <strong>ID del Error:</strong> {errorId}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                    Error Details (Development Only):
                  </h3>
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto">
                    {error.message}
                  </pre>
                  {error.stack && (
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar</span>
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="secondary"
                  className="flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir al inicio</span>
                </Button>
              </div>

              <Button
                onClick={this.handleReportError}
                variant="outline"
                className="mt-3 w-full text-sm"
                size="sm"
              >
                Reportar error
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar ErrorBoundary con componentes funcionales
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Componente de error personalizado para casos específicos
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  title = "Error", 
  message = "Ha ocurrido un error inesperado" 
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
        {message}
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400">
            Ver detalles del error
          </summary>
          <pre className="text-xs text-red-700 dark:text-red-300 mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded overflow-auto max-w-md">
            {error.message}
          </pre>
        </details>
      )}

      {resetError && (
        <Button onClick={resetError} variant="primary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      )}
    </div>
  );
}