'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

let toastIdCounter = 0;

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.persistent ? undefined : 5000),
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto remove toast if not persistent
    if (!toast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  }, [toast.id, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-white dark:bg-gray-800 shadow-lg";
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-green-500`;
      case 'error':
        return `${baseStyles} border-red-500`;
      case 'warning':
        return `${baseStyles} border-yellow-500`;
      case 'info':
        return `${baseStyles} border-blue-500`;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg p-4 transition-all duration-300 ease-in-out transform",
        getStyles(),
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95"
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {toast.message}
          </p>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Helper functions for common toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, message, type: 'success' }),
    
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, message, type: 'error' }),
    
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, message, type: 'warning' }),
    
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, message, type: 'info' }),
  };
}

// Specific toast functions for common app scenarios
export function useChatToasts() {
  const { success, error, info } = useToastHelpers();

  return {
    messageDeleted: () => success('Mensaje eliminado'),
    messageSent: () => success('Mensaje enviado'),
    messageError: () => error('Error al enviar mensaje'),
    userBlocked: (name: string) => info(`${name} ha sido bloqueado`),
    userUnblocked: (name: string) => info(`${name} ha sido desbloqueado`),
    fileUploaded: () => success('Archivo subido correctamente'),
    fileUploadError: () => error('Error al subir archivo'),
    connectionLost: () => error('Conexión perdida', { persistent: true }),
    connectionRestored: () => success('Conexión restaurada'),
  };
}

export function useMatchToasts() {
  const { success, info } = useToastHelpers();

  return {
    newMatch: (name: string) => success(`¡Nuevo match con ${name}!`, {
      title: '💕 ¡Es un match!',
      duration: 8000,
    }),
    superLikeUsed: () => info('Super Like enviado'),
    noMoreProfiles: () => info('No hay más perfiles por ahora'),
  };
}

export function useProfileToasts() {
  const { success, error } = useToastHelpers();

  return {
    profileUpdated: () => success('Perfil actualizado'),
    profileUpdateError: () => error('Error al actualizar perfil'),
    photoUploaded: () => success('Foto subida correctamente'),
    photoUploadError: () => error('Error al subir foto'),
  };
}

export default ToastProvider;