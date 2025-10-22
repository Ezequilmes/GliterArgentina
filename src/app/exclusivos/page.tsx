'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card, { CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Crown, 
  MapPin, 
  Phone, 
  Instagram, 
  Search,
  Star,
  Heart,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ExclusiveCard {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  instagram?: string;
  biography?: string;
  photos: string[];
  videos: string[];
  subscriptionStatus: 'pending' | 'active' | 'rejected' | 'expired';
  createdAt?: any;
  validUntil?: any;
  description?: string;
  location?: string;
  services?: string[];
  rating?: number;
  price?: string;
  featured?: boolean;
}

export default function ExclusivosPage() {
  const [exclusiveCards, setExclusiveCards] = useState<ExclusiveCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<ExclusiveCard | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    // Consulta para obtener todos los perfiles exclusivos creados por admin
    const q = query(
      collection(db, 'exclusives'),
      where('subscriptionStatus', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExclusiveCard[];
      
      // Filtrar solo cards activas y que no hayan expirado
      const activeCards = cards.filter(card => {
        // Filtrar por subscriptionStatus activo
        if (card.subscriptionStatus !== 'active') return false;
        // Filtrar por fecha de expiración
        if (!card.validUntil) return true;
        return card.validUntil.toDate() > new Date();
      });
      
      // Ordenar por fecha de creación (más recientes primero) en el cliente
      const sortedCards = activeCards.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      });
      
      setExclusiveCards(sortedCards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCards = exclusiveCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.services?.some(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hola ${name}, te contacto desde Gliter Exclusivos 💋`);
    const cleanPhone = phone.replace(/\D/g, ''); // Remover todos los caracteres no numéricos
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`, '_blank');
  };

  const openInstagram = (username: string) => {
    const cleanUsername = username.replace('@', '');
    window.open(`https://instagram.com/${cleanUsername}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando exclusivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gliter Exclusivos</h1>
                <p className="text-gray-600">Modelos y masajistas premium</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Volver al Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Buscador */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar por nombre, ubicación o servicio..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{exclusiveCards.length}</div>
            <div className="text-sm text-gray-600">Perfiles Activos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{exclusiveCards.filter(c => c.featured).length}</div>
            <div className="text-sm text-gray-600">Destacados</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">24/7</div>
            <div className="text-sm text-gray-600">Disponibilidad</div>
          </Card>
        </div>

        {/* Grid de Cards */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No hay exclusivos disponibles'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Pronto habrá nuevos perfiles disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCards.map((card) => (
              <Card key={card.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-lg h-fit">
                <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
                  <Image
                    src={card.photos?.[0] || '/placeholder.jpg'}
                    alt={card.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay gradient para mejor legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {card.featured && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      Exclusivo
                    </Badge>
                  </div>

                  {/* Rating */}
                  {card.rating && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium">{card.rating}</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-3 sm:p-4">
                  {/* Nombre y ubicación - Más compacto */}
                  <div className="mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-1">{card.name}</h3>
                    {card.location && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                        <span className="text-xs sm:text-sm">{card.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Precio destacado */}
                  {card.price && (
                    <div className="mb-2">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{card.price}</span>
                    </div>
                  )}

                  {/* Biografía - Color mejorado y más visible */}
                  {card.biography && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2 leading-relaxed">{card.biography}</p>
                  )}

                  {/* Servicios - Más compactos */}
                  {card.services && card.services.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {card.services.slice(0, 2).map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 hover:bg-purple-200">
                            {service}
                          </Badge>
                        ))}
                        {card.services.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700">
                            +{card.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botones de contacto */}
                  <div className="flex gap-2 mb-2">
                    {card.whatsapp && (
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm px-3 py-2"
                        onClick={() => openWhatsApp(card.whatsapp!, card.name)}
                      >
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">WhatsApp</span>
                        <span className="sm:hidden">WA</span>
                      </Button>
                    )}
                    {card.instagram && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white hover:border-transparent shadow-sm hover:shadow-lg transition-all duration-300 text-xs sm:text-sm px-3 py-2"
                        onClick={() => openInstagram(card.instagram!)}
                      >
                        <Instagram className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Instagram</span>
                        <span className="sm:hidden">IG</span>
                      </Button>
                    )}
                  </div>

                  {/* Botón ver más */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:text-purple-800 border border-purple-200 hover:border-purple-300 transition-all duration-200 text-xs sm:text-sm py-2"
                    onClick={() => setSelectedCard(card)}
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Ver más detalles</span>
                    <span className="sm:hidden">Ver más</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalles */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedCard.name}</h2>
                  <Button variant="ghost" onClick={() => setSelectedCard(null)}>
                    ✕
                  </Button>
                </div>

                {/* Galería de fotos */}
                {selectedCard.photos && selectedCard.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {selectedCard.photos.slice(0, 4).map((photo, index) => (
                      <div 
                        key={index} 
                        className="relative h-48 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm hover:shadow-md"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <Image
                          src={photo}
                          alt={`${selectedCard.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Información detallada */}
                <div className="space-y-4">
                  {selectedCard.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Descripción</h3>
                      <p className="text-gray-600">{selectedCard.description}</p>
                    </div>
                  )}

                  {selectedCard.biography && (
                    <div>
                      <h3 className="font-semibold mb-2">Biografía</h3>
                      <p className="text-gray-600">{selectedCard.biography}</p>
                    </div>
                  )}

                  {selectedCard.services && (
                    <div>
                      <h3 className="font-semibold mb-2">Servicios</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCard.services.map((service, index) => (
                          <Badge key={index} variant="secondary">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de contacto */}
                  <div className="flex gap-3 pt-4">
                    {selectedCard.whatsapp && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => openWhatsApp(selectedCard.whatsapp!, selectedCard.name)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contactar por WhatsApp
                      </Button>
                    )}
                    {selectedCard.instagram && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openInstagram(selectedCard.instagram!)}
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        Ver Instagram
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para ampliar foto */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-6xl max-h-full w-full">
              <Button 
                variant="ghost" 
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-10 bg-black/30 rounded-full"
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </Button>
              <div className="relative flex items-center justify-center">
                <Image
                  src={selectedPhoto}
                  alt="Foto ampliada"
                  width={1200}
                  height={900}
                  className="object-contain max-h-[90vh] max-w-full w-auto h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}