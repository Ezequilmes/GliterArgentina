import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Evitar que Next intente prerender esta ruta y ejecute inicialización en build
export const dynamic = 'force-dynamic';
export const revalidate = false;

function ensureAdminInitialized() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (projectId && clientEmail && privateKey) {
      // Inicialización con credenciales explícitas (camelCase, compatibles con firebase-admin)
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      // Fallback a Application Default Credentials para evitar fallo en build
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
      });
    }
  } catch (err) {
    // No romper el build; la POST validará y responderá con error claro si falta configuración
    console.warn('⚠️ Firebase Admin no pudo inicializarse durante build:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar Admin de forma perezosa en tiempo de petición
    ensureAdminInitialized();
    const db = admin.firestore();

    // Validar que admin esté disponible
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado. Verifica variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.' },
        { status: 500 }
      );
    }

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
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
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
