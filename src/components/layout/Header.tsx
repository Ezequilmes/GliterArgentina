'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { NotificationBell } from '@/components/notifications';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
  transparent?: boolean;
  centered?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backHref,
  onBack,
  rightContent,
  className,
  transparent = false,
  centered = false
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className={cn(
      'flex items-center justify-between h-12 sm:h-14 px-4 sm:px-6 border-b animate-slide-in-down transition-all duration-300',
      transparent 
        ? 'bg-transparent border-transparent' 
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
      className
    )}>
      {/* Left Section */}
      <div className="flex items-center space-x-2 sm:space-x-3 animate-fade-in">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="flex-shrink-0 hover-lift transition-all-smooth btn-ripple w-10 h-10 sm:w-9 sm:h-9"
          >
            <ArrowLeft className="h-5 w-5 sm:h-5 sm:w-5" />
          </Button>
        )}
        
        {(title || subtitle) && !centered && (
          <div className="min-w-0 flex-1 animate-slide-in-left">
            {title && (
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate text-shimmer">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate animate-fade-in">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Center Section */}
      {centered && (title || subtitle) && (
        <div className="flex-1 text-center animate-fade-in px-4">
          {title && (
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate text-shimmer">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate animate-fade-in">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center space-x-1 sm:space-x-2 animate-slide-in-right">
        {rightContent || <NotificationBell />}
      </div>
    </header>
  );
};

export default Header;