import Link from 'next/link';
import { AppLayout, Header } from '@/components/layout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function HelpPage() {
  return (
    <AppLayout>
      <Header title="Ayuda" subtitle="Políticas de privacidad y Términos" showBackButton backHref="/dashboard" />

      <div className="grid gap-6 mt-6 max-w-3xl mx-auto">
        {/* Términos y Condiciones (actualizado) */}
        <Card variant="modern">
          <CardHeader>
            <CardTitle>📄 Términos y Condiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Última actualización: {new Date().toLocaleDateString('es-AR')}
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3>1. Aceptación</h3>
              <p>Al usar Gliter Argentina aceptas estos términos y te comprometes a cumplir las reglas de convivencia y uso responsable de la plataforma.</p>

              <h3>2. Cuenta y acceso</h3>
              <p>Debes mantener tu cuenta segura y con datos veraces. Podemos suspender cuentas que incumplan normas o presenten actividad sospechosa.</p>

              <h3>3. Contenido y conducta</h3>
              <p>Eres responsable del contenido que publiques. No se permiten contenidos ilegales, discriminatorios, abusivos o que violen derechos de terceros.</p>

              <h3>4. Servicios y funciones</h3>
              <p>La app ofrece funciones gratuitas y algunas ventajas premium. Las características pueden cambiar para mejorar el servicio.</p>

              <h3>5. Pagos y donaciones</h3>
              <p>Los pagos y donaciones se procesan mediante proveedores externos confiables. Podrían aplicar términos adicionales del proveedor.</p>

              <h3>6. Privacidad</h3>
              <p>Tratamos tus datos conforme a nuestra Política de Privacidad. Puedes consultarla desde el botón inferior.</p>

              <h3>7. Propiedad intelectual</h3>
              <p>Las marcas, diseño y software de Gliter Argentina están protegidos. No puedes copiarlos ni usarlos sin autorización.</p>

              <h3>8. Contacto</h3>
              <p>Si tienes consultas sobre estos términos, escríbenos a <a href="mailto:soporte@gliter.com.ar">soporte@gliter.com.ar</a>.</p>
            </div>

            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Descargar documento</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Versión pública del sitio</p>
              </div>
              <a
                href="/TERMINOS%20Y%20CONDICIONES.rtf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Descargar
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Política de Privacidad */}
        <Card variant="modern">
          <CardHeader>
            <CardTitle>🔐 Política de Privacidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Resumen de cómo recopilamos y usamos tus datos.
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3>Información que recopilamos</h3>
              <p>Datos de cuenta, perfil, ubicación aproximada para descubrimiento cercano y métricas técnicas de uso.</p>

              <h3>Uso de la información</h3>
              <p>Operar y mejorar la app, moderar contenidos, facilitar conexiones y mantener la seguridad.</p>

              <h3>Compartir datos</h3>
              <p>Con proveedores de infraestructura y servicios estrictamente para operar la aplicación, bajo estándares de seguridad.</p>

              <h3>Tus derechos</h3>
              <p>Puedes acceder, actualizar o eliminar tu cuenta desde la app. Para derechos adicionales, contáctanos.</p>

              <div className="mt-4">
                <Link
                  href="/privacy/"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Ver Política completa
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soporte */}
        <Card variant="muted">
          <CardHeader>
            <CardTitle>¿Necesitas más ayuda?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Si tienes preguntas o problemas, contáctanos en{' '}
              <a href="mailto:soporte@gliter.com.ar" className="text-purple-600 hover:underline">soporte@gliter.com.ar</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
