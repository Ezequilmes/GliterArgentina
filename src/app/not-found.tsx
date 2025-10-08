import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
      <div className="text-center text-white px-6">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Página no encontrada</h2>
        <p className="text-lg mb-8 opacity-90">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link 
          href="/"
          className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}