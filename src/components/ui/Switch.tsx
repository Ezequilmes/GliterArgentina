'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const sizeClasses = {
  sm: {
    track: 'h-4 w-7',
    thumb: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0'
  },
  md: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
  },
  lg: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
  }
};

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'md',
  className,
  id,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}) => {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      id={id}
      name={name}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50',
      'dark:focus-visible:ring-purple-300 dark:focus-visible:ring-offset-gray-950',
      size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
      checked
        ? 'bg-primary-600 dark:bg-primary-500'
          : 'bg-gray-200 dark:bg-gray-800',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
          'dark:bg-gray-950',
          sizeClasses[size].thumb
        )}
      />
    </button>
  );
};

export default Switch;