'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui';
import { 
  Bell, 
  BellRing, 
  Heart, 
  Star, 
  MessageCircle, 
  Eye, 
  CheckCircle, 
  Crown,
  X,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification } from '@/services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'match':
      return <Heart className={`${iconClass} text-pink-500`} />;
    case 'super_like':
      return <Star className={`${iconClass} text-yellow-500`} />;
    case 'message':
      return <MessageCircle className={`${iconClass} text-blue-500`} />;
    case 'like':
      return <Heart className={`${iconClass} text-red-500`} />;
    case 'visit':
      return <Eye className={`${iconClass} text-gray-500`} />;
    case 'verification':
      return <CheckCircle className={`${iconClass} text-green-500`} />;
    case 'premium':
      return <Crown className={`${iconClass} text-purple-500`} />;
    default:
      return <Bell className={`${iconClass} text-gray-500`} />;
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const timeAgo = formatDistanceToNow(notification.createdAt.toDate(), {
    addSuffix: true,
    locale: es
  });

  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 transition-colors ${
      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
    }`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {timeAgo}
              </p>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1 h-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="p-1 h-auto text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notificaciones
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                No leídas ({unreadCount})
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-800"
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'unread' 
                    ? 'Todas tus notificaciones están al día'
                    : 'Te notificaremos cuando tengas nuevas actividades'
                  }
                </p>
              </div>
            ) : (
              <div>
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}