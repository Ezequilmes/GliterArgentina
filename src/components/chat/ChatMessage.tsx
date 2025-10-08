'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChatMessage as ChatMessageType } from '@/services/chatService';
import { Avatar, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  Heart,
  Smile,
  Edit,
  Reply,
  MoreHorizontal,
  Download,
  Play,
  Pause,
  MapPin,
  File,
  X,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// FIX: Tipos TypeScript más estrictos
export interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  senderName?: string;
  senderAvatar?: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onReply?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onImageClick?: (imageUrl: string) => void;
  onRetry?: (messageId: string) => void;
  className?: string;
}

// FIX: Validación de coordenadas para ubicaciones
const isValidCoordinates = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// FIX: Función formatTime más segura con Intl.DateTimeFormat
const formatTime = (timestamp: any): string => {
  try {
    // Validar si timestamp existe y tiene el método toDate
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '--:--';
    }
    
    const date = timestamp.toDate();
    
    // Validar que la fecha sea válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '--:--';
    }
    
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.warn('Error formatting time:', error);
    return '--:--';
  }
};

// FIX: Validación segura de fileSize
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || typeof bytes !== 'number' || bytes <= 0) {
    return 'Tamaño desconocido';
  }
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i >= sizes.length) {
    return 'Archivo muy grande';
  }
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
  senderName,
  senderAvatar,
  onEdit,
  onReply,
  onAddReaction,
  onRemoveReaction,
  onImageClick,
  onRetry,
  className
}: ChatMessageProps) {
  const { user } = useAuth(); // FIX: Obtener currentUser correctamente
  const [imageLoading, setImageLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0); // FIX: Soporte táctil
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // FIX: useEffect del audio con dependencias correctas
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || message.type !== 'audio') return;

    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else {
        // Si la duración es infinita o inválida, mostrar 0:00 en la UI
        setAudioDuration(0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };

    const handleError = (event: Event) => {
      const audioElement = event.target as HTMLAudioElement;
      const error = audioElement.error;
      
      console.error('Error loading audio:', message.content);
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            console.error('Audio loading was aborted');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            console.error('Network error while loading audio');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            console.error('Audio decoding error');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.error('Audio format not supported or source not accessible');
            break;
          default:
            console.error('Unknown audio error');
        }
      }
      
      setIsPlaying(false);
      setAudioProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [message.type, message.content]); // FIX: Dependencias correctas

  // FIX: Función formatDuration optimizada
  const formatDuration = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // FIX: Función getStatusIcon optimizada
  const getStatusIcon = useCallback(() => {
    if (message.status) {
      switch (message.status) {
        case 'sending':
          return <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />;
        case 'failed':
          return (
            <button
              onClick={() => {
                // FIX: Validar message.id antes de usar onRetry
                if (message.id && onRetry) {
                  onRetry(message.id);
                }
              }}
              className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-0.5 transition-colors"
              title="Reintentar envío"
              aria-label="Reintentar envío del mensaje"
            >
              <AlertCircle className="w-3 h-3 text-red-500" />
            </button>
          );
        case 'retrying':
          return <RotateCcw className="w-3 h-3 text-yellow-500 animate-spin" />;
        case 'sent':
          return <Check className="w-3 h-3 text-gray-400" />;
        case 'delivered':
          return <CheckCheck className="w-3 h-3 text-gray-400" />;
        default:
          break;
      }
    }

    // Fallback al sistema anterior basado en read
    if (message.read) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    } else {
      return <Check className="w-3 h-3 text-gray-400" />;
    }
  }, [message.status, message.read, message.id, onRetry]);

  // FIX: Funciones de edición optimizadas
  const handleEditSave = useCallback(() => {
    if (editContent.trim() && editContent !== message.content && message.id && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
    setEditContent(message.content || '');
  }, [editContent, message.content, message.id, onEdit]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content || '');
  }, [message.content]);

  // FIX: Función toggleAudio optimizada con mejor manejo de errores
  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Validar que el contenido del mensaje sea una URL válida
    if (!message.content || !message.content.trim()) {
      console.error('Error playing audio: No audio source provided');
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      // Verificar si el audio tiene fuentes válidas antes de reproducir
      if (audio.readyState === 0) {
        // Forzar la carga del audio
        audio.load();
      }
      
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        
        // Proporcionar información más específica sobre el error
        if (error.name === 'NotSupportedError') {
          console.error('Audio format not supported or source not accessible:', message.content);
        } else if (error.name === 'NotAllowedError') {
          console.error('Audio playback not allowed by browser policy');
        } else if (error.name === 'AbortError') {
          console.error('Audio playback was aborted');
        }
        
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, message.content]);

  // FIX: handleLocationClick con validación de coordenadas
  const handleLocationClick = useCallback(() => {
    try {
      if (!message.content) return;
      
      // Intentar obtener coordenadas de metadata primero
      if (message.metadata?.coordinates) {
        const { lat, lng } = message.metadata.coordinates;
        if (isValidCoordinates(lat, lng)) {
          const url = `https://www.google.com/maps?q=${lat},${lng}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }
      
      // Fallback: parsear del contenido
      const coords = message.content.split(',');
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        
        if (isValidCoordinates(lat, lng)) {
          const url = `https://www.google.com/maps?q=${lat},${lng}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          console.warn('Coordenadas inválidas:', { lat, lng });
        }
      }
    } catch (error) {
      console.error('Error al abrir ubicación:', error);
    }
  }, [message.content, message.metadata]);

  // FIX: Función de descarga de archivos mejorada
  const handleFileDownload = useCallback(() => {
    try {
      if (!message.content) return;
      
      const link = document.createElement('a');
      link.href = message.content;
      link.download = message.metadata?.fileName || 'archivo';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
    }
  }, [message.content, message.metadata]);

  // FIX: Soporte táctil para acciones
  const handleTouchStart = useCallback(() => {
    setTouchStartTime(Date.now());
  }, []);

  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration > 500) { // Long press
      setShowActions(true);
      setTimeout(() => setShowActions(false), 3000); // Auto-hide after 3s
    }
  }, [touchStartTime]);

  // FIX: Validación de estructura de reactions
  const groupedReactions = useMemo(() => {
    if (!message.reactions || typeof message.reactions !== 'object') {
      return {};
    }

    return Object.entries(message.reactions).reduce((acc, [userId, emoji]) => {
      if (typeof emoji === 'string' && emoji.trim()) {
        if (!acc[emoji]) acc[emoji] = [];
        acc[emoji].push(userId);
      }
      return acc;
    }, {} as { [emoji: string]: string[] });
  }, [message.reactions]);

  // FIX: Función para manejar reacciones con currentUser.uid
  const handleReactionClick = useCallback((emoji: string, userIds: string[]) => {
    if (!user?.id || !message.id) return;
    
    const hasReacted = userIds.includes(user.id);
    if (hasReacted) {
      onRemoveReaction?.(message.id, emoji);
    } else {
      onAddReaction?.(message.id, emoji);
    }
  }, [user?.id, message.id, onAddReaction, onRemoveReaction]);

  // FIX: Renderizado optimizado del contenido del mensaje
  const renderMessageContent = useCallback(() => {
    if (!message.content && message.type !== 'emoji') {
      return (
        <div className="px-4 py-3 rounded-2xl max-w-xs shadow-lg border bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <p className="text-sm italic">Mensaje sin contenido</p>
        </div>
      );
    }

    switch (message.type) {
      case 'text':
        if (isEditing) {
          return (
            <div className={cn(
              "px-4 py-3 rounded-2xl max-w-xs shadow-lg border transition-all duration-300",
              isOwn 
                ? "bg-gradient-to-r from-primary to-accent text-white ml-auto border-primary/30" 
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            )}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder-gray-400"
                rows={2}
                autoFocus
                placeholder="Escribe tu mensaje..."
                maxLength={1000}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditCancel}
                  className="px-2 py-1 text-xs hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditSave}
                  className="px-2 py-1 text-xs hover:bg-white/20"
                  disabled={!editContent.trim()}
                >
                  Guardar
                </Button>
              </div>
            </div>
          );
        }
        
        return (
          <div 
            className={cn(
              "relative group px-4 py-3 rounded-2xl max-w-xs break-words shadow-lg border transition-all duration-300 hover:shadow-xl",
              isOwn 
                ? "bg-gradient-to-r from-primary to-accent text-white ml-auto border-primary/30" 
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
            </p>
            
            {/* Message Actions */}
            {showActions && (
              <div className={cn(
                "absolute top-0 flex space-x-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 animate-in fade-in-0 zoom-in-95 duration-200",
                isOwn ? "right-0 -translate-y-full" : "left-0 -translate-y-full"
              )}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => message.id && onReply?.(message.id)}
                  className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={!message.id}
                >
                  <Reply className="w-3 h-3" />
                </Button>
                
                {isOwn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => message.id && onAddReaction?.(message.id, '❤️')}
                  className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={!message.id}
                >
                  <Heart className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className={cn(
            "relative rounded-2xl overflow-hidden max-w-xs cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700",
            isOwn ? "ml-auto" : ""
          )}>
            <Image
              src={message.content}
              alt="Imagen enviada"
              width={250}
              height={250}
              className="object-cover transition-transform duration-300 hover:scale-105"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              onClick={() => onImageClick?.(message.content)}
              priority={false}
              loading="lazy"
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        );

      case 'gif':
        return (
          <div className={cn(
            "relative rounded-2xl overflow-hidden max-w-xs shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700",
            isOwn ? "ml-auto" : ""
          )}>
            <Image
              src={message.content}
              alt="GIF"
              width={250}
              height={200}
              className="object-cover transition-transform duration-300 hover:scale-105"
              unoptimized
              loading="lazy"
            />
          </div>
        );

      case 'audio':
        return (
          <div className={cn(
            "flex items-center space-x-3 px-4 py-3 rounded-2xl max-w-xs shadow-lg border transition-all duration-300",
            isOwn 
              ? "bg-gradient-to-r from-purple-500 to-orange-500 text-white ml-auto border-purple-300/30" 
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAudio}
              className="p-2 rounded-full hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-1">
                <div 
                  className="bg-current h-1 rounded-full transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <div className="text-xs opacity-75">
                {formatDuration(audioDuration)}
              </div>
            </div>
            
            <audio 
              ref={audioRef} 
              preload="metadata"
              aria-label="Mensaje de audio"
              crossOrigin="anonymous"
            >
              <source src={message.content} type="audio/wav" />
              <source src={message.content} type="audio/mpeg" />
              <source src={message.content} type="audio/ogg" />
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>
        );

      case 'file':
        return (
          <div className={cn(
            "flex items-center space-x-3 px-4 py-3 rounded-2xl max-w-xs shadow-lg border transition-all duration-300 cursor-pointer hover:shadow-xl",
            isOwn 
              ? "bg-gradient-to-r from-purple-500 to-orange-500 text-white ml-auto border-purple-300/30" 
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
          )}
          onClick={handleFileDownload}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFileDownload();
            }
          }}
          >
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <File className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.metadata?.fileName || 'Archivo'}
              </p>
              <p className="text-xs opacity-75">
                {formatFileSize(message.metadata?.fileSize)}
              </p>
            </div>
            
            <Download className="w-4 h-4 opacity-75" />
          </div>
        );

      case 'location':
        return (
          <div className={cn(
            "flex items-center space-x-3 px-4 py-3 rounded-2xl max-w-xs shadow-lg border transition-all duration-300 cursor-pointer hover:shadow-xl",
            isOwn 
              ? "bg-gradient-to-r from-purple-500 to-orange-500 text-white ml-auto border-purple-300/30" 
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
          )}
          onClick={handleLocationClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLocationClick();
            }
          }}
          >
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium">Ubicación compartida</p>
              <p className="text-xs opacity-75">Toca para abrir en Maps</p>
            </div>
          </div>
        );

      case 'emoji':
        return (
          <div className={cn(
            "text-4xl p-2 select-none",
            isOwn ? "ml-auto" : ""
          )}>
            {message.content}
          </div>
        );

      default:
        return (
          <div className={cn(
            "px-4 py-3 rounded-2xl max-w-xs shadow-lg border transition-all duration-300 hover:shadow-xl",
            isOwn 
              ? "bg-gradient-to-r from-purple-500 to-orange-500 text-white ml-auto border-purple-300/30" 
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
          )}>
            <p className="text-sm leading-relaxed select-text">{message.content}</p>
          </div>
        );
    }
  }, [
    message.content, 
    message.type, 
    message.metadata, 
    message.id,
    isOwn, 
    isEditing, 
    editContent, 
    showActions, 
    imageLoading, 
    isPlaying, 
    audioProgress, 
    audioDuration,
    handleEditCancel,
    handleEditSave,
    handleTouchStart,
    handleTouchEnd,
    handleFileDownload,
    handleLocationClick,
    toggleAudio,
    formatDuration,
    onReply,
    onAddReaction,
    onImageClick
  ]);

  return (
    <div className={cn(
      "flex items-end space-x-2 mb-3 group",
      isOwn ? "flex-row-reverse space-x-reverse" : "",
      className
    )}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar
          src={senderAvatar}
          alt={senderName || 'Usuario'}
          size="sm" // FIX: Prop size correcto
          className="mb-1 shrink-0"
        />
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[70%] sm:max-w-[80%]", // FIX: Responsive design
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name for group chats */}
        {!isOwn && senderName && showAvatar && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2 truncate max-w-full">
            {senderName}
          </span>
        )}
        
        {renderMessageContent()}
        
        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 max-w-full">
            {Object.entries(groupedReactions).map(([emoji, userIds]) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(emoji, userIds)}
                className={cn(
                  "flex items-center space-x-1 px-2 py-1 h-auto rounded-full text-xs transition-colors",
                  user?.id && userIds.includes(user.id)
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}

              >
                <span>{emoji}</span>
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {userIds.length}
                </span>
              </Button>
            ))}
          </div>
        )}

        {/* Timestamp and Status */}
        <div className={cn(
          "flex items-center space-x-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isOwn ? "flex-row-reverse space-x-reverse" : ""
        )}>
          {showTimestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400 select-none">
              {formatTime(message.timestamp)}
            </span>
          )}
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
});

// FIX: Asignar displayName para debugging
ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;