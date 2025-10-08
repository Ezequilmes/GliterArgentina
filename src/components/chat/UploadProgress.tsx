'use client';

import React from 'react';
import { X, FileText, Image, Mic } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  fileName: string;
  fileType: 'image' | 'file' | 'audio';
  progress: number;
  isUploading: boolean;
  onCancel?: () => void;
  className?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  fileType,
  progress,
  isUploading,
  onCancel,
  className
}) => {
  const getIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (fileType) {
      case 'image':
        return 'Imagen';
      case 'audio':
        return 'Audio';
      default:
        return 'Archivo';
    }
  };

  if (!isUploading) return null;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="text-blue-500">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Subiendo {getTypeLabel().toLowerCase()}...
            </p>
          </div>
        </div>
        
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      {/* Porcentaje */}
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(progress)}%
        </span>
        {progress < 100 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Subiendo...
          </span>
        )}
        {progress >= 100 && (
          <span className="text-xs text-green-500">
            ¡Completado!
          </span>
        )}
      </div>
    </div>
  );
};

export default UploadProgress;