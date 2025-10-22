'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, rows = 3, ...props }, ref) => {
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
        
        <textarea
          id={inputId}
          rows={rows}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-input-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 resize-none shadow-modern backdrop-blur-sm',
            error && 'border-error focus:ring-error/50 focus:border-error',
            className
          )}
          ref={ref}
          {...props}
        />
        
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

Textarea.displayName = 'Textarea';

export default Textarea;