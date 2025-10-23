import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  } as admin.ServiceAccount;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

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