import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Serve the Firebase Messaging Service Worker script from `public`.
 */
export async function GET(): Promise<Response> {
  try {
    const filePath = join(process.cwd(), 'public', 'firebase-messaging-sw.js');
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
    return new NextResponse(`/* firebase-messaging-sw.js not found: ${String(error)} */`, {
      status: 404,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    });
  }
}

export const runtime = 'nodejs';

