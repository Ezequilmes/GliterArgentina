'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';
import { Shield } from 'lucide-react';

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
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md mx-auto">
          {/* Animated Shield Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-10 h-10 text-pink-500 animate-bounce" />
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {initializing ? 'Inicializando aplicación' : 'Verificando acceso'}
            </h3>
            <p className="text-muted-foreground">
              {initializing ? 'Configurando tu experiencia...' : 'Validando permisos...'}
            </p>
            <p className="text-sm text-muted-foreground/60">
              Esto solo tomará un momento
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"
              style={{ width: initializing ? '60%' : '80%', animation: 'pulse 2s infinite' }}
            />
          </div>

          {/* Tip */}
          <div className="text-xs text-muted-foreground/60 italic">
            🔐 {initializing ? 'Preparando la aplicación' : 'Verificando autenticación'}
          </div>
        </div>
      </div>
    );
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