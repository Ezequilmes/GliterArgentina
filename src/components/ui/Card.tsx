'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { CardProps } from '@/types';

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    hover = false, 
    padding = 'default',
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'rounded-2xl border bg-white text-gray-900 shadow-soft transition-all duration-300 animate-fade-in backdrop-blur-sm';
    
    const variants = {
      default: 'bg-white border-gray-100 shadow-soft hover:shadow-lg',
      primary: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50 shadow-lg hover:shadow-xl',
      accent: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 shadow-lg hover:shadow-xl',
      gold: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200/50 shadow-lg hover:shadow-xl',
      muted: 'bg-gray-50 border-gray-200/50 shadow-sm hover:shadow-md',
      glass: 'bg-white/80 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl',
      modern: 'card-modern',
    };

    const paddings = {
      none: '',
      sm: 'p-4 sm:p-5',
      default: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-10',
    };

    const hoverEffects = hover ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer hover:border-purple-300 hover-lift' : '';

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          hoverEffects,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// CardHeader component
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// CardTitle component
const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// CardContent component
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export default Card;
export { CardHeader, CardTitle, CardContent };