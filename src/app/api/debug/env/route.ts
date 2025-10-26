import { NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const revalidate = false;

/**
 * GET /api/debug/env
 * 
 * API de diagnóstico para verificar qué variables de entorno están disponibles
 * en el runtime de Firebase App Hosting
 */
export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      PORT: process.env.PORT || 'undefined',
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || 'undefined',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'undefined',
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET (hidden)' : 'undefined',
      MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'SET (hidden)' : 'undefined',
      NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'undefined',
      MERCADOPAGO_CLIENT_ID: process.env.MERCADOPAGO_CLIENT_ID || 'undefined',
      MERCADOPAGO_CLIENT_SECRET: process.env.MERCADOPAGO_CLIENT_SECRET ? 'SET (hidden)' : 'undefined',
    };

    return NextResponse.json({
      message: 'Environment variables status',
      timestamp: new Date().toISOString(),
      environment: envVars,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('MERCADO') || 
        key.includes('GOOGLE') || 
        key.includes('NODE') ||
        key.includes('NEXT')
      ).sort()
    });
  } catch (error) {
    console.error('Error en debug/env API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}