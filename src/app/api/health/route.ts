// Configuración para exportación estática
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  return new Response('Server healthy', {
    status: 200,
    headers,
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}