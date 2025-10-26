import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Chat, Message, UserDistance } from '@/types';
import { notificationService } from '@/services/notificationService';
import { withRetry, safeFirestoreReadSimple as safeFirestoreRead, safeFirestoreWriteSimple as safeFirestoreWrite } from './firestoreErrorHandler';
import { calculateDistance } from './geolocation';

// Servicios de usuarios
export const userService = {
  // Crear perfil de usuario
  async createUser(userId: string, userData: Partial<User>): Promise<void> {
    await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        id: userId,
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp(),
        blockedUsers: [],
        favoriteUsers: []
      });
    }, `createUser(${userId})`);
  },

  // Obtener usuario por ID
  async getUser(userId: string): Promise<User | null> {
    return await safeFirestoreRead(async () => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
      }
      return null;
    }, null, `getUser(${userId})`);
  },

  // Actualizar usuario
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    }, `updateUser(${userId})`);
  },

  // Actualizar estado online
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp()
      });
    }, `updateOnlineStatus(${userId})`);
  },

  // Obtener usuarios cercanos
  async getNearbyUsers(
    currentUserId: string,
    latitude: number,
    longitude: number,
    maxDistance: number = 50,
    offset: number = 0
  ): Promise<UserDistance[]> {
    return await safeFirestoreRead(async () => {
      console.log(`🔍 [getNearbyUsers] Buscando usuarios cerca de ${latitude}, ${longitude} para usuario ${currentUserId}`);
      
      // Nota: Para una implementación completa de geolocalización,
      // se recomienda usar GeoFirestore o implementar índices geoespaciales
      const usersRef = collection(db, 'users');
      
      // Obtener todos los usuarios (excepto el actual) y filtrar por distancia
      const q = query(usersRef, limit(100));
      
      const querySnapshot = await getDocs(q);
      const users: UserDistance[] = [];
      
      console.log(`📊 [getNearbyUsers] Encontrados ${querySnapshot.size} usuarios en total`);
      
      querySnapshot.forEach((doc) => {
        // Skip current user
        if (doc.id === currentUserId) {
          return;
        }
        
        const userData = { id: doc.id, ...doc.data() } as User;
        
        // Check if user has location data
        if (userData.location && userData.location.latitude && userData.location.longitude) {
          const distance = calculateDistance(
            latitude,
            longitude,
            userData.location.latitude,
            userData.location.longitude
          );
          
          if (distance <= maxDistance) {
            users.push({ 
              user: userData, 
              distance 
            });
          }
        } else {
          console.log(`⚠️ [getNearbyUsers] Usuario ${doc.id} no tiene datos de ubicación`);
        }
      });
      
      console.log(`✅ [getNearbyUsers] Encontrados ${users.length} usuarios dentro de ${maxDistance}km`);
      
      return users
        .sort((a, b) => a.distance - b.distance)
        .slice(offset, offset + 20); // Pagination
    }, [], `getNearbyUsers(${currentUserId})`);
  },

  // Verificar si un usuario es nuevo (menos de 7 días)
  isNewUser(userData: User): boolean {
    if (!userData.createdAt) return false;
    
    let createdAt: Date;
    if (userData.createdAt instanceof Date) {
      createdAt = userData.createdAt;
    } else if (typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt) {
      // Firestore Timestamp object
      createdAt = userData.createdAt.toDate();
    } else {
      // String or number timestamp
      createdAt = new Date(userData.createdAt as any);
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdAt > sevenDaysAgo;
  },

  // Dar like a un usuario
  async likeUser(userId: string, targetUserId: string): Promise<void> {
    await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      const targetUserRef = doc(db, 'users', targetUserId);
      
      // Get user data first for validation
      const [currentUserSnap, targetUserSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(targetUserRef)
      ]);
      
      if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
        throw new Error('Usuario no encontrado');
      }
      
      const currentUserData = currentUserSnap.data() as User;
      const targetUserData = targetUserSnap.data() as User;
      
      // Validación básica: evitar auto-likes
      if (userId === targetUserId) {
        throw new Error('No puedes darte like a ti mismo');
      }
      
      // Add to liked users
      await updateDoc(userRef, {
        likedUsers: arrayUnion(targetUserId)
      });
      
      // Check if it's a match (target user also liked this user)
      if (targetUserData.likedUsers?.includes(userId)) {
        // It's a match! Create a chat
        const chatId = await chatService.getOrCreateChat(userId, targetUserId);
        
        // Create match in matches collection
        const matchesRef = collection(db, 'matches');
        await addDoc(matchesRef, {
          user1Id: userId,
          user2Id: targetUserId,
          createdAt: serverTimestamp(),
          isActive: true,
          lastActivity: serverTimestamp(),
          chatId
        });

        // Send match notifications to both users using the notification service
        await Promise.all([
          notificationService.createMatchNotification(userId, { name: targetUserData.name, id: targetUserId }),
          notificationService.createMatchNotification(targetUserId, { name: currentUserData.name, id: userId })
        ]);
      } else {
        // Send like notification to target user
        await notificationService.createLikeNotification(targetUserId, { name: currentUserData.name, id: userId });
      }
    }, `likeUser(${userId}, ${targetUserId})`);
  },

  // Pasar a un usuario
  async passUser(userId: string, targetUserId: string): Promise<void> {
    await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        passedUsers: arrayUnion(targetUserId)
      });
    }, `passUser(${userId}, ${targetUserId})`);
  },

  // Dar super like a un usuario
  async superLikeUser(userId: string, targetUserId: string): Promise<void> {
    await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      const targetUserRef = doc(db, 'users', targetUserId);
      
      // Get user data first for validation
      const [currentUserSnap, targetUserSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(targetUserRef)
      ]);
      
      if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
        throw new Error('Usuario no encontrado');
      }
      
      const currentUserData = currentUserSnap.data() as User;
      const targetUserData = targetUserSnap.data() as User;
      
      // Validar restricciones de usuarios nuevos
      const currentUserIsNew = userService.isNewUser(currentUserData);
      const targetUserIsNew = userService.isNewUser(targetUserData);
      
      // Si el usuario actual es nuevo, no puede dar super like a usuarios existentes
      if (currentUserIsNew && !targetUserIsNew) {
        throw new Error('Los usuarios nuevos no pueden dar super like a usuarios existentes');
      }
      
      // Si el usuario objetivo es nuevo, los usuarios existentes no pueden darle super like
      if (!currentUserIsNew && targetUserIsNew) {
        throw new Error('Los usuarios existentes no pueden dar super like a usuarios nuevos');
      }

      // Verificar si el usuario tiene créditos disponibles (solo si no es premium)
      const currentSuperLikes = currentUserData.superLikes || 0;
      const isPremium = currentUserData.isPremium || false;
      
      if (!isPremium && currentSuperLikes <= 0) {
        throw new Error('No tienes suficientes Super Likes disponibles');
      }
      
      // Preparar las actualizaciones
      const userUpdates: any = {
        superLikedUsers: arrayUnion(targetUserId)
      };
      
      // Decrementar créditos solo si no es premium
      if (!isPremium) {
        userUpdates.superLikes = Math.max(0, currentSuperLikes - 1);
      }
      
      // Actualizar usuario que da el super like
      await updateDoc(userRef, userUpdates);
      
      // Add to received super likes
      await updateDoc(targetUserRef, {
        receivedSuperLikes: arrayUnion(userId)
      });
      
      // Check if it's a match (target user also liked this user)
      if (targetUserData.likedUsers?.includes(userId) || targetUserData.superLikedUsers?.includes(userId)) {
        // It's a match! Create a chat
        const chatId = await chatService.getOrCreateChat(userId, targetUserId);
        
        // Create match in matches collection
        const matchesRef = collection(db, 'matches');
        await addDoc(matchesRef, {
          user1Id: userId,
          user2Id: targetUserId,
          createdAt: serverTimestamp(),
          isActive: true,
          lastActivity: serverTimestamp(),
          chatId
        });

        // Send match notifications to both users
        await Promise.all([
          notificationService.createMatchNotification(userId, { name: targetUserData.name, id: targetUserId }),
          notificationService.createMatchNotification(targetUserId, { name: currentUserData.name, id: userId })
        ]);
      } else {
        // Send super like notification to target user
        await notificationService.createSuperLikeNotification(targetUserId, { name: currentUserData.name, id: userId });
      }
    }, `superLikeUser(${userId}, ${targetUserId})`);
  },

  // Reportar un usuario
  async reportUser(reporterId: string, reportedUserId: string, reason: string, description?: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const reportsRef = collection(db, 'reports');
      
      await addDoc(reportsRef, {
        reporterId,
        reportedUserId,
        reason,
        description: description || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });
    }, `reportUser(${reporterId}, ${reportedUserId})`);
  },

  // Bloquear un usuario
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(blockedUserId)
      });
    }, `blockUser(${userId}, ${blockedUserId})`);
  },

  // Desbloquear un usuario
  async unblockUser(userId: string, unblockedUserId: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(unblockedUserId)
      });
    }, `unblockUser(${userId}, ${unblockedUserId})`);
  },

  // Obtener usuarios bloqueados
  async getBlockedUsers(userId: string): Promise<string[]> {
    return await safeFirestoreRead(async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() as User;
      return userData.blockedUsers || [];
    }, [], `getBlockedUsers(${userId})`);
  },

  // Agregar a favoritos
  async addToFavorites(userId: string, targetUserId: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favoriteUsers: arrayUnion(targetUserId)
      });
    }, `addToFavorites(${userId}, ${targetUserId})`);
  },

  // Remover de favoritos
  async removeFromFavorites(userId: string, targetUserId: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favoriteUsers: arrayRemove(targetUserId)
      });
    }, `removeFromFavorites(${userId}, ${targetUserId})`);
  }
};

