'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/types';

import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 hover:from-purple-600 hover:to-pink-600 transform transition-all duration-300",
        secondary: "bg-white/90 backdrop-blur-sm text-gray-700 shadow-md hover:shadow-lg border border-gray-200 hover:border-purple-300 hover:scale-105 hover:bg-white",
        outline: "border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105",
        ghost: "text-purple-600 hover:bg-purple-50 hover:text-purple-700 rounded-xl",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:from-red-600 hover:to-red-700 hover:scale-105",
        accent: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/25 hover:from-green-600 hover:to-green-700 hover:scale-105",
        soft: "bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 border border-purple-200 hover:border-purple-300 rounded-xl"
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 py-2.5",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false,
    children, 
    ...props 
  }, ref) => {

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          loading && 'cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        <div className="relative z-10 flex items-center justify-center w-full">{children}</div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;