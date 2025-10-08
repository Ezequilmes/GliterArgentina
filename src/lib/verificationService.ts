import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface VerificationRequest {
  id?: string;
  userId: string;
  type: 'photo' | 'phone' | 'email' | 'identity';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  documents?: string[]; // URLs de documentos subidos
  notes?: string;
  rejectionReason?: string;
}

export interface VerificationStatus {
  photoVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  verificationLevel: 'none' | 'basic' | 'verified' | 'premium';
  lastVerificationUpdate?: Timestamp;
}

class VerificationService {
  // Solicitar verificación
  async requestVerification(
    userId: string, 
    type: VerificationRequest['type'], 
    documents?: string[]
  ): Promise<string> {
    try {
      const verificationData: Omit<VerificationRequest, 'id'> = {
        userId,
        type,
        status: 'pending',
        submittedAt: serverTimestamp() as Timestamp,
        documents: documents || []
      };

      const docRef = await addDoc(collection(db, 'verificationRequests'), verificationData);
      
      // Actualizar el estado del usuario
      await this.updateUserVerificationStatus(userId, type, 'pending');
      
      return docRef.id;
    } catch (error) {
      console.error('Error requesting verification:', error);
      throw error;
    }
  }

  // Obtener solicitudes de verificación del usuario
  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    try {
      const q = query(
        collection(db, 'verificationRequests'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VerificationRequest));
    } catch (error) {
      console.error('Error getting verification requests:', error);
      throw error;
    }
  }

  // Verificar teléfono (simulado - en producción usarías SMS)
  async verifyPhone(userId: string, phoneNumber: string, code: string): Promise<boolean> {
    try {
      // En producción, aquí verificarías el código SMS
      // Por ahora, simulamos que cualquier código de 6 dígitos es válido
      if (code.length === 6 && /^\d+$/.test(code)) {
        await this.updateUserVerificationStatus(userId, 'phone', 'approved');
        
        // Actualizar el número de teléfono verificado
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          phoneNumber,
          phoneVerified: true
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying phone:', error);
      throw error;
    }
  }

  // Verificar email
  async verifyEmail(userId: string, email: string): Promise<boolean> {
    try {
      // En producción, aquí enviarías un email de verificación
      // Por ahora, marcamos como verificado directamente
      await this.updateUserVerificationStatus(userId, 'email', 'approved');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        email,
        emailVerified: true
      });
      
      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }

  // Actualizar estado de verificación del usuario
  private async updateUserVerificationStatus(
    userId: string, 
    type: VerificationRequest['type'], 
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = {
        lastVerificationUpdate: serverTimestamp()
      };

      // Actualizar el campo específico de verificación
      switch (type) {
        case 'photo':
          updateData.photoVerified = status === 'approved';
          break;
        case 'phone':
          updateData.phoneVerified = status === 'approved';
          break;
        case 'email':
          updateData.emailVerified = status === 'approved';
          break;
        case 'identity':
          updateData.identityVerified = status === 'approved';
          break;
      }

      // Calcular el nivel de verificación
      updateData.verificationLevel = this.calculateVerificationLevel({
        photoVerified: type === 'photo' ? status === 'approved' : false,
        phoneVerified: type === 'phone' ? status === 'approved' : false,
        emailVerified: type === 'email' ? status === 'approved' : false,
        identityVerified: type === 'identity' ? status === 'approved' : false
      });

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }

  // Calcular nivel de verificación
  private calculateVerificationLevel(status: Partial<VerificationStatus>): string {
    const verifiedCount = Object.values(status).filter(Boolean).length;
    
    if (verifiedCount === 0) return 'none';
    if (verifiedCount === 1) return 'basic';
    if (verifiedCount >= 2 && verifiedCount < 4) return 'verified';
    if (verifiedCount === 4) return 'premium';
    
    return 'none';
  }

  // Obtener estadísticas de verificación
  async getVerificationStats(userId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
  }> {
    try {
      const requests = await this.getUserVerificationRequests(userId);
      
      return {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      throw error;
    }
  }

  // Verificar si el usuario puede solicitar un tipo de verificación
  canRequestVerification(
    requests: VerificationRequest[], 
    type: VerificationRequest['type']
  ): boolean {
    const typeRequests = requests.filter(r => r.type === type);
    const latestRequest = typeRequests[0]; // Ya están ordenados por fecha desc
    
    // Si no hay solicitudes previas, puede solicitar
    if (!latestRequest) return true;
    
    // Si la última solicitud fue rechazada hace más de 24 horas, puede volver a solicitar
    if (latestRequest.status === 'rejected') {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return !!(latestRequest.reviewedAt && latestRequest.reviewedAt.toDate() < dayAgo);
    }
    
    // Si está pendiente o aprobada, no puede solicitar de nuevo
    return false;
  }
}

export const verificationService = new VerificationService();