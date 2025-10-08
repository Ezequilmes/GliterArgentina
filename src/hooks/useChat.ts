import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, type ChatMessage, type Chat } from '@/services/chatService';
import { PopulatedChat, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentSnapshot } from 'firebase/firestore';
import { analyticsService } from '@/services/analyticsService';

export interface UseChatReturn {
  chats: PopulatedChat[];
  currentChat: PopulatedChat | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  
  // Typing status
  isTyping: boolean;
  otherUserTyping: boolean;
  
  // Actions
  sendMessage: (chatId: string, content: string, type?: ChatMessage['type'], replyTo?: string, metadata?: any) => Promise<void>;
  createChat: (participantId: string) => Promise<string>;
  selectChat: (chatId: string | null) => void;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string) => Promise<void>;
  setTyping: (typing: boolean) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  getTotalUnreadCount: () => number;
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const { user, initializing } = useAuth();
  const [chats, setChats] = useState<PopulatedChat[]>([]);
  const [currentChat, setCurrentChat] = useState<PopulatedChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const lastMessageDoc = useRef<DocumentSnapshot | undefined>(undefined);
  const unsubscribeChatsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeTypingRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to store a chatId requested before chats are loaded
  const pendingChatIdRef = useRef<string | null>(null);

  // Limpiar suscripciones al desmontar
  useEffect(() => {
    return () => {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
      }
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Configurar chats cuando el usuario esté disponible y autenticado
  useEffect(() => {
    // No ejecutar si no hay usuario autenticado o si aún está inicializando
    if (!user?.id || initializing) {
      return;
    }

    setLoading(true);
    setError(null);

    const handleError = (error: Error) => {
      console.error('🚨 Chat subscription error in useChat:', {
        error: error,
        message: error.message,
        code: (error as any).code,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      setError(`Chat subscription error: ${error.message}`);
      setLoading(false);
    };

    const unsubscribe = chatService.subscribeToUserChatsPopulated(
      user.id,
      (chats) => {
        setChats(chats);
        setLoading(false);
        setError(null); // Clear any previous errors on successful data
        
        // Handle pending chat selection
        if (pendingChatIdRef.current) {
          const pendingChat = chats.find(c => c.id === pendingChatIdRef.current);
          if (pendingChat) {
            setCurrentChat(pendingChat);
            pendingChatIdRef.current = null;
          }
        }
      },
      handleError // Pass error handler to the service
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, initializing]);

  // Cargar mensajes del chat actual
  useEffect(() => {
    const currentChatId = currentChat?.id;
    const userId = user?.id;
    
    if (!currentChatId || !userId) {
      setMessages([]);
      setHasMoreMessages(false);
      setOtherUserTyping(false);
      lastMessageDoc.current = undefined;
      
      // Limpiar suscripciones
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
        unsubscribeTypingRef.current = null;
      }
      return;
    }

    const setupMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Limpiar suscripciones anteriores
        if (unsubscribeMessagesRef.current) {
          unsubscribeMessagesRef.current();
        }
        if (unsubscribeTypingRef.current) {
          unsubscribeTypingRef.current();
        }
        
        // Suscribirse a mensajes
        unsubscribeMessagesRef.current = chatService.subscribeToMessages(
          currentChatId,
          (chatMessages) => {
            setMessages(chatMessages);
            setLoading(false);
            setError(null); // Limpiar errores previos al recibir datos exitosos
            
            // Marcar como leído automáticamente
            const unreadMessages = chatMessages.filter(
              msg => !msg.read && msg.receiverId === userId
            );
            if (unreadMessages.length > 0) {
              chatService.markMessagesAsRead(currentChatId, userId).catch(err => {
                console.error('Error marking messages as read:', err);
              });
            }
          },
          (error) => {
            console.error('Error en suscripción de mensajes:', error);
            setError(`Error al cargar mensajes: ${error.message}`);
            setLoading(false);
          }
        );
        
        // Suscribirse al estado de escritura
        const currentChatData = currentChat;
        if (currentChatData) {
          const otherUser = currentChatData.participants.find((participant: User) => participant.id !== userId);
          const otherUserId = otherUser?.id;
          if (otherUserId) {
            unsubscribeTypingRef.current = chatService.subscribeToTyping(
              currentChatId,
              (typingUserId, isTyping) => {
                // Solo mostrar el estado de escritura si es del otro usuario
                if (typingUserId === otherUserId) {
                  setOtherUserTyping(isTyping);
                }
              }
            );
          }
        }
      } catch (err) {
        console.error('Error setting up messages:', err);
        setError('Error al cargar los mensajes');
        setLoading(false);
      }
    };

    setupMessages();
  }, [currentChat?.id, user?.id]);

  // Enviar mensaje
  const sendMessage = useCallback(async (
    chatId: string, 
    content: string, 
    type: ChatMessage['type'] = 'text',
    replyTo?: string,
    metadata?: any
  ) => {
    if (!chatId || !user?.id || !content.trim()) return;
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      setError('Chat no encontrado');
      return;
    }
    
    const otherUser = chat.participants.find((participant: User) => participant.id !== user.id);
    const otherUserId = otherUser?.id;
    if (!otherUserId) {
      setError('Usuario destinatario no encontrado');
      return;
    }

    // Sanitize metadata to avoid undefined values causing Firestore errors
    const cleanMetadata = metadata && typeof metadata === 'object'
      ? Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined))
      : undefined;

    try {
      await chatService.sendMessage(chatId, user.id, otherUserId, content.trim(), type, replyTo, cleanMetadata);
      
      // Track message sent event
      try {
        analyticsService.trackMessageSent(type, content.length);
      } catch (analyticsError) {
        console.error('Error tracking message sent:', analyticsError);
      }
      
      // Detener indicador de escritura
      if (isTyping) {
        await setTyping(false);
      }
      
      // Limpiar error si el envío fue exitoso
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setError(errorMessage);
      console.error('Error sending message:', err);
      throw err; // Re-lanzar para que el componente pueda manejarlo
    }
  }, [user?.id, chats, isTyping]);

  // Crear chat
  const createChat = useCallback(async (participantId: string): Promise<string> => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      const chatId = await chatService.getOrCreateChat(user.id, participantId);
      setError(null); // Limpiar error si fue exitoso
      return chatId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear chat';
      setError(errorMessage);
      console.error('Error creating chat:', err);
      throw err;
    }
  }, [user?.id]);

  // Seleccionar chat
  const selectChat = useCallback((chatId: string | null) => {
    if (chatId === null) {
      setCurrentChat(null);
      setError(null);
      pendingChatIdRef.current = null;
      return;
    }

    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      setError(null);
      pendingChatIdRef.current = null;
    } else {
      // Store the chatId to select once chats are loaded
      pendingChatIdRef.current = chatId;
    }
  }, [chats]);

  // Cargar más mensajes
  const loadMoreMessages = useCallback(async () => {
    if (!currentChat?.id || loading || !hasMoreMessages) return;

    try {
      setLoading(true);
      const { messages: olderMessages, lastDoc } = await chatService.getMessages(
        currentChat.id, 
        20, 
        lastMessageDoc.current
      );

      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...olderMessages, ...prev]);
        lastMessageDoc.current = lastDoc;
      }
    } catch (err) {
      setError('Error al cargar más mensajes');
      console.error('Error loading more messages:', err);
    } finally {
      setLoading(false);
    }
  }, [currentChat?.id, loading, hasMoreMessages]);

  // Marcar como leído
  const markAsRead = useCallback(async (chatId: string) => {
    if (!user?.id) return;

    try {
      await chatService.markMessagesAsRead(chatId, user.id);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user?.id]);

  // Editar mensaje
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await chatService.editMessage(currentChat?.id ?? '', messageId, newContent);
      setError(null); // Limpiar error si fue exitoso
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al editar mensaje';
      setError(errorMessage);
      console.error('Error editing message:', err);
      throw err;
    }
  }, []);

  // Agregar reacción
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      await chatService.addReaction(currentChat?.id ?? '', messageId, user.id, emoji);
      setError(null); // Limpiar error si fue exitoso
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar reacción';
      setError(errorMessage);
      console.error('Error adding reaction:', err);
      throw err;
    }
  }, [user?.id]);

  // Remover reacción
  const removeReaction = useCallback(async (messageId: string) => {
    if (!user?.id) return;

    try {
      await chatService.removeReaction(currentChat?.id ?? '', messageId, user.id);
      setError(null); // Limpiar error si fue exitoso
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al remover reacción';
      setError(errorMessage);
      console.error('Error removing reaction:', err);
      throw err;
    }
  }, [user?.id]);

  // Reintentar envío de mensaje
  const retryMessage = useCallback(async (messageId: string) => {
    if (!user?.id) return;

    try {
      // Actualizar estado a "reintentando"
      await chatService.updateMessageStatus(currentChat?.id ?? '', messageId, 'retrying');
      
      // Buscar el mensaje original
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Mensaje no encontrado');
      }

      // Intentar reenviar el mensaje
      await chatService.updateMessageStatus(currentChat?.id ?? '', messageId, 'sending');
      
      // Simular reenvío (aquí podrías implementar la lógica específica de reenvío)
      // Por ahora, simplemente marcamos como enviado
      await chatService.updateMessageStatus(currentChat?.id ?? '', messageId, 'sent');
      
      setError(null); // Limpiar error si fue exitoso
    } catch (err) {
      // Marcar como fallido si el reintento falla
      await chatService.updateMessageStatus(currentChat?.id ?? '', messageId, 'failed');
      
      const errorMessage = err instanceof Error ? err.message : 'Error al reintentar mensaje';
      setError(errorMessage);
      console.error('Error retrying message:', err);
      throw err;
    }
  }, [user?.id, messages]);

  // Configurar estado de escritura
  const setTyping = useCallback(async (typing: boolean) => {
    if (!currentChat?.id || !user?.id) return;

    try {
      setIsTyping(typing);
      await chatService.setTyping(currentChat.id, user.id, typing);

      // Auto-detener después de 3 segundos
      if (typing) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      } else {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error setting typing status:', err);
    }
  }, [currentChat?.id, user?.id]);

  // Try to resolve any pending chat selection when chats list updates
  useEffect(() => {
    if (pendingChatIdRef.current) {
      const chat = chats.find(c => c.id === pendingChatIdRef.current);
      if (chat) {
        setCurrentChat(chat);
        setError(null);
        pendingChatIdRef.current = null;
      }
    }
  }, [chats]);

  // Obtener total de mensajes no leídos
  const getTotalUnreadCount = useCallback(() => {
    if (!user?.id) return 0;

    return chats.reduce((total, chat) => {
      return total + (chat.unreadCount[user.id] || 0);
    }, 0);
  }, [chats, user?.id]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    chats,
    currentChat,
    messages,
    loading,
    error,
    hasMoreMessages,
    isTyping,
    otherUserTyping,
    sendMessage,
    createChat,
    selectChat,
    loadMoreMessages,
    markAsRead,
    editMessage,
    addReaction,
    removeReaction,
    setTyping,
    retryMessage,
    getTotalUnreadCount,
    clearError
  };
}