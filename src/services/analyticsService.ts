import { analytics } from '@/lib/firebase';
import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';

// Tipos de eventos personalizados para la app de citas
export interface AnalyticsEvents {
  // Eventos de autenticación
  user_signup: {
    method: 'email' | 'google' | 'facebook';
    age_range?: string;
    gender?: string;
  };
  user_login: {
    method: 'email' | 'google' | 'facebook';
  };
  user_logout: {};

  // Eventos de perfil
  profile_completed: {
    completion_percentage: number;
    has_photos: boolean;
    has_bio: boolean;
  };
  profile_photo_uploaded: {
    photo_count: number;
    is_first_photo: boolean;
  };
  profile_updated: {};

  // Eventos de descubrimiento
  profile_viewed: {
    viewed_user_age?: number;
    viewed_user_distance?: number;
  };
  profile_liked: {
    liked_user_age?: number;
    liked_user_distance?: number;
  };
  profile_passed: {
    passed_user_age?: number;
    passed_user_distance?: number;
  };
  super_like_sent: {
    liked_user_age?: number;
    liked_user_distance?: number;
  };

  // Eventos de matches
  match_created: {
    match_user_age?: number;
    match_user_distance?: number;
    time_to_match_hours?: number;
  };

  // Eventos de chat
  message_sent: {
    message_type: 'text' | 'image' | 'audio' | 'location' | 'file' | 'gif' | 'emoji';
    message_length: number;
    match_age_hours?: number;
  };
  chat_opened: {
    match_age_hours?: number;
  };

  // Eventos de premium
  premium_viewed: {
    source: 'discover' | 'matches' | 'settings' | 'popup';
  };
  premium_purchase_started: {
    plan_type: 'monthly' | 'yearly';
    price: number;
  };
  premium_purchase_completed: {
    plan_type: 'monthly' | 'yearly';
    price: number;
    payment_method: 'mercadopago';
  };

  // Eventos de ubicación
  location_permission_granted: {};
  location_permission_denied: {};
  location_updated: {
    accuracy?: number;
  };

  // Eventos de notificaciones
  notification_permission_granted: {};
  notification_permission_denied: {};
  push_notification_received: {
    type: 'match' | 'message' | 'like' | 'general';
  };
  push_notification_clicked: {
    type: 'match' | 'message' | 'like' | 'general';
  };
}

class AnalyticsService {
  private isInitialized = false;

  constructor() {
    // Verificar si Analytics está disponible
    if (typeof window !== 'undefined' && analytics) {
      this.isInitialized = true;
    }
  }

