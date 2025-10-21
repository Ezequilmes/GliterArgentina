'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de redirección de /messages a /chat
 * Mantiene compatibilidad con enlaces antiguos
 */
export default function MessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente a /chat
    router.replace('/chat');
  }, [router]);

  // Mostrar un loading mientras se redirige
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a chats...</p>
      </div>
    </div>
  );
}