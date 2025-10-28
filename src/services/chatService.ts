import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, // FIX: Added getDoc import for optimized queries
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  getDocs,
  limit,
  startAfter,
  DocumentSnapshot,
  writeBatch,
  increment,
  documentId,
  deleteField, // FIX: Added deleteField import for proper reaction removal
  enableNetwork,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { userService } from '@/lib/firestore';
import { PopulatedChat } from '@/types';
import { notificationService } from '@/services/notificationService';
import { realtimeService } from '@/services/realtimeService';
import { fcmNotificationService } from '@/services/fcmNotificationService';

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
  // Nuevos campos para acknowledgments
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
  deliveryAttempts?: number;
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
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  // Mejorado: Cache para tracking de mensajes pendientes de acknowledgment con cleanup automático
  private pendingAcknowledgments = new Map<string, { 
    messageId: string; 
    chatId: string; 
    timestamp: number;
    unsubscribe: () => void; // Para cleanup de listeners
    timeoutId: ReturnType<typeof setTimeout>; // Para cleanup de timeouts
  }>();
  // Nuevo: Cache para listeners de mensajes con paginación
  private messageListeners = new Map<string, { unsubscribe: () => void; lastDoc?: unknown; hasMore: boolean }>();
  // Nuevo: Sistema de reintento automático
  private retryQueue = new Map<string, { messageData: { chatId: string; receiverId: string; [key: string]: unknown }; attempts: number; nextRetry: number }>();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private retryInterval: ReturnType<typeof setInterval> | null = null;
  private maxRetryAttempts = 5;
  private baseRetryDelay = 1000; // 1 segundo
  // Mejorado: Sistema de heartbeat avanzado para presencia
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatFrequency = 30000; // 30 segundos (base)
  private adaptiveHeartbeatFrequency = 30000; // Frecuencia adaptativa
  private currentUserId: string | null = null;
  private lastHeartbeatTime = 0;
  private heartbeatFailures = 0;
  private maxHeartbeatFailures = 3;
  private isTabActive = true;
  private lastUserActivity = Date.now();
  private heartbeatMetrics = {
    totalSent: 0,
    totalFailed: 0,
    averageLatency: 0,
    lastLatency: 0
  };

  constructor() {
    this.setupNetworkListeners();
    this.startRetryProcessor();
  }

  // Nuevo: Configurar listeners de conectividad
  private setupNetworkListeners(): void {
    // Verificar que estamos en el lado del cliente
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Listener para cambios de conectividad
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada');
      this.isOnline = true;
      this.handleNetworkReconnection();
    });

    window.addEventListener('offline', () => {
      console.log('🚫 Conexión perdida');
      this.isOnline = false;
    });

    // Listener para cambios de visibilidad de la página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.handleNetworkReconnection();
      }
    });
  }

  // Nuevo: Manejar reconexión de red
  private async handleNetworkReconnection(): Promise<void> {
    try {
      // Reactivar Firestore
      await enableNetwork(db);
      console.log('🔄 Firestore reactivado');

      // Procesar mensajes en cola de reintento
      await this.processRetryQueue();

      // Reestablecer listeners activos
      this.reestablishActiveListeners();
    } catch (error) {
      console.error('Error durante la reconexión:', error);
    }
  }

  // Nuevo: Procesar cola de reintentos
  private async processRetryQueue(): Promise<void> {
    const now = Date.now();
    const toRetry: string[] = [];

    this.retryQueue.forEach((retryData, messageId) => {
      if (now >= retryData.nextRetry) {
        toRetry.push(messageId);
      }
    });

    for (const messageId of toRetry) {
      await this.retryFailedMessage(messageId);
    }
  }

  // Nuevo: Reintentar mensaje fallido
  private async retryFailedMessage(messageId: string): Promise<void> {
    const retryData = this.retryQueue.get(messageId);
    if (!retryData) return;

    try {
      const { messageData, attempts } = retryData;
      
      if (attempts >= this.maxRetryAttempts) {
        console.log(`❌ Mensaje ${messageId} excedió máximo de reintentos`);
        this.retryQueue.delete(messageId);
        
        // Marcar como fallido permanentemente
        await this.updateMessageStatus(messageData.chatId, messageId, 'failed');
        return;
      }

      console.log(`🔄 Reintentando mensaje ${messageId} (intento ${attempts + 1})`);

      // Actualizar estado a 'retrying'
      await this.updateMessageStatus(messageData.chatId, messageId, 'retrying');

      // Intentar reenviar
      const messagesRef = collection(db, 'chats', messageData.chatId, 'messages');
      const messageRef = doc(messagesRef, messageId);
      
      await updateDoc(messageRef, {
        status: 'sent',
        deliveryAttempts: increment(1),
        timestamp: serverTimestamp() // Actualizar timestamp
      });

      // Configurar acknowledgment
      await this.setupDeliveryAcknowledgment(messageData.chatId, messageId, messageData.receiverId);

      // Remover de cola de reintento
      this.retryQueue.delete(messageId);
      
      console.log(`✅ Mensaje ${messageId} reenviado exitosamente`);

    } catch (error) {
      console.error(`Error reintentando mensaje ${messageId}:`, error);
      
      // Incrementar contador de intentos y programar siguiente reintento
      const newAttempts = retryData.attempts + 1;
      const delay = this.calculateRetryDelay(newAttempts);
      
      this.retryQueue.set(messageId, {
        ...retryData,
        attempts: newAttempts,
        nextRetry: Date.now() + delay
      });
    }
  }

  // Nuevo: Calcular delay de reintento con backoff exponencial
  private calculateRetryDelay(attempts: number): number {
    // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
    return this.baseRetryDelay * Math.pow(2, attempts - 1);
  }

  // Nuevo: Iniciar procesador de reintentos
  private startRetryProcessor(): void {
    this.retryInterval = setInterval(() => {
      if (this.isOnline && this.retryQueue.size > 0) {
        this.processRetryQueue();
      }
    }, 5000); // Revisar cada 5 segundos
  }

  // Nuevo: Reestablecer listeners activos
  private reestablishActiveListeners(): void {
    // Reestablecer listeners de mensajes
    this.messageListeners.forEach((listenerInfo, chatId) => {
      console.log(`🔄 Reestableciendo listener para chat ${chatId}`);
      
      // Limpiar el listener anterior antes de crear uno nuevo
      try {
        listenerInfo.unsubscribe();
      } catch (error) {
        console.warn(`Error limpiando listener para ${chatId}:`, error);
      }
      
      // Los listeners de Firestore se reestablecen automáticamente
      // pero podemos forzar una reconexión si es necesario
    });
    
    // Limpiar el mapa de listeners para evitar conflictos
    this.messageListeners.clear();
  }

  // Nuevo: Agregar mensaje a cola de reintento
  private addToRetryQueue(messageId: string, messageData: Record<string, unknown>): void {
    this.retryQueue.set(messageId, {
      messageData: messageData as { chatId: string; receiverId: string; [key: string]: unknown },
      attempts: 0,
      nextRetry: Date.now() + this.baseRetryDelay
    });
    
    console.log(`📝 Mensaje ${messageId} agregado a cola de reintento`);
  }

  // Modificado: sendMessage con manejo de reintento automático
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
    const removeUndefinedDeep = (obj: unknown): unknown => {
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

    const sanitizedMetadata = metadata !== undefined ? removeUndefinedDeep(metadata) as ChatMessage['metadata'] : undefined;
    
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
        deliveryAttempts: 0,
        replyTo: replyTo ?? null,
        ...(sanitizedMetadata !== undefined && { metadata: sanitizedMetadata })
      };
      
      const docRef = await addDoc(messagesRef, message);
      
      // Actualizar último mensaje del chat y usar increment para contador de no leídos
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content: this.getPreviewContent(content, type),
          senderId,
          timestamp: serverTimestamp(),
          type
        },
        lastActivity: serverTimestamp(),
        [`unreadCount.${receiverId}`]: increment(1)
      });
      
      // Limpiar estado de escritura
      await this.setTyping(chatId, senderId, false);
      
      // Actualizar estado a 'sent' después del envío exitoso
      await this.updateMessageStatus(chatId, docRef.id, 'sent');
      
      // Configurar acknowledgment automático
      await this.setupDeliveryAcknowledgment(chatId, docRef.id, receiverId);
      
      // Crear notificación para el receptor
      try {
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        const senderData = senderDoc.data();
        
        if (senderData) {
          // Crear notificación en Firestore
          await notificationService.createMessageNotification(
            receiverId,
            { name: senderData.name || 'Usuario', id: senderId },
            this.getPreviewContent(content, type)
          );

          // Enviar notificación FCM push
          try {
            await fcmNotificationService.sendNewMessageNotification(
              receiverId,
              { name: senderData.name || 'Usuario', photoURL: senderData.profilePhoto },
              this.getPreviewContent(content, type)
            );
          } catch (fcmError) {
            console.error('Error sending FCM notification:', fcmError);
          }
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Si hay un error, crear mensaje fallido y agregarlo a cola de reintento
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
          deliveryAttempts: 1,
          replyTo: replyTo ?? null,
          ...(sanitizedMetadata !== undefined && { metadata: sanitizedMetadata as ChatMessage['metadata'] })
        };
        
        const docRef = await addDoc(messagesRef, failedMessage);
        
        // Agregar a cola de reintento si estamos online
        if (this.isOnline) {
          this.addToRetryQueue(docRef.id, {
            chatId,
            senderId,
            receiverId,
            content,
            type,
            replyTo,
            metadata: sanitizedMetadata
          });
        }
        
        return docRef.id;
      } catch (secondError) {
        console.error('Error creating failed message:', secondError);
        throw new Error('No se pudo enviar el mensaje');
      }
    }
  }

  // Nuevo: Configurar acknowledgment automático de entrega
  private async setupDeliveryAcknowledgment(chatId: string, messageId: string, receiverId: string): Promise<void> {
    try {
      // Limpiar acknowledgment previo si existe
      this.cleanupPendingAcknowledgment(messageId);

      // Crear listener para detectar cuando el receptor está activo
      const receiverStatusRef = doc(db, 'onlineStatus', receiverId);
      
      const unsubscribe = onSnapshot(receiverStatusRef, async (snapshot) => {
        if (snapshot.exists()) {
          const statusData = snapshot.data() as OnlineStatus;
          
          // Si el receptor está online, marcar como delivered
          if (statusData.isOnline) {
            await this.markMessageAsDelivered(chatId, messageId);
            this.cleanupPendingAcknowledgment(messageId);
          }
        }
      });

      // Timeout inteligente basado en el estado del receptor
      const timeoutDelay = await this.calculateAcknowledgmentTimeout(receiverId);
      const timeoutId = setTimeout(async () => {
        if (this.pendingAcknowledgments.has(messageId)) {
          await this.markMessageAsDelivered(chatId, messageId);
          this.cleanupPendingAcknowledgment(messageId);
        }
      }, timeoutDelay);

      // Guardar referencia para cleanup posterior
      this.pendingAcknowledgments.set(messageId, {
        messageId,
        chatId,
        timestamp: Date.now(),
        unsubscribe,
        timeoutId
      });

    } catch (error) {
      console.error('Error setting up delivery acknowledgment:', error);
    }
  }

  // Nuevo: Calcular timeout inteligente basado en el historial del usuario
  private async calculateAcknowledgmentTimeout(receiverId: string): Promise<number> {
    try {
      // Verificar si el usuario está actualmente online
      const receiverStatusRef = doc(db, 'onlineStatus', receiverId);
      const statusSnapshot = await getDoc(receiverStatusRef);
      
      if (statusSnapshot.exists()) {
        const statusData = statusSnapshot.data() as OnlineStatus;
        
        // Si está online, timeout corto (5 segundos)
        if (statusData.isOnline) {
          return 5000;
        }
        
        // Si estuvo online recientemente (últimos 5 minutos), timeout medio (15 segundos)
        const lastSeen = statusData.lastSeen;
        if (lastSeen && typeof lastSeen.toMillis === 'function') {
          const timeSinceLastSeen = Date.now() - lastSeen.toMillis();
          if (timeSinceLastSeen < 5 * 60 * 1000) { // 5 minutos
            return 15000;
          }
        }
      }
      
      // Timeout por defecto para usuarios offline (30 segundos)
      return 30000;
    } catch (error) {
      console.error('Error calculating acknowledgment timeout:', error);
      return 30000; // Fallback a timeout por defecto
    }
  }

  // Nuevo: Limpiar acknowledgment pendiente
  private cleanupPendingAcknowledgment(messageId: string): void {
    const pending = this.pendingAcknowledgments.get(messageId);
    if (pending) {
      // Limpiar listener
      pending.unsubscribe();
      // Limpiar timeout
      clearTimeout(pending.timeoutId);
      // Remover del cache
      this.pendingAcknowledgments.delete(messageId);
    }
  }

  // Mejorado: Marcar mensaje como entregado con mejor logging
  async markMessageAsDelivered(chatId: string, messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      // Verificar el estado actual del mensaje antes de actualizar
      const messageSnapshot = await getDoc(messageRef);
      if (!messageSnapshot.exists()) {
        console.warn(`Message ${messageId} not found when marking as delivered`);
        return;
      }

      const currentMessage = messageSnapshot.data();
      
      // Solo actualizar si el mensaje no está ya en un estado superior
      if (currentMessage.status === 'sent' || currentMessage.status === 'sending') {
        await updateDoc(messageRef, {
          status: 'delivered',
          deliveredAt: serverTimestamp()
        });

        console.log(`✅ Message ${messageId} marked as delivered`);
      } else {
        console.log(`📋 Message ${messageId} already in status: ${currentMessage.status}`);
      }

      // Limpiar del cache de acknowledgments pendientes
      this.cleanupPendingAcknowledgment(messageId);
      
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }

  // Nuevo: Marcar mensaje como leído (diferente de delivered)
  async markMessageAsRead(chatId: string, messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      // Verificar el estado actual del mensaje
      const messageSnapshot = await getDoc(messageRef);
      if (!messageSnapshot.exists()) {
        console.warn(`Message ${messageId} not found when marking as read`);
        return;
      }

      const currentMessage = messageSnapshot.data();
      
      // Actualizar a 'read' solo si no está ya leído
      if (currentMessage.status !== 'read') {
        await updateDoc(messageRef, {
          status: 'read',
          read: true,
          readAt: serverTimestamp()
        });

        console.log(`👁️ Message ${messageId} marked as read`);
      }

    } catch (error) {
      console.error('Error marking message as read:', error);
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
  private removeUndefinedValues(obj: unknown): unknown {
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

  // Marcar mensajes como leídos con transiciones de estado correctas
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Validar parámetros
      if (!chatId || !userId) {
        throw new Error('chatId y userId son requeridos');
      }

      // Obtener mensajes no leídos del usuario
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const unreadQuery = query(
        messagesRef,
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const unreadSnapshot = await getDocs(unreadQuery);
      
      if (unreadSnapshot.empty) {
        console.log('No hay mensajes no leídos para marcar');
        return;
      }

      // Usar batch para actualizar múltiples mensajes
      const batch = writeBatch(db);
      const readTimestamp = serverTimestamp();
      let messagesUpdated = 0;

      unreadSnapshot.docs.forEach((messageDoc) => {
        const messageData = messageDoc.data();
        const currentStatus = messageData.status;
        
        // Preparar datos de actualización
        const updateData: Record<string, unknown> = {
          read: true,
          readAt: readTimestamp
        };

        // Manejar transiciones de estado correctas
        if (currentStatus === 'sent') {
          // Primero marcar como delivered, luego como read
          updateData.status = 'delivered';
          updateData.deliveredAt = readTimestamp;
          
          // Programar actualización a 'read' después de un breve delay
          setTimeout(async () => {
            try {
              await updateDoc(messageDoc.ref, {
                status: 'read',
                readAt: serverTimestamp()
              });
              console.log(`📖 Mensaje ${messageDoc.id} actualizado de 'delivered' a 'read'`);
            } catch (error) {
              console.error(`Error actualizando mensaje ${messageDoc.id} a 'read':`, error);
            }
          }, 100); // 100ms delay para asegurar la transición
          
        } else if (currentStatus === 'delivered') {
          // Directamente a read
          updateData.status = 'read';
        } else if (currentStatus === 'sending') {
          // Casos edge: mensaje aún enviándose pero el usuario ya lo está leyendo
          updateData.status = 'delivered';
          updateData.deliveredAt = readTimestamp;
          
          // También programar actualización a 'read'
          setTimeout(async () => {
            try {
              await updateDoc(messageDoc.ref, {
                status: 'read',
                readAt: serverTimestamp()
              });
            } catch (error) {
              console.error(`Error actualizando mensaje ${messageDoc.id} a 'read':`, error);
            }
          }, 200);
        } else {
          // Para otros estados, solo marcar como leído sin cambiar status
          console.log(`Mensaje ${messageDoc.id} en estado ${currentStatus}, solo marcando como leído`);
        }

        batch.update(messageDoc.ref, updateData);
        messagesUpdated++;

        // Limpiar acknowledgment pendiente si existe
        this.cleanupPendingAcknowledgment(messageDoc.id);
      });

      // Actualizar contador de no leídos en el chat
      const chatRef = doc(db, 'chats', chatId);
      batch.update(chatRef, {
        [`unreadCount.${userId}`]: 0
      });

      await batch.commit();
      
      console.log(`📖 Marcados ${messagesUpdated} mensajes como leídos en chat ${chatId} con transiciones de estado correctas`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
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
  
  // Mejorado: Sistema de paginación para mensajes
  subscribeToMessages(
    chatId: string, 
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 50,
    options?: {
      enablePagination?: boolean;
      loadOlder?: boolean;
      startAfter?: unknown; // DocumentSnapshot para paginación
      onError?: (error: Error) => void;
    }
  ): () => void {
    try {
      // Validaciones
      if (!chatId || typeof chatId !== 'string' || chatId.trim().length === 0) {
        throw new Error('ID de chat inválido');
      }
      
      if (!callback || typeof callback !== 'function') {
        throw new Error('Callback es requerido y debe ser una función');
      }
      
      if (limitCount <= 0 || limitCount > 100) {
        throw new Error('Límite debe estar entre 1 y 100');
      }

      // Prevenir múltiples listeners para el mismo chat
      const listenerKey = options?.startAfter ? `${chatId}_paginated` : chatId;
      const existingListener = this.messageListeners.get(listenerKey);
      
      if (existingListener) {
        console.log(`⚠️  Ya existe un listener activo para el chat ${listenerKey}, limpiando...`);
        try {
          existingListener.unsubscribe();
        } catch (error) {
          console.warn(`Error limpiando listener existente para ${listenerKey}:`, error);
        }
        this.messageListeners.delete(listenerKey);
      }

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      // Construir query base
      let baseQuery = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Si hay paginación, agregar startAfter
      if (options?.startAfter) {
        baseQuery = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          startAfter(options.startAfter),
          limit(limitCount)
        );
      }

      const unsubscribe = onSnapshot(
        baseQuery,
        (snapshot) => {
          try {
            const messages: ChatMessage[] = [];
            let lastDoc = null;

            snapshot.forEach((doc) => {
              const data = doc.data();
              lastDoc = doc; // Guardar último documento para paginación
              
              messages.push({
                id: doc.id,
                chatId: data.chatId || chatId,
                senderId: data.senderId || '',
                receiverId: data.receiverId || '',
                content: data.content || '',
                type: data.type || 'text',
                timestamp: data.timestamp,
                read: data.read || false,
                status: data.status || 'sent',
                deliveredAt: data.deliveredAt,
                readAt: data.readAt,
                deliveryAttempts: data.deliveryAttempts || 0,
                edited: data.edited || false,
                editedAt: data.editedAt,
                replyTo: data.replyTo || null,
                reactions: data.reactions || {},
                metadata: data.metadata
              });
            });

            // Invertir para mostrar mensajes más antiguos primero
            const sortedMessages = messages.reverse();

            // Actualizar cache de listener
            const listenerKey = options?.startAfter ? `${chatId}_paginated` : chatId;
            this.messageListeners.set(listenerKey, {
              unsubscribe,
              lastDoc,
              hasMore: messages.length === limitCount
            });

            callback(sortedMessages);
          } catch (error) {
            console.error('Error processing messages snapshot:', error);
            if (options?.onError) {
              options.onError(error as Error);
            }
            callback([]);
          }
        },
        (error) => {
          console.error('Error in messages subscription:', error);
          if (options?.onError) {
            options.onError(error);
          }
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      if (options?.onError) {
        options.onError(error as Error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Nuevo: Cargar mensajes más antiguos (paginación hacia atrás)
  async loadOlderMessages(
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 50
  ): Promise<boolean> {
    try {
      const listenerInfo = this.messageListeners.get(chatId);
      
      if (!listenerInfo?.lastDoc || !listenerInfo.hasMore) {
        console.log('No hay más mensajes antiguos para cargar');
        return false;
      }

      // Crear nuevo listener para mensajes más antiguos
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const olderUnsubscribe = this.subscribeToMessages(
        chatId,
        callback,
        limitCount,
        {
          enablePagination: true,
          loadOlder: true,
          startAfter: listenerInfo.lastDoc
        }
      );

      return true;
    } catch (error) {
      console.error('Error loading older messages:', error);
      return false;
    }
  }

  // Nuevo: Limpiar listeners de mensajes con manejo de errores
  cleanupMessageListeners(chatId?: string): void {
    if (chatId) {
      // Limpiar listener específico
      const listenerInfo = this.messageListeners.get(chatId);
      if (listenerInfo) {
        try {
          listenerInfo.unsubscribe();
        } catch (error) {
          console.warn(`Error cleaning up message listener for chat ${chatId}:`, error);
        }
        this.messageListeners.delete(chatId);
      }
      
      // También limpiar listener paginado si existe
      const paginatedKey = `${chatId}_paginated`;
      const paginatedListener = this.messageListeners.get(paginatedKey);
      if (paginatedListener) {
        try {
          paginatedListener.unsubscribe();
        } catch (error) {
          console.warn(`Error cleaning up paginated listener for chat ${chatId}:`, error);
        }
        this.messageListeners.delete(paginatedKey);
      }
    } else {
      // Limpiar todos los listeners
      this.messageListeners.forEach((listenerInfo, key) => {
        try {
          listenerInfo.unsubscribe();
        } catch (error) {
          console.warn(`Error cleaning up message listener for key ${key}:`, error);
        }
      });
      this.messageListeners.clear();
    }
  }

  // Nuevo: Obtener información de paginación
  getPaginationInfo(chatId: string): { hasMore: boolean; canLoadOlder: boolean } {
    const listenerInfo = this.messageListeners.get(chatId);
    return {
      hasMore: listenerInfo?.hasMore || false,
      canLoadOlder: !!listenerInfo?.lastDoc
    };
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
        const data = doc.data() as Record<string, unknown>;
        chats.push({ id: doc.id, ...data } as Chat);
      });
      
      // Filter inactive chats (ordering already done by server)
      return chats.filter(chat => (chat as Chat & { isActive?: boolean }).isActive !== false);
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
    const processSnapshot = (snapshot: unknown): Chat[] => {
      const chats: Chat[] = [];
      (snapshot as { forEach: (callback: (doc: { id: string; data: () => unknown }) => void) => void }).forEach((doc: { id: string; data: () => unknown }) => {
        const data = doc.data() as Record<string, unknown>;
        chats.push({ id: doc.id, ...data } as Chat);
      });
      return chats
        .filter(chat => (chat as { isActive?: boolean }).isActive !== false)
        .sort((a, b) => {
          const t1 = (a as { lastActivity?: { seconds?: number; toMillis?: () => number } }).lastActivity;
          const t2 = (b as { lastActivity?: { seconds?: number; toMillis?: () => number } }).lastActivity;
          const ts1 = t1 && (typeof t1.toMillis === 'function' ? t1.toMillis() : ((t1 as { seconds?: number }).seconds ?? 0) * 1000);
          const ts2 = t2 && (typeof t2.toMillis === 'function' ? t2.toMillis() : ((t2 as { seconds?: number }).seconds ?? 0) * 1000);
          return (ts2 ?? 0) - (ts1 ?? 0);
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
    const buildPopulatedChats = async (snapshot: { docs: { id: string; data: () => unknown }[] }): Promise<PopulatedChat[]> => {
      const chats: PopulatedChat[] = [];

      const allParticipantIds = new Set<string>();
      snapshot.docs.forEach((docSnap: { id: string; data: () => unknown }) => {
        const chatData = docSnap.data() as Chat & { participantIds?: string[] };
        (chatData.participants || chatData.participantIds || []).forEach((pid: string) =>
          allParticipantIds.add(pid)
        );
      });

      // Optimized batch user loading
      const userMap = new Map<string, unknown>();
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

      snapshot.docs.forEach((docSnap: { id: string; data: () => unknown }) => {
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
            .filter(chat => (chat as { isActive?: boolean }).isActive !== false)
            .sort((a, b) => {
              const t1 = (a as { lastActivity?: { toMillis?: () => number; seconds?: number } }).lastActivity;
              const t2 = (b as { lastActivity?: { toMillis?: () => number; seconds?: number } }).lastActivity;
              const ts1 = t1 && (typeof t1.toMillis === 'function' ? t1.toMillis() : ((t1 as { seconds?: number }).seconds ?? 0) * 1000);
              const ts2 = t2 && (typeof t2.toMillis === 'function' ? t2.toMillis() : ((t2 as { seconds?: number }).seconds ?? 0) * 1000);
              return (ts2 ?? 0) - (ts1 ?? 0);
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

  // Nuevo: Inicializar presencia del usuario
  async initializePresence(userId: string): Promise<void> {
    try {
      this.currentUserId = userId;
      this.isOnline = true;
      this.lastUserActivity = Date.now();
      this.heartbeatFailures = 0;
      
      // Establecer presencia inicial
      await realtimeService.setUserPresence(userId, 'online');
      
      // Configurar listeners de actividad y visibilidad
      this.setupActivityListeners();
      
      // Iniciar heartbeat adaptativo
      this.startHeartbeat();
      
      console.log(`✅ Presencia inicializada para usuario ${userId}`);
    } catch (error) {
      console.error('Error inicializando presencia:', error);
      throw error;
    }
  }

  // Mejorado: Heartbeat adaptativo para mantener presencia activa
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (!this.currentUserId || !this.isOnline) {
        return;
      }

      // Pausar heartbeat si la pestaña está inactiva por más de 5 minutos
      if (!this.isTabActive && Date.now() - this.lastUserActivity > 300000) {
        console.log('⏸️ Heartbeat pausado - pestaña inactiva');
        return;
      }

      try {
        const startTime = Date.now();
        await realtimeService.setUserPresence(this.currentUserId, 'online');
        
        // Calcular latencia y actualizar métricas
        const latency = Date.now() - startTime;
        this.updateHeartbeatMetrics(latency, true);
        
        // Resetear contador de fallos en caso de éxito
        this.heartbeatFailures = 0;
        this.lastHeartbeatTime = Date.now();
        
        console.log(`💓 Heartbeat enviado (${latency}ms)`);
        
        // Ajustar frecuencia adaptativa basada en actividad
        this.adjustHeartbeatFrequency();
        
      } catch (error) {
        this.heartbeatFailures++;
        this.updateHeartbeatMetrics(0, false);
        
        console.error(`❌ Error en heartbeat (${this.heartbeatFailures}/${this.maxHeartbeatFailures}):`, error);
        
        // Si hay muchos fallos consecutivos, intentar reconectar
        if (this.heartbeatFailures >= this.maxHeartbeatFailures) {
          console.warn('🔄 Demasiados fallos de heartbeat, intentando reconectar...');
          await this.handleHeartbeatFailure();
        }
      }
    }, this.adaptiveHeartbeatFrequency);
  }

  // Nuevo: Detener heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Mejorado: Limpiar presencia del usuario y listeners
  async clearPresence(): Promise<void> {
    try {
      if (this.currentUserId) {
        await realtimeService.clearUserPresence(this.currentUserId);
        this.stopHeartbeat();
        this.cleanupActivityListeners();
        this.resetHeartbeatMetrics();
        this.currentUserId = null;
        console.log('🧹 Presencia y listeners limpiados');
      }
    } catch (error) {
      console.error('Error limpiando presencia:', error);
    }
  }

  // Nuevo: Configurar listeners de actividad del usuario
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    // Listener para visibilidad de la página
    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive) {
        this.lastUserActivity = Date.now();
        console.log('👁️ Pestaña activa - reanudando heartbeat normal');
      } else {
        console.log('😴 Pestaña inactiva - heartbeat reducido');
      }
    });

    // Listeners para actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Listener para conexión de red
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada - reiniciando heartbeat');
      this.heartbeatFailures = 0;
      if (this.currentUserId) {
        this.startHeartbeat();
      }
    });

    window.addEventListener('offline', () => {
      console.log('📡 Conexión perdida - pausando heartbeat');
    });
  }

  // Nuevo: Ajustar frecuencia de heartbeat basada en actividad
  private adjustHeartbeatFrequency(): void {
    const timeSinceActivity = Date.now() - this.lastUserActivity;
    
    if (timeSinceActivity < 60000) { // Menos de 1 minuto
      this.adaptiveHeartbeatFrequency = 15000; // 15 segundos - muy activo
    } else if (timeSinceActivity < 300000) { // Menos de 5 minutos
      this.adaptiveHeartbeatFrequency = 30000; // 30 segundos - moderadamente activo
    } else if (timeSinceActivity < 900000) { // Menos de 15 minutos
      this.adaptiveHeartbeatFrequency = 60000; // 1 minuto - poco activo
    } else {
      this.adaptiveHeartbeatFrequency = 120000; // 2 minutos - inactivo
    }

    // Reiniciar heartbeat con nueva frecuencia si cambió significativamente
    const frequencyDiff = Math.abs(this.adaptiveHeartbeatFrequency - this.heartbeatFrequency);
    if (frequencyDiff > 5000) { // Cambio significativo de más de 5 segundos
      this.heartbeatFrequency = this.adaptiveHeartbeatFrequency;
      this.startHeartbeat(); // Reiniciar con nueva frecuencia
    }
  }

  // Nuevo: Actualizar métricas de heartbeat
  private updateHeartbeatMetrics(latency: number, success: boolean): void {
    this.heartbeatMetrics.totalSent++;
    
    if (success) {
      this.heartbeatMetrics.lastLatency = latency;
      // Calcular promedio móvil de latencia
      this.heartbeatMetrics.averageLatency = 
        (this.heartbeatMetrics.averageLatency * 0.8) + (latency * 0.2);
    } else {
      this.heartbeatMetrics.totalFailed++;
    }
  }

  // Nuevo: Manejar fallos de heartbeat
  private async handleHeartbeatFailure(): Promise<void> {
    try {
      // Detener heartbeat actual
      this.stopHeartbeat();
      
      // Esperar un poco antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Intentar reconectar
      if (this.currentUserId) {
        console.log('🔄 Reintentando conexión de presencia...');
        await realtimeService.setUserPresence(this.currentUserId, 'online');
        
        // Reiniciar heartbeat con frecuencia reducida temporalmente
        this.adaptiveHeartbeatFrequency = 60000; // 1 minuto
        this.heartbeatFailures = 0;
        this.startHeartbeat();
        
        console.log('✅ Reconexión de presencia exitosa');
      }
    } catch (error) {
      console.error('❌ Error en reconexión de presencia:', error);
      // Programar otro intento en 30 segundos
      setTimeout(() => {
        if (this.heartbeatFailures >= this.maxHeartbeatFailures) {
          this.handleHeartbeatFailure();
        }
      }, 30000);
    }
  }

  // Nuevo: Limpiar listeners de actividad
  private cleanupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    // Remover listeners de actividad
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };

    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });

    console.log('🧹 Listeners de actividad limpiados');
  }

  // Nuevo: Resetear métricas de heartbeat
  private resetHeartbeatMetrics(): void {
    this.heartbeatMetrics = {
      totalSent: 0,
      totalFailed: 0,
      averageLatency: 0,
      lastLatency: 0
    };
    this.heartbeatFailures = 0;
    this.lastHeartbeatTime = 0;
    this.adaptiveHeartbeatFrequency = this.heartbeatFrequency;
  }

  // Nuevo: Obtener métricas de heartbeat
  getHeartbeatMetrics() {
    return {
      ...this.heartbeatMetrics,
      currentFrequency: this.adaptiveHeartbeatFrequency,
      failures: this.heartbeatFailures,
      lastHeartbeat: this.lastHeartbeatTime,
      isActive: this.isTabActive,
      timeSinceActivity: Date.now() - this.lastUserActivity
    };
  }

  // Nuevo: Obtener usuarios en línea
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    try {
      return await realtimeService.getOnlineUsers(userIds);
    } catch (error) {
      console.error('Error obteniendo usuarios en línea:', error);
      return [];
    }
  }
  
  // Migrado: Usar Realtime Database para typing
  async setTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      if (!chatId || !userId) {
        throw new Error('chatId y userId son requeridos');
      }

      await realtimeService.setTypingStatus(chatId, userId, isTyping);
      console.log(`📝 Estado de typing actualizado: ${isTyping ? 'escribiendo' : 'no escribiendo'}`);
    } catch (error) {
      console.error('Error actualizando estado de typing:', error);
      throw error;
    }
  }
  
  // Suscribirse al estado de escritura de un chat
  // Migrado: Usar Realtime Database para typing
  subscribeToTyping(chatId: string, callback: (userId: string, isTyping: boolean) => void): () => void {
    try {
      return realtimeService.onTypingStatus(chatId, (typingData) => {
        Object.entries(typingData).forEach(([userId, typing]) => {
          callback(userId, typing.isTyping);
        });
      });
    } catch (error) {
      console.error('Error suscribiéndose a typing status:', error);
      return () => {}; // Return empty cleanup function
    }
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

  // Actualizar estado de mensaje con validaciones mejoradas
  async updateMessageStatus(chatId: string, messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'retrying'): Promise<void> {
    try {
      if (!chatId || !messageId) {
        throw new Error('chatId y messageId son requeridos');
      }

      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      // Obtener estado actual del mensaje para validar transición
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        console.warn(`Mensaje ${messageId} no encontrado para actualizar estado`);
        return;
      }

      const currentStatus = messageDoc.data().status;
      
      // Validar transiciones de estado válidas
      const validTransitions: Record<string, string[]> = {
        'sending': ['sent', 'failed'],
        'sent': ['delivered', 'failed'],
        'delivered': ['read'],
        'failed': ['retrying', 'sent'],
        'retrying': ['sent', 'failed'],
        'read': [] // Estado final
      };

      if (currentStatus && validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
        console.warn(`Transición de estado inválida: ${currentStatus} -> ${status}`);
        return;
      }

      const updateData: Record<string, unknown> = { status };
      
      // Añadir timestamp específico según el estado
      if (status === 'delivered') {
        updateData.deliveredAt = serverTimestamp();
      } else if (status === 'read') {
        updateData.readAt = serverTimestamp();
      }

      await updateDoc(messageRef, updateData);
      
      console.log(`Estado del mensaje ${messageId} actualizado a: ${status}`);
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
      
      // Usar realtimeService para gestionar presencia
      const status = isOnline ? 'online' : 'away';
      await realtimeService.setUserPresence(userId, status);
      
      console.log(`🟢 Estado de presencia actualizado: ${userId} -> ${status}`);
    } catch (error) {
      console.error('Error setting online status:', error);
      throw error;
    }
  }

  // Suscribirse al estado en línea
  subscribeToOnlineStatus(
    userIds: string[],
    callback: (userId: string, isOnline: boolean, lastSeen?: Date) => void
  ): () => void {
    try {
      // FIX: Filter out empty/invalid user IDs
      const validUserIds = userIds.filter(id => id && id.trim().length > 0);
      
      if (validUserIds.length === 0) {
        console.warn('No hay IDs de usuario válidos para suscribirse al estado en línea');
        return () => {};
      }
      
      // Usar realtimeService para suscribirse a la presencia
      return realtimeService.onUserPresence(validUserIds, (presenceData) => {
        Object.entries(presenceData).forEach(([userId, presence]) => {
          callback(userId, presence.isOnline, presence.lastSeen ? new Date(presence.lastSeen) : undefined);
        });
      });
    } catch (error) {
      console.error('Error suscribiéndose al estado en línea:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  // Obtener total de mensajes no leídos del usuario
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const chats = await this.getUserChats(userId);
      return chats.reduce((total, chat) => {
        return total + (chat.unreadCount && userId && chat.unreadCount[userId] || 0);
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

  // Obtener o crear un chat entre dos usuarios
  async getOrCreateChat(user1Id: string, user2Id: string): Promise<string> {
    try {
      // Buscar chat existente
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user1Id)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Buscar chat que contenga ambos usuarios
      for (const doc of querySnapshot.docs) {
        const chat = doc.data() as Chat;
        if (chat.participants.includes(user2Id)) {
          return doc.id;
        }
      }
      
      // Si no existe, crear nuevo chat
      const newChat: Omit<Chat, 'id'> = {
        participants: [user1Id, user2Id],
        participantIds: [user1Id, user2Id],
        lastMessage: null,
        lastActivity: serverTimestamp() as Timestamp,
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        },
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        chatType: 'direct'
      };
      
      const docRef = await addDoc(chatsRef, newChat);
      console.log(`💬 Nuevo chat creado: ${docRef.id} entre ${user1Id} y ${user2Id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error obteniendo o creando chat:', error);
      throw error;
    }
  }

  // Limpiar todos los acknowledgments pendientes con manejo de errores
  private cleanupAllPendingAcknowledgments(): void {
    console.log(`🧹 Limpiando ${this.pendingAcknowledgments.size} acknowledgments pendientes`);
    
    this.pendingAcknowledgments.forEach((ack, messageId) => {
      try {
        this.cleanupPendingAcknowledgment(messageId);
      } catch (error) {
        console.warn(`Error cleaning up acknowledgment for message ${messageId}:`, error);
      }
    });
    
    this.pendingAcknowledgments.clear();
  }

  // Limpiar recursos con manejo robusto de errores
  cleanup(): void {
    try {
      // Limpiar timeouts de typing
      this.typingTimeouts.forEach((timeout, key) => {
        try {
          clearTimeout(timeout);
        } catch (error) {
          console.warn(`Error clearing typing timeout for ${key}:`, error);
        }
      });
      this.typingTimeouts.clear();
      
      // Limpiar cache
      this.onlineStatusCache.clear();
      
      // Nuevo: Limpiar sistema de reintento
      if (this.retryInterval) {
        try {
          clearInterval(this.retryInterval);
        } catch (error) {
          console.warn('Error clearing retry interval:', error);
        }
        this.retryInterval = null;
      }
      this.retryQueue.clear();
      
      // Limpiar acknowledgments pendientes con cleanup completo
      try {
        this.cleanupAllPendingAcknowledgments();
      } catch (error) {
        console.warn('Error during acknowledgments cleanup:', error);
      }
      
      // Limpiar listeners de mensajes
      try {
        this.cleanupMessageListeners();
      } catch (error) {
        console.warn('Error during message listeners cleanup:', error);
      }
      
      // Limpiar presencia y heartbeat
      this.clearPresence().catch(error => {
        console.error('Error limpiando presencia durante cleanup:', error);
      });
      
      console.log('🧹 ChatService cleanup completed');
    } catch (error) {
      console.error('Error during ChatService cleanup:', error);
    }
  }
}

// Instancia singleton del servicio
export const chatService = new ChatService();