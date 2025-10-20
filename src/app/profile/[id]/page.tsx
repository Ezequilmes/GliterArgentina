'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { Button, Loading, Badge } from '@/components/ui';
import { UserCard } from '@/components/profile';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Heart, 
  X, 
  Star, 
  MessageCircle, 
  Flag,
  Shield,
  MapPin,
  Calendar,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userService } from '@/lib/firestore';
import { formatDistance, calculateDistance } from '@/lib/geolocation';
import { getUserAllPhotos, userHasPhotos } from '@/lib/userUtils';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/chatService';
import { ReportModal } from '@/components/modals/ReportModal';
import type { User } from '@/types';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isPassed, setIsPassed] = useState(false);
  const [isSuperLiked, setIsSuperLiked] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser || !userId) return;

      setIsLoading(true);
      try {
        // Load target user profile
        const user = await userService.getUser(userId);
        if (!user) {
          router.push('/discover');
          return;
        }

        setProfileUser(user);

        // Load current user data to check interactions
        const currentUserData = await userService.getUser(currentUser.id);
        if (currentUserData) {
          setIsLiked(currentUserData.likedUsers?.includes(userId) || false);
          setIsPassed(currentUserData.passedUsers?.includes(userId) || false);
          setIsSuperLiked(currentUserData.superLikedUsers?.includes(userId) || false);
          setIsMatch(currentUserData.matches?.includes(userId) || false);
          setIsBlocked(currentUserData.blockedUsers?.includes(userId) || false);

          // Calculate distance if both users have location
          if (currentUserData.location && user.location) {
            const dist = calculateDistance(
              currentUserData.location.latitude,
              currentUserData.location.longitude,
              user.location.latitude,
              user.location.longitude
            );
            setDistance(dist);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        router.push('/discover');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, currentUser, router]);

  const handleLike = async () => {
    if (!currentUser || !profileUser || isLiked) return;

    try {
      await userService.likeUser(currentUser.id, profileUser.id);
      setIsLiked(true);
      
      // Check if it became a match
      const updatedUser = await userService.getUser(currentUser.id);
      if (updatedUser?.matches?.includes(profileUser.id)) {
        setIsMatch(true);
      }
    } catch (error) {
      console.error('Error liking user:', error);
    }
  };

  const handlePass = async () => {
    if (!currentUser || !profileUser || isPassed) return;

    try {
      await userService.passUser(currentUser.id, profileUser.id);
      setIsPassed(true);
    } catch (error) {
      console.error('Error passing user:', error);
    }
  };

  const handleSuperLike = async () => {
    if (!currentUser || !profileUser || isSuperLiked) return;

    try {
      await userService.superLikeUser(currentUser.id, profileUser.id);
      setIsSuperLiked(true);
      setIsMatch(true); // Super likes create immediate match opportunity
    } catch (error) {
      console.error('Error super liking user:', error);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;

    try {
      const chatId = await chatService.getOrCreateChat(currentUser.id, profileUser.id);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleBlock = async () => {
    if (!currentUser || !profileUser) return;

    try {
      if (isBlocked) {
        await userService.unblockUser(currentUser.id, profileUser.id);
        setIsBlocked(false);
      } else {
        await userService.blockUser(currentUser.id, profileUser.id);
        setIsBlocked(true);
        router.push('/discover');
      }
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
    }
  };

  const handleReportSubmitted = () => {
    // Optionally show a success message or redirect
    console.log('Report submitted successfully');
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md w-full">
              {/* Animated Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center animate-pulse">
                    <Heart className="w-8 h-8 text-white animate-bounce" />
                  </div>
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-primary/30 rounded-full animate-spin" 
                     style={{ animationDuration: '3s' }} />
              </div>

              {/* Loading Dots */}
              <div className="flex justify-center space-x-1 mb-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-foreground mb-2">
                Cargando perfil
              </h3>

              {/* Message */}
              <p className="text-muted-foreground mb-4">
                Obteniendo información del usuario...
              </p>

              {/* Progress Indicator */}
              <div className="w-full bg-muted rounded-full h-1 mb-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse" 
                     style={{ width: '60%' }} />
              </div>

              {/* Tip */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Los perfiles completos tienen más posibilidades de hacer match
                </p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!profileUser) {
    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Usuario no encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                El perfil que buscas no existe o no está disponible.
              </p>
              <Button variant="primary" onClick={() => router.push('/discover')}>
                Volver a Descubrir
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <Header
            title={profileUser.name}
            subtitle={distance ? `A ${formatDistance(distance)}` : ''}
            showBackButton={true}
            onBack={() => router.back()}
            rightContent={
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleReport}>
                  <Flag className="w-4 h-4" />
                </Button>
                <Button variant={isBlocked ? "primary" : "ghost"} size="sm" onClick={handleBlock}>
                  <Shield className="w-4 h-4" />
                </Button>
              </div>
            }
          />

          {/* Match Status */}
          {isMatch && (
            <div className="bg-gradient-to-r from-accent-start to-accent-end text-white p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-6 h-6 mr-2 fill-current" />
                <span className="font-semibold">¡Es un Match!</span>
              </div>
              <p className="text-sm opacity-90">
                A ambos se gustaron. ¡Empiecen a conversar!
              </p>
            </div>
          )}

          {/* Profile Photos */}
          <div className="relative">
            {userHasPhotos(profileUser) ? (
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={getUserAllPhotos(profileUser)[currentPhotoIndex]}
                  alt={`${profileUser.name} - Foto ${currentPhotoIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Photo Navigation */}
                {getUserAllPhotos(profileUser).length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhotoIndex(prev => 
                        prev === 0 ? getUserAllPhotos(profileUser).length - 1 : prev - 1
                      )}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/30 text-white p-2 rounded-full hover:bg-foreground/50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPhotoIndex(prev => 
                        prev === getUserAllPhotos(profileUser).length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/30 text-white p-2 rounded-full hover:bg-foreground/50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Photo Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {getUserAllPhotos(profileUser).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            index === currentPhotoIndex 
                              ? "bg-white" 
                              : "bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Premium Badge */}
                {profileUser.isPremium && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="gold" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted-foreground/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {profileUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Sin fotos</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {profileUser.name}
                </h1>
                <div className="flex items-center space-x-2">
                  {profileUser.isVerified && (
                    <Badge variant="success">
                      <Shield className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  {profileUser.isOnline && (
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-muted-foreground space-x-4">
                <span>{profileUser.age} años</span>
                {distance && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{formatDistance(distance)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Acerca de mí
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {profileUser.bio}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-1 gap-4">
              {profileUser.location?.city && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{profileUser.location.city}</span>
                </div>
              )}
            </div>

            {/* Interests */}
            {profileUser.interests && profileUser.interests.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Intereses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pb-6">
            {!isPassed && !isLiked && (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePass}
                  className="w-16 h-16 rounded-full border-border hover:border-destructive hover:text-destructive"
                >
                  <X className="w-6 h-6" />
                </Button>
                
                {!isSuperLiked && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleSuperLike}
                    className="w-16 h-16 rounded-full border-border hover:border-primary hover:text-primary"
                  >
                    <Star className="w-6 h-6" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLike}
                  className="w-16 h-16 rounded-full border-border hover:border-accent-end hover:text-accent-end"
                >
                  <Heart className="w-6 h-6" />
                </Button>
              </>
            )}
            
            {isMatch && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleMessage}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Enviar mensaje</span>
              </Button>
            )}
          </div>

          {/* Status Messages */}
          {isLiked && !isMatch && (
            <div className="bg-primary-faint border border-primary-strong/30 rounded-lg p-4 text-center">
              <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-primary-strong font-medium">
                Le diste like a {profileUser.name}
              </p>
              <p className="text-sm text-primary-strong/80 mt-1">
                Si también le gustas, será un match
              </p>
            </div>
          )}

          {isPassed && (
            <div className="bg-muted border border-border rounded-lg p-4 text-center">
              <X className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground font-medium">
                Pasaste a {profileUser.name}
              </p>
            </div>
          )}

          {isSuperLiked && (
            <div className="bg-info-faint border border-info-strong/30 rounded-lg p-4 text-center">
              <Star className="w-8 h-8 text-info mx-auto mb-2" />
              <p className="text-info-strong font-medium">
                Le diste Super Like a {profileUser.name}
              </p>
              <p className="text-sm text-info-strong/80 mt-1">
                Tu perfil se destacará para esta persona
              </p>
            </div>
          )}
        </div>

        {/* Report Modal */}
        {profileUser && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            reportedUser={profileUser}
            onReportSubmitted={handleReportSubmitted}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}