'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { UserCard } from '@/components/profile';
import { VerificationPanel } from '@/components/verification';
import { Avatar } from '@/components/ui';
import { 
  Settings, 
  MapPin,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async (profileData: User) => {
    try {
      // Aquí iría la lógica para guardar el perfil
      console.log('Saving profile:', profileData);
      
      // Track profile updated event
      try {
        analyticsService.trackProfileUpdated();
      } catch (analyticsError) {
        console.error('Error tracking profile updated:', analyticsError);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      // Aquí iría la lógica para subir la foto
      console.log('Uploading photo:', file);
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  if (isEditing) {
    return (
      <ProtectedRoute requireAuth>
        <AppLayout>
          <div className="space-y-6">
            <Header
              title="Editar Perfil"
              backHref="/profile"
              onBack={() => setIsEditing(false)}
            />
            {user && (
              <ProfileForm
                user={user}
                onSave={handleSaveProfile}
              />
            )}
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header con botones de navegación */}
        <div className="fixed top-20 left-0 right-0 z-40 bg-card px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver</span>
            </button>
            
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium">Editar</span>
            </button>
          </div>
        </div>

        {/* Contenido principal con fondo redondeado */}
        <div className="bg-card rounded-t-[2rem] min-h-screen px-6 pt-20 pb-24">
          {/* Información del usuario */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {user?.name || 'Ezequiel'}
            </h2>
            
            <div className="flex items-center justify-center space-x-6 text-muted-foreground mb-6">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">{user?.age || '30'} años</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {user?.location?.city && user?.location?.country 
                    ? `${user.location.city}, ${user.location.country}`
                    : 'Buenos Aires, Argentina'
                  }
                </span>
              </div>
            </div>

            {/* Avatar con gradiente circular */}
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-start via-accent-end to-accent-end p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-card p-1">
                  <Avatar
                    src={user?.photos?.[0]}
                    fallback={user?.name?.charAt(0) || 'E'}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">0</div>
                <div className="text-sm text-muted-foreground font-medium">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">0</div>
                <div className="text-sm text-muted-foreground font-medium">Visits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">0</div>
                <div className="text-sm text-muted-foreground font-medium">Likes</div>
              </div>
            </div>

            {/* Vista previa del perfil */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4 text-left">Vista previa de tu perfil</h3>
              <p className="text-sm text-muted-foreground mb-4 text-left">Así es como otros usuarios ven tu perfil:</p>
              <div className="flex justify-center">
                <div className="max-w-sm w-full">
                  {user && (
                    <UserCard 
                      user={user}
                      showActions={false}
                      className="shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Completar perfil */}
            <div className="text-left mb-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Completar Perfil</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-foreground font-medium">Información básica</span>
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <span className="text-success-foreground text-sm">✓</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-foreground font-medium">Foto de perfil</span>
                  <div className="bg-warning text-warning-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Pendiente
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-foreground font-medium">Biografía</span>
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <span className="text-success-foreground text-sm">✓</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-foreground font-medium">Intereses</span>
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <span className="text-success-foreground text-sm">✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de Verificación */}
            <div className="mb-8">
              <VerificationPanel />
            </div>

          </div>
        </div>
      </div>
        
        {/* Modal de edición */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Editar Perfil</h2>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80"
                  >
                    ✕
                  </button>
                </div>
                {user && (
                  <ProfileForm 
                    user={user}
                    onSave={handleSaveProfile}
                  />
                )}
              </div>
            </div>
          </div>
        )}
    </ProtectedRoute>
  );
}