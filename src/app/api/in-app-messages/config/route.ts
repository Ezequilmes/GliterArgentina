import { NextRequest, NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Configuración por defecto para producción
const DEFAULT_CONFIG = {
  enabled: true,
  maxMessagesPerSession: 3,
  displayInterval: 30000, // 30 segundos
  debugMode: false
};

// En producción, esto vendría de una base de datos o servicio de configuración
const PRODUCTION_CONFIG = {
  enabled: process.env.INAPP_MESSAGING_ENABLED === 'true' || true,
  maxMessagesPerSession: parseInt(process.env.INAPP_MAX_MESSAGES_PER_SESSION || '3'),
  displayInterval: parseInt(process.env.INAPP_DISPLAY_INTERVAL || '30000'),
  debugMode: process.env.NODE_ENV !== 'production'
};

export async function GET(request: NextRequest) {
  try {
    // En producción, aquí podrías verificar autenticación/autorización
    const config = process.env.NODE_ENV === 'production' 
      ? PRODUCTION_CONFIG 
      : DEFAULT_CONFIG;

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting in-app messaging config:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // En producción, verificar permisos de administrador
    if (process.env.NODE_ENV === 'production') {
      // Aquí implementarías verificación de autenticación/autorización
      // Por ejemplo, verificar JWT token de admin
    }

    const newConfig = await request.json();
    
    // Validar configuración
    const validatedConfig = {
      enabled: typeof newConfig.enabled === 'boolean' ? newConfig.enabled : true,
      maxMessagesPerSession: Math.max(1, Math.min(10, newConfig.maxMessagesPerSession || 3)),
      displayInterval: Math.max(5000, newConfig.displayInterval || 30000),
      debugMode: process.env.NODE_ENV !== 'production'
    };

    // En producción, guardar en base de datos
    // await saveConfigToDatabase(validatedConfig);

    return NextResponse.json(validatedConfig);
  } catch (error) {
    console.error('Error updating in-app messaging config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}