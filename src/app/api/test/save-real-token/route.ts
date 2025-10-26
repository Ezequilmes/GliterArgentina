import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json();

    // Validar datos requeridos
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Token y userId son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el token tenga el formato correcto de FCM
    if (typeof token !== 'string' || token.length < 100) {
      return NextResponse.json(
        { error: 'Token FCM inválido' },
        { status: 400 }
      );
    }

    console.log(`💾 Guardando token FCM real para usuario: ${userId}`);
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);

    // Guardar el token en Firestore
    const tokenData = {
      tokens: [token],
      userId: userId,
      lastUpdated: FieldValue.serverTimestamp(),
      isRealToken: true, // Marcar como token real
      deviceInfo: {
        userAgent: request.headers.get('user-agent') || 'Unknown',
        timestamp: new Date().toISOString()
      }
    };

    await db.collection('fcm_tokens').doc(userId).set(tokenData);

    // También crear un usuario de prueba si no existe
    const userData = {
      id: userId,
      email: `${userId}@test-real.com`,
      displayName: `Usuario Real ${userId}`,
      isPremium: true,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      isTestUser: true
    };

    await db.collection('users').doc(userId).set(userData, { merge: true });

    console.log(`✅ Token FCM real guardado exitosamente para ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Token FCM real guardado exitosamente',
      userId: userId,
      tokenPreview: `${token.substring(0, 30)}...`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error al guardar token FCM real:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}