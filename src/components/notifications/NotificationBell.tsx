'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useSounds } from '@/hooks/useSounds';
import { Bell, Heart, Star, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { playRefreshSound } = useSounds();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    switch (notification.type) {
      case 'new_match':
        router.push('/matches');
        break;
      case 'super_like_received':
        router.push('/matches');
        break;
      case 'message_received':
        if (notification.data?.chatId) {
          router.push(`/chat/${notification.data.chatId}`);
        } else {
          router.push('/chat');
        }
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_match':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'super_like_received':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'message_received':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'new_match':
        return '¡Nuevo Match!';
      case 'super_like_received':
        return '¡Super Like recibido!';
      case 'message_received':
        return 'Nuevo mensaje';
      default:
        return 'Notificación';
    }
  };

  const recentNotifications = notifications.slice(0, 10); // Mostrar solo las 10 más recientes

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    playRefreshSound();
                    markAllAsRead();
                  }}
                  className="text-sm text-pink-500 hover:text-pink-600 font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    !notification.read ? 'bg-pink-50 dark:bg-pink-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icono */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {getNotificationTitle(notification.type)}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                        {formatDistanceToNow(notification.createdAt.toDate(), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  router.push('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-pink-500 hover:text-pink-600 font-medium"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}