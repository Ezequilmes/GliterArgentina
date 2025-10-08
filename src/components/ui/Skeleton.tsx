import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };
  
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height={16}
        className={i === lines - 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  return (
    <Skeleton
      variant="circular"
      className={cn(sizeClasses[size], className)}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton height={20} width="60%" />
        <Skeleton height={16} width="40%" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton
    height={40}
    width={120}
    className={cn('rounded-md', className)}
  />
);