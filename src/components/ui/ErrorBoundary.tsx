'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
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
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
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

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                    Error Details (Development Only):
                  </h3>
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-32">
                      {this.state.error.stack}
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