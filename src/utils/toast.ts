import { toast as sonnerToast } from 'sonner';
import { ReactElement, JSXElementConstructor } from 'react';

// Wrapper para mantener compatibilidad con react-hot-toast
export const toast = Object.assign(
  (message: string, options?: Record<string, unknown>) => {
    return sonnerToast(message, options);
  },
  {
    success: (message: string, options?: Record<string, unknown>) => {
      return sonnerToast.success(message, options);
    },
    error: (message: string, options?: Record<string, unknown>) => {
      return sonnerToast.error(message, options);
    },
    loading: (message: string, options?: Record<string, unknown>) => {
      return sonnerToast.loading(message, options);
    },
    custom: (jsx: (id: string | number) => ReactElement<unknown, string | JSXElementConstructor<unknown>>, options?: Record<string, unknown>) => {
      return sonnerToast.custom(jsx, options);
    },
    dismiss: (toastId?: string) => {
      return sonnerToast.dismiss(toastId);
    },
    promise: sonnerToast.promise
  }
);

// Re-exportar Toaster de sonner
export { Toaster } from 'sonner';