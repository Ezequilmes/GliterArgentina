'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Header } from '@/components/layout';
import { Card, Button, Switch, Slider, Select, Badge } from '@/components/ui';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup';
import { analyticsService } from '@/services/analyticsService';
import { 
  MapPin, 
  Users, 
  Heart, 
  Moon, 
  Sun, 
  Globe, 
  Smartphone,
  FileText,
  Mail,
  Star,
  Filter,
  Volume2,
  Vibrate,
  Eye,
  Lock,
  HelpCircle,
  Shield
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [ageRange, setAgeRange] = useState([18, 35]);
  const [maxDistance, setMaxDistance] = useState([50]);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  // Settings states
  const [globalMode, setGlobalMode] = useState(false);
  const [recentlyActive, setRecentlyActive] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [superLikeNotifications, setSuperLikeNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [vibrationNotifications, setVibrationNotifications] = useState(true);

  const handleAgeRangeChange = (values: number[]) => {
    setAgeRange(values);
  };

  const handleDistanceChange = (values: number[]) => {
    setMaxDistance(values);
  };

  return (
    <ProtectedRoute requireAuth>
      <AppLayout>
        <div className="space-y-6">
          <Header title="Configuración" />

          {/* Discovery Settings */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Preferencias de Descubrimiento
            </h3>
            
            <div className="space-y-6">
              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Rango de edad: {ageRange[0]} - {ageRange[1]} años
                </label>
                <Slider
                  value={ageRange}
                  onValueChange={handleAgeRangeChange}
                  min={18}
                  max={80}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Distancia máxima: {maxDistance[0]} km
                </label>
                <Slider
                  value={maxDistance}
                  onValueChange={handleDistanceChange}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Show Me */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Mostrarme
                </label>
                <Select
                  options={[
                    { value: 'men', label: 'Hombres' },
                    { value: 'women', label: 'Mujeres' },
                    { value: 'everyone', label: 'Todos' }
                  ]}
                  placeholder="Seleccionar preferencia"
                  className="w-full"
                />
              </div>

              {/* Sexual Role */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Rol sexual preferido
                </label>
                <Select
                  options={[
                    { value: 'active', label: 'Activo' },
                    { value: 'passive', label: 'Pasivo' },
                    { value: 'versatile', label: 'Versátil' },
                    { value: 'any', label: 'Cualquiera' }
                  ]}
                  placeholder="Seleccionar rol"
                  className="w-full"
                />
              </div>

              {/* Global Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Modo global</h4>
                  <p className="text-sm text-muted-foreground">
                    Descubre personas de todo el mundo
                  </p>
                </div>
                <Switch 
                  checked={globalMode}
                  onCheckedChange={setGlobalMode}
                />
              </div>

              {/* Recently Active */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Solo usuarios activos</h4>
                  <p className="text-sm text-muted-foreground">
                    Mostrar solo personas activas recientemente
                  </p>
                </div>
                <Switch 
                  checked={recentlyActive}
                  onCheckedChange={setRecentlyActive}
                />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Notificaciones
            </h3>
            
            <div className="space-y-6">
              {/* Push Notifications Setup */}
              <PushNotificationSetup />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Nuevos matches</h4>
                  <p className="text-sm text-muted-foreground">
                    Cuando hagas match con alguien
                  </p>
                </div>
                <Switch 
                  checked={matchNotifications}
                  onCheckedChange={setMatchNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Mensajes</h4>
                  <p className="text-sm text-muted-foreground">
                    Nuevos mensajes de tus matches
                  </p>
                </div>
                <Switch 
                  checked={messageNotifications}
                  onCheckedChange={setMessageNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Super Likes</h4>
                  <p className="text-sm text-muted-foreground">
                    Cuando recibas un Super Like
                  </p>
                </div>
                <Switch 
                  checked={superLikeNotifications}
                  onCheckedChange={setSuperLikeNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Sonido</h4>
                  <p className="text-sm text-muted-foreground">
                    Reproducir sonidos de notificación
                  </p>
                </div>
                <Switch 
                  checked={soundNotifications}
                  onCheckedChange={setSoundNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Vibración</h4>
                  <p className="text-sm text-muted-foreground">
                    Vibrar al recibir notificaciones
                  </p>
                </div>
                <Switch 
                  checked={vibrationNotifications}
                  onCheckedChange={setVibrationNotifications}
                />
              </div>
            </div>
          </Card>

          {/* Privacy & Security */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Privacidad y Seguridad
            </h3>
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsChangePasswordModalOpen(true)}
              >
                <Lock className="w-4 h-4 mr-3" />
                Cambiar contraseña
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-3" />
                Configuración de privacidad
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-3" />
                Usuarios bloqueados
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Smartphone className="w-4 h-4 mr-3" />
                Dispositivos conectados
              </Button>
            </div>
          </Card>

          {/* App Settings */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Configuración de la App
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground flex items-center">
                    {isDarkMode ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                    Modo oscuro
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cambiar el tema de la aplicación
                  </p>
                </div>
                <Switch 
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Idioma
                </label>
                <Select
                  options={[
                    { value: 'es', label: 'Español' },
                    { value: 'en', label: 'English' },
                    { value: 'pt', label: 'Português' }
                  ]}
                  defaultValue="es"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Región
                </label>
                <Select
                  options={[
                    { value: 'ar', label: 'Argentina' },
                    { value: 'br', label: 'Brasil' },
                    { value: 'cl', label: 'Chile' },
                    { value: 'co', label: 'Colombia' },
                    { value: 'mx', label: 'México' },
                    { value: 'pe', label: 'Perú' },
                    { value: 'uy', label: 'Uruguay' }
                  ]}
                  defaultValue="ar"
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Premium */}
          {!user?.isPremium && (
            <Card variant="gold" padding="lg">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Gliter Premium
                </h3>
                <p className="text-muted-foreground mb-4">
                  Desbloquea funciones exclusivas y mejora tu experiencia
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Likes ilimitados
                  </div>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Ver quién te dio like
                  </div>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    5 Super Likes por día
                  </div>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Boost mensual gratis
                  </div>
                </div>
                <Button 
                  variant="accent" 
                  size="lg"
                  onClick={() => {
                    try {
                      analyticsService.trackPremiumViewed('settings');
                    } catch (error) {
                      console.error('Error tracking premium viewed:', error);
                    }
                  }}
                >
                  Actualizar a Premium
                </Button>
              </div>
            </Card>
          )}

          {/* Support & Legal */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Soporte y Legal
            </h3>
            
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-3" />
                Centro de ayuda
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-3" />
                Contactar soporte
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-3" />
                Términos de servicio
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-3" />
                Política de privacidad
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Star className="w-4 h-4 mr-3" />
                Calificar la app
              </Button>
            </div>
          </Card>

          {/* App Info */}
          <Card variant="default" padding="lg">
            <div className="text-center text-sm text-muted-foreground">
              <p>Gliter Argentina v1.0.0</p>
              <p className="mt-1">© 2024 Gliter. Todos los derechos reservados.</p>
            </div>
          </Card>
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}