'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { Avatar } from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { useMatches } from '@/hooks/useMatches';
import { getUserProfilePhoto } from '@/lib/userUtils';
import { MessageCircle, Heart, X, Star, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { analyticsService } from '@/services/analyticsService';



export default function MatchesPage() {
  const router = useRouter();
  const { matches, loading, error, deactivateMatch } = useMatches();

  const handleStartChat = (chatId: string, matchAgeHours?: number) => {
    if (chatId) {
      // Track chat opened event
      analyticsService.trackChatOpened(matchAgeHours);
      router.push(`/chat/${chatId}`);
    }
  };

  const handleViewProfile = (userId: string, userAge?: number, distance?: number) => {
    // Track profile viewed event
    analyticsService.trackProfileViewed(userAge, distance);
    router.push(`/profile/${userId}`);
  };

  const handleRemoveMatch = async (matchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar este match?')) {
      await deactivateMatch(matchId);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loading size="lg" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-background">
          <Header 
            title="Matches" 
            showBackButton 
            className="bg-card/80 backdrop-blur-lg border-b border-border"
          />
          
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                {error}
              </div>
            )}

            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-accent-start/20 to-accent-end/20 rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No tienes matches aún
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sigue deslizando para encontrar a tu persona especial
                </p>
                <Button
                  onClick={() => router.push('/discover')}
                  className="bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90"
                >
                  Ir a Descubrir
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Tus Matches
                  </h2>
                  <p className="text-muted-foreground">
                    {matches.length} {matches.length === 1 ? 'match' : 'matches'} encontrados
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <Card 
                      key={match.id} 
                      className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur-lg border border-border relative group"
                    >
                      {/* Botón de eliminar */}
                      <button
                        onClick={(e) => handleRemoveMatch(match.id, e)}
                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <img
                          src={getUserProfilePhoto(match.otherUser) || '/default-avatar.png'}
                          alt={match.otherUser.name}
                          className="w-full h-48 object-cover"
                        />
                        
                        {/* Badge de match reciente */}
                        {match.createdAt && new Date().getTime() - match.createdAt.toMillis() < 24 * 60 * 60 * 1000 && (
                          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-accent-start to-accent-end text-accent-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Nuevo Match
                          </Badge>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 className="text-white font-semibold text-lg">
                            {match.otherUser.name}
                            {match.otherUser.age && `, ${match.otherUser.age}`}
                          </h3>
                          
                          <div className="flex items-center space-x-3 text-white/80 text-sm mt-1">
                            {match.otherUser.location && (
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span>{match.otherUser.location.city}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {match.createdAt ? formatDistanceToNow(match.createdAt.toDate(), { 
                                  addSuffix: true, 
                                  locale: es 
                                }) : 'Hace poco'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        {match.otherUser.bio && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {match.otherUser.bio}
                          </p>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              const matchAgeHours = match.createdAt ? 
                                Math.floor((Date.now() - match.createdAt.toDate().getTime()) / (1000 * 60 * 60)) : 
                                undefined;
                              handleStartChat(match.chatId || '', matchAgeHours);
                            }}
                            className="flex-1 bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 text-accent-foreground"
                            size="sm"
                            disabled={!match.chatId}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            onClick={() => handleViewProfile(match.otherUser.id, match.otherUser.age, undefined)}
                            variant="secondary"
                            size="sm"
                            className="border-border hover:bg-muted"
                          >
                            Ver perfil
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}