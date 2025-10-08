import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'bars' | 'ring' | 'pulse';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'primary',
  className
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-purple-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  if (variant === 'default') {
    return (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-bounce',
              sizeClasses[size].replace('w-', 'w-').replace('h-', 'h-'),
              colorClasses[color].replace('text-', 'bg-'),
              'animate-delay-' + (i * 150)
            )}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse',
              'w-1',
              sizeClasses[size].split(' ')[1],
              colorClasses[color].replace('text-', 'bg-')
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'ring') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-current opacity-25',
            colorClasses[color]
          )}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin',
            colorClasses[color]
          )}
        />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color].replace('text-', 'bg-'),
          className
        )}
      />
    );
  }

  return null;
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerProps?: Partial<SpinnerProps>;
}> = ({ isLoading, children, className, spinnerProps = {} }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-10 animate-fade-in">
          <Spinner {...spinnerProps} />
        </div>
      )}
    </div>
  );
};

// Inline loading component
export const InlineLoading: React.FC<{
  text?: string;
  spinnerProps?: Partial<SpinnerProps>;
  className?: string;
}> = ({ text = 'Cargando...', spinnerProps = {}, className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Spinner size="sm" {...spinnerProps} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
};