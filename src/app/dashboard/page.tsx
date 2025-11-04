'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout';
import { Card, Button, Loading, Avatar } from '@/components/ui';
import { getUserProfilePhoto } from '@/lib/userUtils';
import { 
  User, 
  Heart, 
  MessageCircle, 
  Crown,
  Shield,
  MapPin,
  Calendar,
  HeartHandshake
} from 'lucide-react';
import { createDonationPreference } from '@/lib/mercadopago';
import { analyticsService } from '@/services/analyticsService';


export default function DashboardPage() {
  const { user, loading, initializing } = useAuth();
  const router = useRouter();
  const [donating, setDonating] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading icon="heart" size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <AppLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center bg-gradient-to-r from-primary to-accent-end rounded-2xl p-8 text-primary-foreground mb-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-2">
              ¡Hola, {user?.name}! 👋
            </h1>
            <p className="text-primary-foreground/90">
              Bienvenido de vuelta a Gliter Argentina
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <div className="lg:col-span-1">
              <Card padding="lg">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <Avatar
                      src={getUserProfilePhoto(user)}
                      alt={user?.name || 'Usuario'}
                      size="2xl"
                      fallback={user?.name?.charAt(0) || 'U'}
                      className="w-full h-full"
                    />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {user?.name || 'Usuario'}
                  </h2>
                  
                  <p className="text-muted-foreground mb-4">
                    {user?.email}
                  </p>

                  {user?.age && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {user.age} años
                    </div>
                  )}

                  {user?.location && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.location.city && user.location.country 
                        ? `${user.location.city}, ${user.location.country}`
                        : user.location.city || user.location.country || 'Ubicación no disponible'
                      }
                    </div>
                  )}

                  <div className="flex justify-center space-x-2 mb-4">
                    {user?.isPremium && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-faint text-accent-strong">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </span>
                    )}
                    
                    {user?.isVerified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-faint text-info-strong">
                        <Shield className="w-3 h-3 mr-1" />
                        Verificado
                      </span>
                    )}
                  </div>

                  <Button variant="primary" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </div>
              </Card>
            </div>

            {/* Stats and Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      Matches
                    </div>
                  </div>
                </Card>
                
                <Card padding="lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-end mb-1">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      Mensajes
                    </div>
                  </div>
                </Card>
                
                <Card padding="lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success mb-1">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      Visitas
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card padding="lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Acciones Rápidas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="h-16 flex items-center justify-center"
                    onClick={() => router.push('/discover')}
                  >
                    <div className="flex items-center">
                      <Heart className="w-6 h-6 mr-3" />
                      <div className="text-center">
                        <div className="font-semibold">Descubrir</div>
                        <div className="text-sm opacity-80">Encuentra nuevas personas</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    className="h-16 flex items-center justify-center"
                    onClick={() => router.push('/chat')}
                  >
                    <div className="flex items-center">
                      <MessageCircle className="w-6 h-6 mr-3" />
                      <div className="text-center">
                        <div className="font-semibold">Mensajes</div>
                        <div className="text-sm opacity-80">Revisa tus conversaciones</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </Card>

              {/* Activity Summary */}
              <Card padding="lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Actividad Reciente
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Perfil completado
                    </span>
                    <span className="text-sm font-medium text-success">
                      85%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Última conexión
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Ahora
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Miembro desde
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Hoy
                    </span>
                  </div>
              </div>
              </Card>

              {/* Membership Status */}
              <Card className={user?.isPremium ? "bg-gradient-to-r from-accent-start to-accent-end text-accent-foreground" : ""} padding="lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {user?.isPremium ? 'Membresía Premium' : 'Membresía Gratuita'}
                    </h3>
                    <p className={user?.isPremium ? "text-accent-foreground/90" : "text-muted-foreground"}>
                      {user?.isPremium 
                        ? 'Disfruta de todas las funciones premium'
                        : 'Actualiza para desbloquear funciones exclusivas'
                      }
                    </p>
                  </div>
                  
                  {!user?.isPremium && (
                    <Button variant="accent">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </Card>

              {/* Donations Card */}
              <Card padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                      <HeartHandshake className="w-5 h-5 mr-2 text-pink-500" />
                      Apoya el proyecto
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Tu aporte nos ayuda a mantener y mejorar Gliter Argentina.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[100000, 300000, 1000000].map((amount) => (
                    <Button
                      key={amount}
                      variant="primary"
                      disabled={donating}
                      onClick={async () => {
                        if (!user?.email || !(user as any)?.name) {
                          setDonationError('Completa tu perfil (nombre y email) para donar');
                          return;
                        }
                        const userId = (user as any)?.id ?? (user as any)?.uid;
                        if (!userId) {
                          setDonationError('No se encontró tu usuario. Intenta iniciar sesión nuevamente.');
                          return;
                        }
                        setDonationError(null);
                        setDonating(true);
                        try {
                          analyticsService.trackDonationStarted(amount, 'ARS', 'general');
                          const pref = await createDonationPreference(
                            userId,
                            amount,
                            'ARS',
                            user.email!,
                            (user as any).name,
                            { campaignId: 'general' }
                          );
                          if (pref?.initPoint) {
                            window.location.href = pref.initPoint;
                          }
                        } catch (e: any) {
                          console.error(e);
                          setDonationError(e?.message || 'No se pudo iniciar la donación');
                          analyticsService.trackDonationFailed(e?.message, amount, 'ARS', 'general');
                        } finally {
                          setDonating(false);
                        }
                      }}
                      className="h-12"
                    >
                      <div className="flex items-center justify-center">
                        <Heart className="w-5 h-5 mr-2" />
                        <span>
                          Donar {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount / 100)}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>

                {donationError && (
                  <div className="mt-4 text-sm text-destructive">
                    {donationError}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
