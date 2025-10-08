'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui';
import { Bell, BellRing } from 'lucide-react';

interface NotificationBadgeProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'primary' | 'secondary';
  showCount?: boolean;
}

export default function NotificationBadge({ 
  onClick, 
  size = 'md', 
  variant = 'ghost',
  showCount = true 
}: NotificationBadgeProps) {
  const { unreadCount, loading } = useNotifications();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const badgeSizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[18px] h-[18px]',
    md: 'text-xs px-2 py-1 min-w-[20px] h-[20px]',
    lg: 'text-sm px-2 py-1 min-w-[22px] h-[22px]'
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Bell className={sizeClasses[size]} />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button 
        variant={variant} 
        size={size} 
        onClick={onClick}
        className="relative"
      >
        {unreadCount > 0 ? (
          <BellRing className={`${sizeClasses[size]} text-blue-600`} />
        ) : (
          <Bell className={sizeClasses[size]} />
        )}
      </Button>
      
      {showCount && unreadCount > 0 && (
        <div className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-medium ${badgeSizeClasses[size]}`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}