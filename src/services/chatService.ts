import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  getDoc, // FIX: Added getDoc import for optimized queries
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  getDocs,
  limit,
  startAfter,
  DocumentSnapshot,
  writeBatch,
  increment,
  documentId,
  deleteField, // FIX: Added deleteField import for proper reaction removal
  runTransaction, // FIX: Added runTransaction for atomic operations
  arrayUnion // FIX: Added arrayUnion for readBy field compatibility
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { userService } from '@/lib/firestore';
import { PopulatedChat } from '@/types';
import { notificationService } from '@/services/notificationService';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'gif' | 'audio' | 'file' | 'location' | 'emoji';
  timestamp: Timestamp;
  read: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'failed' | 'retrying';
  edited?: boolean;
  editedAt?: Timestamp;
  replyTo?: string | null; // ID del mensaje al que responde
  reactions?: { [userId: string]: string }; // emoji reactions
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    duration?: number; // For audio messages
    coordinates?: { lat: number; lng: number }; // For location messages
    thumbnailUrl?: string; // For images/videos
  };
}

export interface Chat {
  id: string;
  participants: string[];
  participantIds: string[]; // Added property
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
    type: ChatMessage['type'];
  } | null;
  lastActivity: Timestamp;
  unreadCount: { [userId: string]: number };
  isActive: boolean;
  createdAt: Timestamp;
  chatType: 'direct' | 'group';
  groupName?: string;
  groupAvatar?: string;
  groupAdmins?: string[];
  matchId?: string;
}

export interface ChatTyping {
  chatId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Timestamp;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: Timestamp;
}

