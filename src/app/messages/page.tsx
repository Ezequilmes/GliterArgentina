'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSounds } from '@/hooks/useSounds';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { Avatar, Card, Button, Badge, Loading } from '@/components/ui';
import { getUserProfilePhoto } from '@/lib/userUtils';
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

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

const getLastSeenText = (lastSeen?: Date) => {
  if (!lastSeen) return 'Desconectado';
  
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 5) return 'En línea';
  if (minutes < 60) return `Visto hace ${minutes}m`;
  if (hours < 24) return `Visto hace ${hours}h`;
  if (days < 7) return `Visto hace ${days}d`;
  return 'Desconectado';
};

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading, error, getTotalUnreadCount } = useChat();
  const { playVoipCallSound } = useSounds();
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Simular estado en línea (en producción esto vendría de Firebase Presence)
  useEffect(() => {
    // TODO: Implementar Firebase Presence para estado en línea real
    const mockOnlineUsers = new Set(['user1', 'user2', 'user3']);
    setOnlineUsers(mockOnlineUsers);
  }, []);

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants.find(p => p.id !== user?.id);
    if (!searchQuery) return true;
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  const totalUnread = getTotalUnreadCount();

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleVideoCall = (chatId: string, otherUserId: string) => {
    playVoipCallSound();
    // TODO: Implementar videollamada para usuarios premium
  };

  const handleVoiceCall = (chatId: string, otherUserId: string) => {
    playVoipCallSound();
    // TODO: Implementar llamada de voz
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <Loading />
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

          {/* New Matches Section */}
          {filteredChats.some(chat => {
            if (!chat.lastActivity) return false;
            const createdAt = chat.lastActivity.toDate ? chat.lastActivity.toDate() : new Date(chat.lastActivity.seconds * 1000);
            return Date.now() - createdAt.getTime() < 86400000;
          }) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-primary" />
                Nuevos Matches
              </h3>
              
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {filteredChats
                  .filter(chat => {
                    if (!chat.lastActivity) return false;
                    const createdAt = chat.lastActivity.toDate ? chat.lastActivity.toDate() : new Date(chat.lastActivity.seconds * 1000);
                    return Date.now() - createdAt.getTime() < 86400000;
                  })
                  .map(chat => {
                    const otherUser = chat.participants.find(p => p.id !== user?.id);
                    if (!otherUser) return null;
                    
                    const isOnline = onlineUsers.has(otherUser.id);
                    
                    return (
                      <div key={chat.id} className="flex-shrink-0 text-center cursor-pointer group" onClick={() => handleChatClick(chat.id)}>
                        <div className="relative">
                          <Avatar
                            src={getUserProfilePhoto(otherUser)}
                            size="lg"
                            alt={otherUser.name}
                            className="mb-2 transition-transform group-hover:scale-105"
                          />
                          {/* Estado en línea */}
                          <div className={`absolute bottom-2 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {/* Badge Premium */}
                          {otherUser.isPremium && (
                            <div className="absolute -top-1 -right-1">
                              <Badge variant="gold" className="text-xs px-1">
                                <Star className="w-3 h-3" />
                              </Badge>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-16">
                          {(otherUser?.name ?? '').split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isOnline ? 'En línea' : 'Desconectado'}
                        </p>
                      </div>
                    );
                  })
                  .filter(Boolean)
                }
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
              Conversaciones
            </h3>

            {filteredChats.length > 0 ? (
              <div className="space-y-2">
                {filteredChats.map(chat => {
                  const otherUser = chat.participants.find(p => p.id !== user?.id);
                  if (!otherUser) return null;
                  
                  const unreadCount = chat.unreadCount?.[user?.id || ''] || 0;
                  const lastMessage = chat.lastMessage;
                  const isOnline = onlineUsers.has(otherUser.id);
                  
                  return (
                    <Card
                      key={chat.id}
                      variant="default"
                      padding="sm"
                      hover
                      className="cursor-pointer transition-all group"
                      onClick={() => handleChatClick(chat.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar
                            src={getUserProfilePhoto(otherUser)}
                            size="md"
                            alt={otherUser.name}
                            className="transition-transform group-hover:scale-105"
                          />
                          {/* Estado en línea */}
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {/* Badge Premium */}
                          {otherUser.isPremium && (
                            <div className="absolute -top-1 -right-1">
                              <Badge variant="gold" className="text-xs px-1">
                                <Star className="w-2 h-2" />
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {otherUser.name}
                                {otherUser.isVerified && (
                                  <span className="ml-1 text-blue-500">✓</span>
                                )}
                              </h4>
                              {/* Indicador de estado */}
                              <div className="flex items-center space-x-1">
                                <Circle className={`w-2 h-2 ${isOnline ? 'text-green-500 fill-current' : 'text-gray-400'}`} />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {getLastSeenText(otherUser.lastSeen?.toDate ? otherUser.lastSeen.toDate() : undefined)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Botones de llamada para usuarios premium */}
                              {user?.isPremium && (
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleVoiceCall(chat.id, otherUser.id);
                                    }}
                                    className="p-1 h-8 w-8"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleVideoCall(chat.id, otherUser.id);
                                    }}
                                    className="p-1 h-8 w-8"
                                  >
                                    <Video className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              {unreadCount > 0 && (
                                <Badge variant="primary" className="text-xs">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                              )}
                              {lastMessage && lastMessage.timestamp && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(lastMessage.timestamp.toDate ? lastMessage.timestamp.toDate() : new Date(lastMessage.timestamp.seconds * 1000))}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {lastMessage && (
                            <div className="flex items-center justify-between">
                              <p className={`text-sm truncate flex-1 ${
                                unreadCount > 0 
                                  ? 'text-gray-900 dark:text-gray-100 font-medium' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {lastMessage.senderId === user?.id && (
                                  <span className="text-blue-500 mr-1">Tú:</span>
                                )}
                                {lastMessage.type === 'image' ? '📷 Imagen' : 
                                 lastMessage.type === 'gif' ? '🎬 GIF' :
                                 lastMessage.type === 'emoji' ? lastMessage.content :
                                 lastMessage.content}
                              </p>
                              {/* Indicador de mensaje enviado */}
                              {lastMessage.senderId === user?.id && (
                                <div className="ml-2">
                                  <div className="text-gray-400">✓</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {searchQuery ? 'No se encontraron conversaciones' : 'No tienes mensajes aún'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery 
                    ? 'Intenta con otro término de búsqueda'
                    : 'Cuando hagas match con alguien, podrás empezar a chatear aquí'
                  }
                </p>
                {!searchQuery && (
                  <Button variant="primary" onClick={() => router.push('/discover')}>
                    <Heart className="w-4 h-4 mr-2" />
                    Descubrir personas
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}