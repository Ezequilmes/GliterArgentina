import { NextRequest, NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const revalidate = false;

/**
 * GET /api/auth/status
 * Endpoint para verificar el estado de autenticación del usuario
 */
export async function GET(request: NextRequest) {
  try {
    // En una implementación real, aquí verificarías el token de autenticación
    // Por ejemplo, desde cookies o headers Authorization
    
    const authHeader = request.headers.get('Authorization');
    const sessionCookie = request.cookies.get('session')?.value;
    
    // Simulación de verificación de autenticación
    const isAuthenticated = !!(authHeader || sessionCookie);
    
    const response = {
      authenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
      message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated'
    };

    // En producción, aquí podrías incluir información adicional del usuario
    if (process.env.NODE_ENV === 'production' && isAuthenticated) {
      // response.user = await getUserFromToken(authHeader || sessionCookie);
    }

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check authentication status',
        authenticated: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}