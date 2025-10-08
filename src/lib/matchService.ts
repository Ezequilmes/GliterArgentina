import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';
import { chatService } from '@/services/chatService';
import { analyticsService } from '@/services/analyticsService';

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Timestamp;
  isActive: boolean;
  lastActivity?: Timestamp;
  chatId?: string;
}

export interface MatchNotification {
  id: string;
  userId: string;
  type: 'match' | 'super_like' | 'like';
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export const matchService = {
  // Obtener matches del usuario
  async getUserMatches(userId: string): Promise<Match[]> {
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('user1Id', '==', userId),
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc')
    );
    
    const q2 = query(
      matchesRef,
      where('user2Id', '==', userId),
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc')
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q),
      getDocs(q2)
    ]);

    const matches: Match[] = [];
    
    snapshot1.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() } as Match);
    });
    
    snapshot2.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() } as Match);
    });

    // Ordenar por fecha de creación
    return matches.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  },

  // Crear un match
  async createMatch(user1Id: string, user2Id: string): Promise<string> {
    const matchesRef = collection(db, 'matches');
    
    // Verificar si ya existe un match
    const existingMatch = await this.getExistingMatch(user1Id, user2Id);
    if (existingMatch) {
      return existingMatch.id;
    }

    // Crear el chat
    const chatId = await chatService.getOrCreateChat(user1Id, user2Id);

    // Crear el match
    const matchDoc = await addDoc(matchesRef, {
      user1Id,
      user2Id,
      createdAt: serverTimestamp(),
      isActive: true,
      lastActivity: serverTimestamp(),
      chatId
    });

    // Track match created event
    try {
      analyticsService.trackMatchCreated();
    } catch (error) {
      console.error('Error tracking match created:', error);
    }

    // Crear notificaciones para ambos usuarios
    await notificationService.createMatchNotification(user1Id, user2Id, 'match');
    await notificationService.createMatchNotification(user2Id, user1Id, 'match');

    return matchDoc.id;
  },

  // Verificar si existe un match entre dos usuarios
  async getExistingMatch(user1Id: string, user2Id: string): Promise<Match | null> {
    const matchesRef = collection(db, 'matches');
    
    const q1 = query(
      matchesRef,
      where('user1Id', '==', user1Id),
      where('user2Id', '==', user2Id),
      limit(1)
    );
    
    const q2 = query(
      matchesRef,
      where('user1Id', '==', user2Id),
      where('user2Id', '==', user1Id),
      limit(1)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    if (!snapshot1.empty) {
      const doc = snapshot1.docs[0];
      return { id: doc.id, ...doc.data() } as Match;
    }

    if (!snapshot2.empty) {
      const doc = snapshot2.docs[0];
      return { id: doc.id, ...doc.data() } as Match;
    }

    return null;
  },

  // Actualizar actividad del match
  async updateMatchActivity(matchId: string): Promise<void> {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      lastActivity: serverTimestamp()
    });
  },

  // Desactivar un match
  async deactivateMatch(matchId: string): Promise<void> {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      isActive: false
    });
  },

  // Escuchar cambios en matches en tiempo real
  onMatchesChange(userId: string, callback: (matches: Match[]) => void): Unsubscribe {
    const matchesRef = collection(db, 'matches');
    
    const q1 = query(
      matchesRef,
      where('user1Id', '==', userId),
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc')
    );
    
    const q2 = query(
      matchesRef,
      where('user2Id', '==', userId),
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc')
    );

    let matches1: Match[] = [];
    let matches2: Match[] = [];

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      matches1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      const allMatches = [...matches1, ...matches2].sort((a, b) => 
        (b.lastActivity?.toMillis() || 0) - (a.lastActivity?.toMillis() || 0)
      );
      callback(allMatches);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      matches2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      const allMatches = [...matches1, ...matches2].sort((a, b) => 
        (b.lastActivity?.toMillis() || 0) - (a.lastActivity?.toMillis() || 0)
      );
      callback(allMatches);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }
};

export const notificationService = {
  // Crear notificación de match
  async createMatchNotification(
    userId: string, 
    fromUserId: string, 
    type: 'match' | 'super_like' | 'like'
  ): Promise<void> {
    // Obtener información del usuario que envía la notificación
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUser = fromUserDoc.data() as User;

    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      type,
      fromUserId,
      fromUserName: fromUser.name,
      fromUserPhoto: fromUser.photos?.[0],
      isRead: false,
      createdAt: serverTimestamp()
    });
  },

  // Obtener notificaciones del usuario
  async getUserNotifications(userId: string): Promise<MatchNotification[]> {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchNotification));
  },

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  },

  // Marcar todas las notificaciones como leídas
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
  },

  // Escuchar notificaciones en tiempo real
  onNotificationsChange(userId: string, callback: (notifications: MatchNotification[]) => void): Unsubscribe {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchNotification));
      callback(notifications);
    });
  },

  // Obtener número de notificaciones no leídas
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }
};