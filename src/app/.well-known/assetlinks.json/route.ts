import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

/**
 * GET handler for /.well-known/assetlinks.json
 *
 * Sirve el archivo Digital Asset Links requerido para la delegación TWA.
 * Intenta leer el JSON desde public/.well-known/assetlinks.json para mantener una única fuente de verdad.
 * Si no existe, retorna un contenido de respaldo con el fingerprint configurado actualmente.
 *
 * @returns {NextResponse} Respuesta JSON con el contenido de assetlinks o un error descriptivo.
 */
export function GET(): NextResponse {
  try {
    const assetsPath = path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json');
    if (fs.existsSync(assetsPath)) {
      const content = fs.readFileSync(assetsPath, 'utf8');
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Fallback content (kept in sync with public/.well-known/assetlinks.json)
    const fallback = [
      {
        relation: [
          'delegate_permission/common.handle_all_urls',
          'delegate_permission/common.use_as_origin',
        ],
        target: {
          namespace: 'android_app',
          package_name: 'ar.com.gliter.twa',
          sha256_cert_fingerprints: [
            '86:1C:BF:27:E5:B0:2D:A3:00:9D:FF:0F:C7:A8:54:89:C8:28:F4:52:64:B8:2C:BE:94:5F:A6:C0:7B:0D:4D:C6',
          ],
        },
      },
    ];

    return NextResponse.json(fallback, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'assetlinks_unexpected_error', message },
      { status: 500 }
    );
  }
}
