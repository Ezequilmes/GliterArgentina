'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Interfaz para NetworkInformation (no está incluida en TypeScript por defecto)
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
}
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, AuthContextType, LoginForm, RegisterForm } from '@/types';
import { 
  signIn, 
  signUp, 
  signInWithGoogle, 
  logout, 
  resetPassword, 
  changePassword,
  onAuthStateChange,
  getUserProfile,
  updateUserOnlineStatus,
  AuthUser
} from '@/lib/auth';
import { getCurrentLocation } from '@/lib/geolocation';
import { analyticsService } from '@/services/analyticsService';
import { useServiceWorkerHandler } from '@/hooks/useServiceWorkerHandler';
import { chatService } from '@/services/chatService';
import { fcmService } from '@/services/fcmService';
import MobileLoadingScreen from '@/components/ui/MobileLoadingScreen';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Manejar service worker
  useServiceWorkerHandler();

  // Detectar si es dispositivo móvil
  const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  };

  // Función para logging de eventos de autenticación
  const logAuthEvent = async (event: string, data: any = {}) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      isMobile: isMobileDevice(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null,
      connection: typeof navigator !== 'undefined' && 'connection' in navigator ? {
        effectiveType: (navigator as Navigator & { connection?: NetworkInformation }).connection?.effectiveType,
        downlink: (navigator as Navigator & { connection?: NetworkInformation }).connection?.downlink,
        rtt: (navigator as Navigator & { connection?: NetworkInformation }).connection?.rtt
      } : null,
      ...data
    };

    console.log(`🔍 [AUTH EVENT] ${event}:`, logData);

    // En producción, solo log a consola por ahora
    // TODO: Integrar con servicio de logging externo si es necesario
  };

  // Función de reintento para autenticación - más conservadora
  const retryAuth = async () => {
    if (retryCount >= 2) { // Reducido de 3 a 2 intentos
      setAuthError('Error de conexión persistente. Por favor, verifica tu conexión a internet.');
      return;
    }

    setRetryCount(prev => prev + 1);
    setAuthError(null);
    setLoading(true);
    setInitializing(true);

    await logAuthEvent('auth_retry_attempt', { retryCount: retryCount + 1 });

    // Solo recargar en el último intento y solo si es un error crítico
    if (retryCount >= 1) {
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Aumentado el delay
    }
  };

  // Función para generar automáticamente token FCM
  const generateFCMTokenAutomatically = async (userId: string) => {
    try {
      await logAuthEvent('fcm_auto_generation_start', { userId });
      
      // Verificar que el usuario esté autenticado en Firebase Auth
      if (!auth.currentUser) {
        await logAuthEvent('fcm_user_not_authenticated', { userId });
        console.warn('FCM: Usuario no autenticado en Firebase Auth, esperando...');
        return;
      }

      // Verificar que el token de autenticación esté disponible
      try {
        const idToken = await auth.currentUser.getIdToken();
        if (!idToken) {
          await logAuthEvent('fcm_no_auth_token', { userId });
          console.warn('FCM: No se pudo obtener el token de autenticación');
          return;
        }
        console.log('FCM: Usuario autenticado correctamente, token disponible');
      } catch (authError) {
        await logAuthEvent('fcm_auth_token_error', { 
          userId, 
          error: authError instanceof Error ? authError.message : 'Unknown auth error' 
        });
        console.warn('FCM: Error al verificar autenticación:', authError);
        return;
      }
      
      // Verificar si las notificaciones están soportadas
      const isSupported = await fcmService.isNotificationSupported();
      if (!isSupported) {
        await logAuthEvent('fcm_not_supported', { userId });
        return;
      }

      // Verificar el estado actual de los permisos
      const currentPermission = fcmService.getPermissionStatus();
      
      // Si ya están denegados, no intentar solicitar
      if (currentPermission === 'denied') {
        await logAuthEvent('fcm_permission_denied', { userId });
        return;
      }

      // Si ya están concedidos, obtener el token directamente
      if (currentPermission === 'granted') {
        try {
          const existingToken = await fcmService.getRegistrationToken();
          if (existingToken) {
            await fcmService.saveTokenToServer(userId, existingToken);
            await logAuthEvent('fcm_existing_token_saved', { userId, hasToken: !!existingToken });
            return;
          }
        } catch (error) {
          await logAuthEvent('fcm_existing_token_error', { 
            userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Si los permisos están en 'default', solicitar automáticamente
      if (currentPermission === 'default' || currentPermission === null) {
        try {
          const hasPermission = await fcmService.requestPermission();
          if (hasPermission) {
            const token = await fcmService.getRegistrationToken();
            if (token) {
              await fcmService.saveTokenToServer(userId, token);
              await logAuthEvent('fcm_auto_token_generated', { userId, hasToken: !!token });
            }
          } else {
            await logAuthEvent('fcm_permission_auto_denied', { userId });
          }
        } catch (error) {
          await logAuthEvent('fcm_auto_generation_error', { 
            userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    } catch (error) {
      await logAuthEvent('fcm_auto_generation_critical_error', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Función para cargar datos del usuario
  const loadUserData = async (authUser: AuthUser): Promise<User | null> => {
    try {
      // Timeout de 8 segundos para evitar carga infinita
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('User data loading timeout'));
        }, 8000);
      });

      const userData: User | null = await Promise.race([
        getUserProfile(authUser.uid),
        timeoutPromise
      ]);

      return userData;
    } catch (error) {
      console.error('💥 [AUTH DEBUG] Error loading user data:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? error.code : 'unknown',
        timestamp: new Date().toISOString()
      });
      
      // En caso de error, crear un usuario básico para evitar bloqueos
      return {
        id: authUser.uid,
        name: authUser.displayName || 'Usuario',
        email: authUser.email || '',
        photos: authUser.photoURL ? [authUser.photoURL] : [],
        age: 18,
        gender: 'male' as const,
        sexualRole: 'versatile' as const,
        location: {
          latitude: -34.6037,
          longitude: -58.3816,
          city: 'Buenos Aires',
          country: 'Argentina'
        },
        bio: '',
        interests: [],
        isOnline: true,
        lastSeen: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isVerified: false,
        isPremium: false,
        settings: {
          notifications: {
            messages: true,
            matches: true,
            marketing: false
          },
          privacy: {
            showOnline: true,
            showDistance: true,
            showAge: true
          },
          searchPreferences: {
            maxDistance: 50,
            ageRange: { min: 18, max: 99 },
            genders: ['male', 'female', 'other'],
            sexualRoles: ['active', 'passive', 'versatile']
          }
        }
      };
    }
  };

  // Efecto para escuchar cambios de autenticación
  useEffect(() => {
    let mounted = true;
    
    const setupAuth = async () => {
      await logAuthEvent('auth_setup_start', { isMobile: isMobileDevice() });
      
      // Timeout más tolerante para móviles
      const timeoutDuration = isMobileDevice() ? 25000 : 15000; // Aumentado significativamente
      
      const initTimeout = setTimeout(() => {
        if (mounted && initializing) {
          logAuthEvent('auth_timeout', { 
            timeoutDuration,
            isMobile: isMobileDevice(),
            retryCount 
          });
          // Solo mostrar error de timeout si no hay usuario autenticado
          if (!authUser) {
            setAuthError('Conexión lenta detectada. Reintentando...');
          }
          setInitializing(false);
          setLoading(false);
        }
      }, timeoutDuration);

      try {
        if (!auth) {
          throw new Error('Firebase Auth no está disponible');
        }

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
          if (!mounted) return;
          
          setLoading(true);
          setAuthError(null);
          
          try {
            await logAuthEvent('auth_state_change', { 
              hasUser: !!authUser,
              userId: authUser?.uid,
              isMobile: isMobileDevice()
            });

            if (authUser) {
              setAuthUser(authUser as AuthUser);
              const userData: User | null = await loadUserData(authUser as AuthUser);
              setUser(userData);
              
              // Inicializar presencia en Realtime Database
              try {
                await chatService.initializePresence(authUser.uid);
                await logAuthEvent('presence_initialized', { userId: authUser.uid });
              } catch (error) {
                await logAuthEvent('presence_init_error', { 
                  userId: authUser.uid, 
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              }

              // Generar automáticamente token FCM para notificaciones push
              // Se ejecuta en background para no bloquear la autenticación
              setTimeout(() => {
                generateFCMTokenAutomatically(authUser.uid).catch(error => {
                  console.warn('Error en generación automática de token FCM:', error);
                });
              }, 2000); // Delay de 2 segundos para permitir que la autenticación se complete
            } else {
              setAuthUser(null);
              setUser(null);
              
              // Limpiar presencia cuando el usuario se desautentica
              try {
                await chatService.clearPresence();
                await logAuthEvent('presence_cleared');
              } catch (error) {
                await logAuthEvent('presence_clear_error', { 
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              }
            }
          } catch (error) {
            await logAuthEvent('auth_state_error', {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              isMobile: isMobileDevice()
            });
            
            // Si el error es porque Firebase no está disponible en el servidor, no es un error crítico
            if (error instanceof Error && error.message.includes('Firebase no está disponible en el servidor')) {
              console.log('🔄 [AUTH DEBUG] Firebase not available on server - this is expected during SSR');
            } else {
              setAuthError(error instanceof Error ? error.message : 'Error de autenticación desconocido');
            }
            
            setAuthUser(null);
            setUser(null);
          } finally {
            if (mounted) {
              setLoading(false);
              setInitializing(false);
              clearTimeout(initTimeout);
            }
          }
        });

        return () => {
          unsubscribe();
          clearTimeout(initTimeout);
        };
      } catch (error) {
        await logAuthEvent('auth_setup_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          isMobile: isMobileDevice()
        });
        
        if (mounted) {
          setAuthError(error instanceof Error ? error.message : 'Error de configuración de autenticación');
          setInitializing(false);
          setLoading(false);
        }
      }
    };

    const cleanup = setupAuth();
    
    return () => {
      mounted = false;
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [retryCount]);

  // Función de login
  const login = async (data: LoginForm): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await logAuthEvent('login_attempt', { 
        email: data.email,
        isMobile: isMobileDevice()
      });

      const authUser = await signIn({
        email: data.email,
        password: data.password
      });
      
      const userData: User | null = await loadUserData(authUser);
      setUser(userData);
      setAuthUser(authUser);

      // La presencia se inicializa automáticamente en setupAuth

      // Track login event
      analyticsService.trackLogin('email');
      analyticsService.setUserId(authUser.uid);
      if (userData) {
        analyticsService.setUserProperties({
          age_range: userData.age ? `${userData.age}` : undefined,
          gender: userData.gender,
          is_premium: userData.isPremium,
          location_city: userData.location?.city,
          location_country: userData.location?.country
        });
      }

      await logAuthEvent('login_success', { 
        userId: authUser.uid,
        hasUserData: !!userData
      });
    } catch (error) {
      await logAuthEvent('login_error', {
        email: data.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileDevice()
      });
      
      setAuthError(error instanceof Error ? error.message : 'Error de inicio de sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const register = async (data: RegisterForm): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await logAuthEvent('register_attempt', { 
        email: data.email,
        age: data.age,
        gender: data.gender,
        isMobile: isMobileDevice()
      });

      // Use default location (Buenos Aires) - user can update later with explicit permission
      const location = {
        latitude: -34.6037,
        longitude: -58.3816,
        city: 'Buenos Aires',
        country: 'Argentina'
      };

      await logAuthEvent('default_location_used', { location });

      const authUser = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        age: data.age,
        gender: (data.gender || 'other') as 'male' | 'female' | 'non-binary' | 'other',
        sexualRole: (data.sexualRole || 'versatile') as 'active' | 'passive' | 'versatile',
        location,
        bio: '',
        interests: []
      });

      const userData: User | null = await loadUserData(authUser);
      setUser(userData);
      setAuthUser(authUser);

      // La presencia se inicializa automáticamente en setupAuth

      // Track signup event
      analyticsService.trackSignup('email');
      analyticsService.setUserId(authUser.uid);
      if (userData) {
        analyticsService.setUserProperties({
          age_range: userData.age ? `${userData.age}` : undefined,
          gender: userData.gender,
          is_premium: userData.isPremium,
          location_city: userData.location?.city,
          location_country: userData.location?.country
        });
      }

      await logAuthEvent('register_success', { 
        userId: authUser.uid,
        hasUserData: !!userData
      });
    } catch (error) {
      await logAuthEvent('register_error', {
        email: data.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileDevice()
      });
      
      setAuthError(error instanceof Error ? error.message : 'Error de registro');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de login con Google
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await logAuthEvent('google_login_attempt', { 
        isMobile: isMobileDevice()
      });

      const authUser = await signInWithGoogle();
      const userData: User | null = await loadUserData(authUser);
      setUser(userData);
      setAuthUser(authUser);

      // La presencia se inicializa automáticamente en setupAuth

      // Track Google login event
      analyticsService.trackLogin('google');
      analyticsService.setUserId(authUser.uid);
      if (userData) {
        analyticsService.setUserProperties({
          age_range: userData.age ? `${userData.age}` : undefined,
          gender: userData.gender,
          is_premium: userData.isPremium,
          location_city: userData.location?.city,
          location_country: userData.location?.country
        });
      }

      await logAuthEvent('google_login_success', { 
        userId: authUser.uid,
        hasUserData: !!userData
      });
    } catch (error) {
      await logAuthEvent('google_login_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileDevice()
      });
      
      setAuthError(error instanceof Error ? error.message : 'Error de inicio de sesión con Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    
    try {
      await logAuthEvent('logout_attempt', { 
        userId: authUser?.uid,
        isMobile: isMobileDevice()
      });

      if (authUser) {
        // Limpiar presencia antes del logout
        try {
          await chatService.clearPresence();
          await logAuthEvent('logout_presence_cleaned', { userId: authUser.uid });
        } catch (error) {
          await logAuthEvent('logout_presence_error', { 
            userId: authUser.uid,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      await logout();
      setUser(null);
      setAuthUser(null);

      // Track logout event
      analyticsService.trackLogout();
      
      await logAuthEvent('logout_success', {});
    } catch (error) {
      await logAuthEvent('logout_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileDevice()
      });
      
      setAuthError(error instanceof Error ? error.message : 'Error al cerrar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para restablecer contraseña
  const handleResetPassword = async (email: string): Promise<void> => {
    try {
      await logAuthEvent('reset_password_attempt', { 
        email,
        isMobile: isMobileDevice()
      });

      await resetPassword(email);
      
      await logAuthEvent('reset_password_success', { email });
    } catch (error) {
      await logAuthEvent('reset_password_error', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileDevice()
      });
      
      throw error;
    }
  };

  // Función para cambiar contraseña
  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!authUser) {
      throw new Error('No user authenticated');
    }

    try {
      await logAuthEvent('change_password_attempt', { 
        userId: authUser.uid,
        isMobile: isMobileDevice()
      });

      await changePassword(currentPassword, newPassword);
      
      await logAuthEvent('change_password_success', { userId: authUser.uid });
    } catch (error) {
      await logAuthEvent('change_password_error', {
        userId: authUser.uid,
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileDevice()
      });
      
      throw error;
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Aquí implementaremos la actualización del perfil en Firestore
      // Por ahora, actualizamos el estado local
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Función para refrescar datos del usuario desde Firestore
  const refreshUser = async (): Promise<void> => {
    if (!authUser) throw new Error('No authenticated user');
    
    try {
      const userData: User | null = await loadUserData(authUser);
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = !!user && !!authUser;

  // Verificar si el usuario es premium
  const isPremium = user?.isPremium || false;

  // Verificar si el usuario está verificado
  const isVerified = user?.isVerified || false;

  const value: AuthContextType = {
    user,
    authUser,
    loading,
    initializing,
    isAuthenticated,
    isPremium,
    isVerified,
    login,
    register,
    loginWithGoogle,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    changePassword: handleChangePassword,
    updateProfile,
    refreshUser,
  };

  // Renderizado condicional para dispositivos móviles - solo en casos de error o timeout prolongado
  if (isMobileDevice() && authError && retryCount > 0) {
    return (
      <MobileLoadingScreen
         isLoading={loading || initializing}
         error={authError}
         onRetry={retryAuth}
       />
    );
  }

  return (
     <AuthContext.Provider value={value}>
       {children}
     </AuthContext.Provider>
   );
 };