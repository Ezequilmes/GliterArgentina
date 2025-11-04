import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

export const dynamic = 'force-dynamic';
export const revalidate = false;

function ensureAdminInitialized() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');
  try {
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else {
      console.warn('⚠️ Credenciales Firebase Admin incompletas (users-list).');
    }
  } catch (err) {
    console.warn('⚠️ Firebase Admin no pudo inicializarse (users-list):', err);
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureAdminInitialized();
    if (!getApps().length) {
      return NextResponse.json(
        { error: 'Firebase Admin no configurado. Verifica FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.' },
        { status: 500 }
      );
    }

    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (adminEmail !== 'admin@gliter.com.ar') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

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
