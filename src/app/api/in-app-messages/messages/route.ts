import { NextRequest, NextResponse } from 'next/server';
import { InAppMessage } from '@/services/inAppMessagingService';

// Configuración para exportación estática
export const dynamic = 'force-static';
export const revalidate = false;

// Mensajes de ejemplo para desarrollo/testing
const SAMPLE_MESSAGES: InAppMessage[] = [
  {
    messageId: 'welcome_msg_001',
    title: '¡Bienvenido a Gliter!',
    body: 'Descubre todas las funcionalidades de nuestra plataforma',
    actionUrl: '/dashboard',
    campaignName: 'welcome_campaign',
    priority: 'high',
    displayConditions: {
      minSessionTime: 5000, // 5 segundos
      requiresAuth: true
    }
  },
  {
    messageId: 'premium_promo_001',
    title: '🚀 Upgrade a Premium',
    body: 'Obtén acceso a funciones exclusivas con nuestro plan Premium',
    actionUrl: '/premium',
    campaignName: 'premium_promotion',
    priority: 'normal',
    displayConditions: {
      minSessionTime: 30000, // 30 segundos
      maxDisplaysPerDay: 2
    }
  },
  {
    messageId: 'feature_announcement_001',
    title: '✨ Nueva Funcionalidad',
    body: 'Hemos añadido nuevas herramientas para mejorar tu experiencia',
    actionUrl: '/features',
    campaignName: 'feature_announcement',
    priority: 'normal',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAuthenticated = searchParams.get('authenticated') === 'true';
    const sessionTime = parseInt(searchParams.get('sessionTime') || '0');

    // En producción, aquí obtendrías los mensajes de tu base de datos
    // basándote en el usuario, segmentación, campañas activas, etc.
    let messages = SAMPLE_MESSAGES;

    if (process.env.NODE_ENV === 'production') {
      // Ejemplo de obtención desde base de datos
      // messages = await getMessagesFromDatabase({
      //   userId,
      //   isAuthenticated,
      //   sessionTime,
      //   currentTime: new Date()
      // });
    }

    // Filtrar mensajes basándose en condiciones
    const filteredMessages = messages.filter(message => {
      // Verificar expiración
      if (message.expiresAt && new Date() > message.expiresAt) {
        return false;
      }

      // Verificar condiciones de display
      if (message.displayConditions) {
        const { minSessionTime, requiresAuth } = message.displayConditions;
        
        if (minSessionTime && sessionTime < minSessionTime) {
          return false;
        }

        if (requiresAuth && !isAuthenticated) {
          return false;
        }
      }

      return true;
    });

    // Ordenar por prioridad
    const sortedMessages = filteredMessages.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return (priorityOrder[b.priority || 'normal'] || 2) - (priorityOrder[a.priority || 'normal'] || 2);
    });

    // Limitar número de mensajes
    const maxMessages = parseInt(process.env.INAPP_MAX_MESSAGES_PER_REQUEST || '5');
    const limitedMessages = sortedMessages.slice(0, maxMessages);

    return NextResponse.json({
      messages: limitedMessages,
      total: filteredMessages.length,
      hasMore: filteredMessages.length > maxMessages
    });

  } catch (error) {
    console.error('Error fetching in-app messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Endpoint para crear nuevos mensajes (solo para administradores)
    if (process.env.NODE_ENV === 'production') {
      // Verificar autenticación y permisos de administrador
      // const isAdmin = await verifyAdminPermissions(request);
      // if (!isAdmin) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }
    }

    const messageData = await request.json();
    
    // Validar datos del mensaje
    if (!messageData.title || !messageData.body) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body' },
        { status: 400 }
      );
    }

    const newMessage: InAppMessage = {
      messageId: messageData.messageId || `msg_${Date.now()}`,
      title: messageData.title,
      body: messageData.body,
      actionUrl: messageData.actionUrl,
      campaignName: messageData.campaignName,
      data: messageData.data,
      priority: messageData.priority || 'normal',
      expiresAt: messageData.expiresAt ? new Date(messageData.expiresAt) : undefined,
      targetAudience: messageData.targetAudience,
      displayConditions: messageData.displayConditions
    };

    // En producción, guardar en base de datos
    // await saveMessageToDatabase(newMessage);

    // Log para desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log('📝 New In-App Message created:', newMessage);
    }

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error('Error creating in-app message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}