import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const response = NextResponse.next();

  // Detect WebView and mobile app browsers
  const isWebView = /wv|WebView|Android.*Version\/.*Chrome|iPhone.*Mobile.*Safari|iPad.*Mobile.*Safari/.test(userAgent);
  const isTraeApp = /TraeApp/i.test(userAgent); // Only detect explicit TraeApp, not generic "Trae"
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  // Add headers for WebView compatibility
  if (isWebView || isTraeApp || isMobile) {
    // Disable some features that might not work in WebView
    response.headers.set('X-WebView-Compatible', 'true');
    response.headers.set('X-Frame-Options', 'ALLOWALL');
    
    // Add cache control for better performance in mobile browsers
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Special handling for Trae app
  if (isTraeApp) {
    response.headers.set('X-Trae-App', 'true');
    // Disable service worker registration
    response.headers.set('X-Disable-SW', 'true');
  }

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};