import fs from 'fs';
import path from 'path';
import { AppLayout, Header } from '@/components/layout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function PrivacyPolicyPage() {
  const txtPath = path.join(process.cwd(), 'public', 'TERMINOS Y CONDICIONES.txt');
  let termsText = '';
  try {
    const rawBufferTxt = fs.readFileSync(txtPath);
    // Decode as Latin-1, remove potential BOM
    termsText = rawBufferTxt.toString('latin1').replace(/^\uFEFF/, '');
  } catch (err) {
    // If file missing or error reading, leave empty so we can show warning
    console.error('No se pudo leer TERMINOS Y CONDICIONES.txt', err);
  }

  const hasTerms = termsText.trim().length > 0;

  return (
    <AppLayout>
      <Header title="Términos y Condiciones" showBackButton backHref="/dashboard" />

      <div className="max-w-3xl mx-auto mt-6">
        <Card variant="modern">
          <CardHeader>
            <CardTitle>Gliter Argentina — Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            {hasTerms ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-black !text-black bg-white dark:bg-transparent dark:text-white">
                {termsText}
              </pre>
            ) : (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
                No se pudo cargar el texto completo desde <code>TERMINOS Y CONDICIONES.txt</code>. Verifica que el archivo exista en la carpeta <code>/public</code>.
              </div>
            )}

            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Descargar documento original</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Archivo TXT público del sitio</p>
              </div>
              <a
                href="/TERMINOS%20Y%20CONDICIONES.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Descargar
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}