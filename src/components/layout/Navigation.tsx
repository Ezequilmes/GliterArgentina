'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfilePhoto, userHasPhotos } from '@/lib/userUtils';
import { NotificationBadge, NotificationCenter } from '@/components/notifications';
import { FollowInstagramButton } from '@/components/ui';
import {
  Home,
  Heart,
  MessageCircle,
  User,
  Menu,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  Bell,
  Zap,
  X,
  Star
} from 'lucide-react';

interface NavigationProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Descubrir',
    href: '/discover',
    icon: Home
  },
  {
    name: 'Matches',
    href: '/matches',
    icon: Heart
  },
  {
    name: 'Chats',
    href: '/chat',
    icon: MessageCircle
  },
  {
    name: 'Exclusivos',
    href: '/exclusivos',
    icon: Star
  },
  {
    name: 'Perfil',
    href: '/profile',
    icon: User
  }
];

const dropdownItems = [
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    description: 'Ajustes de la cuenta'
  },
  {
    name: 'Gliter Plus',
    href: '/premium',
    icon: Zap,
    description: 'Funciones premium',
    highlight: true
  },
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    description: 'Gestionar notificaciones'
  },
  {
    name: 'Privacidad',
    href: '/privacy',
    icon: Shield,
    description: 'Configuración de privacidad'
  },
  {
    name: 'Ayuda',
    href: '/help',
    icon: HelpCircle,
    description: 'Centro de ayuda'
  }
];

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className={cn("fixed top-0 left-0 right-0 z-50 bg-primary px-4 sm:px-6 py-3 sm:py-4 shadow-lg", className)}>
      <div className="flex items-center justify-between sm:justify-between">
        {/* Logo/Title - Hidden on mobile */}
        <div className="hidden sm:flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center p-1">
            <img 
              src="/logo.svg" 
              alt="Gliter Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Gliter</h1>
        </div>
        
        {/* Navigation Buttons - Centered on mobile */}
        <div className="flex items-center space-x-1 sm:space-x-3 mx-auto sm:mx-0">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors touch-manipulation',
                  isActive
                    ? 'bg-white/30 text-white'
                    : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white active:bg-white/40'
                )}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            );
          })}
          
          {/* Notification Badge */}
          <div className="w-9 h-9 sm:w-10 sm:h-10">
            <NotificationBadge
              onClick={() => setIsNotificationCenterOpen(true)}
              size="sm"
              variant="ghost"
            />
          </div>
          
          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors touch-manipulation',
                isDropdownOpen
                  ? 'bg-white/30 text-white'
                  : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white active:bg-white/40'
              )}
            >
              {isDropdownOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Dropdown Content */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-12 sm:top-12 w-72 sm:w-80 md:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* User Info Header */}
                 <div className="bg-gradient-to-r from-primary to-accent p-4 sm:p-4 text-white">
                   <div className="flex items-center space-x-3 sm:space-x-3">
                     <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/30">
                       {userHasPhotos(user) ? (
                         <img
                           src={getUserProfilePhoto(user) || ''}
                           alt={user?.name || 'Usuario'}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full bg-white/20 flex items-center justify-center">
                           <User className="w-6 h-6" />
                         </div>
                       )}
                     </div>
                     <div className="min-w-0 flex-1">
                       <h3 className="font-semibold text-sm sm:text-base truncate">{user?.name || 'Usuario'}</h3>
                       <p className="text-white/80 text-xs sm:text-sm truncate">{user?.email}</p>
                     </div>
                   </div>
                 </div>

                {/* Instagram Follow Button */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <FollowInstagramButton 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className={cn(
                        'flex items-center px-4 sm:px-4 py-3 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation',
                        item.highlight && 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0',
                        item.highlight 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          'font-medium text-sm sm:text-base truncate',
                          item.highlight 
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-900 dark:text-gray-100'
                        )}>
                          {item.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      {item.highlight && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                          NUEVO
                        </div>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 sm:px-4 py-3 sm:py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation"
                  >
                    <div className="w-10 h-10 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">Cerrar Sesión</h4>
                      <p className="text-xs sm:text-sm text-red-500 truncate">Salir de tu cuenta</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  );
};

export default Navigation;