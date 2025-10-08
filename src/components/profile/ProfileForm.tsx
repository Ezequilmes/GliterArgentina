'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Button, Input, Select, Card, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/firestore';
import { storageService } from '@/lib/storage';
import { cn, isValidEmail } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Spinner } from '@/components/ui/Spinner';
import { Camera, Plus, X, MapPin } from 'lucide-react';

export interface ProfileFormProps {
  user: User;
  onSave?: (user: User) => void;
  className?: string;
}

const INTERESTS_OPTIONS = [
  'Oral', 'Anal', 'Besos', 'Caricias', 'Masajes', 'Juguetes', 'Roleplay',
  'BDSM', 'Fetichismo', 'Exhibicionismo', 'Voyeurismo', 'Threesome', 'Orgías',
  'Sexo tántrico', 'Sexo al aire libre', 'Sexo en público', 'Dominación',
  'Sumisión', 'Bondage', 'Spanking', 'Wax play', 'Crossdressing'
];

const SEXUAL_ROLES = [
  { value: 'active', label: 'Activo' },
  { value: 'passive', label: 'Pasivo' },
  { value: 'versatile', label: 'Versátil' }
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  onSave,
  className
}) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    bio: user.bio || '',
    age: user.age || 18,
    sexualRole: user.sexualRole || '',
    interests: user.interests || [],
    location: typeof user.location === 'string' ? user.location : (user.location ? `${user.location.city || ''}, ${user.location.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : ''),
    showDistance: user.settings?.privacy?.showDistance ?? true,
    showOnline: user.settings?.privacy?.showOnline ?? true,
    showAge: user.settings?.privacy?.showAge ?? true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newInterest, setNewInterest] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.age < 18 || formData.age > 100) {
      newErrors.age = 'La edad debe estar entre 18 y 100 años';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'La biografía no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar que el usuario esté autenticado
    if (!currentUser || !currentUser.id) {
      console.error('Usuario no autenticado');
      setErrors(prev => ({ ...prev, photo: 'Debes estar autenticado para subir fotos' }));
      return;
    }

    // Verificar que el archivo sea válido
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF)');
      return;
    }

    // Verificar el tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB permitido');
      return;
    }

    // Limpiar errores previos
    setErrors(prev => ({ ...prev, photo: '' }));
    setUploadingPhoto(true);

    try {
      const result = await storageService.uploadProfileImage(currentUser.id, file, (progress) => {
        setUploadProgress(progress.progress);
      });
      
      // Update user photos
      const updatedPhotos = user.photos ? [...user.photos] : [];
      if (updatedPhotos.length === 0) {
        updatedPhotos.push(result.url);
      } else {
        updatedPhotos[0] = result.url; // Replace main photo
      }

      await userService.updateUser(currentUser.id, { photos: updatedPhotos });
      
      // Update local user data
      const updatedUser = { ...user, photos: updatedPhotos };
      onSave?.(updatedUser);
      
      // Refresh user data in AuthContext to update navigation and other components
      await refreshUser();
      
      // Clear any previous errors
      setErrors(prev => ({ ...prev, photo: '' }));
      
      // Show success message
      toast.success('Foto de perfil actualizada correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la foto. Por favor intenta de nuevo.';
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      handleInputChange('interests', [...formData.interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    handleInputChange('interests', formData.interests.filter(i => i !== interest));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser) return;

    setLoading(true);
    try {
      const updatedData: any = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        age: formData.age,
        sexualRole: formData.sexualRole,
        interests: formData.interests,
        settings: {
          ...user.settings,
          privacy: {
            ...user.settings?.privacy,
            showDistance: formData.showDistance,
            showOnline: formData.showOnline,
            showAge: formData.showAge
          }
        }
      };

      // Only include location if it's a valid coordinate object, not a string
      if (typeof formData.location === 'object' && formData.location !== null && 'latitude' in formData.location) {
        updatedData.location = formData.location;
      }

      await userService.updateUser(currentUser.id, updatedData);
      
      const updatedUser = { ...user, ...updatedData };
      onSave?.(updatedUser);
      
      // Show success message
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil. Por favor intenta de nuevo.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3 sm:space-y-6 animate-fade-in stagger-children', className)}>
      {/* Profile Photo */}
      <Card className="p-3 sm:p-6 hover-lift transition-all-smooth">
        <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 animate-slide-in-left">Foto de perfil</h3>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-shrink-0">
            <Avatar
              src={user.profilePhoto || user.photos?.[0]}
              alt={user.name}
              size="xl"
              fallback={user.name.charAt(0)}
              className="hover-scale transition-all-smooth"
            />
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center animate-fade-in">
                <div className="text-white text-xs font-medium">
                  {Math.round(uploadProgress)}%
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left min-w-0">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingPhoto}
                className="pointer-events-none hover-lift transition-all-smooth btn-ripple w-full sm:w-auto touch-manipulation"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{uploadingPhoto ? 'Subiendo...' : 'Cambiar foto'}</span>
              </Button>
            </label>
            
            {uploadingPhoto && (
              <div className="mt-2 animate-fade-in">
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 dark:bg-gray-700">
                  <div 
                    className="bg-primary-600 h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Subiendo foto... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            
            {!uploadingPhoto && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1 animate-fade-in">
                JPG, PNG o GIF. Máximo 5MB.
              </p>
            )}
            
            {errors.photo && (
              <p className="text-xs sm:text-sm text-red-600 mt-1 animate-fade-in">
                {errors.photo}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card className="p-3 sm:p-6 hover-lift transition-all-smooth">
        <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 animate-slide-in-left">Información básica</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 stagger-children">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
            className="text-sm sm:text-base"
          />
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
            className="text-sm sm:text-base"
          />
          
          <Input
            label="Edad"
            type="number"
            min="18"
            max="100"
            value={formData.age}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('age', parseInt(e.target.value))}
            error={errors.age}
            required
            className="text-sm sm:text-base"
          />
          
          <Select
            label="Rol sexual"
            value={formData.sexualRole}
            onChange={(value: string) => handleInputChange('sexualRole', value)}
            options={SEXUAL_ROLES}
            placeholder="Selecciona tu rol"
            className="text-sm sm:text-base"
          />
        </div>
        
        <div className="mt-3 sm:mt-4">
          <Input
            label="Biografía"
            value={formData.bio}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
            error={errors.bio}
            helperText={`${formData.bio.length}/500 caracteres`}
            multiline
            rows={3}
            className="text-sm sm:text-base"
          />
        </div>

        <div className="mt-3 sm:mt-4">
          <Input
            label="Ubicación"
            value={formData.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('location', e.target.value)}
            icon={<MapPin className="w-3 h-3 sm:w-4 sm:h-4" />}
            placeholder="Ciudad, País"
            className="text-sm sm:text-base"
          />
        </div>
      </Card>

      {/* Interests */}
      <Card className="p-3 sm:p-6">
        <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Intereses</h3>
        
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
          {formData.interests.map((interest, index) => (
            <Badge
              key={index}
              variant="primary"
              className="cursor-pointer text-xs sm:text-sm touch-manipulation"
              onClick={() => removeInterest(interest)}
            >
              <span className="truncate max-w-[120px] sm:max-w-none">{interest}</span>
              <X className="w-3 h-3 ml-1 flex-shrink-0" />
            </Badge>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Select
            value={newInterest}
            onChange={(value) => setNewInterest(value)}
            options={INTERESTS_OPTIONS
              .filter(option => !formData.interests.includes(option))
              .map(option => ({ value: option, label: option }))}
            placeholder="Selecciona un interés"
            className="flex-1 text-sm sm:text-base"
          />
          <Button
            type="button"
            onClick={addInterest}
            disabled={!newInterest || formData.interests.includes(newInterest)}
            size="sm"
            className="w-full sm:w-auto touch-manipulation"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="sm:hidden ml-1">Agregar</span>
          </Button>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Selecciona hasta 10 intereses que te representen
        </p>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-3 sm:p-6">
        <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Configuración de privacidad</h3>
        <div className="space-y-3 sm:space-y-4">
          <label className="flex items-center justify-between py-1 touch-manipulation cursor-pointer">
            <span className="text-xs sm:text-sm font-medium">Mostrar distancia</span>
            <input
              type="checkbox"
              checked={formData.showDistance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('showDistance', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 sm:w-4 sm:h-4 touch-manipulation"
            />
          </label>
          
          <label className="flex items-center justify-between py-1 touch-manipulation cursor-pointer">
            <span className="text-xs sm:text-sm font-medium">Mostrar estado en línea</span>
            <input
              type="checkbox"
              checked={formData.showOnline}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('showOnline', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 sm:w-4 sm:h-4 touch-manipulation"
            />
          </label>
          
          <label className="flex items-center justify-between py-1 touch-manipulation cursor-pointer">
            <span className="text-xs sm:text-sm font-medium">Mostrar edad</span>
            <input
              type="checkbox"
              checked={formData.showAge}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('showAge', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 sm:w-4 sm:h-4 touch-manipulation"
            />
          </label>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center sm:justify-end pt-2">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="hover-lift transition-all-smooth btn-ripple w-full sm:w-auto touch-manipulation"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <Spinner size="sm" color="white" />
              <span className="text-sm sm:text-base">Guardando...</span>
            </div>
          ) : (
            <span className="text-sm sm:text-base">Guardar cambios</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;