'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card } from '@/components/ui';
import { Heart, Users, MessageCircle, Shield, Sparkles, Star, ArrowRight, Play } from 'lucide-react';
import BrowserCompatibility from '@/components/BrowserCompatibility';


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo.svg" 
                  alt="Gliter Logo" 
                  className="w-8 h-8"
                />
              </div>
              <span className="text-2xl font-bold text-gradient-primary">Gliter</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="md"
                onClick={() => window.location.href = '/auth/login'}
              >
                Iniciar Sesión
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                className="shadow-lg"
                onClick={() => window.location.href = '/auth/register'}
              >
                Registrarse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Browser Compatibility Warning */}
      <BrowserCompatibility />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 mr-2" />
              La app de citas LGBTQ+ más popular de Argentina
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fade-in-up">
              Encuentra tu
              <span className="block text-gradient-primary">
                conexión perfecta
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Sin anuncios, Sin distracciones. Conectá con personas reales cerca tuyo y descubrí nuevas conexiones a tu medida.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up animation-delay-400">
              <Button 
                size="xl" 
                className="w-full sm:w-auto shadow-2xl hover:shadow-purple-500/25"
                onClick={() => window.location.href = '/auth/register'}
              >
                <Heart className="mr-2 h-5 w-5" />
                Comenzar Gratis
              </Button>
              <Button 
                variant="secondary" 
                size="xl" 
                className="w-full sm:w-auto"
                onClick={() => window.location.href = '/auth/login'}
              >
                <Play className="mr-2 h-5 w-5" />
                Ya tengo cuenta
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 animate-fade-in-up animation-delay-600">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                100% Seguro
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                +10K Usuarios
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                4.8 Estrellas
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir <span className="text-gradient-primary">Gliter</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La experiencia de citas más completa y segura para la comunidad LGBTQ+
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card variant="default" hover className="text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conexiones Locales</h3>
              <p className="text-gray-600 leading-relaxed">
                Encuentra personas cerca de ti con intereses similares. Nuestro algoritmo de geolocalización te conecta con usuarios compatibles en tu área.
              </p>
            </Card>
            
            <Card variant="default" hover className="text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Seguro y Verificado</h3>
              <p className="text-gray-600 leading-relaxed">
                Perfiles verificados y herramientas de seguridad avanzadas. Tu privacidad y seguridad son nuestra prioridad número uno.
              </p>
            </Card>
            
            <Card variant="default" hover className="text-center p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Matches Inteligentes</h3>
              <p className="text-gray-600 leading-relaxed">
                Algoritmo avanzado de compatibilidad que aprende de tus preferencias para conectarte con personas realmente afines.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <div className="container mx-auto px-4">
          <Card variant="default" className="p-12 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Números que hablan por sí solos
              </h2>
              <p className="text-lg text-gray-600">
                Miles de personas ya encontraron el amor en Gliter
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">10K+</div>
                <div className="text-gray-600 font-medium">Usuarios Activos</div>
                <div className="text-sm text-gray-500 mt-1">Creciendo cada día</div>
              </div>
              
              <div className="group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">50K+</div>
                <div className="text-gray-600 font-medium">Matches Exitosos</div>
                <div className="text-sm text-gray-500 mt-1">Conexiones reales</div>
              </div>
              
              <div className="group">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">1K+</div>
                <div className="text-gray-600 font-medium">Relaciones Formadas</div>
                <div className="text-sm text-gray-500 mt-1">Historias de amor</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Gliter Logo" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-2xl font-bold text-gradient-primary">Gliter Argentina</span>
            </div>
            
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Conectando corazones en la comunidad LGBTQ+ de Argentina desde 2024
            </p>
            
            <div className="flex justify-center space-x-6 mb-8">
              <Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">
                Registrarse
              </Link>
              <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Términos
              </Link>
            </div>
            
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500 text-sm">
                © 2024 Gliter Argentina. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
