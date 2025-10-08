'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Heart, X, Star, Check, AlertCircle } from 'lucide-react';

interface ActionFeedbackProps {
  action: 'like' | 'pass' | 'superlike' | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  onComplete?: () => void;
  className?: string;
}

export default function ActionFeedback({
  action,
  status,
  onComplete,
  className
}: ActionFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particlePositions, setParticlePositions] = useState<Array<{top: string, left: string}>>([]);

  useEffect(() => {
    if (status === 'loading' || status === 'success' || status === 'error') {
      setIsVisible(true);
      // Generate particle positions on client side to avoid hydration mismatch
      if (action === 'superlike' && status === 'success') {
        const positions = Array.from({ length: 6 }, () => ({
          top: `${20 + Math.random() * 60}%`,
          left: `${20 + Math.random() * 60}%`
        }));
        setParticlePositions(positions);
      }
    } else {
      setIsVisible(false);
    }
  }, [status, action]);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);

  if (!isVisible || !action) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'like':
        return {
          icon: Heart,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          borderColor: 'border-green-500',
          shadowColor: 'shadow-green-500/25',
          label: 'Like'
        };
      case 'pass':
        return {
          icon: X,
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          shadowColor: 'shadow-red-500/25',
          label: 'Pass'
        };
      case 'superlike':
        return {
          icon: Star,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-500',
          shadowColor: 'shadow-blue-500/25',
          label: 'Super Like'
        };
      default:
        return {
          icon: Heart,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-500',
          shadowColor: 'shadow-gray-500/25',
          label: 'Action'
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        );
      case 'success':
        return <Check className="w-6 h-6" />;
      case 'error':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Icon className="w-6 h-6" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return `Enviando ${config.label.toLowerCase()}...`;
      case 'success':
        return `${config.label} enviado!`;
      case 'error':
        return 'Error al enviar';
      default:
        return config.label;
    }
  };

  const getStatusColors = () => {
    switch (status) {
      case 'loading':
        return {
          bg: 'bg-blue-500',
          text: 'text-white',
          border: 'border-blue-500'
        };
      case 'success':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          border: 'border-red-500'
        };
      default:
        return {
          bg: config.bgColor,
          text: 'text-white',
          border: config.borderColor
        };
    }
  };

  const statusColors = getStatusColors();

  return (
    <div className={cn(
      'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
      'animate-in fade-in-0 zoom-in-95 duration-300',
      className
    )}>
      <div className={cn(
        'flex items-center space-x-3 px-6 py-4 rounded-full',
        'backdrop-blur-md border-2 shadow-2xl',
        'transition-all duration-300',
        statusColors.bg,
        statusColors.text,
        statusColors.border,
        status === 'loading' && 'animate-pulse',
        status === 'success' && 'animate-bounce',
        status === 'error' && 'animate-shake'
      )}>
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <span className="font-semibold text-sm whitespace-nowrap">
          {getStatusMessage()}
        </span>
      </div>

      {/* Ripple effect for success */}
      {status === 'success' && (
        <div className={cn(
          'absolute inset-0 rounded-full animate-ping',
          statusColors.bg,
          'opacity-20'
        )} />
      )}

      {/* Particles effect for super like */}
      {action === 'superlike' && status === 'success' && particlePositions.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {particlePositions.map((position, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                top: position.top,
                left: position.left,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}