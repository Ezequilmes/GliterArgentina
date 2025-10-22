import { 
  collection, 
  doc, 
  setDoc, 
  Timestamp,
  addDoc 
} from 'firebase/firestore';
import { db } from './firebase';

// Función para crear códigos promocionales de ejemplo
export const createSamplePromoCodes = async () => {
  try {
    const promoCodes = [
      {
        code: 'GLITERFREE2025',
        type: 'free_month',
        active: true,
        maxUses: 100,
        used: 0,
        expires: '2025-12-31',
        description: 'Un mes de Premium gratis para nuevos usuarios',
        createdAt: Timestamp.now(),
        createdBy: 'admin'
      },
      {
        code: 'PREMIUM30',
        type: 'free_month',
        active: true,
        maxUses: 50,
        used: 0,
        expires: '2025-06-30',
        description: 'Mes gratis de Premium - Campaña especial',
        createdAt: Timestamp.now(),
        createdBy: 'admin'
      },
      {
        code: 'DESTACADO15',
        type: 'highlight',
        active: true,
        maxUses: 200,
        used: 0,
        expires: '2025-12-31',
        description: 'Perfil destacado por 15 días',
        createdAt: Timestamp.now(),
        createdBy: 'admin'
      },
      {
        code: 'DESCUENTO50',
        type: 'discount',
        active: true,
        maxUses: 75,
        used: 0,
        expires: '2025-08-31',
        description: '50% de descuento por 30 días',
        createdAt: Timestamp.now(),
        createdBy: 'admin'
      }
    ];

    for (const promoCode of promoCodes) {
      await setDoc(doc(db, 'promo_codes', promoCode.code), promoCode);
      console.log(`Código promocional ${promoCode.code} creado`);
    }

    console.log('Códigos promocionales de ejemplo creados exitosamente');
  } catch (error) {
    console.error('Error al crear códigos promocionales:', error);
  }
};

// Función para configurar el rol de administrador
export const setupAdminUser = async (email: string = 'admin@gliter.com.ar') => {
  try {
    // Nota: En producción, esto se haría después de que el usuario se registre
    // Por ahora, creamos un documento de ejemplo
    const adminData = {
      email: email,
      role: 'admin',
      createdAt: Timestamp.now(),
      permissions: [
        'manage_exclusives',
        'manage_promo_codes',
        'manage_users',
        'view_analytics'
      ]
    };

    // Este documento se creará cuando el admin se registre por primera vez
    console.log('Configuración de admin preparada para:', email);
    return adminData;
  } catch (error) {
    console.error('Error al configurar usuario admin:', error);
  }
};

// Función para crear una card exclusiva de ejemplo
export const createSampleExclusive = async () => {
  try {
    const sampleExclusive = {
      name: 'Sofia Martinez',
      age: 25,
      location: 'Buenos Aires',
      services: ['Masajes relajantes', 'Terapia de parejas'],
      photos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg'
      ],
      videos: [
        'https://example.com/video1.mp4'
      ],
      whatsapp: '+5491123456789',
      instagram: '@sofia_martinez_oficial',
      email: 'sofia@example.com',
      subscriptionStatus: 'active',
      validUntil: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 días
      tokenUsed: 'MODELO-INVITE-2025',
      createdAt: Timestamp.now(),
      approvedAt: Timestamp.now(),
      approvedBy: 'admin',
      featured: false,
      rating: 4.8,
      reviewCount: 23
    };

    const docRef = await addDoc(collection(db, 'exclusives'), sampleExclusive);
    console.log('Card exclusiva de ejemplo creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear card exclusiva de ejemplo:', error);
  }
};

// Función para inicializar todas las colecciones
export const initializeFirestoreCollections = async () => {
  console.log('Inicializando colecciones de Firestore...');
  
  await createSamplePromoCodes();
  await setupAdminUser();
  await createSampleExclusive();
  
  console.log('Inicialización de Firestore completada');
};

// Tipos TypeScript para las colecciones
export interface PromoCode {
  code: string;
  type: 'discount' | 'free_month' | 'highlight';
  active: boolean;
  maxUses: number;
  used: number;
  expires: string;
  description: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Exclusive {
  name: string;
  age: number;
  location: string;
  services: string[];
  photos: string[];
  videos: string[];
  whatsapp: string;
  instagram: string;
  email: string;
  subscriptionStatus: 'pending' | 'active' | 'expired' | 'rejected';
  validUntil?: Timestamp;
  tokenUsed: string;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  featured: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface AdminUser {
  email: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  permissions: string[];
}