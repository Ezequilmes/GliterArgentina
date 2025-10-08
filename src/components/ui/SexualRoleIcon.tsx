import React from 'react';
import { cn } from '@/lib/utils';

interface SexualRoleIconProps {
  role: 'active' | 'passive' | 'versatile';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const SexualRoleIcon: React.FC<SexualRoleIconProps> = ({ 
  role, 
  size = 'md', 
  className,
  showLabel = false 
}) => {
  const getIcon = () => {
    switch (role) {
      case 'active':
        return '🍆'; // Berenjena para activo
      case 'passive':
        return '🍑'; // Durazno para pasivo
      case 'versatile':
        return '⚔️'; // Espadas cruzadas para versátil
      default:
        return '❓';
    }
  };

  const getLabel = () => {
    switch (role) {
      case 'active':
        return 'Activo';
      case 'passive':
        return 'Pasivo';
      case 'versatile':
        return 'Versátil';
      default:
        return 'Otro';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-1',
      className
    )}>
      <span className={cn(
        'select-none',
        getSizeClasses()
      )}>
        {getIcon()}
      </span>
      {showLabel && (
        <span className={cn(
          'text-xs font-medium text-gray-600 dark:text-gray-400',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          {getLabel()}
        </span>
      )}
    </div>
  );
};

export default SexualRoleIcon;