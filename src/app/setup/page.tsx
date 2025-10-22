'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initializeFirestoreCollections } from '@/lib/firestore-setup';
import { Button, Card } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { Check, X, Loader2 } from 'lucide-react';

export default function SetupPage() {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo permitir acceso al administrador
  if (!user || user.email !== 'admin@gliter.com.ar') {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card padding="lg" className="text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600">Solo el administrador puede acceder a esta página.</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleInitialize = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      await initializeFirestoreCollections();
      setIsCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          {!isCompleted ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Configuración Inicial
              </h1>
              <p className="text-gray-600 mb-6">
                Inicializar las colecciones de Firestore y crear datos de ejemplo.
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="w-full"
                variant="primary"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  'Inicializar Firestore'
                )}
              </Button>
            </>
          ) : (
            <>
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Configuración Completada!
              </h1>
              <p className="text-gray-600 mb-6">
                Las colecciones de Firestore han sido inicializadas correctamente.
              </p>
              <Button
                onClick={() => window.location.href = '/admin-panel'}
                variant="primary"
                className="w-full"
              >
                Ir al Panel de Administración
              </Button>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}