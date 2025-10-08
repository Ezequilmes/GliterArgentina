'use client';

import { useState, useMemo } from 'react';
import { PopulatedChat, User } from '@/types';
import { Avatar, Loading } from '@/components/ui';
import { getUserProfilePhoto } from '@/lib/userUtils';
import { Search, MessageCircle, Clock, Image, File, MapPin, Mic, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export interface ChatListProps {
  chats: PopulatedChat[];
  currentUser: User;
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onCreateChat?: (userId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatList({
  chats,
  currentUser,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  isLoading = false,
  className
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener IDs de otros usuarios para el estado en línea
  const otherUserIds = useMemo(() => {
    return chats.map(chat => {
      const otherUser = chat.participants.find(p => p.id !== currentUser.id);
      return otherUser?.id || '';
    }).filter(Boolean);
  }, [chats, currentUser.id]);

  const { isUserOnline, getUserLastSeen } = useOnlineStatus(otherUserIds);

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Ahora' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d`;
      } else {
        return new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'short'
        }).format(date);
      }
    }
  };

  const getOtherUser = (chat: PopulatedChat): User => {
    return chat.participants.find(p => p.id !== currentUser.id) || chat.participants[0];
  };

  // Función para obtener vista previa del mensaje
  const getMessagePreview = (lastMessage: PopulatedChat['lastMessage']) => {
    if (!lastMessage) return '';

    const { content, type } = lastMessage;
    
    switch (type) {
      case 'image':
        return '📷 Imagen';
      case 'file':
        return '📎 Archivo';
      case 'audio':
        return '🎵 Audio';
      case 'location':
        return '📍 Ubicación';
      case 'gif':
        return '🎬 GIF';
      case 'emoji':
        return content; // Los emojis se muestran tal como son
      default:
        return content;
    }
  };

  // Función para obtener el ícono del tipo de mensaje
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4 text-muted-foreground" />;
      case 'file':
        return <File className="w-4 h-4 text-muted-foreground" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-muted-foreground" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
      case 'gif':
        return <Heart className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(chat);
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Ordenar chats por actividad reciente
  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      // Primero por mensajes no leídos
      const aUnread = a.unreadCount[currentUser.id] || 0;
      const bUnread = b.unreadCount[currentUser.id] || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;

      // Luego por última actividad
      const aTime = a.lastActivity?.toDate?.()?.getTime() || 0;
      const bTime = b.lastActivity?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
  }, [filteredChats, currentUser.id]);

  if (isLoading) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          Mensajes
        </h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones'}
            </p>
            <p className="text-sm text-center text-muted-foreground/80">
              {searchQuery 
                ? 'Intenta con otro término de búsqueda' 
                : 'Comienza a chatear con tus matches'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const isSelected = chat.id === selectedChatId;
              const hasUnread = (chat.unreadCount[currentUser.id] || 0) > 0;
              const isOnline = isUserOnline(otherUser.id);
              const lastSeen = getUserLastSeen(otherUser.id);

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-accent transition-colors relative",
                    isSelected && "bg-accent/80 border-r-2 border-primary"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar con estado en línea */}
                    <div className="relative">
                      <Avatar
                        src={getUserProfilePhoto(otherUser)}
                        fallback={(otherUser?.name?.charAt(0) ?? '')}
                        alt={otherUser.name}
                        size="md"
                        className={cn(
                          "ring-2 transition-all",
                          hasUnread 
                            ? "ring-primary/70" 
                            : "ring-border"
                        )}
                      />
                      {/* Indicador de estado en línea */}
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 border-2 border-background rounded-full transition-colors",
                        isOnline 
                          ? "bg-green-500" 
                          : "bg-muted-foreground/50"
                      )}></div>
                    </div>

                    {/* Información del chat */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={cn(
                          "font-medium truncate",
                          hasUnread 
                            ? "text-foreground" 
                            : "text-muted-foreground"
                        )}>
                          {otherUser.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {chat.lastMessage && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatLastMessageTime(chat.lastMessage.timestamp.toDate())}
                            </span>
                          )}
                          {hasUnread && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                              {(chat.unreadCount[currentUser.id] || 0) > 99 ? '99+' : (chat.unreadCount[currentUser.id] || 0)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Vista previa del mensaje */}
                      {chat.lastMessage ? (
                        <div className="flex items-center space-x-1">
                          {getMessageIcon(chat.lastMessage.type)}
                          <p className={cn(
                            "text-sm truncate flex-1",
                            hasUnread 
                              ? "text-foreground/90 font-medium" 
                              : "text-muted-foreground"
                          )}>
                            {chat.lastMessage.senderId === currentUser.id && "Tú: "}
                            {truncateMessage(getMessagePreview(chat.lastMessage))}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/80 italic">
                          ¡Inicia la conversación!
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}