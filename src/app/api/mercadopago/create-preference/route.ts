import { NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Fallback: leer el access token desde Secret Manager si falta en env
let cachedAccessToken: string | null = null;
async function getMercadoPagoAccessToken(): Promise<string | null> {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return process.env.MERCADOPAGO_ACCESS_TOKEN;
  }
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const projectId =
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'gliter-argentina';

    // Intentar primero con secreto regional (App Hosting crea secretos regionales)
    const locations = [process.env.SECRET_LOCATION || process.env.GOOGLE_SECRET_LOCATION || 'us-central1'];

    for (const loc of locations) {
      try {
        const regionalName = `projects/${projectId}/locations/${loc}/secrets/MERCADOPAGO_ACCESS_TOKEN/versions/latest`;
        const [accessResponse] = await client.accessSecretVersion({ name: regionalName });
        const data = accessResponse.payload?.data?.toString();
        if (data) {
          cachedAccessToken = data;
          return data;
        }
      } catch (e) {
        // Continúa con fallback global si falla regional
      }
    }

    // Fallback global (por si el secreto no es regional)
    try {
      const globalName = `projects/${projectId}/secrets/MERCADOPAGO_ACCESS_TOKEN/versions/latest`;
      const [accessResponse] = await client.accessSecretVersion({ name: globalName });
      const data = accessResponse.payload?.data?.toString();
      if (data) {
        cachedAccessToken = data;
        return data;
      }
    } catch (e) {
      // Ignorar, se manejará abajo como no configurado
    }

    return null;
  } catch (err) {
    console.error('Secret Manager fallback failed:', err);
    return null;
  }
}

/**
 * POST /api/mercadopago/create-preference
 *
 * Esta ruta recibe un objeto de preferencia desde el frontend y lo reenvía a la API
 * de Mercado Pago usando el Access Token configurado en la variable de entorno
 * MERCADOPAGO_ACCESS_TOKEN. Devuelve la respuesta de Mercado Pago al cliente.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const accessToken = await getMercadoPagoAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token de Mercado Pago no configurado' },
        { status: 500 }
      );
    }

    const { MercadoPagoConfig, Preference } = await import('mercadopago');
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({ body });
     return NextResponse.json(result);
  } catch (err) {
    console.error('Error en create-preference API:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}