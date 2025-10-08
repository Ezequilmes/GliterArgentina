'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gold' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300',
  secondary: 'bg-accent-100 text-accent-800 dark:bg-accent-900/20 dark:text-accent-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg',
  outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

export default Badge;