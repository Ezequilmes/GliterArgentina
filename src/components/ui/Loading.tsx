import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, MessageCircle, Users, Heart } from 'lucide-react';

interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
  text?: string;
  icon?: 'default' | 'chat' | 'users' | 'heart';
  fullScreen?: boolean;
}

export function Loading({ 
  size = 'md', 
  variant = 'spinner',
  className,
  text,
  icon = 'default',
  fullScreen = false
}: LoadingProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const getIcon = () => {
    switch (icon) {
      case 'chat':
        return <MessageCircle className={cn(sizeClasses[size], 'animate-pulse')} />;
      case 'users':
        return <Users className={cn(sizeClasses[size], 'animate-pulse')} />;
      case 'heart':
        return <Heart className={cn(sizeClasses[size], 'animate-pulse')} />;
      default:
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />;
    }
  };

  const renderSpinner = () => (
    <div className={cn(
      'animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-purple-600 dark:border-t-purple-400',
      sizeClasses[size],
      className
    )} />
  );

  const renderDots = () => (
    <div className={cn('flex space-x-1', className)}>
      <div className={cn(
        'bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce',
        size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
      )} style={{ animationDelay: '0ms' }} />
      <div className={cn(
        'bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce',
        size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
      )} style={{ animationDelay: '150ms' }} />
      <div className={cn(
        'bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce',
        size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
      )} style={{ animationDelay: '300ms' }} />
    </div>
  );

  const renderPulse = () => (
    <div className={cn(
      'bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse',
      sizeClasses[size],
      className
    )} />
  );

  const renderSkeleton = () => (
    <div className={cn(
      'bg-gray-200 dark:bg-gray-700 rounded animate-pulse',
      size === 'xs' ? 'h-3' : size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : size === 'lg' ? 'h-8' : 'h-12',
      className
    )} />
  );

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return icon !== 'default' ? getIcon() : renderSpinner();
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-3',
      fullScreen && 'min-h-screen'
    )}>
      {renderLoading()}
      {text && (
        <p className={cn(
          'text-gray-600 dark:text-gray-400 font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Componentes específicos para diferentes contextos
export function ChatLoading({ size = 'md' }: { size?: LoadingProps['size'] }) {
  return (
    <Loading 
      size={size} 
      icon="chat" 
      text="Cargando mensajes..." 
      variant="spinner"
    />
  );
}

export function MatchesLoading({ size = 'md' }: { size?: LoadingProps['size'] }) {
  return (
    <Loading 
      size={size} 
      icon="heart" 
      text="Buscando matches..." 
      variant="spinner"
    />
  );
}

export function UsersLoading({ size = 'md' }: { size?: LoadingProps['size'] }) {
  return (
    <Loading 
      size={size} 
      icon="users" 
      text="Cargando usuarios..." 
      variant="spinner"
    />
  );
}

export function PageLoading({ text = "Cargando..." }: { text?: string }) {
  return (
    <Loading 
      size="lg" 
      text={text} 
      fullScreen 
      variant="spinner"
    />
  );
}

// Skeleton components para diferentes layouts
export function MessageSkeleton() {
  return (
    <div className="flex space-x-3 p-4">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Export default for backward compatibility
export default Loading;