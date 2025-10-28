import { Timestamp } from 'firebase/firestore';
import { AuthUser } from '@/lib/auth';

// Tipos de usuario
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  sexualRole: 'active' | 'passive' | 'versatile';
  profilePhoto?: string;
  photos?: string[];
  additionalPhotos?: string[];
  bio?: string;
  interests?: string[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  distance?: number; // Distance in kilometers (calculated dynamically)
  isOnline: boolean;
  isVerified?: boolean;
  verificationLevel?: 'basic' | 'verified' | 'premium';
  lastSeen: Timestamp;
  isPremium: boolean;
  premiumExpiry?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isBlocked?: boolean;
  blockedUsers?: string[];
  favoriteUsers?: string[];
  likedUsers?: string[];
  passedUsers?: string[];
  superLikedUsers?: string[];
  receivedSuperLikes?: string[];
  superLikes?: number;
  matches?: string[];
  settings?: UserSettings;
}

export interface UserSettings {
  notifications: {
    messages: boolean;
    matches: boolean;
    marketing: boolean;
  };
  privacy: {
    showOnline: boolean;
    showDistance: boolean;
    showAge: boolean;
  };
  searchPreferences: {
    maxDistance: number; // en kilómetros
    ageRange: {
      min: number;
      max: number;
    };
    genders: ('male' | 'female' | 'other')[];
    sexualRoles: ('active' | 'passive' | 'versatile')[];
  };
}

// Tipos de chat
export interface Chat {
  id: string;
  participants: string[]; // Array de IDs de usuarios
  participantIds: string[]; // Array de IDs de usuarios (para reglas de Firestore)
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
    type: string;
  };
  lastActivity: Timestamp;
  unreadCount: { [userId: string]: number };
  isActive: boolean;
  chatType: 'direct' | 'group';
  groupName?: string;
  groupAvatar?: string;
  groupAdmins?: string[];
  matchId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Chat con participantes poblados como objetos User completos
export interface PopulatedChat extends Omit<Chat, 'participants'> {
  participants: User[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'location' | 'file';
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
  createdAt: Timestamp;
  timestamp: Timestamp;
  readBy: string[];
  edited?: boolean;
  editedAt?: Timestamp;
  status?: 'sending' | 'sent' | 'delivered' | 'failed' | 'retrying';
}

// Tipos de geolocalización
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  city?: string;
  country?: string;
}

export interface UserDistance {
  user: User;
  distance: number; // en kilómetros
}

// Tipos de membresía
export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // en días
  features: string[];
  isPopular?: boolean;
}

export interface PaymentIntent {
  id: string;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  mercadoPagoId?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Timestamp;
}

// Tipos de notificaciones
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'match' | 'premium' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Timestamp;
}

// Tipos de reportes
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

// Tipos de componentes
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent' | 'soft';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'accent' | 'gold' | 'muted';
  padding?: 'none' | 'sm' | 'default' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

// Tipos de formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other' | '';
  sexualRole: 'active' | 'passive' | 'versatile' | '';
  acceptTerms?: boolean;
}

export interface ProfileForm {
  name: string;
  age: number;
  bio: string;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  sexualRole: 'active' | 'passive' | 'versatile';
}

// Tipos de contexto
export interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  isVerified: boolean;
  login: (data: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createChat: (participantId: string) => Promise<string>;
  setCurrentChat: (chat: Chat | null) => void;
}

// Tipos de utilidades
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchFilters {
  maxDistance?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  genders?: ('male' | 'female' | 'other')[];
  sexualRoles?: ('active' | 'passive' | 'versatile')[];
  isOnline?: boolean;
  isPremium?: boolean;
}