'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, MapPin, Heart, Eye, Users, Camera, Check, X, Shield } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { UserCard } from '@/components/profile/UserCard';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { getUserProfilePhoto } from '@/lib/userUtils';

export default function ProfilePage() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  const handlePhotoUpload = (photoUrl: string) => {
    // Handle photo upload
    console.log('Photo uploaded:', photoUrl);
  };

  if (!user) {
    return null;
  }

  // Calcular el porcentaje de completitud del perfil
  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 5; // Total de elementos a completar

    if (user.name) completed++;
    if (user.age) completed++;
    if (user.bio) completed++;
    if (getUserProfilePhoto(user)) completed++; // Usar getUserProfilePhoto en lugar de user.profilePhoto
    if (user.interests && user.interests.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
          {/* Header fijo */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              
              <h1 className="text-lg font-semibold text-gray-800">Mi Perfil</h1>
              
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
              >
                <Edit3 className="w-5 h-5" />
                <span>Editar</span>
              </button>
            </div>
          </div>

          {/* Contenido principal con padding superior ajustado */}
          <div className="pt-24 pb-20">
            {/* Información del usuario */}
            <div className="px-4 mb-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-600">
                  {user.age && `${user.age} años`}
                  {user.location?.city && ` • ${user.location.city}`}
                </p>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Avatar
                    src={getUserProfilePhoto(user)}
                    alt={user.name}
                    size="xl"
                    className="border-4 border-white shadow-lg"
                  />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {statsLoading ? '...' : stats.matchesCount}
                  </div>
                  <div className="text-sm text-gray-600">Matches</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {statsLoading ? '...' : stats.visitsCount}
                  </div>
                  <div className="text-sm text-gray-600">Visitas</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {statsLoading ? '...' : stats.likesCount}
                  </div>
                  <div className="text-sm text-gray-600">Likes</div>
                </div>
              </div>

              {/* Vista previa del perfil */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Vista previa</h3>
                <div className="max-w-sm mx-auto">
                  <UserCard
                    user={user}
                    distance={0}
                    onLike={() => {}}
                    onPass={() => {}}
                    onSuperLike={() => {}}
                    showActions={false}
                  />
                </div>
              </div>

              {/* Completar Perfil */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Completar Perfil</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progreso</span>
                    <span className="text-sm font-medium text-gray-800">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Información básica</span>
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Completado</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Foto de perfil</span>
                    <div className="flex items-center gap-1">
                      {getUserProfilePhoto(user) ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Completado</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-600">Pendiente</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Intereses</span>
                    <div className="flex items-center gap-1">
                      {user.interests && user.interests.length > 0 ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Completado</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-600">Pendiente</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verificaciones - Simplificado */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Verificación</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Estado de verificación</p>
                      <span className="text-sm font-medium">
                        {user.isVerified ? 'Cuenta verificada' : 'Sin verificar'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/verification')}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
                  >
                    {user.isVerified ? 'Ver estado' : 'Verificar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de edición */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Editar Perfil</h2>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <ProfileForm
                    user={user}
                    onSave={handleSaveProfile}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}