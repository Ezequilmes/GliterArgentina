'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showNavigation = true,
  fullWidth = false,
  className
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {showNavigation && <Navigation />}
      <main
        className={cn(
          'transition-all duration-300',
          showNavigation && 'pt-14 sm:pt-16', // Responsive top padding for fixed navigation
          fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;