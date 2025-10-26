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
  sendMessage: (chatId: string, content: string, type?: ChatMessage['type'], replyTo?: string, metadata?: Record<string, unknown>) => Promise<void>;
  createChat: (participantId: string) => Promise<string>;
  startChat: (otherUserId: string) => Promise<string>;
  selectChat: (chatId: string | null) => Promise<void>;
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

  // Configurar mensajes cuando se selecciona un chat - MEMOIZED to prevent infinite re-renders
  const setupMessages = useCallback(async () => {
    // Verificar que el usuario esté autenticado y no esté inicializando
    if (!user || initializing) {
      console.log('🔍 Usuario no autenticado o inicializando, esperando...');
      setMessages([]);
      setLoading(false);
      return;
    }

    // Si no hay chat seleccionado, limpiar mensajes pero no mostrar advertencia
    // (esto es normal durante la carga inicial)
    if (!currentChat?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    const currentChatId = currentChat?.id;
    const userId = user?.id;
    
    if (!currentChatId || !userId) {
      setMessages([]);
      setHasMoreMessages(false);
      setOtherUserTyping(false);
      lastMessageDoc.current = undefined;
      
      // Limpiar suscripciones con manejo de errores
      try {
        if (unsubscribeMessagesRef.current) {
          unsubscribeMessagesRef.current();
          unsubscribeMessagesRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up messages subscription:', error);
      }
      
      try {
        if (unsubscribeTypingRef.current) {
          unsubscribeTypingRef.current();
          unsubscribeTypingRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up typing subscription:', error);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Limpiar suscripciones anteriores con manejo de errores
      try {
        if (unsubscribeMessagesRef.current) {
          unsubscribeMessagesRef.current();
          unsubscribeMessagesRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up previous messages subscription:', error);
      }
      
      try {
        if (unsubscribeTypingRef.current) {
          unsubscribeTypingRef.current();
          unsubscribeTypingRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up previous typing subscription:', error);
      }
      
      // Suscribirse a mensajes
      unsubscribeMessagesRef.current = chatService.subscribeToMessages(
        currentChatId,
        (chatMessages) => {
          try {
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
          } catch (err) {
            console.error('Error processing messages:', err);
            setError('Error al procesar mensajes');
            setLoading(false);
          }
        },
        50, // limitCount
        {
          onError: (error: Error) => {
            console.error('Error en suscripción de mensajes:', error);
            
            // Provide more specific error messages based on error type
            let errorMessage = 'Error al cargar mensajes';
            
            try {
              if (error?.message) {
                if (error.message.includes('permission') || error.message.includes('denied')) {
                  errorMessage = 'No tienes permisos para acceder a este chat';
                } else if (error.message.includes('not-found') || error.message.includes('document')) {
                  errorMessage = 'El chat no existe o ha sido eliminado';
                } else if (error.message.includes('network') || error.message.includes('offline')) {
                  errorMessage = 'Error de conexión. Verifica tu internet';
                } else if (error.message.includes('unauthenticated') || error.message.includes('auth')) {
                  errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
                } else if (error.message.includes('quota') || error.message.includes('limit')) {
                  errorMessage = 'Límite de uso excedido. Intenta más tarde';
                } else {
                  errorMessage = `Error al cargar mensajes: ${error.message}`;
                }
              }
            } catch (parseError) {
              console.error('Error parsing error message:', parseError);
              errorMessage = 'Error desconocido al cargar mensajes';
            }
            
            setError(errorMessage);
            setLoading(false);
          }
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
  }, [currentChat?.id, user?.id, currentChat, user, initializing]); // Only depend on necessary values to prevent unnecessary re-renders

  // Limpiar suscripciones al desmontar
  useEffect(() => {
    return () => {
      // Cleanup with error handling to prevent Firestore state issues
      try {
        if (unsubscribeChatsRef.current) {
          unsubscribeChatsRef.current();
          unsubscribeChatsRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up chats subscription:', error);
      }
      
      try {
        if (unsubscribeMessagesRef.current) {
          unsubscribeMessagesRef.current();
          unsubscribeMessagesRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up messages subscription:', error);
      }
      
      try {
        if (unsubscribeTypingRef.current) {
          unsubscribeTypingRef.current();
          unsubscribeTypingRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up typing subscription:', error);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Enhanced cleanup function for listeners
  const cleanupListeners = useCallback(() => {
    try {
      if (unsubscribeChatsRef.current) {
        unsubscribeChatsRef.current();
        unsubscribeChatsRef.current = null;
      }
    } catch (error) {
      console.warn('Error cleaning up chats subscription:', error);
    }
    
    try {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    } catch (error) {
      console.warn('Error cleaning up messages subscription:', error);
    }
    
    try {
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
        unsubscribeTypingRef.current = null;
      }
    } catch (error) {
      console.warn('Error cleaning up typing subscription:', error);
    }
  }, []);

  // Configurar chats cuando el usuario esté disponible y autenticado
  useEffect(() => {
    // No ejecutar si no hay usuario autenticado o si aún está inicializando
    if (!user?.id || initializing) {
      // Clean up any existing listeners when user is not available
      cleanupListeners();
      return;
    }

    // Clean up existing listeners before setting up new ones
    cleanupListeners();

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
      
      // Provide more specific error messages
      let errorMessage = 'Error al cargar chats';
      
      try {
        if (error?.message) {
          if (error.message.includes('permission') || error.message.includes('denied')) {
            errorMessage = 'No tienes permisos para acceder a los chats';
          } else if (error.message.includes('network') || error.message.includes('offline')) {
            errorMessage = 'Error de conexión. Verifica tu internet';
          } else if (error.message.includes('unauthenticated') || error.message.includes('auth')) {
            errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
          } else if (error.message.includes('quota') || error.message.includes('limit')) {
            errorMessage = 'Límite de uso excedido. Intenta más tarde';
          } else {
            errorMessage = `Error al cargar chats: ${error.message}`;
          }
        }
      } catch (parseError) {
        console.error('Error parsing chat error message:', parseError);
        errorMessage = 'Error desconocido al cargar chats';
      }
      
      setError(errorMessage);
      setLoading(false);
    };

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = chatService.subscribeToUserChatsPopulated(
        user.id,
        (chats) => {
          try {
            setChats(chats || []); // Ensure chats is always an array
            setLoading(false);
            setError(null); // Clear any previous errors on successful data
            
            // Handle pending chat selection
            if (pendingChatIdRef.current) {
              const pendingChat = chats?.find(c => c.id === pendingChatIdRef.current);
              if (pendingChat) {
                setCurrentChat(pendingChat);
                pendingChatIdRef.current = null;
              }
            }
          } catch (err) {
            console.error('Error processing chats data:', err);
            setError('Error al procesar datos de chats');
            setLoading(false);
          }
        },
        handleError // Pass error handler to the service
      );
    } catch (subscriptionError) {
      console.error('Error setting up chat subscription:', subscriptionError);
      handleError(subscriptionError instanceof Error ? subscriptionError : new Error('Error desconocido'));
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from chats:', err);
        }
      }
    };
  }, [user?.id, initializing]);

  // Cargar mensajes del chat actual
  useEffect(() => {
    setupMessages();
  }, [currentChat?.id, user?.id, initializing]); // Dependencias específicas en lugar de setupMessages

  // Handle pending chat selection after initialization
  useEffect(() => {
    if (!initializing && user?.id && pendingChatIdRef.current) {
      console.log('🔄 Initialization complete, processing pending chat:', pendingChatIdRef.current);
      const pendingChatId = pendingChatIdRef.current;
      pendingChatIdRef.current = null;
      selectChat(pendingChatId);
    }
  }, [initializing, user?.id]);

  // Enviar mensaje
  const sendMessage = useCallback(async (
    chatId: string, 
    content: string, 
    type: ChatMessage['type'] = 'text',
    replyTo?: string,
    metadata?: Record<string, unknown>
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
  const selectChat = useCallback(async (chatId: string | null) => {
    try {
      console.log('🔄 selectChat called with:', { chatId, currentChatId: currentChat?.id });
      
      if (chatId === null) {
        setCurrentChat(null);
        setError(null);
        pendingChatIdRef.current = null;
        return;
      }

      // If it's the same chat, don't reload
      if (currentChat?.id === chatId) {
        console.log('📌 Same chat selected, skipping reload');
        return;
      }

      setError(null);

      // If still initializing, store the chatId to select later
      if (initializing) {
        console.log('🔄 Still initializing, storing chatId for later:', chatId);
        pendingChatIdRef.current = chatId;
        return;
      }

      // Validate user is authenticated
      if (!user?.id) {
        console.error('❌ User not authenticated');
        setError('Usuario no autenticado');
        return;
      }

      const chat = chats.find(c => c.id === chatId);
      console.log('🔍 Looking for chat:', { chatId, foundChat: !!chat, totalChats: chats.length });
      
      if (chat) {
        console.log('✅ Chat found, setting as current:', chat.id);
        setCurrentChat(chat);
        pendingChatIdRef.current = null;
      } else {
        console.log('❌ Chat not found in loaded chats, attempting to create/get it');
        // If chat not found in loaded chats, try to create/get it
        if (chatId.startsWith('direct_')) {
          // Extract userIds from chatId format: direct_userId1_userId2
          const parts = chatId.split('_');
          if (parts.length === 3) {
            const [, userId1, userId2] = parts;
            
            // Validate that current user is one of the participants
            if (userId1 !== user.id && userId2 !== user.id) {
              console.error('❌ User not authorized for this chat:', { chatId, userId: user.id });
              setError('No tienes permisos para acceder a este chat');
              return;
            }
            
            const otherUserId = userId1 === user.id ? userId2 : userId1;
            
            console.log('🔧 Creating chat between users:', { userId1, userId2, currentUser: user.id, otherUser: otherUserId });
            
            // Set loading state during chat creation
            setLoading(true);
            
            try {
              // Ensure the chat document exists
              const createdChatId = await chatService.getOrCreateChat(user.id, otherUserId);
              console.log('✅ Chat created/verified successfully:', { requestedChatId: chatId, createdChatId });
              
              // Verify the created chat ID matches the requested one
              if (createdChatId !== chatId) {
                console.warn('⚠️ Created chat ID differs from requested:', { requested: chatId, created: createdChatId });
              }
              
              // Store the chatId to select once chats are loaded
              pendingChatIdRef.current = chatId;
              
              // Loading will be set to false when the chat subscription updates
            } catch (createError) {
              console.error('❌ Error creating/getting chat:', {
                error: createError,
                chatId,
                userId1,
                userId2,
                currentUser: user.id
              });
              
              // Provide more specific error messages
              if (createError instanceof Error) {
                if (createError.message.includes('permission')) {
                  setError('No tienes permisos para crear este chat');
                } else if (createError.message.includes('network')) {
                  setError('Error de conexión. Verifica tu internet');
                } else {
                  setError(`Error al crear el chat: ${createError.message}`);
                }
              } else {
                setError('Error desconocido al crear el chat');
              }
              setLoading(false);
            }
          } else {
            console.error('❌ Invalid direct chat ID format:', chatId);
            setError('Formato de chat inválido');
            setLoading(false);
          }
        } else {
          // Store the chatId to select once chats are loaded
          pendingChatIdRef.current = chatId;
        }
      }
    } catch (error) {
      console.error('❌ Error in selectChat:', {
        error,
        chatId,
        userId: user?.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      setError(error instanceof Error ? `Error al seleccionar el chat: ${error.message}` : 'Error desconocido al seleccionar el chat');
      setLoading(false);
    }
  }, [chats, user?.id, currentChat?.id]);

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

        typingTimeoutRef.current = setTimeout(async () => {
          try {
            setIsTyping(false);
            if (currentChat?.id && user?.id) {
              await chatService.setTyping(currentChat.id, user.id, false);
            }
          } catch (err) {
            console.error('Error auto-stopping typing status:', err);
          }
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
      return total + (chat.unreadCount?.[user.id] || 0);
    }, 0);
  }, [chats, user?.id]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Start chat - more robust version of createChat
  const startChat = useCallback(async (otherUserId: string): Promise<string> => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    if (!otherUserId) throw new Error('ID de usuario requerido');
    if (otherUserId === user.id) throw new Error('No puedes iniciar un chat contigo mismo');

    try {
      setError(null);
      const chatId = await chatService.getOrCreateChat(user.id, otherUserId);
      
      // Wait a moment for the chat to be created and appear in the subscription
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to find the chat in the current chats list
      const existingChat = chats.find(c => c.id === chatId);
      if (existingChat) {
        setCurrentChat(existingChat);
      } else {
        // Store for when chats are loaded
        pendingChatIdRef.current = chatId;
      }
      
      return chatId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar chat';
      setError(errorMessage);
      console.error('Error starting chat:', err);
      throw err;
    }
  }, [user?.id, chats]);

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
    startChat,
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
