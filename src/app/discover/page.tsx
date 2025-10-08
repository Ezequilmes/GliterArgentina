'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { DiscoverFilters, FilterOptions } from '@/components/discover';
import { ProfileGrid } from '@/components/discover/ProfileGrid';
import { Button, Loading } from '@/components/ui';
import { SuperLikeCounter, PremiumModal } from '@/components/premium';
import { LocationStatus } from '@/components/location';
import { useToast } from '@/components/ui/Toast';
import ActionFeedback from '@/components/ui/ActionFeedback';
import { UserCard } from '@/components/profile';
import { Settings, Filter, MapPin, User as UserIcon, MessageCircle } from 'lucide-react';
import { userService } from '@/lib/firestore';
import { matchService } from '@/lib/matchService';
import { chatService } from '@/services/chatService';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouter } from 'next/navigation';
import { analyticsService } from '@/services/analyticsService';
import type { User, UserDistance } from '@/types';

export default function DiscoverPage() {
  const { user } = useAuth();
  const { location, error: locationError, loading: locationLoading } = useGeolocation();
  const { addToast } = useToast();
  const router = useRouter();
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [users, setUsers] = useState<UserDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    action: 'like' | 'pass' | 'superlike' | null;
    status: 'idle' | 'loading' | 'success' | 'error';
  }>({ action: null, status: 'idle' });
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [18, 50],
    maxDistance: 50,
    showMe: 'everyone',
    sexualRole: 'any',
    onlineOnly: false,
    verifiedOnly: false,
    premiumOnly: false,
    hasPhotos: true,
    interests: []
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user || !location) return;
      
      setIsLoading(true);
      try {
        // Load current user data
        const userData = await userService.getUser(user.id);
        setCurrentUserData(userData);

        // Load nearby users
        const nearbyUsers = await userService.getNearbyUsers(
          user.id,
          location.latitude,
          location.longitude,
          filters.maxDistance
        );
        
        // Apply additional filters
        const filteredUsers = nearbyUsers.filter(userWithDistance => {
          const targetUser = userWithDistance.user;
          
          // Exclude blocked users
          if (userData?.blockedUsers?.includes(targetUser.id)) {
            return false;
          }
          
          // Exclude users who blocked current user
          if (targetUser.blockedUsers?.includes(user.id)) {
            return false;
          }
          
          // Age filter
          if (targetUser.age && (targetUser.age < filters.ageRange[0] || targetUser.age > filters.ageRange[1])) {
            return false;
          }
          
          // Gender/Show me filter
          if (filters.showMe !== 'everyone') {
            if (filters.showMe === 'men' && targetUser.gender !== 'male') return false;
            if (filters.showMe === 'women' && targetUser.gender !== 'female') return false;
          }
          
          // Sexual role filter
          if (filters.sexualRole !== 'any' && targetUser.sexualRole !== filters.sexualRole) {
            return false;
          }
          
          // Online only filter
          if (filters.onlineOnly && !targetUser.isOnline) {
            return false;
          }
          
          // Verified only filter
          if (filters.verifiedOnly && !targetUser.isVerified) {
            return false;
          }
          
          // Premium only filter
          if (filters.premiumOnly && !targetUser.isPremium) {
            return false;
          }
          
          // Has photos filter
          if (filters.hasPhotos && (!targetUser.photos || targetUser.photos.length === 0)) {
            return false;
          }
          
          // Interests filter
          if (filters.interests.length > 0) {
            const hasMatchingInterest = filters.interests.some(interest => 
              targetUser.interests?.includes(interest)
            );
            if (!hasMatchingInterest) return false;
          }
          
          return true;
        });
        
        // Sort by distance
        filteredUsers.sort((a, b) => a.distance - b.distance);
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, location, filters]);

  const handleLike = async (userId: string) => {
    if (!user) return;
    
    setActionFeedback({ action: 'like', status: 'loading' });
    
    try {
      await userService.likeUser(user.id, userId);
      
      // Track like event
      const likedUser = users.find(u => u.user.id === userId);
      if (likedUser) {
        analyticsService.trackProfileLiked(likedUser.user.age, likedUser.distance);
      }
      
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      setActionFeedback({ action: 'like', status: 'success' });
      addToast({ title: '¡Like enviado!', message: 'Tu like ha sido enviado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error liking user:', error);
      setActionFeedback({ action: 'like', status: 'error' });
      addToast({ title: 'Error al enviar like. Inténtalo de nuevo.', message: 'Hubo un problema al procesar tu like', type: 'error' });
    }
  };

  const handlePass = async (userId: string) => {
    if (!user) return;
    
    setActionFeedback({ action: 'pass', status: 'loading' });
    
    try {
      await userService.passUser(user.id, userId);
      
      // Track pass event
      const passedUser = users.find(u => u.user.id === userId);
      if (passedUser) {
        analyticsService.trackProfilePassed(passedUser.user.age, passedUser.distance);
      }
      
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      setActionFeedback({ action: 'pass', status: 'success' });
      addToast({ title: 'Usuario pasado', message: 'Has pasado a este usuario', type: 'info' });
    } catch (error) {
      console.error('Error passing user:', error);
      setActionFeedback({ action: 'pass', status: 'error' });
      addToast({ title: 'Error al pasar usuario. Inténtalo de nuevo.', message: 'Hubo un problema al pasar este usuario', type: 'error' });
    }
  };

  const handleSuperLike = async (userId: string) => {
    if (!user) return;
    
    setActionFeedback({ action: 'superlike', status: 'loading' });
    
    try {
      await userService.superLikeUser(user.id, userId);
      
      // Track super like event
      const superLikedUser = users.find(u => u.user.id === userId);
      if (superLikedUser) {
        analyticsService.trackSuperLike(superLikedUser.user.age, superLikedUser.distance);
      }
      
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      setActionFeedback({ action: 'superlike', status: 'success' });
      addToast({ title: '¡Super Like enviado!', message: 'Tu super like ha sido enviado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error super liking user:', error);
      setActionFeedback({ action: 'superlike', status: 'error' });
      addToast({ title: 'Error al enviar Super Like. Inténtalo de nuevo.', message: 'Hubo un problema al procesar tu super like', type: 'error' });
    }
  };

  const handleBlock = async (userId: string) => {
    if (!user) return;
    
    try {
      await userService.blockUser(user.id, userId);
      // Remove user from the list
      setUsers(prev => prev.filter(u => u.user.id !== userId));
      addToast({ title: 'Usuario bloqueado', message: 'Has bloqueado a este usuario correctamente', type: 'success' });
    } catch (error) {
      console.error('Error blocking user:', error);
      addToast({ title: 'Error al bloquear usuario. Inténtalo de nuevo.', message: 'Hubo un problema al bloquear este usuario', type: 'error' });
    }
  };

  const handleStartChat = async (userId: string) => {
    if (!user) return;
    
    try {
      // Crear o obtener chat directamente sin verificar match
      const chatId = await chatService.getOrCreateChat(user.id, userId);
      router.push(`/chat/${chatId}`);
      addToast({ title: 'Chat iniciado', message: 'Puedes comenzar a chatear ahora', type: 'success' });
    } catch (error) {
      console.error('Error starting chat:', error);
      addToast({ title: 'Error al iniciar chat', message: 'Hubo un problema al iniciar el chat', type: 'error' });
    }
  };

  const handleLoadMore = async () => {
    if (!user || !location || isLoading) return;
    
    try {
      // Load more users with pagination
      const moreUsers = await userService.getNearbyUsers(
        user.id,
        location.latitude,
        location.longitude,
        filters.maxDistance,
        users.length // offset
      );
      
      setUsers(prev => [...prev, ...moreUsers]);
    } catch (error) {
      console.error('Error loading more users:', error);
    }
  };

  // Show location error if geolocation failed
  if (locationError) {
    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in-0 duration-500">
            <div className="text-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="w-16 h-16 bg-gradient-to-br from-destructive/20 to-destructive/10
                            rounded-full flex items-center justify-center mx-auto mb-4 
                            animate-pulse shadow-lg border border-destructive/30">
                <MapPin className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 
                           animate-in slide-in-from-bottom-2 duration-500 delay-300">
                Ubicación requerida
              </h3>
              <p className="text-muted-foreground mb-4 
                          animate-in slide-in-from-bottom-2 duration-500 delay-400">
                Necesitamos acceso a tu ubicación para mostrarte personas cerca de ti.
              </p>
              <div className="animate-in slide-in-from-bottom-2 duration-500 delay-500">
                <Button 
                  variant="primary" 
                  onClick={() => window.location.reload()}
                  className="hover:scale-105 transition-transform duration-300"
                >
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (isLoading || locationLoading) {
    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in-0 duration-500">
            <div className="text-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <Loading 
                variant="pulse" 
                size="lg" 
                text={locationLoading ? 'Obteniendo ubicación...' : 'Buscando personas cerca de ti...'} 
              />
              <div className="mt-6 animate-in slide-in-from-bottom-2 duration-500 delay-500">
                <p className="text-sm text-muted-foreground">
                  {locationLoading 
                    ? 'Esto puede tomar unos segundos...' 
                    : 'Preparando tu experiencia de descubrimiento...'
                  }
                </p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <AppLayout>
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 animate-in fade-in-0 duration-500">
          {/* Header */}
          <div className="animate-in slide-in-from-top-4 duration-500 delay-100">
            <Header
              title="Descubrir"
              subtitle="Encuentra personas increíbles cerca de ti"
              rightContent={
                <div className="flex items-center space-x-2 sm:space-x-3 animate-in slide-in-from-right-4 duration-500 delay-200">
                  <SuperLikeCounter 
                    onUpgrade={() => setShowPremiumModal(true)}
                    showUpgradeButton={true}
                  />
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFilters(true)}
                      className="hover:scale-110 transition-transform duration-300"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:scale-110 transition-transform duration-300"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              }
            />
          </div>

          {/* Location Info */}
          <div className="flex flex-col items-center space-y-2 px-4 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground 
                          hover:text-foreground transition-colors duration-300 text-center">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary animate-pulse flex-shrink-0" />
              <span>Mostrando personas en un radio de {filters.maxDistance}km</span>
            </div>
            <LocationStatus compact={true} />
          </div>

          {/* Current User Card */}
          {currentUserData && (
            <div className="flex justify-center mb-4 sm:mb-6 animate-in slide-in-from-bottom-4 duration-500 delay-400">
              <div className="w-full max-w-sm px-4 sm:px-0">
                <div className="bg-gradient-to-r from-primary to-secondary p-1 rounded-2xl shadow-lg 
                              hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 
                              hover:scale-[1.02] group">
                  <div className="bg-card rounded-2xl p-4 transition-all duration-300">
                    <div className="flex items-center justify-center mb-3 animate-in slide-in-from-top-2 duration-500 delay-500">
                      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-3 py-1 rounded-full 
                                    text-sm font-medium flex items-center hover:scale-105 transition-transform duration-300
                                    shadow-lg hover:shadow-primary/25">
                        <UserIcon className="w-4 h-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Tu perfil
                      </div>
                    </div>
                    <div className="animate-in fade-in-0 duration-500 delay-600">
                      <UserCard 
                        user={currentUserData} 
                        showActions={false}
                        className="border-0 shadow-none bg-transparent"
                      />
                    </div>
                    <div className="text-center mt-3 animate-in slide-in-from-bottom-2 duration-500 delay-700">
                      <p className="text-sm text-muted-foreground 
                                  group-hover:text-foreground
                                  transition-colors duration-300">
                        Así te ven otros usuarios
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discover Stack */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 
                        animate-in fade-in-0 slide-in-from-bottom-6 duration-700 delay-500">
            <div className="w-full max-w-7xl transform transition-all duration-500 
                          hover:scale-[1.01] group">
              {users.length > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Personas cerca de ti
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {users.length} persona{users.length !== 1 ? 's' : ''} encontrada{users.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ProfileGrid
                    users={users}
                    onLike={handleLike}
                    onSuperLike={handleSuperLike}
                    onBlock={handleBlock}
                    onStartChat={handleStartChat}
                    className="px-4"
                  />
                </>
              ) : (
                <div className="text-center py-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-600">
                  <div className="bg-card rounded-2xl p-8 shadow-lg border
                                hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 
                                hover:scale-[1.02] group">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full 
                                  flex items-center justify-center mx-auto mb-4 
                                  animate-pulse hover:animate-none hover:scale-110 transition-all duration-300
                                  shadow-lg hover:shadow-primary/25">
                      <MapPin className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 
                                 group-hover:text-primary
                                 transition-colors duration-300 animate-in slide-in-from-top-2 duration-500 delay-700">
                      ¡No hay más personas por ahora!
                    </h3>
                    <p className="text-muted-foreground mb-6 
                                group-hover:text-foreground/80
                                transition-colors duration-300 animate-in slide-in-from-bottom-2 duration-500 delay-800">
                      Hemos mostrado todas las personas disponibles en tu área. 
                      Intenta ajustar tus filtros o vuelve más tarde.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowFilters(true)}
                      className="animate-in slide-in-from-bottom-4 duration-500 delay-900"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Ajustar filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="px-4 py-6 bg-muted/50
                        animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-700">
            <div className="max-w-sm mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center
                           animate-in slide-in-from-top-4 duration-500 delay-800
                           hover:text-primary transition-colors duration-300">
                💡 Consejos para conseguir más matches
              </h3>
              <div className="space-y-3">
                <div className="bg-card p-4 rounded-xl shadow-sm border
                              hover:shadow-md hover:shadow-primary/10 transition-all duration-300 
                              hover:scale-[1.02] group cursor-pointer
                              animate-in slide-in-from-left-4 duration-500 delay-900">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0
                                  group-hover:scale-110 group-hover:bg-primary/20
                                  transition-all duration-300">
                      <Settings className="w-4 h-4 text-primary
                                           group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground text-sm
                                   group-hover:text-primary
                                   transition-colors duration-300">
                        Completa tu perfil
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1
                                  group-hover:text-foreground/80
                                  transition-colors duration-300">
                        Los perfiles completos obtienen más matches
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-4 rounded-xl shadow-sm border
                              hover:shadow-md hover:shadow-secondary/10 transition-all duration-300 
                              hover:scale-[1.02] group cursor-pointer
                              animate-in slide-in-from-left-4 duration-500 delay-1000">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0
                                  group-hover:scale-110 group-hover:bg-secondary/20
                                  transition-all duration-300">
                      <UserIcon className="w-4 h-4 text-secondary
                                             group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground text-sm
                                   group-hover:text-secondary
                                   transition-colors duration-300">
                        Sé auténtico
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1
                                  group-hover:text-foreground/80
                                  transition-colors duration-300">
                        La autenticidad atrae conexiones genuinas
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-4 rounded-xl shadow-sm border
                              hover:shadow-md hover:shadow-tertiary/10 transition-all duration-300 
                              hover:scale-[1.02] group cursor-pointer
                              animate-in slide-in-from-left-4 duration-500 delay-1100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-tertiary/10 rounded-full flex items-center justify-center flex-shrink-0
                                  group-hover:scale-110 group-hover:bg-tertiary/20
                                  transition-all duration-300">
                      <MapPin className="w-4 h-4 text-tertiary
                                          group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground text-sm
                                   group-hover:text-tertiary
                                   transition-colors duration-300">
                        Usa Super Likes
                      </h4>
                      <p className="text-muted-foreground text-xs mt-1
                                  group-hover:text-foreground/80
                                  transition-colors duration-300">
                        Destaca con personas especiales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Modal */}
        <DiscoverFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />

        {/* Action Feedback */}
        <ActionFeedback
          action={actionFeedback.action}
          status={actionFeedback.status}
          onComplete={() => setActionFeedback({ action: null, status: 'idle' })}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}