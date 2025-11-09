'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { userService } from '@/lib/firestore';
import { isFirebaseClientReady } from '@/lib/firebase';
import { User, UserDistance } from '@/types';
import DiscoverCard from '@/components/discover/DiscoverCard';
import LocationStatus from '@/components/location/LocationStatus';
import LoadingSpinner from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { createLogger } from '@/services/loggingService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout';
import ActionFeedback from '@/components/ui/ActionFeedback';
import { DiscoverFilters } from '@/components/discover';
import { PremiumModal, SuperLikeCounter } from '@/components/premium';
import { UserCard } from '@/components/profile';
import { ProfileGrid } from '@/components/discover';
import { Header } from '@/components/layout';
import { Shield, MapPin, RefreshCw, AlertTriangle, Heart, Users, Filter, Settings, UserIcon } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { analyticsService } from '@/services/analyticsService';

// Types
interface UseToastReturn {
  addToast: (toast: { title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }) => void;
}

interface FilterOptions {
  ageRange: [number, number];
  maxDistance: number;
  showMe: 'everyone' | 'men' | 'women';
  sexualRole: 'any' | 'active' | 'passive' | 'versatile';
  onlineOnly: boolean;
  verifiedOnly: boolean;
  premiumOnly: boolean;
  hasPhotos: boolean;
  interests: string[];
}

// Mock useToast hook for now
const useToast = (): UseToastReturn => ({
  addToast: ({ title, message, type }) => {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }
});

// Create component-specific logger
const logger = createLogger('DiscoverPage');

interface DiscoverPageState {
  nearbyUsers: User[];
  currentUser: User | null;
  isLoadingUsers: boolean;
  userError: string | null;
  lastLoadTime: number;
  locationAttempts: number;
}

// Constants for anti-cycle protection
const MAX_LOCATION_ATTEMPTS = 3;
const MIN_LOAD_INTERVAL = 10000; // 10 seconds minimum between loads
const LOCATION_RETRY_DELAY = 5000; // 5 seconds between location retries

/**
 * DiscoverPage: vista principal de descubrimiento.
 * Implementa un gating coordinado (user + geolocation + Firebase listo) para evitar
 * renders vacíos y cargas que se disparan antes de tener los datos necesarios.
 * Además, usa caché local para render instantáneo y una pantalla de carga controlada.
 */
