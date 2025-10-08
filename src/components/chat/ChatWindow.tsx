'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useRealtime } from '@/hooks/useRealtime';
import { useSounds } from '@/hooks/useSounds';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Avatar, Button, Badge, Loading } from '@/components/ui';
import { getUserProfilePhoto } from '@/lib/userUtils';
import { 
  ArrowDown, 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Star,
  Circle,
  AlertCircle,
  Wifi,
  WifiOff,
  X,
  Edit3
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/services/chatService';
import { PopulatedChat } from '@/types';

export interface ChatWindowProps {
  chat: PopulatedChat;
  onBack?: () => void;
}

export function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { 
    messages, 
    loading, 
    error, 
    hasMoreMessages, 
    otherUserTyping, 
    loadMoreMessages, 
    markAsRead,
    editMessage,
    addReaction,
    removeReaction,
    retryMessage,
    selectChat
  } = useChat();
  const { playReceiveChatSound, playVoipCallSound } = useSounds();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  const otherUser = chat.participants.find(p => p.id !== user?.id);
  
  // Seleccionar el chat cuando cambie el ID
  useEffect(() => {
    if (chat.id) {
      selectChat(chat.id);
    }
  }, [chat.id, selectChat]);
  
  // Hook para estado en línea
  const { isUserOnline, getUserLastSeen } = useOnlineStatus(otherUser ? [otherUser.id] : []);
  const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
  const lastSeen = otherUser ? getUserLastSeen(otherUser.id) : undefined;

  // Hook para funcionalidades de tiempo real
  const {
    isConnected,
    userPresence,
    setTyping,
    watchTyping,
    watchUserPresence,
    isUserTyping,
    getTypingUsers
  } = useRealtime({
    enablePresence: true,
    enableTyping: true,
    enableNotifications: true
  });

  // Función para formatear la última vez visto
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (isNearBottom || force)) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [isNearBottom]);

  // Detectar si el usuario está cerca del final
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && messages.length > 0);

    // Cargar más mensajes si está cerca del top
    if (scrollTop < 100 && hasMoreMessages && !loading) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loading, loadMoreMessages, messages.length]);

  // Marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (chat.id && user?.id) {
      markAsRead(chat.id);
    }
  }, [chat.id, user?.id, markAsRead]);

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Detectar nuevos mensajes y reproducir sonido de recepción
  useEffect(() => {
    if (messages.length > previousMessageCount && previousMessageCount > 0) {
      // Verificar si el último mensaje no es del usuario actual
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== user?.id) {
        playReceiveChatSound();
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length, messages, user?.id, playReceiveChatSound, previousMessageCount]);

  // Configurar listeners de scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageViewerOpen(true);
  };

  // Configurar listeners de tiempo real
  useEffect(() => {
    if (!otherUser?.id || !chat.id) return;

    // Escuchar presencia del otro usuario
    const presenceUnsubscribe = watchUserPresence([otherUser.id]);
    
    // Escuchar estado de escritura en este chat
    const typingUnsubscribe = watchTyping(chat.id);

    return () => {
      if (presenceUnsubscribe) presenceUnsubscribe();
      if (typingUnsubscribe) typingUnsubscribe();
    };
  }, [otherUser?.id, chat.id, watchUserPresence, watchTyping]);

  // Manejar estado de escritura
  const handleTypingStart = useCallback(() => {
    if (chat.id) {
      setTyping(chat.id, true);
    }
  }, [chat.id, setTyping]);

  const handleTypingStop = useCallback(() => {
    if (chat.id) {
      setTyping(chat.id, false);
    }
  }, [chat.id, setTyping]);

  const handleVoiceCall = () => {
    playVoipCallSound();
    // TODO: Implementar llamada de voz
  };

  const handleVideoCall = () => {
    playVoipCallSound();
    // TODO: Implementar videollamada
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    editMessage(messageId, newContent);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    removeReaction(messageId);
  };

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se pudo cargar la información del chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {/* Avatar con estado en línea */}
          <div className="relative">
            <Avatar
              src={getUserProfilePhoto(otherUser)}
              fallback={(otherUser?.name?.charAt(0) ?? '')}
              alt={otherUser.name}
              size="md"
              className="ring-2 ring-border"
            />
            {/* Indicador de estado en línea */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-card rounded-full ${
              isOnline ? 'bg-success' : 'bg-muted'
            }`}></div>
          </div>
          
          {/* Información del usuario */}
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">
              {otherUser.name}
            </h2>
            <div className="flex items-center space-x-1">
              {/* Indicador de conexión del usuario actual */}
              {!isConnected && (
                <div className="flex items-center space-x-1 mr-2">
                  <WifiOff className="w-3 h-3 text-destructive" />
                  <span className="text-xs text-destructive">Sin conexión</span>
                </div>
              )}
              
              {/* Estado del otro usuario */}
              {isOnline || userPresence[otherUser.id]?.isOnline ? (
                <>
                  <Circle className="w-2 h-2 fill-success text-success" />
                  <span className="text-sm text-success-strong">
                    En línea
                    {isUserTyping(chat.id, otherUser.id) && (
                      <span className="ml-1 flex items-center">
                        <Edit3 className="w-3 h-3 animate-pulse" />
                        <span className="ml-1">escribiendo...</span>
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Circle className="w-2 h-2 fill-muted-foreground text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {lastSeen || userPresence[otherUser.id]?.lastSeen
                      ? formatLastSeen(lastSeen || new Date(userPresence[otherUser.id]?.lastSeen!))
                      : 'Desconectado'}
                  </span>
                </>
              )}
              {otherUserTyping && (
                <span className="text-sm text-accent-end ml-2">
                  escribiendo...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          {/* Indicador de conexión */}
          <div className="flex items-center space-x-1">
            {navigator.onLine ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
          </div>

          {/* Botones de llamada (solo si el usuario está en línea) */}
          {isOnline && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceCall}
                className="p-2"
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVideoCall}
                className="p-2"
              >
                <Video className="w-5 h-5" />
              </Button>
            </>
          )}
          
          <Button variant="ghost" size="sm" className="p-2">
            <Info className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Área de mensajes */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {/* Indicador de carga para mensajes anteriores */}
        {loading && hasMoreMessages && (
          <div className="flex justify-center py-4">
            <Loading size="sm" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center py-4">
            <div className="bg-destructive-faint text-destructive-strong px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-muted rounded-full p-6 mb-4">
              <Star className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              ¡Comienza la conversación!
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Este es el comienzo de tu conversación con {otherUser.name}. 
              ¡Envía un mensaje para romper el hielo!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const showAvatar = !isOwn && (
                index === 0 || 
                messages[index - 1]?.senderId !== message.senderId
              );
              const showTimestamp = index === 0 || 
                (message.timestamp?.toDate()?.getTime() || 0) - (messages[index - 1]?.timestamp?.toDate()?.getTime() || 0) > 300000; // 5 minutos

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  senderName={otherUser.name}
                  senderAvatar={getUserProfilePhoto(otherUser) || undefined}
                  onEdit={handleEditMessage}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                  onImageClick={handleImageClick}
                  onRetry={retryMessage}
                />
              );
            })}
            
            {/* Indicador de escritura */}
            {otherUserTyping && (
              <div className="flex items-center space-x-2">
                <Avatar
                  src={getUserProfilePhoto(otherUser)}
                  fallback={(otherUser?.name?.charAt(0) ?? '')}
                  alt={otherUser.name}
                  size="sm"
                />
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Referencia para auto-scroll */}

        <div ref={messagesEndRef} />
      </div>

      {/* Botón de scroll hacia abajo */}
      {showScrollButton && (
        <div className="absolute bottom-20 right-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => scrollToBottom(true)}
            className="rounded-full shadow-lg"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input de mensaje */}
      <div className="border-t border-border bg-card">
        <ChatInput 
          chatId={chat.id}
          otherUserId={otherUser.id}
          disabled={!isConnected && !navigator.onLine}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>

      {/* Visor de imágenes */}
      {imageViewerOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setImageViewerOpen(false)}
        >
          <div className="relative max-w-4xl max-h-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageViewerOpen(false)}
              className="absolute top-4 right-4 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}