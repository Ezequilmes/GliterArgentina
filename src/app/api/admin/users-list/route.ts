import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  const serviceAccount = {
    type: "service_account",
    projectId: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Verificar que el usuario es administrador
    if (adminEmail !== 'admin@gliter.com.ar') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener usuarios
    let query = db.collection('users').limit(limit);
    
    const usersSnapshot = await query.get();

    let users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Sin nombre',
      email: doc.data().email || '',
      isPremium: doc.data().isPremium || false,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      lastActive: doc.data().lastActive?.toDate?.()?.toISOString() || doc.data().lastActive
    }));

    // Filtrar por búsqueda si se proporciona
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching users list:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}