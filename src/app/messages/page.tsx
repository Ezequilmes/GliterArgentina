'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSounds } from '@/hooks/useSounds';
import { analyticsService } from '@/services/analyticsService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { Avatar, Card, Button, Badge, Loading } from '@/components/ui';
import { getUserProfilePhoto } from '@/lib/userUtils';
import { PopulatedChat } from '@/types';
import { 
  MessageCircle, 
  Phone, 
  Video, 
  Search, 
  Filter,
  Users,
  Heart,
  Star,
  MoreVertical,
  Trash2,
  Archive,
  Pin,
  Volume2,
  VolumeX,
  Circle
} from 'lucide-react';

const formatTime = (timestamp: any): string => {
  try {
    if (!timestamp) return '';
    
    let date: Date;
    
    // Handle Firestore Timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Handle timestamp number
    else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    }
    // Handle string timestamp
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    }
    else {
      console.warn('Invalid timestamp format:', timestamp);
      return '';
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date created from timestamp:', timestamp);
      return '';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  } catch (error) {
    console.error('Error formatting time:', error, timestamp);
    return '';
  }
};

const formatLastSeen = (timestamp: any): string => {
  try {
    if (!timestamp) return 'Desconocido';
    
    let date: Date;
    
    // Handle Firestore Timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Handle timestamp number
    else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    }
    // Handle string timestamp
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    }
    else {
      console.warn('Invalid lastSeen timestamp format:', timestamp);
      return 'Desconocido';
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date created from lastSeen timestamp:', timestamp);
      return 'Desconocido';
    }
    
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Ahora';
    } else if (diffInMinutes < 60) {
      return `Hace ${Math.floor(diffInMinutes)} min`;
    } else if (diffInMinutes < 24 * 60) {
      return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    } else {
      const diffInDays = Math.floor(diffInMinutes / (24 * 60));
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error formatting last seen:', error, timestamp);
    return 'Desconocido';
  }
};

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading, error, getTotalUnreadCount, selectChat } = useChat();
  const { playVoipCallSound } = useSounds();
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Simular estado en línea (en producción esto vendría de Firebase Presence)
  useEffect(() => {
    // TODO: Implementar Firebase Presence para estado en línea real
    const mockOnlineUsers = new Set(['user1', 'user2', 'user3']);
    setOnlineUsers(mockOnlineUsers);
  }, []);

  // Agrupar chats por usuario (mostrar solo el más reciente de cada usuario)
  const groupedChats = useMemo(() => {
    const userChats = new Map<string, PopulatedChat>();
    
    chats.forEach(chat => {
      const otherUser = chat.participants.find(p => p.id !== user?.id);
      if (otherUser) {
        const existingChat = userChats.get(otherUser.id);
        if (!existingChat || 
            (chat.lastActivity && existingChat.lastActivity && 
             chat.lastActivity.toDate() > existingChat.lastActivity.toDate())) {
          userChats.set(otherUser.id, chat);
        }
      }
    });
    
    return Array.from(userChats.values());
  }, [chats, user?.id]);

  const filteredChats = groupedChats.filter(chat => {
    const otherUser = chat.participants.find(p => p.id !== user?.id);
    if (!searchQuery) return true;
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  const totalUnread = getTotalUnreadCount();

  const handleChatClick = useCallback((chat: PopulatedChat) => {
    try {
      if (!chat?.id) {
        console.error('Invalid chat object:', chat);
        return;
      }
      
      setSelectedChatId(chat.id);
      selectChat(chat.id);
      
      // Track chat opened event
      try {
        // Track chat opened - calculate match age if possible
        const matchAgeHours = chat.createdAt ? 
          Math.floor((Date.now() - chat.createdAt.toMillis()) / (1000 * 60 * 60)) : 
          undefined;
        analyticsService.trackChatOpened(matchAgeHours);
      } catch (analyticsError) {
        console.error('Error tracking chat opened:', analyticsError);
        // Don't block the UI for analytics errors
      }
    } catch (error) {
      console.error('Error handling chat click:', error);
      // Don't show error to user for this action
    }
  }, [selectChat]);

  const handleVoiceCall = useCallback((chat: PopulatedChat) => {
    try {
      if (!chat?.id || !user?.id) {
        console.error('Invalid chat or user for voice call:', { chat: chat?.id, user: user?.id });
        return;
      }
      
      const otherUser = chat.participants?.find(p => p?.id !== user.id);
      if (!otherUser?.id) {
        console.error('Other user not found for voice call');
        return;
      }
      
      // TODO: Implement voice call functionality and add analytics tracking
      console.log('Voice call initiated with:', otherUser.name || otherUser.id);
    } catch (error) {
      console.error('Error handling voice call:', error);
      // Don't show error to user for this action
    }
  }, [user?.id]);

  const handleVideoCall = useCallback((chat: PopulatedChat) => {
    try {
      if (!chat?.id || !user?.id) {
        console.error('Invalid chat or user for video call:', { chat: chat?.id, user: user?.id });
        return;
      }
      
      const otherUser = chat.participants?.find(p => p?.id !== user.id);
      if (!otherUser?.id) {
        console.error('Other user not found for video call');
        return;
      }
      
      // TODO: Implement video call functionality and add analytics tracking
      console.log('Video call initiated with:', otherUser.name || otherUser.id);
    } catch (error) {
      console.error('Error handling video call:', error);
      // Don't show error to user for this action
    }
  }, [user?.id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="text-center space-y-6 max-w-md mx-auto">
              {/* Animated Message Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto animate-pulse">
                <MessageCircle className="w-10 h-10 text-blue-500 animate-bounce" />
              </div>

              {/* Loading Dots */}
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>

              {/* Title and Message */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Cargando mensajes
                </h3>
                <p className="text-muted-foreground">
                  Obteniendo tus conversaciones...
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Esto puede tomar unos momentos
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                  style={{ width: '75%', animation: 'pulse 2s infinite' }}
                />
              </div>

              {/* Tip */}
              <div className="text-xs text-muted-foreground/60 italic">
                💬 Tip: Mantén conversaciones activas para mejores matches
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error al cargar mensajes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <Header
            title="Mensajes"
            subtitle={totalUnread > 0 ? `${totalUnread} mensajes sin leer` : 'Todas las conversaciones al día'}
            rightContent={
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            }
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Nuevos Matches */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Nuevos Matches</h3>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {Array.isArray(chats) && chats
                .filter(chat => {
                  try {
                    return chat?.matchId && 
                           Array.isArray(chat.participants) && 
                           chat.participants.length > 0;
                  } catch (error) {
                    console.error('Error filtering match chats:', error, chat);
                    return false;
                  }
                })
                .slice(0, 10)
                .map((chat) => {
                  try {
                    if (!chat?.id || !Array.isArray(chat.participants)) {
                      console.warn('Invalid chat data for match:', chat);
                      return null;
                    }
                    
                    const otherUser = chat.participants.find(p => p?.id !== user?.id);
                    if (!otherUser) {
                      console.warn('Other user not found in match chat:', chat.id);
                      return null;
                    }
                    
                    const isOnline = onlineUsers.has(otherUser.id || '');
                    
                    return (
                      <div key={chat.id} className="flex-shrink-0">
                        <div 
                          className="relative cursor-pointer"
                          onClick={() => handleChatClick(chat)}
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500">
                            <img
                              src={otherUser.photos?.[0] || '/default-avatar.png'}
                              alt={otherUser.name || 'Usuario'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-avatar.png';
                              }}
                            />
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-center mt-1 text-gray-600 truncate w-16">
                          {otherUser.name || 'Usuario'}
                        </p>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering match chat:', error, chat);
                    return null;
                  }
                })
                .filter(Boolean) // Remove null entries
              }
            </div>
          </div>

          {/* Lista de Conversaciones */}
          <div className="space-y-2">
            {Array.isArray(chats) && chats.length > 0 ? (
              chats
                .filter(chat => {
                  try {
                    return chat?.id && 
                           Array.isArray(chat.participants) && 
                           chat.participants.length > 0;
                  } catch (error) {
                    console.error('Error filtering chats:', error, chat);
                    return false;
                  }
                })
                .map((chat) => {
                  try {
                    if (!chat?.id || !Array.isArray(chat.participants)) {
                      console.warn('Invalid chat data:', chat);
                      return null;
                    }
                    
                    const otherUser = chat.participants.find(p => p?.id !== user?.id);
                    if (!otherUser) {
                      console.warn('Other user not found in chat:', chat.id);
                      return null;
                    }
                    
                    const isOnline = onlineUsers.has(otherUser.id || '');
                    const unreadCount = chat.unreadCount?.[user?.id || ''] || 0;
                    const isSelected = selectedChatId === chat.id;
                    
                    return (
                      <div
                        key={chat.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-pink-50 border border-pink-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleChatClick(chat)}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={otherUser.photos?.[0] || '/default-avatar.png'}
                            alt={otherUser.name || 'Usuario'}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default-avatar.png';
                            }}
                          />
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 ml-3 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate">
                              {otherUser.name || 'Usuario'}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {chat.lastMessage?.timestamp && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(chat.lastMessage.timestamp)}
                                </span>
                              )}
                              {unreadCount > 0 && (
                                <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessage?.content || 'No hay mensajes'}
                            </p>
                            
                            {/* Botones de llamada para usuarios premium */}
                            {user?.isPremium && (
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVoiceCall(chat);
                                  }}
                                  className="p-1 text-gray-400 hover:text-pink-500 transition-colors"
                                  title="Llamada de voz"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVideoCall(chat);
                                  }}
                                  className="p-1 text-gray-400 hover:text-pink-500 transition-colors"
                                  title="Videollamada"
                                >
                                  <Video className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {!isOnline && otherUser.lastSeen && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatLastSeen(otherUser.lastSeen)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering chat:', error, chat);
                    return null;
                  }
                })
                .filter(Boolean) // Remove null entries
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tienes conversaciones aún</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cuando hagas match con alguien, aparecerá aquí
                </p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}