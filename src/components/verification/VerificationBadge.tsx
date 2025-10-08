import React from 'react';
import { Shield, ShieldCheck, Star, Crown } from 'lucide-react';
import { VerificationStatus } from '@/lib/verificationService';

interface VerificationBadgeProps {
  verificationLevel: VerificationStatus['verificationLevel'];
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  verificationLevel, 
  size = 'md', 
  showText = false,
  className = '' 
}: VerificationBadgeProps) {
  const getBadgeConfig = () => {
    switch (verificationLevel) {
      case 'basic':
        return {
          icon: Shield,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          text: 'Verificado Básico',
          description: 'Perfil parcialmente verificado'
        };
      case 'verified':
        return {
          icon: ShieldCheck,
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-800',
          text: 'Verificado',
          description: 'Perfil verificado'
        };
      case 'premium':
        return {
          icon: Crown,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          text: 'Premium Verificado',
          description: 'Perfil completamente verificado'
        };
      default:
        return null;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-5 h-5',
          icon: 'w-3 h-3',
          text: 'text-xs',
          padding: 'px-1.5 py-0.5'
        };
      case 'lg':
        return {
          container: 'w-8 h-8',
          icon: 'w-5 h-5',
          text: 'text-sm',
          padding: 'px-3 py-1.5'
        };
      default:
        return {
          container: 'w-6 h-6',
          icon: 'w-4 h-4',
          text: 'text-sm',
          padding: 'px-2 py-1'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = getSizeClasses();

  if (!config) return null;

  const Icon = config.icon;

  if (showText) {
    return (
      <div className={`
        inline-flex items-center space-x-1 rounded-full border
        ${config.bgColor} ${config.borderColor} ${sizeClasses.padding} ${className}
      `}>
        <Icon className={`${sizeClasses.icon} ${config.color}`} />
        <span className={`font-medium ${config.color} ${sizeClasses.text}`}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`
        inline-flex items-center justify-center rounded-full border
        ${config.bgColor} ${config.borderColor} ${sizeClasses.container} ${className}
      `}
      title={config.description}
    >
      <Icon className={`${sizeClasses.icon} ${config.color}`} />
    </div>
  );
}