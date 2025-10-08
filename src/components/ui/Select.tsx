'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  error?: string;
  icon?: React.ReactNode;
  label?: string;
  helperText?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    options, 
    error, 
    icon, 
    label, 
    helperText, 
    placeholder,
    onChange,
    value,
    id,
    ...props 
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
              {icon}
            </div>
          )}
          
          <select
            id={selectId}
            value={value}
            onChange={handleChange}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 appearance-none cursor-pointer',
              icon && 'pl-10',
              'pr-10', // Espacio para el icono de chevron
              error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
              !value && 'text-muted-foreground',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className="text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;