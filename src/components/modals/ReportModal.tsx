'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { User } from '@/types';
import { userService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Flag, Shield, Ban, User as UserIcon, MessageSquare } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: User;
  onReportSubmitted?: () => void;
}

const reportReasons = [
  {
    id: 'inappropriate',
    label: 'Contenido inapropiado',
    description: 'Fotos o contenido sexual explícito',
    icon: AlertTriangle,
    color: 'text-red-500'
  },
  {
    id: 'fake',
    label: 'Perfil falso',
    description: 'Información falsa o fotos robadas',
    icon: UserIcon,
    color: 'text-orange-500'
  },
  {
    id: 'harassment',
    label: 'Comportamiento abusivo',
    description: 'Acoso, insultos o amenazas',
    icon: Shield,
    color: 'text-purple-500'
  },
  {
    id: 'spam',
    label: 'Spam o estafa',
    description: 'Promociones no deseadas o intentos de estafa',
    icon: Ban,
    color: 'text-yellow-500'
  },
  {
    id: 'other',
    label: 'Otro motivo',
    description: 'Otro tipo de comportamiento inapropiado',
    icon: Flag,
    color: 'text-gray-500'
  }
];

export function ReportModal({ isOpen, onClose, reportedUser, onReportSubmitted }: ReportModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;

    setIsSubmitting(true);
    try {
      await userService.reportUser(
        user.id,
        reportedUser.id,
        selectedReason,
        description
      );

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        onReportSubmitted?.();
        // Reset form
        setSelectedReason('');
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedReason('');
      setDescription('');
      setShowSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto mx-3 sm:mx-0">
        {showSuccess ? (
          <div className="p-4 sm:p-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Reporte enviado
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Gracias por ayudarnos a mantener la comunidad segura. Revisaremos tu reporte.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                Reportar a {reportedUser.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                ¿Por qué quieres reportar a este usuario?
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {reportReasons.map((reason) => {
                  const IconComponent = reason.icon;
                  return (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left touch-manipulation ${
                        selectedReason === reason.id
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${reason.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            {reason.label}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {reason.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedReason && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detalles adicionales (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Proporciona más detalles sobre el problema..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-sm sm:text-base"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {description.length}/500 caracteres
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="secondary"
                  className="flex-1 w-full sm:w-auto touch-manipulation"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 w-full sm:w-auto touch-manipulation"
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Reportar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}