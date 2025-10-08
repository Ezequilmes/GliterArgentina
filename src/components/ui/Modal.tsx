'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalProps } from '@/types';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-xs sm:max-w-md mx-3 sm:mx-0',
    md: 'max-w-sm sm:max-w-lg mx-3 sm:mx-0',
    lg: 'max-w-md sm:max-w-2xl mx-3 sm:mx-0',
    xl: 'max-w-lg sm:max-w-4xl mx-3 sm:mx-0',
    full: 'max-w-full mx-3 sm:mx-4',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={handleOverlayClick}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative bg-card rounded-2xl shadow-modern-lg border border-border animate-slide-up w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            {title && (
              <h2 className="text-lg font-bold text-foreground truncate pr-2">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 flex-shrink-0 hover:bg-background-secondary rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}