export default function DiscoverPage() {
  const { user } = useAuth();
  const { 
    location, 
    error: locationError, 
    loading: locationLoading,
    permission: permissionState,
    retryCount,
    getCurrentLocation,
    
    shouldAttemptLocation,
    isWatching
  } = useGeolocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  const { addToast } = useToast();
  const router = useRouter();
  
  // Debug logs at component initialization (avoid duplicates in dev StrictMode/HMR)
  const isDev = process.env.NODE_ENV !== 'production';
  const __initLogged = (globalThis as any).__DiscoverPageInitLogged__ as boolean | undefined;
  if (!isDev || !__initLogged) {
    console.log('🚀 DiscoverPage component initialized');
    console.log('👤 Auth user:', user);
    console.log('📍 Geolocation:', { location, locationLoading, locationError, permissionState, retryCount });
    if (isDev) (globalThis as any).__DiscoverPageInitLogged__ = true;
  }
  
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  // Track if we have already requested geolocation due to a user gesture
  const [hasRequestedLocationByGesture, setHasRequestedLocationByGesture] = useState(false);
  // Última ubicación conocida como fallback
  const [lastCoords, setLastCoords] = useState<{ latitude: number; longitude: number; timestamp: number } | null>(null);

  /**
   * Solicita la ubicación explícitamente al hacer click en el botón.
   * Asegura que la geolocalización se dispare por un gesto del usuario
   * y reporta feedback si falla.
   */
  const requestLocationByButton = useCallback(async (): Promise<void> => {
    if (locationLoading) return; // evita doble solicitud si ya está en curso
    setHasRequestedLocationByGesture(true);
    setLocationAttempts(prev => prev + 1);
    try {
      // Si no podemos intentar nueva ubicación, usar la última conocida
      if (typeof shouldAttemptLocation === 'function' && !shouldAttemptLocation()) {
        if (lastCoords) {
          addToast({
            title: 'Ubicación',
            message: 'Usando tu última ubicación guardada.',
            type: 'info'
          });
          return; // el efecto de carga usará lastCoords automáticamente
        }
      }
      await getCurrentLocation();
    } catch (err: any) {
      console.error('Error al obtener ubicación desde botón:', err);
      addToast({
        title: 'Ubicación',
        message: 'No se pudo obtener tu ubicación. Intenta otra vez.',
        type: 'error'
      });
    }
  }, [getCurrentLocation, addToast, locationLoading, shouldAttemptLocation, lastCoords]);
  
  const [users, setUsers] = useState<UserDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Anti-infinite loop mechanism
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [locationAttempts, setLocationAttempts] = useState<number>(0);

  // Enhanced logging with centralized service
  const logDiscoverPage = useCallback((level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const context = {
      userId: user?.id,
      hasLocation: !!location,
      permissionState,
      locationAttempts,
      nearbyUsersCount: users.length,
      ...data
    };

    switch (level) {
      case 'info':
        logger.info(message, context);
        break;
      case 'warn':
        logger.warn(message, context);
        break;
      case 'error':
        logger.error(message, context);
        break;
    }
  }, [user?.id, location, permissionState, locationAttempts, users.length]);

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

  // Constants for anti-cycle protection
  const MAX_LOCATION_ATTEMPTS = 3;
  const MIN_LOAD_INTERVAL = 2000; // 2 seconds minimum between loads

  // Coordinated readiness state
  const firebaseReady = isFirebaseClientReady();
  const ready = !!user && firebaseReady && (!!location || !!lastCoords);
  const initStartRef = typeof window !== 'undefined'
    ? ((window as any).__discoverInitStartRef ?? ((window as any).__discoverInitStartRef = Date.now()))
    : Date.now();

  // Prime UI from cache for instant render on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('discoverCache');
      if (!raw) return;
      const cached = JSON.parse(raw) as { users?: UserDistance[]; currentUserData?: User | null; timestamp?: number };
      if (cached?.users && Array.isArray(cached.users)) {
        setUsers(cached.users);
      }
      if (cached?.currentUserData) {
        setCurrentUserData(cached.currentUserData);
      }
    } catch (_) {
      // Ignore cache errors
    }
  }, []);

  // Guardar última ubicación conocida cuando se actualiza y cargarla al montar
  useEffect(() => {
    // carga inicial
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('lastCoords');
        if (raw && !lastCoords) {
          const parsed = JSON.parse(raw) as { latitude: number; longitude: number; timestamp: number };
          if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
            setLastCoords(parsed);
          }
        }
      } catch (_) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!location) return;
    const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude, timestamp: Date.now() };
    setLastCoords(coords);
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('lastCoords', JSON.stringify(coords)); } catch (_) {}
    }
  }, [location]);

  // Effect 1: Preparar el intento de ubicación, pero no solicitarla automáticamente.
  // En su lugar, la pedimos en respuesta al primer gesto del usuario para evitar
  // la advertencia: "Only request geolocation information in response to a user gesture".
  useEffect(() => {
    const now = Date.now();
    if (now - lastLoadTime < MIN_LOAD_INTERVAL) return;
    if (!user) return;
    if (location) return; // ya tenemos ubicación

    if (locationError) {
      console.log('Location error:', locationError);
    }
    // No incrementamos aquí; lo haremos al producirse el gesto del usuario
  }, [user, location, locationError, lastLoadTime]);

  /**
   * Solicita la geolocalización únicamente tras el primer gesto del usuario
   * cuando el permiso ya está concedido y aún no tenemos ubicación.
   * Esto evita la violación de timing que reporta Chrome y mantiene el flujo.
   */
  useEffect(() => {
    if (!user) return;
    if (location) return;
    if (hasRequestedLocationByGesture) return;
    if (permissionState !== 'granted') return;

    const onFirstGesture = async () => {
      setHasRequestedLocationByGesture(true);
      setLocationAttempts(prev => prev + 1);
      try {
        await getCurrentLocation();
      } catch (err) {
        console.error('Error getting location after user gesture:', err);
      }
    };

    // Usamos pointerdown para capturar el primer gesto (click/tap)
    document.addEventListener('pointerdown', onFirstGesture, { once: true });
    return () => {
      document.removeEventListener('pointerdown', onFirstGesture);
    };
  }, [user, location, permissionState, hasRequestedLocationByGesture, getCurrentLocation, setLocationAttempts]);

  // Effect 2: Load data only when fully ready
  useEffect(() => {
    if (!ready) return;

    const loadData = async () => {
      setIsLoading(true);
      setLastLoadTime(Date.now());
      const lat = location?.coords.latitude ?? lastCoords?.latitude;
      const lng = location?.coords.longitude ?? lastCoords?.longitude;
      console.log('[DiscoverPage] loadData (ready=TRUE)', {
        user: user?.id,
        lat,
        lng,
        source: location ? 'geolocation' : 'lastCoords'
      });

      try {
        // Load current user data
        const userData = await userService.getUser(user!.id);
        setCurrentUserData(userData);
        setUserSuperLikes(userData?.superLikes || 0);
        setUserIsPremium(userData?.isPremium || false);

        // Load nearby users
        const nearbyUsers = await userService.getNearbyUsers(
          user!.id,
          lat!,
          lng!,
          filters.maxDistance
        );

        // Apply filters
        const filteredUsers = nearbyUsers.filter(targetUser => {
          if (userData?.blockedUsers?.includes(targetUser.user.id)) return false;
          if (targetUser.user.blockedUsers?.includes(user!.id)) return false;
          if (targetUser.user.age && (targetUser.user.age < filters.ageRange[0] || targetUser.user.age > filters.ageRange[1])) return false;
          if (filters.showMe !== 'everyone') {
            if (filters.showMe === 'men' && targetUser.user.gender !== 'male') return false;
            if (filters.showMe === 'women' && targetUser.user.gender !== 'female') return false;
          }
          if (filters.sexualRole !== 'any' && targetUser.user.sexualRole !== filters.sexualRole) return false;
          if (filters.onlineOnly && !targetUser.user.isOnline) return false;
          if (filters.verifiedOnly && !targetUser.user.isVerified) return false;
          if (filters.premiumOnly && !targetUser.user.isPremium) return false;
          if (filters.hasPhotos && (!targetUser.user.photos || targetUser.user.photos.length === 0)) return false;
          if (filters.interests.length > 0) {
            const hasMatchingInterest = filters.interests.some(interest => targetUser.user.interests?.includes(interest));
            if (!hasMatchingInterest) return false;
          }
          return true;
        });

        filteredUsers.sort((a, b) => a.distance - b.distance);
        setUsers(filteredUsers);
        setLocationAttempts(0);

        // Cache for instant subsequent loads
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('discoverCache', JSON.stringify({
              users: filteredUsers,
              currentUserData: userData,
              timestamp: Date.now()
            }));
          } catch (_) {}
        }

        // Single-time ready log
        if (typeof window !== 'undefined') {
          if (!(window as any).__discoverReadyLogged) {
            const elapsed = Date.now() - initStartRef;
            console.log(`🚀 Discover initialized with user + location in ~${elapsed}ms`);
            (window as any).__discoverReadyLogged = true;
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        addToast({ title: 'Error al cargar datos', message: 'Hubo un problema al cargar los usuarios cercanos', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id, location?.coords.latitude, location?.coords.longitude, lastCoords?.latitude, lastCoords?.longitude, filters.maxDistance, filters.ageRange, filters.showMe, filters.sexualRole, filters.onlineOnly, filters.verifiedOnly, filters.premiumOnly, filters.hasPhotos, filters.interests]);

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
      
      // Actualizar créditos locales después del super like
      if (!userIsPremium) {
        setUserSuperLikes(prev => Math.max(0, prev - 1));
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
        location.coords.latitude,
        location.coords.longitude,
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
                  onClick={() => typeof window !== 'undefined' && window.location.reload()}
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

  // Controlled loading screen while initializing or actively loading
  if (!ready || isLoading || locationLoading) {
    const getLoadingInfo = () => {
      if (!ready) {
        return {
          icon: Users as React.ComponentType<{ className?: string }>,
          title: 'Inicializando Discover',
          message: 'Preparando autenticación, ubicación y servicios',
          submessage: 'Cargando contexto y permisos...',
          color: 'secondary'
        };
      }
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
        icon: Users as React.ComponentType<{ className?: string }>,
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
                  <SuperLikeCounter 
                    onUpgrade={() => setShowPremiumModal(true)}
                    showUpgradeButton={true}
                  />
                  <div className="flex items-center space-x-2">
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
            <div className="mt-3 w-full max-w-md">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-muted/40 border rounded-xl p-3">
                <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                  {location 
                    ? '¿Cambiaste de lugar? Actualiza tu ubicación cuando quieras.'
                    : 'Para mostrar personas cerca, toca para actualizar tu ubicación.'}
                </p>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={requestLocationByButton}
                  disabled={locationLoading}
                  className="justify-center"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {locationLoading ? 'Actualizando…' : 'Actualizar ubicación'}
                </Button>
              </div>
            </div>
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