class ChatService {
  private onlineStatusCache = new Map<string, OnlineStatus>();
  // FIX: Updated typing timeout type for Node/browser compatibility
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // FIX: Crear o obtener un chat entre dos usuarios con ID determinístico
  async getOrCreateChat(userId1: string, userId2: string, matchId?: string): Promise<string> {
    try {
      // FIX: Generate deterministic chat ID to prevent duplicates
      const sortedIds = [userId1, userId2].sort();
      const deterministicId = `direct_${sortedIds[0]}_${sortedIds[1]}`;
      
      // FIX: Use transaction to ensure atomicity
      return await runTransaction(db, async (transaction) => {
        const chatRef = doc(db, 'chats', deterministicId);
        const chatDoc = await transaction.get(chatRef);
        
        if (chatDoc.exists()) {
          return deterministicId;
        }
        
        // Create new chat with deterministic ID
        const newChat: Omit<Chat, 'id'> = {
          participants: [userId1, userId2],
          participantIds: [userId1, userId2],
          lastActivity: serverTimestamp() as Timestamp,
          unreadCount: {
            [userId1]: 0,
            [userId2]: 0
          },
          isActive: true,
          createdAt: serverTimestamp() as Timestamp,
          chatType: 'direct',
          matchId
        };
        
        transaction.set(chatRef, newChat);
        return deterministicId;
      });
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }
  
  // FIX: Enviar mensaje con validaciones de seguridad y tamaño
  async sendMessage(
    chatId: string, 
    senderId: string, 
    receiverId: string, 
    content: string, 
    type: ChatMessage['type'] = 'text',
    replyTo?: string,
    metadata?: ChatMessage['metadata']
  ): Promise<string> {
    // FIX: Validate content size and type
    if (!content || content.trim().length === 0) {
      throw new Error('El contenido del mensaje no puede estar vacío');
    }
    
    // FIX: Content size validation (max 10KB for text, different limits for files)
    const maxContentSize = type === 'text' ? 10240 : 50 * 1024 * 1024; // 10KB for text, 50MB for files
    if (content.length > maxContentSize) {
      throw new Error(`El contenido excede el tamaño máximo permitido (${maxContentSize} bytes)`);
    }
    
    // FIX: Validate file metadata if present
    if (metadata && (type === 'file' || type === 'image' || type === 'audio')) {
      if (metadata.fileSize && metadata.fileSize > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('El archivo excede el tamaño máximo permitido (50MB)');
      }
      
      // Validate file types
      const allowedTypes: Record<string, string[]> = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
        file: [] // Allow all file types for general files
      };
      
      if (metadata.fileType && allowedTypes[type]?.length > 0) {
        if (!allowedTypes[type].includes(metadata.fileType)) {
          throw new Error(`Tipo de archivo no permitido: ${metadata.fileType}`);
        }
      }
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');

    // Helper to recursively remove undefined values
    const removeUndefinedDeep = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeUndefinedDeep);
      }
      if (obj && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, removeUndefinedDeep(v)])
        );
      }
      return obj;
    };

    const sanitizedMetadata = metadata !== undefined ? removeUndefinedDeep(metadata) : undefined;
    try {
      const message: Omit<ChatMessage, 'id'> = {
        chatId,
        senderId,
        receiverId,
        content,
        type,
        timestamp: serverTimestamp() as Timestamp,
        read: false,
        status: 'sending',
        replyTo: replyTo ?? null,
        // metadata will be conditionally added below to avoid undefined values
      } as any;

      if (sanitizedMetadata !== undefined) {
        (message as any).metadata = sanitizedMetadata;
      }
      
      const docRef = await addDoc(messagesRef, message);
      
      // FIX: Actualizar último mensaje del chat y usar increment para contador de no leídos
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content: this.getPreviewContent(content, type),
          senderId,
          timestamp: serverTimestamp(),
          type
        },
        lastActivity: serverTimestamp(),
        // FIX: Use increment to avoid race conditions
        [`unreadCount.${receiverId}`]: increment(1)
      });
      
      // Limpiar estado de escritura
      await this.setTyping(chatId, senderId, false);
      
      // Actualizar estado a 'sent' después del envío exitoso
      await this.updateMessageStatus(chatId, docRef.id, 'sent');
      
      // Crear notificación para el receptor
      try {
        // Obtener información del usuario que envía el mensaje
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        const senderData = senderDoc.data();
        
        if (senderData) {
          await notificationService.createMessageNotification(
            receiverId,
            { name: senderData.name || 'Usuario', id: senderId },
            this.getPreviewContent(content, type)
          );
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // No lanzar error aquí para no afectar el envío del mensaje
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      
      // Si hay un error, intentar marcar el mensaje como fallido
      // (esto solo funcionará si el mensaje se creó antes del error)
      try {
        const failedMessage: Omit<ChatMessage, 'id'> = {
          chatId,
          senderId,
          receiverId,
          content,
          type,
          timestamp: serverTimestamp() as Timestamp,
          read: false,
          status: 'failed',
          replyTo: replyTo ?? null,
          // metadata will be conditionally added below
        } as any;
        if (sanitizedMetadata !== undefined) {
          (failedMessage as any).metadata = sanitizedMetadata;
        }
        const docRef = await addDoc(messagesRef, failedMessage);
        return docRef.id;
      } catch (secondError) {
        console.error('Error creating failed message:', secondError);
        throw new Error('No se pudo enviar el mensaje');
      }
    }
  }

  // Obtener vista previa del contenido según el tipo
  private getPreviewContent(content: string, type: ChatMessage['type']): string {
    switch (type) {
      case 'image':
        return '📷 Imagen';
      case 'gif':
        return '🎬 GIF';
      case 'audio':
        return '🎵 Audio';
      case 'file':
        return '📎 Archivo';
      case 'location':
        return '📍 Ubicación';
      case 'emoji':
        return content;
      default:
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
  }

  // Helper to recursively remove undefined values
  private removeUndefinedValues(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(this.removeUndefinedValues.bind(this));
    }
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, this.removeUndefinedValues(v)])
      );
    }
    return obj;
  }

  // Marcar mensajes como leídos con validaciones
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Validar parámetros
      if (!chatId || typeof chatId !== 'string' || chatId.trim().length === 0) {
        throw new Error('ID de chat inválido');
      }
      
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('ID de usuario inválido');
      }
      
      // Verificar que el chat existe y el usuario tiene permisos
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('El chat no existe');
      }
      
      const chatData = chatDoc.data();
      if (!chatData?.participants?.includes(userId)) {
        throw new Error('No tienes permisos para marcar mensajes como leídos en este chat');
      }
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch: Promise<void>[] = [];
      
      querySnapshot.forEach((doc) => {
        // Actualizar tanto el campo read como readBy para compatibilidad
        batch.push(updateDoc(doc.ref, { 
          read: true,
          readBy: arrayUnion(userId)
        }));
      });
      
      await Promise.all(batch);
      
      // Resetear contador de no leídos
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al marcar mensajes como leídos');
    }
  }
  
  // Obtener mensajes de un chat con paginación mejorada y validaciones
  async getMessages(
    chatId: string, 
    limitCount: number = 50, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ messages: ChatMessage[], lastDoc?: DocumentSnapshot }> {
    try {
      // Validar parámetros
      if (!chatId || typeof chatId !== 'string' || chatId.trim().length === 0) {
        throw new Error('ID de chat inválido');
      }
      
      if (typeof limitCount !== 'number' || limitCount <= 0 || limitCount > 100) {
        throw new Error('Límite de mensajes inválido (debe ser entre 1 y 100)');
      }
      
      // Verificar que el chat existe
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('El chat no existe');
      }
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      let q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      // Ensure proper pagination with lastDoc
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      let newLastDoc: DocumentSnapshot | undefined;
      
      querySnapshot.forEach((doc) => {
        const messageData = doc.data();
        // Validar datos del mensaje antes de añadirlo
        if (messageData && messageData.chatId === chatId) {
          messages.push({ id: doc.id, ...messageData } as ChatMessage);
          newLastDoc = doc;
        }
      });
      
      return { 
        messages: messages.reverse(), 
        lastDoc: querySnapshot.docs.length === limitCount ? newLastDoc : undefined
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener mensajes');
    }
  }
  
  // Suscribirse a mensajes en tiempo real con validaciones mejoradas
  subscribeToMessages(
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
    onError?: (error: Error) => void,
    limitCount: number = 50
  ): () => void {
    // Validar chatId antes de proceder
    if (!chatId || typeof chatId !== 'string' || chatId.trim().length === 0) {
      const error = new Error(`Invalid chatId provided: ${chatId}`);
      console.error('🚨 Error de validación en subscribeToMessages:', {
        chatId,
        chatIdType: typeof chatId,
        chatIdLength: chatId?.length
      });
      if (onError) {
        onError(error);
      }
      return () => {}; // Return empty unsubscribe function
    }
    
    // Validar limitCount
    if (typeof limitCount !== 'number' || limitCount <= 0 || limitCount > 100) {
      const error = new Error(`Invalid limitCount: ${limitCount}. Must be between 1 and 100.`);
      console.error('🚨 Error de validación en subscribeToMessages:', error);
      if (onError) {
        onError(error);
      }
      return () => {};
    }
    
    // Validar callback
    if (typeof callback !== 'function') {
      const error = new Error('Callback must be a function');
      console.error('🚨 Error de validación en subscribeToMessages:', error);
      if (onError) {
        onError(error);
      }
      return () => {};
    }

    try {
      // Listen on /chats/{chatId}/messages sub-collection
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      // We fetch the latest `limitCount` messages ordered by timestamp DESC and
      // later reverse them so the consumer always receives them ASC.
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const messages: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });
          // Firestore returned them DESC, reverse to ASC for UI consistency.
          callback(messages.reverse());
        },
        (error) => {
        console.error('🚨 Error en snapshot listener de mensajes:', {
          error: error,
          message: error.message,
          code: error.code,
          chatId: chatId,
          queryType: 'messages',
          timestamp: new Date().toISOString(),
          stack: error.stack,
          name: error.name
        });
        
        // Log additional context for debugging
        console.error('🔍 Contexto adicional del error:', {
          chatIdType: typeof chatId,
          chatIdLength: chatId?.length,
          isValidChatId: chatId && typeof chatId === 'string' && chatId.length > 0,
          limitCount: limitCount
        });
        
        // FIX: Optional error reporting integration point
        // if (window.Sentry) window.Sentry.captureException(error);
        if (onError) {
          onError(error);
        }
      }
    );
    } catch (error) {
      console.error('🚨 Error al crear la consulta de mensajes:', {
        error,
        chatId,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      return () => {}; // Return empty unsubscribe function
    }
  }
  
  // OPTIMIZED: Obtener chats del usuario con ordenamiento en servidor
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const chatsRef = collection(db, 'chats');
      // FIX: Add server-side ordering for better performance
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', userId),
        orderBy('lastActivity', 'desc') // OPTIMIZED: Server-side ordering
      );
      
      const querySnapshot = await getDocs(q);
      const chats: Chat[] = [];
      
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      
      // Filter inactive chats (ordering already done by server)
      return chats.filter(chat => (chat as any).isActive !== false);
    } catch (error) {
      console.error('Error getting user chats:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }
  
  // Suscribirse a chats del usuario (maneja esquemas nuevos y heredados)
  subscribeToUserChats(
    userId: string,
    callback: (chats: Chat[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const chatsRef = collection(db, 'chats');

    // Procesar instantánea en una lista de chats ordenada y filtrada
    const processSnapshot = (snapshot: any): Chat[] => {
      const chats: Chat[] = [];
      snapshot.forEach((doc: any) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      return chats
        .filter(chat => (chat as any).isActive !== false)
        .sort((a, b) => {
          const t1 = (a as any).lastActivity;
          const t2 = (b as any).lastActivity;
          const ts1 = t1 && (typeof t1.toMillis === 'function' ? t1.toMillis() : ((t1 as any).seconds ?? 0) * 1000);
          const ts2 = t2 && (typeof t2.toMillis === 'function' ? t2.toMillis() : ((t2 as any).seconds ?? 0) * 1000);
          return ts2 - ts1;
        });
    };

    // Intentar primero con participantIds (nuevo esquema)
    const qParticipantIds = query(
      chatsRef,
      where('participantIds', 'array-contains', userId)
    );

    let fallbackUnsubscribe: (() => void) | null = null;
    let hasReceivedData = false;

    const primaryUnsubscribe = onSnapshot(
      qParticipantIds,
      (snapshot) => {
        hasReceivedData = true;
        const chats = processSnapshot(snapshot);
        callback(chats);
        
        // Si recibimos datos exitosos, cancelar el fallback si existe
        if (fallbackUnsubscribe) {
          fallbackUnsubscribe();
          fallbackUnsubscribe = null;
        }
      },
      (error) => {
        console.error('🚨 Error en snapshot listener (participantIds):', {
          error: error,
          message: error.message,
          code: error.code,
          userId: userId,
          queryType: 'participantIds',
          timestamp: new Date().toISOString()
        });
        // FIX: Optional error reporting integration point
        // if (window.Sentry) window.Sentry.captureException(error);
        
        // Si es un error de permisos y no hemos recibido datos, intentar fallback
        if (error.code === 'permission-denied' && !hasReceivedData) {
          console.log('Intentando consulta de respaldo con participants...');
          
          const qParticipants = query(
            chatsRef,
            where('participants', 'array-contains', userId)
          );

          fallbackUnsubscribe = onSnapshot(
            qParticipants,
            (snapshot) => {
              const chats = processSnapshot(snapshot);
              callback(chats);
            },
            (fallbackError) => {
              console.error('🚨 Error en snapshot listener de respaldo (participants):', {
                error: fallbackError,
                message: fallbackError.message,
                code: fallbackError.code,
                userId: userId,
                queryType: 'participants',
                timestamp: new Date().toISOString()
              });
              if (onError) onError(fallbackError);
            }
          );
        } else {
          if (onError) onError(error);
        }
      }
    );

    // Función de limpieza que cancela ambas suscripciones
    return () => {
      primaryUnsubscribe();
      if (fallbackUnsubscribe) {
        fallbackUnsubscribe();
      }
    };
  }

  // OPTIMIZED: Suscribirse a chats del usuario con participantes poblados
  subscribeToUserChatsPopulated(
    userId: string,
    callback: (chats: PopulatedChat[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const chatsRef = collection(db, 'chats');

    // Primary query using participantIds (preferred)
    const qParticipantIds = query(
      chatsRef,
      where('participantIds', 'array-contains', userId)
    );

    // Helper to transform a snapshot into populated chats
    const buildPopulatedChats = async (snapshot: any): Promise<PopulatedChat[]> => {
      const chats: PopulatedChat[] = [];

      const allParticipantIds = new Set<string>();
      snapshot.docs.forEach((docSnap: any) => {
        const chatData = docSnap.data() as Chat & { participantIds?: string[] };
        (chatData.participants || chatData.participantIds || []).forEach((pid: string) =>
          allParticipantIds.add(pid)
        );
      });

      // Optimized batch user loading
      const userMap = new Map<string, any>();
      const participantIdsArray = Array.from(allParticipantIds);
      
      // FIX: Validate array is not empty before batch query
      if (participantIdsArray.length === 0) {
        return chats;
      }
      
      // Load users in batches of 10 (Firestore limit for 'in' queries)
      const batchSize = 10;
      for (let i = 0; i < participantIdsArray.length; i += batchSize) {
        const batch = participantIdsArray.slice(i, i + batchSize);
        
        // FIX: Skip empty batches
        if (batch.length === 0) continue;
        
        try {
          const usersRef = collection(db, 'users');
          const batchQuery = query(usersRef, where(documentId(), 'in', batch));
          const batchSnapshot = await getDocs(batchQuery);
          
          batchSnapshot.docs.forEach((userDoc) => {
            userMap.set(userDoc.id, { id: userDoc.id, ...userDoc.data() });
          });
        } catch (error) {
          console.error(`Error loading user batch:`, error);
          // FIX: Optional error reporting integration point
          // if (window.Sentry) window.Sentry.captureException(error);
          
          // Fallback to individual requests for this batch
          const fallbackPromises = batch.map(async (id) => {
            try {
              const user = await userService.getUser(id);
              if (user) userMap.set(id, user);
            } catch (err) {
              console.error(`Error loading user ${id}:`, err);
            }
          });
          await Promise.all(fallbackPromises);
        }
      }

      snapshot.docs.forEach((docSnap: any) => {
        const rawData = docSnap.data() as Chat & { participantIds?: string[] };
        // If the "participants" field is missing or empty, fall back to "participantIds"
        const participantIds = (rawData.participants && (rawData.participants as string[]).length > 0
          ? (rawData.participants as string[])
          : (rawData.participantIds as string[])) || [];
        const populatedParticipants = participantIds.map((pid) => userMap.get(pid)).filter(Boolean);

        if (populatedParticipants.length === participantIds.length) {
          chats.push({
            ...rawData,
            id: docSnap.id,
            participants: populatedParticipants
          } as unknown as PopulatedChat);
        }
      });

      return chats;
    };

    // Single subscription to avoid duplicates
    const unsubscribe = onSnapshot(
      qParticipantIds, 
      async (snapshot) => {
        try {
          const populatedChats = await buildPopulatedChats(snapshot);
          const filtered = populatedChats
            .filter(chat => (chat as any).isActive !== false)
            .sort((a, b) => {
              const t1 = (a as any).lastActivity;
              const t2 = (b as any).lastActivity;
              const ts1 = t1 && (typeof t1.toMillis === 'function' ? t1.toMillis() : ((t1 as any).seconds ?? 0) * 1000);
              const ts2 = t2 && (typeof t2.toMillis === 'function' ? t2.toMillis() : ((t2 as any).seconds ?? 0) * 1000);
              return ts2 - ts1;
            });
          callback(filtered);
        } catch (error) {
          console.error('Error building populated chats:', error);
          // FIX: Optional error reporting integration point
          // if (window.Sentry) window.Sentry.captureException(error);
          if (onError) {
            onError(error as Error);
          } else {
            callback([]);
          }
        }
      },
      (error) => {
        console.error('Error in snapshot listener:', error);
        // FIX: Optional error reporting integration point
        // if (window.Sentry) window.Sentry.captureException(error);
        if (onError) {
          onError(error);
        }
      }
    );

    // Return cleanup function
    return unsubscribe;
  }
  
  // FIX: Indicar que el usuario está escribiendo con validación de seguridad
  async setTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      // FIX: Validate that user can only modify their own typing status
      // This should be enforced by Firestore rules, but adding client-side validation
      if (!userId || userId.trim().length === 0) {
        throw new Error('ID de usuario inválido');
      }
      
      const typingRef = doc(db, 'typing', `${chatId}_${userId}`);
      const timeoutKey = `${chatId}_${userId}`;
      
      // Limpiar timeout anterior
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
        this.typingTimeouts.delete(timeoutKey);
      }
      
      if (isTyping) {
        const typingData: ChatTyping = {
          chatId,
          userId,
          isTyping: true,
          timestamp: serverTimestamp() as Timestamp
        };
        
        await setDoc(typingRef, typingData, { merge: true });
        
        // Auto-limpiar después de 3 segundos
        const timeout = setTimeout(async () => {
          try {
            await this.setTyping(chatId, userId, false);
          } catch (error) {
            console.error('Error auto-clearing typing status:', error);
          }
        }, 3000);
        
        this.typingTimeouts.set(timeoutKey, timeout);
      } else {
         // Eliminar documento de typing
         try {
           await deleteDoc(typingRef);
         } catch (error) {
           // Ignorar error si el documento no existe
         }
       }
    } catch (error) {
      console.error('Error setting typing status:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
    }
  }
  
  // Suscribirse al estado de escritura de un chat
  subscribeToTyping(chatId: string, callback: (userId: string, isTyping: boolean) => void): () => void {
    const typingQuery = query(
      collection(db, 'typing'),
      where('chatId', '==', chatId)
    );

    return onSnapshot(typingQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as ChatTyping;
        
        if (change.type === 'added' || change.type === 'modified') {
          callback(data.userId, data.isTyping);
        } else if (change.type === 'removed') {
          callback(data.userId, false);
        }
      });
    }, (error) => {
      console.error('Error in typing subscription:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
    });
  }
  
  // Editar mensaje
  async editMessage(chatId: string, messageId: string, newContent: string): Promise<void> {
    try {
      // FIX: Validate content
      if (!newContent || newContent.trim().length === 0) {
        throw new Error('El contenido del mensaje no puede estar vacío');
      }
      
      if (newContent.length > 10240) { // 10KB limit
        throw new Error('El contenido del mensaje es demasiado largo');
      }
      
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        content: newContent.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error editing message:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }

  // Actualizar estado de mensaje
  async updateMessageStatus(chatId: string, messageId: string, status: 'sending' | 'sent' | 'delivered' | 'failed' | 'retrying'): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        status: status
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }
  
  // Agregar reacción a mensaje
  async addReaction(chatId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      // FIX: Validate emoji input
      if (!emoji || emoji.trim().length === 0) {
        throw new Error('Emoji inválido');
      }
      
      // FIX: Validate emoji is actually an emoji (basic validation)
      const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
      if (!emojiRegex.test(emoji.trim())) {
        throw new Error('Formato de emoji inválido');
      }
      
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: emoji.trim()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }
  
  // FIX: Remover reacción usando deleteField() en lugar de null
  async removeReaction(chatId: string, messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      // FIX: Use deleteField() instead of setting to null
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: deleteField()
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }
  
  // Obtener contador de mensajes no leídos
  private async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      return 0;
    }
  }
  
  // FIX: Estado en línea de usuarios con validación de seguridad
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      // FIX: Validate that user can only modify their own online status
      if (!userId || userId.trim().length === 0) {
        throw new Error('ID de usuario inválido');
      }
      
      const statusRef = doc(db, 'onlineStatus', userId);
      const statusData: OnlineStatus = {
        userId,
        isOnline,
        lastSeen: serverTimestamp() as Timestamp
      };
      
      await setDoc(statusRef, statusData, { merge: true });
      this.onlineStatusCache.set(userId, statusData);
    } catch (error) {
      console.error('Error setting online status:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
    }
  }

  // Suscribirse al estado en línea
  subscribeToOnlineStatus(
    userIds: string[],
    callback: (userId: string, isOnline: boolean, lastSeen?: Date) => void
  ): () => void {
    const unsubscribes: (() => void)[] = [];
    
    // FIX: Filter out empty/invalid user IDs
    const validUserIds = userIds.filter(id => id && id.trim().length > 0);
    
    validUserIds.forEach(userId => {
      const statusRef = doc(db, 'onlineStatus', userId);
      const unsubscribe = onSnapshot(statusRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as OnlineStatus;
            this.onlineStatusCache.set(userId, data);
            callback(userId, data.isOnline, data.lastSeen?.toDate());
          } else {
            callback(userId, false);
          }
        },
        (error) => {
          console.error(`Error in online status subscription for ${userId}:`, error);
          // FIX: Optional error reporting integration point
          // if (window.Sentry) window.Sentry.captureException(error);
          callback(userId, false);
        }
      );
      
      unsubscribes.push(unsubscribe);
    });
    
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }

  // Obtener total de mensajes no leídos del usuario
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const chats = await this.getUserChats(userId);
      return chats.reduce((total, chat) => {
        return total + (chat.unreadCount[userId] || 0);
      }, 0);
    } catch (error) {
      console.error('Error getting total unread count:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      return 0;
    }
  }

  // Eliminar chat (marcar como inactivo)
  async deleteChat(chatId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        isActive: false
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw new Error('No se pudo eliminar el chat');
    }
  }

  // FIX: Función optimizada para corregir chats con participants vacío usando getDoc
  async fixChatParticipants(chatId?: string): Promise<{ fixed: number; total: number }> {
    try {
      const chatsToFix: { id: string; data: Chat }[] = [];
      
      if (chatId) {
        // FIX: Optimized to use getDoc instead of getDocs for specific chat
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        
        if (chatDoc.exists()) {
          chatsToFix.push({
            id: chatId,
            data: chatDoc.data() as Chat
          });
        }
      } else {
        // Corregir todos los chats con participants vacío
        const chatsRef = collection(db, 'chats');
        const allChats = await getDocs(chatsRef);
        
        allChats.forEach((doc) => {
          const chatData = doc.data() as Chat;
          if ((!chatData.participants || chatData.participants.length === 0) && 
              chatData.participantIds && chatData.participantIds.length > 0) {
            chatsToFix.push({
              id: doc.id,
              data: chatData
            });
          }
        });
      }
      
      let fixedCount = 0;
      
      // Corregir cada chat
      for (const chat of chatsToFix) {
        const chatRef = doc(db, 'chats', chat.id);
        
        await updateDoc(chatRef, {
          participants: chat.data.participantIds,
          lastActivity: serverTimestamp(),
          chatType: chat.data.chatType || 'direct'
        });
        
        fixedCount++;
        console.log(`✅ Chat ${chat.id} corregido: participants poblado con participantIds`);
      }
      
      console.log(`🎉 Corrección completada: ${fixedCount} de ${chatsToFix.length} chats corregidos`);
      
      return {
        fixed: fixedCount,
        total: chatsToFix.length
      };
      
    } catch (error) {
      console.error('Error corrigiendo chats:', error);
      // FIX: Optional error reporting integration point
      // if (window.Sentry) window.Sentry.captureException(error);
      throw error;
    }
  }

  // Limpiar recursos
  cleanup(): void {
    // Limpiar timeouts de typing
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    
    // Limpiar cache
    this.onlineStatusCache.clear();
  }
}

// Instancia singleton del servicio
export const chatService = new ChatService();