// Servicios de chat
export const chatService = {

  // Crear o obtener chat entre dos usuarios
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    return await safeFirestoreWrite(async () => {
      // Validar restricciones de usuarios nuevos antes de crear chat
      const userRef1 = doc(db, 'users', userId1);
      const userRef2 = doc(db, 'users', userId2);
      
      const [userSnap1, userSnap2] = await Promise.all([
        getDoc(userRef1),
        getDoc(userRef2)
      ]);
      
      if (!userSnap1.exists() || !userSnap2.exists()) {
        throw new Error('Usuario no encontrado');
      }
      
      const userData1 = userSnap1.data() as User;
      const userData2 = userSnap2.data() as User;
      
      // Validación básica: evitar chat consigo mismo
      if (userId1 === userId2) {
        throw new Error('No puedes crear un chat contigo mismo');
      }
      
      const chatsRef = collection(db, 'chats');
      
      // Buscar chat existente
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', userId1)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatId: string | null = null;
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participantIds && chatData.participantIds.includes(userId2)) {
          existingChatId = doc.id;
        }
      });
      
      if (existingChatId) {
        return existingChatId;
      }
      
      // Crear nuevo chat
      const newChatRef = await addDoc(chatsRef, {
        participantIds: [userId1, userId2],
        participants: [], // Will be populated by the real-time listener
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        }
      });
      
      return newChatRef.id;
    }, `getOrCreateChat(${userId1}, ${userId2})`);
  },

  // Obtener chats del usuario
  async getUserChats(userId: string): Promise<Chat[]> {
    return await safeFirestoreRead(async () => {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chats: Chat[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const chatData = docSnap.data();
        
        // Populate participants with full User objects
        const participants: User[] = [];
        if (chatData.participantIds) {
          for (const participantId of chatData.participantIds) {
            const user = await userService.getUser(participantId);
            if (user) {
              participants.push(user);
            }
          }
        }
        
        chats.push({ 
          id: docSnap.id, 
          ...chatData,
          participants 
        } as unknown as Chat);
      }
      
      return chats;
    }, [], `getUserChats(${userId})`);
  },

  // Escuchar chats en tiempo real
  onChatsChange(userId: string, callback: (chats: Chat[]) => void): Unsubscribe {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, async (querySnapshot) => {
      const chats: Chat[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as any;
        
        // Populate participant User objects
        const participants: User[] = [];
        if (chatData.participantIds) {
          for (const participantId of chatData.participantIds) {
            const user = await userService.getUser(participantId);
            if (user) {
              participants.push(user);
            }
          }
        }
        
        chats.push({
          ...chatData,
          participants
        } as Chat);
      }
      
      callback(chats);
    });
  },

  // Alias para compatibilidad con useChat hook
  getUserChatsRealtime(userId: string, callback: (chats: Chat[]) => void): Unsubscribe {
    return this.onChatsChange(userId, callback);
  }
};

