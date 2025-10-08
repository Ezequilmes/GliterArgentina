'use client';

import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Usuario no autenticado');
      }

      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar la contraseña
      await updatePassword(user, newPassword);

      toast.success('Contraseña cambiada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('La contraseña actual es incorrecta');
      } else if (error.code === 'auth/weak-password') {
        toast.error('La nueva contraseña es muy débil');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Por seguridad, necesitas iniciar sesión nuevamente');
      } else {
        toast.error('Error al cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar contraseña" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contraseña actual
          </label>
          <div className="relative">
            <Input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nueva contraseña
          </label>
          <div className="relative">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              placeholder="Ingresa tu nueva contraseña"
              className="pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mínimo 6 caracteres
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Requisitos de la contraseña:
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Al menos 6 caracteres</li>
            <li>• Diferente a la contraseña actual</li>
            <li>• Se recomienda usar una combinación de letras, números y símbolos</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 text-sm"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="hidden sm:inline">Cambiando...</span>
                <span className="sm:hidden">...</span>
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Cambiar contraseña</span>
                <span className="sm:hidden">Cambiar</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}