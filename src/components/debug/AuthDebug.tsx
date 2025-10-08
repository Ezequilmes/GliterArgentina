'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthDebug() {
  const { user, loading } = useAuth();

  return (
    <div className="fixed top-4 left-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <h3 className="font-bold text-lg mb-2">🔍 Auth Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</div>
        <div><strong>Usuario autenticado:</strong> {user ? 'Sí' : 'No'}</div>
        
        {user && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Nombre:</strong> {user.name}</div>
            <div><strong>Verificado:</strong> {user.isVerified ? 'Sí' : 'No'}</div>
          </div>
        )}
        
        {!user && !loading && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
            Usuario no autenticado
          </div>
        )}
      </div>
    </div>
  );
}