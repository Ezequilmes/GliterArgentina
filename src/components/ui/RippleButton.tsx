'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  rippleColor?: string;
  isLoading?: boolean;
}

export default function RippleButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  isLoading = false,
  onClick,
  disabled,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: RippleEffect = {
      x,
      y,
      size,
      id: rippleIdRef.current++,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading) {
      createRipple(event);
      onClick?.(event);
    }
  };

  const baseClasses = cn(
    'relative overflow-hidden inline-flex items-center justify-center',
    'font-medium transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95'
  );

  const variantClasses = {
    primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline: 'border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white focus:ring-pink-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
    destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            borderRadius: '50%',
            transform: 'scale(0)',
            animation: 'ripple 0.6s linear',
          }}
        />
      ))}

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <span className={cn('relative z-10', isLoading && 'opacity-0')}>
        {children}
      </span>

      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}