'use client';

import { useEffect, useState } from 'react';

export default function TestEnvPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
  ];

  const getEnvValue = (key: string) => {
    if (typeof window !== 'undefined') {
      // En el cliente, las variables NEXT_PUBLIC_ están en process.env
      return (process.env as any)[key];
    }
    return 'SSR_CONTEXT';
  };

  const allNextPublicVars = Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .sort();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          🔍 Test de Variables de Entorno - Next.js
        </h1>

        <div className="grid gap-6">
          {/* Información del entorno */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              📊 Información del Entorno
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div>
                <span className="font-semibold">NODE_ENV:</span>{' '}
                <span className={`px-2 py-1 rounded ${
                  process.env.NODE_ENV === 'development' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {process.env.NODE_ENV || 'undefined'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Contexto:</span>{' '}
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                  {typeof window !== 'undefined' ? 'Cliente' : 'Servidor'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Total NEXT_PUBLIC vars:</span>{' '}
                <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">
                  {allNextPublicVars.length}
                </span>
              </div>
            </div>
          </div>

          {/* Variables de Firebase */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              🔥 Variables de Firebase
            </h2>
            <div className="space-y-3">
              {firebaseVars.map((varName) => {
                const value = getEnvValue(varName);
                const isPresent = value && value !== 'undefined';
                
                return (
                  <div key={varName} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-semibold">
                        {varName}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        isPresent 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isPresent ? '✅ PRESENTE' : '❌ FALTANTE'}
                      </span>
                    </div>
                    <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                      {isPresent ? (
                        <>
                          <div><strong>Valor:</strong> {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}</div>
                          <div><strong>Longitud:</strong> {String(value).length}</div>
                          <div><strong>Tipo:</strong> {typeof value}</div>
                        </>
                      ) : (
                        <span className="text-red-600">Variable no definida</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Todas las variables NEXT_PUBLIC */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              🌐 Todas las Variables NEXT_PUBLIC
            </h2>
            {allNextPublicVars.length > 0 ? (
              <div className="space-y-2">
                {allNextPublicVars.map((key) => {
                  const value = getEnvValue(key);
                  return (
                    <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm font-semibold">{key}</span>
                      <span className="font-mono text-xs text-gray-600 max-w-xs truncate">
                        {value ? String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '') : 'undefined'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                ❌ No se encontraron variables NEXT_PUBLIC_*
              </div>
            )}
          </div>

          {/* Debug del proceso */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              🐛 Debug del Proceso
            </h2>
            <div className="font-mono text-xs bg-gray-50 p-4 rounded">
              <div><strong>process.env keys count:</strong> {Object.keys(process.env).length}</div>
              <div><strong>window defined:</strong> {typeof window !== 'undefined' ? 'Sí' : 'No'}</div>
              <div><strong>process defined:</strong> {typeof process !== 'undefined' ? 'Sí' : 'No'}</div>
              <div><strong>process.env defined:</strong> {typeof process.env !== 'undefined' ? 'Sí' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}