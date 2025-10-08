'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
}

type CombinedProps = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CombinedProps>(
  (props, ref) => {
    const { 
      className, 
      error, 
      icon, 
      rightIcon, 
      label, 
      helperText, 
      id,
      multiline = false,
      rows = 3,
      ...restProps 
    } = props;
    
    const type = 'type' in props ? props.type || 'text' : 'text';
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-semibold text-foreground mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && !multiline && (
            <div className="absolute left-4 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          {multiline ? (
            <textarea
              id={inputId}
              rows={rows}
              className={cn(
                'flex min-h-[80px] w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 resize-none shadow-modern backdrop-blur-sm',
                error && 'border-error focus:ring-error/50 focus:border-error',
                className
              )}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              {...(restProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              type={type}
              id={inputId}
              className={cn(
                'flex h-12 w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-modern backdrop-blur-sm',
                icon && 'pl-11',
                rightIcon && 'pr-11',
                error && 'border-error focus:ring-error/50 focus:border-error',
                className
              )}
              ref={ref as React.Ref<HTMLInputElement>}
              {...(restProps as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          
          {rightIcon && !multiline && (
            <div className="absolute right-4 sm:right-3 top-1/2 transform -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-error mt-2 font-medium">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-foreground-muted mt-2">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;