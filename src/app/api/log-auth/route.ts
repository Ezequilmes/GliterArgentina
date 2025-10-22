import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, timestamp, userAgent, url } = body;

    // Log estructurado para debugging
    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      event,
      data,
      userAgent,
      url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'accept': request.headers.get('accept'),
        'accept-language': request.headers.get('accept-language'),
        'referer': request.headers.get('referer'),
      }
    };

    // En desarrollo, solo log a consola
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [AUTH LOG]', JSON.stringify(logEntry, null, 2));
      return NextResponse.json({ success: true });
    }

    // En producción, aquí se puede integrar con servicios como:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - Google Cloud Logging
    // - Firebase Analytics
    
    console.log('📊 [PROD AUTH LOG]', JSON.stringify(logEntry, null, 2));

    // TODO: Integrar con servicio de logging externo
    // Ejemplo con Sentry:
    // Sentry.addBreadcrumb({
    //   message: `Auth Event: ${event}`,
    //   level: 'info',
    //   data: logEntry
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [LOG-AUTH API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to log auth event' },
      { status: 500 }
    );
  }
}