  /**
   * Registra un evento personalizado
   */
  trackEvent<K extends keyof AnalyticsEvents>(
    eventName: K,
    parameters: AnalyticsEvents[K]
  ): void {
    if (!this.isInitialized || !analytics) {
      console.warn('Analytics not initialized');
      return;
    }

    try {
      logEvent(analytics, eventName, parameters);
      console.log(`📊 Analytics event: ${eventName}`, parameters);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Establece el ID del usuario para Analytics
   */
  setUser(userId: string): void {
    if (!this.isInitialized || !analytics) {
      return;
    }

    try {
      setUserId(analytics, userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  /**
   * Establece propiedades del usuario
   */
  setUserProperties(properties: {
    age_range?: string;
    gender?: string;
    is_premium?: boolean;
    location_city?: string;
    location_country?: string;
    signup_date?: string;
    last_active?: string;
  }): void {
    if (!this.isInitialized || !analytics) {
      return;
    }

    try {
      setUserProperties(analytics, properties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }

  setUserId(userId: string): void {
    if (!this.isInitialized || !analytics) {
      return;
    }

    try {
      setUserId(analytics, userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  /**
   * Eventos específicos para la app de citas
   */
  
  // Autenticación
  trackSignup(method: 'email' | 'google' | 'facebook', userInfo?: { age?: number; gender?: string }) {
    this.trackEvent('user_signup', {
      method,
      age_range: userInfo?.age ? this.getAgeRange(userInfo.age) : undefined,
      gender: userInfo?.gender
    });
  }

  trackLogin(method: 'email' | 'google' | 'facebook') {
    this.trackEvent('user_login', { method });
  }

  trackLogout() {
    this.trackEvent('user_logout', {});
  }

  // Perfil
  trackProfileCompleted(completionPercentage: number, hasPhotos: boolean, hasBio: boolean) {
    this.trackEvent('profile_completed', {
      completion_percentage: completionPercentage,
      has_photos: hasPhotos,
      has_bio: hasBio
    });
  }

  trackPhotoUploaded(photoCount: number, isFirstPhoto: boolean) {
    this.trackEvent('profile_photo_uploaded', {
      photo_count: photoCount,
      is_first_photo: isFirstPhoto
    });
  }

  trackProfileUpdated() {
    this.trackEvent('profile_updated', {});
  }

  // Descubrimiento
  trackProfileViewed(viewedUserAge?: number, distance?: number) {
    this.trackEvent('profile_viewed', {
      viewed_user_age: viewedUserAge,
      viewed_user_distance: distance
    });
  }

  trackProfileLiked(likedUserAge?: number, distance?: number) {
    this.trackEvent('profile_liked', {
      liked_user_age: likedUserAge,
      liked_user_distance: distance
    });
  }

  trackProfilePassed(passedUserAge?: number, distance?: number) {
    this.trackEvent('profile_passed', {
      passed_user_age: passedUserAge,
      passed_user_distance: distance
    });
  }

  trackSuperLike(likedUserAge?: number, distance?: number) {
    this.trackEvent('super_like_sent', {
      liked_user_age: likedUserAge,
      liked_user_distance: distance
    });
  }

  // Matches
  trackMatchCreated(matchUserAge?: number, distance?: number, timeToMatchHours?: number) {
    this.trackEvent('match_created', {
      match_user_age: matchUserAge,
      match_user_distance: distance,
      time_to_match_hours: timeToMatchHours
    });
  }

  // Chat
  trackMessageSent(messageType: 'text' | 'image' | 'audio' | 'location' | 'file' | 'gif' | 'emoji', messageLength: number, matchAgeHours?: number) {
    this.trackEvent('message_sent', {
      message_type: messageType,
      message_length: messageLength,
      match_age_hours: matchAgeHours
    });
  }

  trackChatOpened(matchAgeHours?: number) {
    this.trackEvent('chat_opened', {
      match_age_hours: matchAgeHours
    });
  }

  // Premium
  trackPremiumViewed(source: 'discover' | 'matches' | 'settings' | 'popup') {
    this.trackEvent('premium_viewed', { source });
  }

  trackPremiumPurchaseStarted(planType: 'monthly' | 'yearly', price: number) {
    this.trackEvent('premium_purchase_started', {
      plan_type: planType,
      price
    });
  }

  trackPremiumPurchaseCompleted(planType: 'monthly' | 'yearly', price: number) {
    this.trackEvent('premium_purchase_completed', {
      plan_type: planType,
      price,
      payment_method: 'mercadopago'
    });
  }

  // Ubicación
  trackLocationPermissionGranted() {
    this.trackEvent('location_permission_granted', {});
  }

  trackLocationPermissionDenied() {
    this.trackEvent('location_permission_denied', {});
  }

  trackLocationUpdated(accuracy?: number) {
    this.trackEvent('location_updated', { accuracy });
  }

  // Notificaciones
  trackNotificationPermissionGranted() {
    this.trackEvent('notification_permission_granted', {});
  }

  trackNotificationPermissionDenied() {
    this.trackEvent('notification_permission_denied', {});
  }

  trackPushNotificationReceived(type: 'match' | 'message' | 'like' | 'general') {
    this.trackEvent('push_notification_received', { type });
  }

  trackPushNotificationClicked(type: 'match' | 'message' | 'like' | 'general') {
    this.trackEvent('push_notification_clicked', { type });
  }

  /**
   * Utilidades
   */
  private getAgeRange(age: number): string {
    if (age < 20) return '18-19';
    if (age < 25) return '20-24';
    if (age < 30) return '25-29';
    if (age < 35) return '30-34';
    if (age < 40) return '35-39';
    if (age < 45) return '40-44';
    if (age < 50) return '45-49';
    return '50+';
  }
}

// Exportar instancia singleton
export const analyticsService = new AnalyticsService();
export default analyticsService;