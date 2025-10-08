import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'super_like' | 'visit' | 'verification' | 'premium';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type: Notification['type'];
  data?: Record<string, any>;
  expiresIn?: number; // milliseconds
}

export class NotificationService {
  private static instance: NotificationService;
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Crear una nueva notificación
  async createNotification(userId: string, options: NotificationOptions): Promise<string> {
    try {
      const notificationData = {
        userId,
        type: options.type,
        title: options.title,
        message: options.message,
        data: options.data || {},
        read: false,
        createdAt: serverTimestamp(),
        ...(options.expiresIn && {
          expiresAt: new Date(Date.now() + options.expiresIn)
        })
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const batch: Promise<void>[] = [];
        snapshot.docs.forEach((doc) => {
          batch.push(updateDoc(doc.ref, { read: true }));
        });
        
        if (batch.length > 0) {
          await Promise.all(batch);
        }
        unsubscribe();
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Eliminar notificación
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Escuchar notificaciones en tiempo real
  subscribeToNotifications(
    userId: string, 
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));

      callback(notifications);
    });

    this.listeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  // Obtener conteo de notificaciones no leídas
  subscribeToUnreadCount(
    userId: string,
    callback: (count: number) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  }

  // Limpiar notificaciones expiradas
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'notifications'),
        where('expiresAt', '<=', now)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const batch: Promise<void>[] = [];
        snapshot.docs.forEach((doc) => {
          batch.push(deleteDoc(doc.ref));
        });
        
        if (batch.length > 0) {
          await Promise.all(batch);
        }
        unsubscribe();
      });
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Crear notificaciones específicas
  async createMatchNotification(userId: string, matchedUser: { name: string; id: string }): Promise<string> {
    return this.createNotification(userId, {
      type: 'match',
      title: '¡Nuevo Match! 💕',
      message: `¡Tienes un nuevo match con ${matchedUser.name}!`,
      data: { matchedUserId: matchedUser.id }
    });
  }

  async createMessageNotification(userId: string, sender: { name: string; id: string }, preview: string): Promise<string> {
    return this.createNotification(userId, {
      type: 'message',
      title: `Mensaje de ${sender.name}`,
      message: preview.length > 50 ? `${preview.substring(0, 50)}...` : preview,
      data: { senderId: sender.id }
    });
  }

  async createLikeNotification(userId: string, liker: { name: string; id: string }): Promise<string> {
    return this.createNotification(userId, {
      type: 'like',
      title: '¡Te han dado like! 👍',
      message: `A ${liker.name} le gustas`,
      data: { likerId: liker.id },
      expiresIn: 24 * 60 * 60 * 1000 // 24 horas
    });
  }

  async createSuperLikeNotification(userId: string, superLiker: { name: string; id: string }): Promise<string> {
    return this.createNotification(userId, {
      type: 'super_like',
      title: '¡Super Like! ⭐',
      message: `¡${superLiker.name} te ha dado un Super Like!`,
      data: { superLikerId: superLiker.id }
    });
  }

  async createVisitNotification(userId: string, visitor: { name: string; id: string }): Promise<string> {
    return this.createNotification(userId, {
      type: 'visit',
      title: 'Visita a tu perfil 👀',
      message: `${visitor.name} visitó tu perfil`,
      data: { visitorId: visitor.id },
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
  }

  async createVerificationNotification(userId: string, status: 'approved' | 'rejected', type: string): Promise<string> {
    const isApproved = status === 'approved';
    return this.createNotification(userId, {
      type: 'verification',
      title: isApproved ? '✅ Verificación Aprobada' : '❌ Verificación Rechazada',
      message: isApproved 
        ? `Tu verificación de ${type} ha sido aprobada`
        : `Tu verificación de ${type} ha sido rechazada`,
      data: { verificationType: type, status }
    });
  }

  async createPremiumNotification(userId: string, action: 'activated' | 'expired'): Promise<string> {
    const isActivated = action === 'activated';
    return this.createNotification(userId, {
      type: 'premium',
      title: isActivated ? '🌟 Premium Activado' : '⏰ Premium Expirado',
      message: isActivated 
        ? '¡Bienvenido a Gliter Premium! Disfruta de todas las funciones exclusivas'
        : 'Tu suscripción Premium ha expirado. Renueva para seguir disfrutando de las funciones exclusivas',
      data: { action }
    });
  }

  // Limpiar listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const notificationService = NotificationService.getInstance();