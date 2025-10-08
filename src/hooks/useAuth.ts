'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthContextType } from '@/types';

/**
 * Hook personalizado para usar el contexto de autenticación
 * Proporciona acceso a todas las funciones y estado de autenticación
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
}

/**
 * Hook para verificar si el usuario está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { user, initializing } = useAuth();
  return !initializing && user !== null;
}

/**
 * Hook para verificar si el usuario tiene membresía premium
 */
export function useIsPremium(): boolean {
  const { user } = useAuth();
  
  if (!user || !user.isPremium || !user.premiumExpiry) {
    return false;
  }
  
  return new Date() < user.premiumExpiry.toDate();
}

/**
 * Hook para obtener información del usuario actual
 */
export function useCurrentUser() {
  const { user, loading, initializing } = useAuth();
  
  return {
    user,
    isLoading: loading || initializing,
    isAuthenticated: !initializing && user !== null,
    isPremium: user?.isPremium && user?.premiumExpiry ? new Date() < user.premiumExpiry.toDate() : false,
  };
}

/**
 * Hook para manejar el estado de carga de autenticación
 */
export function useAuthLoading(): boolean {
  const { loading, initializing } = useAuth();
  return loading || initializing;
}