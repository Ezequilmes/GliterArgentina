'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePremium?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

function ProtectedRoute({
  children,
  requireAuth = true,
  requirePremium = false,
  redirectTo,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que termine la inicialización
    if (initializing || loading) return;

    // Si requiere autenticación y no hay usuario
    if (requireAuth && !user) {
      router.push(redirectTo || '/auth/login');
      return;
    }

    // Si no requiere autenticación pero hay usuario (ej: páginas de login)
    if (!requireAuth && user) {
      router.push('/dashboard');
      return;
    }

    // Si requiere premium y el usuario no es premium
    if (requirePremium && user && !isPremiumActive(user)) {
      router.push('/premium');
      return;
    }
  }, [user, loading, initializing, requireAuth, requirePremium, router, redirectTo]);

  // Mostrar loading mientras se inicializa
  if (initializing || loading) {
    return fallback || <Loading />;
  }

  // Si requiere autenticación y no hay usuario, no mostrar nada (se redirige)
  if (requireAuth && !user) {
    return null;
  }

  // Si no requiere autenticación pero hay usuario, no mostrar nada (se redirige)
  if (!requireAuth && user) {
    return null;
  }

  // Si requiere premium y el usuario no es premium, no mostrar nada (se redirige)
  if (requirePremium && user && !isPremiumActive(user)) {
    return null;
  }

  return <>{children}</>;
}

// Función helper para verificar si el premium está activo
function isPremiumActive(user: any): boolean {
  if (!user.isPremium || !user.premiumUntil) {
    return false;
  }
  
  return new Date() < new Date(user.premiumUntil);
}

export default ProtectedRoute;