'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { DiscoverFilters, FilterOptions } from '@/components/discover';
import { ProfileGrid } from '@/components/discover/ProfileGrid';
import { Button, Loading } from '@/components/ui';
import { SuperLikeCounter, PremiumModal } from '@/components/premium';
import { LocationStatus } from '@/components/location';
import { DonationButton } from '@/components/donation';
import { useToast } from '@/components/ui/Toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ActionFeedback from '@/components/ui/ActionFeedback';
import { UserCard } from '@/components/profile';
import { Settings, Filter, MapPin, User as UserIcon, MessageCircle, Users, Shield, RefreshCw, AlertCircle, Check, AlertTriangle, Bell } from 'lucide-react';
import { userService } from '@/lib/firestore';
import { matchService } from '@/lib/matchService';
import { chatService } from '@/services/chatService';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouter } from 'next/navigation';
import { analyticsService } from '@/services/analyticsService';
import { fcmService } from '@/services/fcmService';
import type { User, UserDistance } from '@/types';

export default function DiscoverPage() {
  const { user } = useAuth();
  const { 
    location, 
    error: locationError, 
    loading: locationLoading,
    permissionState,
    retryCount,
    isWatching,
    getCurrentLocation,
    watchLocation,
    stopWatching
  } = useGeolocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  const { addToast } = useToast();
  const router = useRouter();
  
  // Debug logs at component initialization
  console.log('🚀 DiscoverPage component initialized');
  console.log('👤 Auth user:', user);
  console.log('📍 Geolocation:', { location, locationLoading, locationError, permissionState, retryCount });
  
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  
  const [users, setUsers] = useState<UserDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [userSuperLikes, setUserSuperLikes] = useState(0);
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    action: 'like' | 'pass' | 'superlike' | null;
    status: 'idle' | 'loading' | 'success' | 'error';
  }>({ action: null, status: 'idle' });
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [18, 50],
    maxDistance: 50,
    showMe: 'everyone',
    sexualRole: 'any',
    onlineOnly: false,
    verifiedOnly: false,
    premiumOnly: false,
    hasPhotos: true,
    interests: []
  });

  // FCM Notification states
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  // Handle location retry
  const handleLocationRetry = async () => {
    try {
      await getCurrentLocation();
      addToast({ 
        title: 'Ubicación actualizada', 
        message: 'Tu ubicación ha sido obtenida correctamente', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error retrying location:', error);
      addToast({ 
        title: 'Error de ubicación', 
        message: 'No se pudo obtener tu ubicación. Verifica los permisos.', 
        type: 'error' 
      });
    }
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    try {
      // Try to get location which will trigger permission request
      await getCurrentLocation();
    } catch (error) {
      console.error('Permission request failed:', error);
      addToast({ 
        title: 'Permisos requeridos', 
        message: 'Por favor, permite el acceso a tu ubicación en la configuración del navegador.', 
        type: 'warning' 
      });
    }
  };

  // FCM Notification functions
  const initializeFCM = async () => {
    try {
      console.log('🔔 Initializing FCM...');
      
      const isSupported = await fcmService.isNotificationSupported();
      if (!isSupported) {
        console.warn('FCM no está soportado en este navegador');
        return;
      }

      const permission = fcmService.getPermissionStatus();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        const token = await fcmService.getRegistrationToken();
        if (token) {
          setFcmToken(token);
          console.log('🔔 FCM Token obtained:', token);
        }
      }
    } catch (error) {
      console.error('❌ Error initializing FCM:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window) || typeof window.Notification === 'undefined') {
        console.warn('Notification API not available');
        return;
      }
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        const token = await fcmService.getRegistrationToken();
        setFcmToken(token);
        addToast({
          title: 'Notificaciones activadas',
          message: 'Ahora recibirás notificaciones de nuevos matches y mensajes',
          type: 'success'
        });
      } else {
        addToast({
          title: 'Notificaciones desactivadas',
          message: 'No recibirás notificaciones push',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      addToast({
        title: 'Error',
        message: 'No se pudo activar las notificaciones',
        type: 'error'
      });
    }
  };

  const sendTestNotification = async () => {
    if (!user) {
      addToast({
        title: 'Error',
        message: 'Debes estar autenticado para enviar notificaciones',
        type: 'error'
      });
      return;
    }

    setIsTestingNotification(true);

    try {
      // Importar el servicio dinámicamente
      const { fcmNotificationService } = await import('@/services/fcmNotificationService');
      
      // Solicitar permisos si no están concedidos
      const permission = await fcmNotificationService.requestPermission();
      if (permission !== 'granted') {
        addToast({
          title: 'Error',
          message: 'Permisos de notificación denegados',
          type: 'error'
        });
        return;
      }

      // Enviar notificación de prueba
      const success = await fcmNotificationService.sendTestNotification();
      
      if (success) {
        addToast({
          title: 'Notificación enviada',
          message: '✅ Notificación enviada correctamente',
          type: 'success'
        });
      } else {
        addToast({
          title: 'Error',
          message: '❌ Error enviando notificación de prueba',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error en sendTestNotification:', error);
      addToast({
        title: 'Error',
        message: '❌ Error enviando notificación de prueba',
        type: 'error'
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  useEffect(() => {
    console.log('🔍 DiscoverPage useEffect triggered');
    console.log('👤 User:', user ? `authenticated (${user.id})` : 'not authenticated');
    console.log('📍 Location:', location ? `${location.latitude}, ${location.longitude}` : 'not available');
    console.log('🔄 Loading state:', isLoading);
    console.log('🌐 Location loading:', locationLoading);
    console.log('❌ Location error:', locationError);
    console.log('🔐 Permission state:', permissionState);
    
    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }

    if (!location) {
      console.log('❌ No location available');
      if (locationError) {
        console.log('📍 Location error details:', locationError);
      }
      // Don't automatically request location - wait for user gesture
      console.log('⏳ Waiting for user to manually request location');
      return;
    }

    console.log('✅ Loading nearby users with location:', location);
    
    const loadData = async () => {
      console.log('🔍 [DiscoverPage] loadData called', { user: !!user, location: !!location });
      
      if (!user || !location) {
        console.log('⚠️ [DiscoverPage] Missing user or location', { 
          hasUser: !!user, 
          hasLocation: !!location,
          locationError,
          locationLoading,
          permissionState
        });
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('📍 [DiscoverPage] Loading data with location:', { 
          lat: location.latitude, 
          lng: location.longitude, 
          maxDistance: filters.maxDistance 
        });
        
        // Load current user data
        const userData = await userService.getUser(user.id);
        setCurrentUserData(userData);
        setUserSuperLikes(userData?.superLikes || 0);
        setUserIsPremium(userData?.isPremium || false);
        console.log('👤 [DiscoverPage] Current user data loaded:', userData?.name);

        // Load nearby users
        const nearbyUsers = await userService.getNearbyUsers(
          user.id,
          location.latitude,
          location.longitude,
          filters.maxDistance
        );
        
        console.log('👥 [DiscoverPage] Nearby users loaded:', nearbyUsers.length);
        
        // Apply additional filters
        const filteredUsers = nearbyUsers.filter(userWithDistance => {
          const targetUser = userWithDistance.user;
          
          // Exclude blocked users
          if (userData?.blockedUsers?.includes(targetUser.id)) {
            return false;
          }
          
          // Exclude users who blocked current user
          if (targetUser.blockedUsers?.includes(user.id)) {
            return false;
          }
          
          // Age filter
          if (targetUser.age && (targetUser.age < filters.ageRange[0] || targetUser.age > filters.ageRange[1])) {
            return false;
          }
          
          // Gender/Show me filter
          if (filters.showMe !== 'everyone') {
            if (filters.showMe === 'men' && targetUser.gender !== 'male') return false;
            if (filters.showMe === 'women' && targetUser.gender !== 'female') return false;
          }
          
          // Sexual role filter
          if (filters.sexualRole !== 'any' && targetUser.sexualRole !== filters.sexualRole) {
            return false;
          }
          
          // Online only filter
          if (filters.onlineOnly && !targetUser.isOnline) {
            return false;
          }
          
          // Verified only filter
          if (filters.verifiedOnly && !targetUser.isVerified) {
            return false;
          }
          
          // Premium only filter
          if (filters.premiumOnly && !targetUser.isPremium) {
            return false;
          }
          
          // Has photos filter
          if (filters.hasPhotos && (!targetUser.photos || targetUser.photos.length === 0)) {
            return false;
          }
          
          // Interests filter
          if (filters.interests.length > 0) {
            const hasMatchingInterest = filters.interests.some(interest => 
              targetUser.interests?.includes(interest)
            );
            if (!hasMatchingInterest) return false;
          }
          
          return true;
        });
        
        // Sort by distance
        filteredUsers.sort((a, b) => a.distance - b.distance);
        
        console.log('🔍 [DiscoverPage] Filtered users:', filteredUsers.length);
        console.log('📊 [DiscoverPage] Applied filters:', filters);
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error loading data:', error);
        addToast({ 
          title: 'Error al cargar datos', 
          message: 'Hubo un problema al cargar los usuarios cercanos', 
          type: 'error' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, location, locationLoading, locationError, filters, permissionState]);

  // Initialize FCM when component mounts
  useEffect(() => {
    if (user) {
      initializeFCM();
    }
  }, [user]);

  // Enhanced location error handling
  const getLocationErrorMessage = () => {
    if (!locationError) return null;

    // locationError is a string, so we check the content to determine the type
    if (locationError.includes('denied') || locationError.includes('permission')) {
      return {
        title: 'Permisos de ubicación denegados',
        message: 'Necesitamos acceso a tu ubicación para mostrarte personas cerca de ti.',
        action: 'Permitir ubicación',
        icon: Shield,
        variant: 'warning' as const
      };
    } else if (locationError.includes('unavailable') || locationError.includes('position')) {
      return {
        title: 'Ubicación no disponible',
        message: 'No se pudo determinar tu ubicación. Verifica tu conexión GPS.',
        action: 'Reintentar',
        icon: MapPin,
        variant: 'error' as const
      };
    } else if (locationError.includes('timeout') || locationError.includes('time')) {
      return {
        title: 'Tiempo de espera agotado',
        message: 'La solicitud de ubicación tardó demasiado. Intenta de nuevo.',
        action: 'Reintentar',
        icon: RefreshCw,
        variant: 'warning' as const
      };
    } else {
      return {
        title: 'Error de ubicación',
        message: 'Hubo un problema al obtener tu ubicación.',
        action: 'Reintentar',
        icon: AlertTriangle,
        variant: 'error' as const
      };
    }
  };

  const handleLike = async (userId: string) => {
    console.log('🔥 BUTTON PRESSED: LIKE BUTTON CLICKED!', { userId, timestamp: new Date().toISOString() });
    console.log('💖 DiscoverPage: handleLike called', { userId, currentUser: user?.id });
    if (!user) {
      console.log('❌ No user authenticated, returning early');
      return;
    }
    
    setActionFeedback({ action: 'like', status: 'loading' });
    
    try {
      await userService.likeUser(user.id, userId);
      
      // Track like event
      const likedUser = users.find(u => u.user.id === userId);
      if (likedUser) {
        analyticsService.trackProfileLiked(likedUser.user.age, likedUser.distance);
      }
      
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      setActionFeedback({ action: 'like', status: 'success' });
      addToast({ title: '¡Like enviado!', message: 'Tu like ha sido enviado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error liking user:', error);
      setActionFeedback({ action: 'like', status: 'error' });
      addToast({ title: 'Error al enviar like. Inténtalo de nuevo.', message: 'Hubo un problema al procesar tu like', type: 'error' });
    }
  };

  const handlePass = async (userId: string) => {
    if (!user) return;
    
    setActionFeedback({ action: 'pass', status: 'loading' });
    
    try {
      await userService.passUser(user.id, userId);
      
      // Track pass event
      const passedUser = users.find(u => u.user.id === userId);
      if (passedUser) {
        analyticsService.trackProfilePassed(passedUser.user.age, passedUser.distance);
      }
      
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      setActionFeedback({ action: 'pass', status: 'success' });
      addToast({ title: 'Usuario pasado', message: 'Has pasado a este usuario', type: 'info' });
    } catch (error) {
      console.error('Error passing user:', error);
      setActionFeedback({ action: 'pass', status: 'error' });
      addToast({ title: 'Error al pasar usuario. Inténtalo de nuevo.', message: 'Hubo un problema al pasar este usuario', type: 'error' });
    }
  };

  const handleSuperLike = async (userId: string) => {
    console.log('🔥 BUTTON PRESSED: SUPER LIKE BUTTON CLICKED!', { userId, timestamp: new Date().toISOString() });
    console.log('⭐ DiscoverPage: handleSuperLike called', { userId, currentUser: user?.id, userSuperLikes, userIsPremium });
    
    if (!user) {
      console.log('❌ No user authenticated, returning early');
      return;
    }
    
    // Verificar si el usuario tiene créditos disponibles o es premium
    if (!userIsPremium && userSuperLikes <= 0) {
      console.log('❌ No super likes available, showing premium modal');
      setShowPremiumModal(true);
      return;
    }
    
    setActionFeedback({ action: 'superlike', status: 'loading' });
    
    try {
      await userService.superLikeUser(user.id, userId);
      
      // Track super like event
      const superLikedUser = users.find(u => u.user.id === userId);
      if (superLikedUser) {
        analyticsService.trackSuperLike(superLikedUser.user.age, superLikedUser.distance);
      }
      
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      setActionFeedback({ action: 'superlike', status: 'success' });
      addToast({ title: '¡Super Like enviado!', message: 'Tu super like ha sido enviado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error super liking user:', error);
      setActionFeedback({ action: 'superlike', status: 'error' });
      addToast({ title: 'Error al enviar Super Like. Inténtalo de nuevo.', message: 'Hubo un problema al procesar tu super like', type: 'error' });
    }
  };

  const handleBlock = async (userId: string) => {
    console.log('🔥 BUTTON PRESSED: BLOCK BUTTON CLICKED!', { userId, timestamp: new Date().toISOString() });
    console.log('🚫 DiscoverPage: handleBlock called', { userId, currentUser: user?.id });
    if (!user) {
      console.log('❌ No user authenticated, returning early');
      return;
    }
    
    try {
      await userService.blockUser(user.id, userId);
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      addToast({ title: 'Usuario bloqueado', message: 'Has bloqueado a este usuario correctamente', type: 'success' });
    } catch (error) {
      console.error('Error blocking user:', error);
      addToast({ title: 'Error al bloquear usuario. Inténtalo de nuevo.', message: 'Hubo un problema al bloquear este usuario', type: 'error' });
    }
  };

  const handleStartChat = async (userId: string) => {
    console.log('🔥 BUTTON PRESSED: START CHAT BUTTON CLICKED!', { userId, timestamp: new Date().toISOString() });
    console.log('💬 DiscoverPage: handleStartChat called', { userId, currentUser: user?.id });
    if (!user) {
      console.log('❌ No user authenticated, returning early');
      return;
    }
    
    try {
      // Crear o obtener chat directamente sin verificar match
      const chatId = await chatService.getOrCreateChat(user.id, userId);
      router.push(`/chat/${chatId}`);
      addToast({ title: 'Chat iniciado', message: 'Puedes comenzar a chatear ahora', type: 'success' });
    } catch (error) {
      console.error('Error starting chat:', error);
      addToast({ title: 'Error al iniciar chat', message: 'Hubo un problema al iniciar el chat', type: 'error' });
    }
  };

  const handleLoadMore = async () => {
    if (!user || !location || isLoading) return;
    
    try {
      // Load more users with pagination
      const moreUsers = await userService.getNearbyUsers(
        user.id,
        location.latitude,
        location.longitude,
        filters.maxDistance,
        users.length // offset
      );
      
      setUsers(prev => [...prev, ...moreUsers]);
    } catch (error) {
      console.error('Error loading more users:', error);
    }
  };

  // Show enhanced location error if geolocation failed
  if (locationError && !location) {
    const errorInfo = getLocationErrorMessage();
    
    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in-0 duration-500">
            <div className="text-center animate-in slide-in-from-bottom-4 duration-700 delay-200 max-w-md mx-auto px-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                            animate-pulse shadow-lg border transition-all duration-300
                            ${errorInfo?.variant === 'warning' 
                              ? 'bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30' 
                              : 'bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30'
                            }`}>
                {errorInfo?.icon && (
                  <errorInfo.icon className={`w-8 h-8 ${
                    errorInfo.variant === 'warning' ? 'text-warning' : 'text-destructive'
                  }`} />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2 
                           animate-in slide-in-from-bottom-2 duration-500 delay-300">
                {errorInfo?.title}
              </h3>
              
              <p className="text-muted-foreground mb-4 
                          animate-in slide-in-from-bottom-2 duration-500 delay-400">
                {errorInfo?.message}
              </p>

              {permissionState === 'denied' && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4
                              animate-in slide-in-from-bottom-2 duration-500 delay-500">
                  <p className="text-sm text-warning-foreground">
                    <strong>Instrucciones:</strong> Ve a la configuración de tu navegador, 
                    busca los permisos de ubicación para este sitio y actívalos.
                  </p>
                </div>
              )}

              {retryCount > 0 && (
                <div className="text-xs text-muted-foreground mb-4
                              animate-in slide-in-from-bottom-2 duration-500 delay-600">
                  Intentos realizados: {retryCount}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center
                            animate-in slide-in-from-bottom-2 duration-500 delay-700">
                <Button 
                  variant="primary" 
                  onClick={permissionState === 'denied' ? handleRequestPermission : handleLocationRetry}
                  className="hover:scale-105 transition-transform duration-300"
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Obteniendo...
                    </>
                  ) : errorInfo ? (
                    <>
                      <errorInfo.icon className="w-4 h-4 mr-2" />
                      {errorInfo.action}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reintentar
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="hover:scale-105 transition-transform duration-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar página
                </Button>
              </div>

              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-left
                              animate-in slide-in-from-bottom-2 duration-500 delay-800">
                  <strong>Debug Info:</strong><br />
                  Error: {locationError}<br />
                  Permission: {permissionState}<br />
                  Retry Count: {retryCount}<br />
                  Is Watching: {isWatching ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (isLoading || locationLoading) {
    const getLoadingInfo = () => {
      if (locationLoading) {
        return {
          icon: MapPin,
          title: 'Obteniendo tu ubicación',
          message: 'Necesitamos conocer tu ubicación para mostrarte personas cerca de ti',
          submessage: permissionState === 'prompt' 
            ? 'Por favor, permite el acceso a tu ubicación cuando se solicite'
            : retryCount > 0 
              ? `Reintentando... (${retryCount}/${3})`
              : 'Esto puede tomar unos segundos...',
          color: 'primary'
        };
      }
      
      return {
        icon: Users,
        title: 'Buscando personas increíbles',
        message: 'Estamos encontrando los mejores perfiles para ti',
        submessage: 'Preparando tu experiencia de descubrimiento...',
        color: 'secondary'
      };
    };

    const loadingInfo = getLoadingInfo();
    const LoadingIcon = loadingInfo.icon;

    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in-0 duration-500">
            <div className="text-center animate-in slide-in-from-bottom-4 duration-700 delay-200 max-w-md mx-auto px-4">
              {/* Animated Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 
                            animate-pulse shadow-lg border transition-all duration-300
                            ${loadingInfo.color === 'primary' 
                              ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30' 
                              : 'bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30'
                            }`}>
                <LoadingIcon className={`w-10 h-10 ${
                  loadingInfo.color === 'primary' ? 'text-primary' : 'text-secondary'
                } animate-bounce`} />
              </div>

              {/* Loading Dots */}
              <div className="flex justify-center space-x-2 mb-6">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  loadingInfo.color === 'primary' ? 'bg-primary' : 'bg-secondary'
                }`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  loadingInfo.color === 'primary' ? 'bg-primary' : 'bg-secondary'
                }`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  loadingInfo.color === 'primary' ? 'bg-primary' : 'bg-secondary'
                }`} style={{ animationDelay: '300ms' }} />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-foreground mb-3 
                           animate-in slide-in-from-bottom-2 duration-500 delay-300">
                {loadingInfo.title}
              </h3>
              
              {/* Main Message */}
              <p className="text-muted-foreground mb-4 
                          animate-in slide-in-from-bottom-2 duration-500 delay-400">
                {loadingInfo.message}
              </p>

              {/* Submessage */}
              <p className="text-sm text-muted-foreground/80 mb-4
                          animate-in slide-in-from-bottom-2 duration-500 delay-500">
                {loadingInfo.submessage}
              </p>

              {/* Progress Indicator */}
              <div className="w-full bg-muted rounded-full h-2 mb-4
                            animate-in slide-in-from-bottom-2 duration-500 delay-600">
                <div className={`h-2 rounded-full transition-all duration-1000 ease-out
                              ${loadingInfo.color === 'primary' 
                                ? 'bg-gradient-to-r from-primary to-primary/80' 
                                : 'bg-gradient-to-r from-secondary to-secondary/80'
                              }`}
                     style={{ 
                       width: locationLoading ? '60%' : '90%',
                       animation: 'pulse 2s infinite'
                     }} />
              </div>

              {/* Additional Info */}
              {locationLoading && permissionState && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4
                              animate-in slide-in-from-bottom-2 duration-500 delay-700">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>Estado de permisos: {permissionState}</span>
                  </div>
                  {retryCount > 0 && (
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Reintento #{retryCount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tips while loading */}
              <div className="text-xs text-muted-foreground/60 italic
                            animate-in slide-in-from-bottom-2 duration-500 delay-800">
                💡 {locationLoading 
                  ? 'Tip: Asegúrate de tener activada la ubicación en tu dispositivo'
                  : 'Tip: Completa tu perfil para obtener mejores matches'
                }
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <AppLayout>
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 animate-in fade-in-0 duration-500 pt-8">
          {/* Header */}
          <div className="animate-in slide-in-from-top-2 duration-500 delay-100">
            <Header
              title="Descubrir"
              subtitle="Encuentra personas increíbles cerca de ti"
              rightContent={
                <div className="flex items-center space-x-2 sm:space-x-3 animate-in slide-in-from-right-4 duration-500 delay-200">
                  <DonationButton />
                  <SuperLikeCounter 
                    onUpgrade={() => setShowPremiumModal(true)}
                    showUpgradeButton={true}
                  />
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={sendTestNotification}
                      disabled={isTestingNotification || !fcmToken}
                      className={`p-2 rounded-md hover:scale-110 transition-transform duration-300 ${
                        notificationPermission === 'granted' ? 'text-green-600' : 
                        notificationPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                      title={
                        !fcmToken ? 'Inicializando notificaciones...' :
                        notificationPermission === 'granted' ? 'Enviar notificación de prueba' :
                        notificationPermission === 'denied' ? 'Permisos de notificación denegados' :
                        'Solicitar permisos de notificación'
                      }
                    >
                      {isTestingNotification ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFilters(true)}
                      className="hover:scale-110 transition-transform duration-300"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:scale-110 transition-transform duration-300"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              }
            />
          </div>

          {/* Location Info */}
          <div className="flex flex-col items-center space-y-0 px-4 animate-in slide-in-from-bottom-1 duration-500 delay-200">
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground 
                          hover:text-foreground transition-colors duration-300 text-center">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary animate-pulse flex-shrink-0" />
              <span>Mostrando personas en un radio de {filters.maxDistance}km</span>
            </div>
            <LocationStatus compact={true} />
          </div>

          {/* Current User Card */}
          {currentUserData && (
            <div className="hidden sm:flex justify-center mb-1 sm:mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-400">
              <div className="w-full max-w-md sm:max-w-sm px-4 sm:px-0">
                <div className="bg-gradient-to-r from-primary to-secondary p-1 rounded-2xl shadow-lg 
                              hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 
                              hover:scale-[1.02] group">
                  <div className="bg-card rounded-2xl p-4 transition-all duration-300">
                    <div className="flex items-center justify-center mb-3 animate-in slide-in-from-top-2 duration-500 delay-500">
                      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-3 py-1 rounded-full 
                                    text-sm font-medium flex items-center hover:scale-105 transition-transform duration-300
                                    shadow-lg hover:shadow-primary/25">
                        <UserIcon className="w-4 h-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Tu perfil
                      </div>
                    </div>
                    <div className="animate-in fade-in-0 duration-500 delay-600">
                      <UserCard 
                        user={currentUserData} 
                        showActions={false}
                        className="border-0 shadow-none bg-transparent"
                      />
                    </div>
                    <div className="text-center mt-3 animate-in slide-in-from-bottom-2 duration-500 delay-700">
                      <p className="text-sm text-muted-foreground 
                                  group-hover:text-foreground
                                  transition-colors duration-300">
                        Así te ven otros usuarios
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discover Stack */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 
                        animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-200">
            <div className="w-full max-w-7xl transform transition-all duration-500 
                          hover:scale-[1.01] group">
              {users.length > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Personas cerca de ti
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {users.length} persona{users.length !== 1 ? 's' : ''} encontrada{users.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ProfileGrid
                    users={users}
                    onLike={handleLike}
                    onSuperLike={handleSuperLike}
                    onBlock={handleBlock}
                    onStartChat={handleStartChat}
                    userSuperLikes={userSuperLikes}
                    userIsPremium={userIsPremium}
                    onShowPremiumModal={() => setShowPremiumModal(true)}
                    className="px-4"
                  />
                </>
              ) : (
                <div className="text-center py-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-600">
                  <div className="bg-card rounded-2xl p-8 shadow-lg border
                                hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 
                                hover:scale-[1.02] group">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full 
                                  flex items-center justify-center mx-auto mb-4 
                                  animate-pulse hover:animate-none hover:scale-110 transition-all duration-300
                                  shadow-lg hover:shadow-primary/25">
                      <MapPin className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 
                                 group-hover:text-primary
                                 transition-colors duration-300 animate-in slide-in-from-top-2 duration-500 delay-700">
                      ¡No hay más personas por ahora!
                    </h3>
                    <p className="text-muted-foreground mb-6 
                                group-hover:text-foreground/80
                                transition-colors duration-300 animate-in slide-in-from-bottom-2 duration-500 delay-800">
                      Hemos mostrado todas las personas disponibles en tu área. 
                      Intenta ajustar tus filtros o vuelve más tarde.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowFilters(true)}
                      className="animate-in slide-in-from-bottom-4 duration-500 delay-900"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Ajustar filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="px-4 py-6 bg-muted/50
                        animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-700">
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center
                           animate-in slide-in-from-top-4 duration-500 delay-800
                           hover:text-primary transition-colors duration-300">
                💡 Consejos para conseguir más matches
              </h3>
              <div className="space-y-3">
                <div className="bg-card p-4 rounded-xl shadow-sm border
                              hover:shadow-md hover:shadow-primary/10 transition-all duration-300 
                              hover:scale-[1.02] group cursor-pointer
                              animate-in slide-in-from-left-4 duration-500 delay-900">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0
                                  group-hover:scale-110 group-hover:bg-primary/20
                                  transition-all duration-300">
                      <Settings className="w-4 h-4 text-primary
                                           group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground text-sm
                                   group-hover:text-primary
                                   transition-colors duration-300">
                        Completa tu perfil
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1
                                  group-hover:text-foreground/80
                                  transition-colors duration-300">
                        Los perfiles completos obtienen más matches
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-4 rounded-xl shadow-sm border
                              hover:shadow-md hover:shadow-secondary/10 transition-all duration-300 
                              hover:scale-[1.02] group cursor-pointer
                              animate-in slide-in-from-left-4 duration-500 delay-1000">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0
                                  group-hover:scale-110 group-hover:bg-secondary/20
                                  transition-all duration-300">
                      <UserIcon className="w-4 h-4 text-secondary
                                             group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground text-sm
                                   group-hover:text-secondary
                                   transition-colors duration-300">
                        Sé auténtico
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1
                                  group-hover:text-foreground/80
                                  transition-colors duration-300">
                        La autenticidad atrae conexiones genuinas
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-4 rounded-xl shadow-sm border
                              hover:shadow-md hover:shadow-tertiary/10 transition-all duration-300 
                              hover:scale-[1.02] group cursor-pointer
                              animate-in slide-in-from-left-4 duration-500 delay-1100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-tertiary/10 rounded-full flex items-center justify-center flex-shrink-0
                                  group-hover:scale-110 group-hover:bg-tertiary/20
                                  transition-all duration-300">
                      <MapPin className="w-4 h-4 text-tertiary
                                          group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground text-sm
                                   group-hover:text-tertiary
                                   transition-colors duration-300">
                        Usa Super Likes
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1
                                  group-hover:text-foreground/80
                                  transition-colors duration-300">
                        Destaca con personas especiales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Modal */}
        <DiscoverFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />

        {/* Action Feedback */}
        <ActionFeedback
          action={actionFeedback.action}
          status={actionFeedback.status}
          onComplete={() => setActionFeedback({ action: null, status: 'idle' })}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}