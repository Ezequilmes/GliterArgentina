'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import RippleButton from './RippleButton';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ComponentProps<typeof RippleButton> {
  isLoading?: boolean;
  loadingText?: string;
  loadingIcon?: React.ReactNode;
  disableOnLoading?: boolean;
}

export default function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  loadingIcon,
  disableOnLoading = true,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || (disableOnLoading && isLoading);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center space-x-2">
          {loadingIcon || (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {loadingText && (
            <span>{loadingText}</span>
          )}
        </div>
      );
    }
    return children;
  };

  return (
    <RippleButton
      {...props}
      disabled={isDisabled}
      className={cn(
        'relative transition-all duration-200',
        isLoading && 'cursor-not-allowed',
        className
      )}
    >
      <div className={cn(
        'transition-opacity duration-200',
        isLoading ? 'opacity-70' : 'opacity-100'
      )}>
        {renderContent()}
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
        </div>
      )}
    </RippleButton>
  );
}