// Servicios de mensajes
export const messageService = {

  // Enviar mensaje
  async sendMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'audio' | 'location' | 'file';
    imageUrl?: string;
    audioUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  }): Promise<string> {
    return await safeFirestoreWrite(async () => {
      const { 
        chatId, 
        senderId, 
        content, 
        type = 'text', 
        imageUrl,
        audioUrl,
        fileUrl,
        fileName,
        fileSize,
        location
      } = data;
      
      // Validar que el chat existe y obtener participantes
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error('Chat no encontrado');
      }
      
      const chatData = chatSnap.data();
      const participantIds = chatData.participantIds || [];
      
      // Verificar que el sender es un participante
      if (!participantIds.includes(senderId)) {
        throw new Error('No tienes permiso para enviar mensajes en este chat');
      }
      
      // Obtener datos de los usuarios para validar restricciones
      const otherParticipantId = participantIds.find((id: string) => id !== senderId);
      if (otherParticipantId) {
        const senderUserRef = doc(db, 'users', senderId);
        const otherUserRef = doc(db, 'users', otherParticipantId);
        
        const [senderSnap, otherSnap] = await Promise.all([
          getDoc(senderUserRef),
          getDoc(otherUserRef)
        ]);
        
        if (senderSnap.exists() && otherSnap.exists()) {
          const senderData = senderSnap.data() as User;
          const otherData = otherSnap.data() as User;
          
          // Validación básica: verificar que no sea el mismo usuario
          if (senderId === otherParticipantId) {
            throw new Error('No puedes enviarte mensajes a ti mismo');
          }
        }
      }
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      const messageData = {
        chatId,
        senderId,
        content,
        type,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        readBy: [senderId],
        ...(imageUrl && { imageUrl }),
        ...(audioUrl && { audioUrl }),
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        ...(fileSize && { fileSize }),
        ...(location && { location })
      };
      
      const messageRef = await addDoc(messagesRef, messageData);
      
      // Actualizar último mensaje del chat
      await updateDoc(chatRef, {
        lastMessage: {
          id: messageRef.id,
          ...messageData,
          timestamp: Timestamp.now()
        },
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Incrementar contador de no leídos para el receptor
      if (otherParticipantId) {
        await updateDoc(chatRef, {
          [`unreadCount.${otherParticipantId}`]: increment(1)
        });
      }
      
      return messageRef.id;
    }, `sendMessage(${data.chatId})`);
  },

  // Obtener mensajes del chat (versión simple)
  async getChatMessagesSimple(chatId: string, limitCount: number = 50): Promise<Message[]> {
    return await safeFirestoreRead(async () => {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      return messages.reverse(); // Mostrar en orden cronológico
    }, [], `getChatMessagesSimple(${chatId})`);
  },

  // Escuchar mensajes en tiempo real
  onMessagesChange(
    chatId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      callback(messages.reverse());
    });
  },

  // Función para useChat hook - obtener mensajes en tiempo real con paginación
  getChatMessagesRealtime(
    chatId: string,
    callback: (messages: Message[], lastDoc: any, hasMore: boolean) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === limitCount;
      
      callback(messages.reverse(), lastDoc, hasMore);
    });
  },

  // Función para obtener mensajes con paginación
  async getChatMessages(
    chatId: string,
    limitCount: number = 50,
    startAfterDoc?: any
  ): Promise<{ messages: Message[]; lastDoc: any; hasMore: boolean }> {
    return await safeFirestoreRead(async () => {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      let q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (startAfterDoc) {
        q = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          limit(limitCount),
          startAfter(startAfterDoc)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === limitCount;
      
      return {
        messages: messages.reverse(),
        lastDoc,
        hasMore
      };
    }, { messages: [], lastDoc: null as any, hasMore: false }, `getChatMessages(${chatId})`);
  },

  // Marcar mensajes como leídos
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('readBy', 'not-in', [[userId]])
      );
      
      const querySnapshot = await getDocs(q);
      const batch: Promise<void>[] = [];
      
      querySnapshot.forEach((doc) => {
        batch.push(
          updateDoc(doc.ref, {
            readBy: arrayUnion(userId)
          })
        );
      });
      
      await Promise.all(batch);
      
      // Resetear contador de no leídos
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0
      });
    }, `markMessagesAsRead(${chatId}, ${userId})`);
  },

  // Editar mensaje
  async editMessage(chatId: string, messageId: string, newContent: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp()
      });
    }, `editMessage(${chatId}, ${messageId})`);
  },

  // Eliminar mensaje
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    return await safeFirestoreWrite(async () => {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await deleteDoc(messageRef);
    }, `deleteMessage(${chatId}, ${messageId})`);
  }
};