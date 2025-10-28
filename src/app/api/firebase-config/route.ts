import { NextResponse } from 'next/server';

// Endpoint para servir la configuración de Firebase al Service Worker
// Usando valores hardcodeados para garantizar estabilidad en producción
export async function GET() {
  try {
    const firebaseConfig = {
      apiKey: 'AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0',
      authDomain: 'gliter-argentina.firebaseapp.com',
      databaseURL: 'https://gliter-argentina-default-rtdb.firebaseio.com/',
      projectId: 'gliter-argentina',
      storageBucket: 'gliter-argentina.firebasestorage.app',
      messagingSenderId: '1084162955705',
      appId: '1:1084162955705:web:25bb32180d1bdaf724fe68',
      measurementId: 'G-MMFQWWFCJD'
    };

    return NextResponse.json(firebaseConfig, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error serving Firebase config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}