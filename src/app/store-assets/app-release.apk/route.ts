import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Entrega el APK firmado de producción desde /store-assets/app-release.apk
 *
 * - Lee el archivo de public/store-assets/app-release.apk
 * - Establece cabeceras adecuadas para descarga de APK
 * - Evita cualquier redirección o rewrite inesperado
 *
 * @returns {Promise<NextResponse>} Respuesta binaria del APK con cabeceras de descarga, o error 404/500.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const apkPath = path.join(process.cwd(), 'public', 'store-assets', 'app-release.apk');

    if (!fs.existsSync(apkPath)) {
      return NextResponse.json(
        { error: 'apk_not_found', message: 'El archivo APK no existe en public/store-assets/app-release.apk' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(apkPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="app-release.apk"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'apk_unexpected_error', message },
      { status: 500 }
    );
  }
}
