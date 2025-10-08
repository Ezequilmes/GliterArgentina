'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue = [0],
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [activeThumb, setActiveThumb] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const currentValue = value ?? internalValue;
  const isRange = currentValue.length > 1;

  const updateValue = useCallback((newValue: number[]) => {
    const clampedValue = newValue.map(v => Math.max(min, Math.min(max, v)));
    
    if (value === undefined) {
      setInternalValue(clampedValue);
    }
    onValueChange?.(clampedValue);
  }, [value, min, max, onValueChange]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleMouseDown = (event: React.MouseEvent, thumbIndex: number) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    setActiveThumb(thumbIndex);
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || activeThumb === null || disabled) return;
    
    const newValue = getValueFromPosition(event.clientX);
    const updatedValues = [...currentValue];
    updatedValues[activeThumb] = newValue;
    
    // Ensure proper ordering for range sliders
    if (isRange && updatedValues.length === 2) {
      if (activeThumb === 0 && updatedValues[0] > updatedValues[1]) {
        updatedValues[0] = updatedValues[1];
      } else if (activeThumb === 1 && updatedValues[1] < updatedValues[0]) {
        updatedValues[1] = updatedValues[0];
      }
    }
    
    updateValue(updatedValues);
  }, [isDragging, activeThumb, disabled, getValueFromPosition, currentValue, isRange, updateValue]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setActiveThumb(null);
      onValueCommit?.(currentValue);
    }
  }, [isDragging, currentValue, onValueCommit]);

  const handleTrackClick = (event: React.MouseEvent) => {
    if (disabled || isDragging) return;
    
    const newValue = getValueFromPosition(event.clientX);
    
    if (isRange) {
      // Find closest thumb
      const distances = currentValue.map(v => Math.abs(v - newValue));
      const closestThumbIndex = distances.indexOf(Math.min(...distances));
      const updatedValues = [...currentValue];
      updatedValues[closestThumbIndex] = newValue;
      
      // Ensure proper ordering
      if (updatedValues.length === 2) {
        updatedValues.sort((a, b) => a - b);
      }
      
      updateValue(updatedValues);
    } else {
      updateValue([newValue]);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getThumbPosition = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const getRangePosition = () => {
    if (!isRange) {
      return { left: 0, width: getThumbPosition(currentValue[0]) };
    }
    
    const [start, end] = currentValue.sort((a, b) => a - b);
    return {
      left: getThumbPosition(start),
      width: getThumbPosition(end) - getThumbPosition(start)
    };
  };

  const rangePosition = getRangePosition();

  return (
    <div
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div
        ref={trackRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleTrackClick}
      >
        {/* Active range */}
        <div
          className="absolute h-full bg-primary-600 dark:bg-primary-500 transition-all"
          style={{
            left: `${rangePosition.left}%`,
            width: `${rangePosition.width}%`
          }}
        />
      </div>
      
      {/* Thumbs */}
      {currentValue.map((thumbValue, index) => (
        <div
          key={index}
          className="absolute block h-5 w-5 rounded-full border-2 border-purple-600 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-purple-500 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-purple-300 cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${getThumbPosition(thumbValue)}% - 10px)`
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={thumbValue}
          aria-orientation="horizontal"
        />
      ))}
    </div>
  );
};

export default Slider;