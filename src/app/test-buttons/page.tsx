'use client';

import { Button } from '@/components/ui';

export default function TestButtonsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Prueba de Botones</h1>
        
        {/* Test básico de visibilidad */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Test Básico de Visibilidad</h2>
          <div className="p-4 border border-gray-300 rounded-lg bg-white">
            <p className="mb-4">Este texto debería ser visible</p>
            <Button 
              variant="primary" 
              size="md"
              onClick={() => alert('Botón clickeado!')}
            >
              Botón Primario
            </Button>
          </div>
        </section>

        {/* Test con diferentes fondos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Test con Diferentes Fondos</h2>
          
          <div className="p-4 bg-red-100 rounded-lg">
            <p className="mb-2">Fondo rojo claro:</p>
            <Button variant="primary" size="md">Botón en Rojo</Button>
          </div>
          
          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="mb-2">Fondo azul claro:</p>
            <Button variant="secondary" size="md">Botón en Azul</Button>
          </div>
          
          <div className="p-4 bg-green-100 rounded-lg">
            <p className="mb-2">Fondo verde claro:</p>
            <Button variant="outline" size="md">Botón en Verde</Button>
          </div>
        </section>

        {/* Test de z-index */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Test de Z-Index</h2>
          <div className="relative p-4 bg-gray-100 rounded-lg">
            <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
            <Button 
              variant="primary" 
              size="md" 
              className="relative z-10"
            >
              Botón con Z-Index Alto
            </Button>
          </div>
        </section>

        {/* Test sin estilos complejos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Test Sin Estilos Complejos</h2>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => alert('Botón HTML básico clickeado!')}
          >
            Botón HTML Básico
          </button>
        </section>

        {/* Test de div como botón */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Test de Div como Botón</h2>
          <div 
            className="inline-block px-4 py-2 bg-purple-500 text-white rounded cursor-pointer hover:bg-purple-600"
            onClick={() => alert('Div clickeado!')}
          >
            Div que actúa como botón
          </div>
        </section>
      </div>
    </div>
  );
}