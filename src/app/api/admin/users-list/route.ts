import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

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