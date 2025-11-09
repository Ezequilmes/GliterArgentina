import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Serve the Service Worker script from the `public` folder with proper headers.
 * Ensures the file is accessible under `/sw.js` even if static file serving differs in production.
 */
export async function GET(): Promise<Response> {
  try {
    const filePath = join(process.cwd(), 'public', 'sw.js');
    const content = await readFile(filePath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return new NextResponse(`/* sw.js not found: ${String(error)} */`, {
      status: 404,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    });
  }
}

export const runtime = 'nodejs';

