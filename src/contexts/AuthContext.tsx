'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
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

  // Manejar service worker
  useServiceWorkerHandler();

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
    console.log('🔍 [AUTH DEBUG] Setting up auth state listener...');
    
    // Timeout de seguridad para evitar carga infinita
    const initTimeout = setTimeout(() => {
      if (initializing) {
        console.warn('⏰ [AUTH DEBUG] Auth initialization timeout - setting initializing to false');
        setInitializing(false);
        setLoading(false);
      }
    }, 10000); // 10 segundos timeout

    const unsubscribe = onAuthStateChange(async (authUser) => {
      setLoading(true);
      
      try {
        if (authUser) {
          setAuthUser(authUser);
          const userData: User | null = await loadUserData(authUser);
          setUser(userData);
        } else {
          setAuthUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('💥 [AUTH DEBUG] Error in auth state change:', {
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        setAuthUser(null);
        setUser(null);
      } finally {
        setLoading(false);
        setInitializing(false);
        clearTimeout(initTimeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(initTimeout);
    };
  }, []);

  // Función de login
  const login = async (data: LoginForm): Promise<void> => {
    setLoading(true);
    try {
      const authUser = await signIn({
        email: data.email,
        password: data.password
      });
      
      const userData: User | null = await loadUserData(authUser);
      setUser(userData);
      setAuthUser(authUser);

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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const register = async (data: RegisterForm): Promise<void> => {
    setLoading(true);
    try {
      // Obtener ubicación actual
      let location = {
        latitude: -34.6037,
        longitude: -58.3816,
        city: 'Buenos Aires',
        country: 'Argentina'
      };

      try {
        const currentLocation = await getCurrentLocation();
        location = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          city: currentLocation.city || 'Buenos Aires',
          country: currentLocation.country || 'Argentina'
        };
      } catch (locationError) {
        console.warn('Could not get current location, using default:', locationError);
      }

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
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de login con Google
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      const authUser = await signInWithGoogle();
      const userData: User | null = await loadUserData(authUser);
      setUser(userData);
      setAuthUser(authUser);

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
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      // Track logout event before clearing user data
      analyticsService.trackLogout();
      
      await logout();
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para restablecer contraseña
  const handleResetPassword = async (email: string): Promise<void> => {
    try {
      await resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // Función para cambiar contraseña
  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}