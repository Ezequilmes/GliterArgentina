import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Camera, 
  Phone, 
  Mail, 
  CreditCard,
  Upload,
  Check,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button, Card, Loading, Input } from '@/components/ui';
import { VerificationBadge } from './VerificationBadge';
import { useVerification } from '@/hooks/useVerification';
import { VerificationRequest } from '@/lib/verificationService';

interface VerificationPanelProps {
  className?: string;
}

export function VerificationPanel({ className = '' }: VerificationPanelProps) {
  const {
    requests,
    loading,
    submitting,
    verificationStats,
    verificationStatus,
    requestVerification,
    verifyPhone,
    verifyEmail,
    canRequestVerification,
    getLatestRequest
  } = useVerification();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [email, setEmail] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const getVerificationTypeConfig = (type: VerificationRequest['type']) => {
    switch (type) {
      case 'photo':
        return {
          icon: Camera,
          title: 'Verificación de Foto',
          description: 'Sube una foto clara de tu rostro para verificar tu identidad',
          color: 'text-blue-500'
        };
      case 'phone':
        return {
          icon: Phone,
          title: 'Verificación de Teléfono',
          description: 'Verifica tu número de teléfono para mayor seguridad',
          color: 'text-green-500'
        };
      case 'email':
        return {
          icon: Mail,
          title: 'Verificación de Email',
          description: 'Confirma tu dirección de email',
          color: 'text-purple-500'
        };
      case 'identity':
        return {
          icon: CreditCard,
          title: 'Verificación de Identidad',
          description: 'Sube una foto de tu documento de identidad',
          color: 'text-orange-500'
        };
    }
  };

  const getStatusIcon = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
        return 'Pendiente';
    }
  };

  const handlePhoneVerification = async () => {
    if (phoneCode) {
      const success = await verifyPhone(phoneNumber, phoneCode);
      if (success) {
        setShowPhoneVerification(false);
        setPhoneCode('');
      }
    } else {
      // Simular envío de código
      setShowPhoneVerification(true);
    }
  };

  const handleEmailVerification = async () => {
    const success = await verifyEmail(email);
    if (success) {
      setShowEmailVerification(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-6">
          {/* Animated Shield Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-10 h-10 text-blue-500 animate-bounce" />
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              Cargando verificaciones
            </h3>
            <p className="text-muted-foreground">
              Obteniendo el estado de tus verificaciones...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
              style={{ width: '70%', animation: 'pulse 2s infinite' }}
            />
          </div>

          {/* Tip */}
          <div className="text-xs text-muted-foreground/60 italic">
            💡 Tip: Las verificaciones aumentan tu confiabilidad en la plataforma
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">Verificación de Perfil</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifica tu perfil para mayor confianza y seguridad
              </p>
            </div>
          </div>
          <VerificationBadge 
            verificationLevel={verificationStatus.verificationLevel}
            size="lg"
            showText
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">
              {verificationStats.totalRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Solicitudes
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">
              {verificationStats.pendingRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Pendientes
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {verificationStats.approvedRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Aprobadas
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-red-500">
              {verificationStats.rejectedRequests}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Rechazadas
            </div>
          </div>
        </div>

        {/* Verification Types */}
        <div className="space-y-4">
          {(['photo', 'phone', 'email', 'identity'] as const).map((type) => {
            const config = getVerificationTypeConfig(type);
            const latestRequest = getLatestRequest(type);
            const canRequest = canRequestVerification(type);
            const Icon = config.icon;

            return (
              <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <div>
                      <h4 className="font-medium">{config.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {latestRequest && (
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(latestRequest.status)}
                        <span className="text-sm">
                          {getStatusText(latestRequest.status)}
                        </span>
                      </div>
                    )}
                    
                    {type === 'phone' && !latestRequest?.status && (
                      <div className="space-y-2">
                        {!showPhoneVerification ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="tel"
                              placeholder="Número de teléfono"
                              value={phoneNumber}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                              className="w-40"
                            />
                            <Button
                              size="sm"
                              onClick={handlePhoneVerification}
                              disabled={!phoneNumber || submitting}
                            >
                              Enviar Código
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="text"
                              placeholder="Código de 6 dígitos"
                              value={phoneCode}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneCode(e.target.value)}
                              className="w-32"
                              maxLength={6}
                            />
                            <Button
                              size="sm"
                              onClick={handlePhoneVerification}
                              disabled={phoneCode.length !== 6 || submitting}
                            >
                              Verificar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {type === 'email' && !latestRequest?.status && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          className="w-40"
                        />
                        <Button
                          size="sm"
                          onClick={handleEmailVerification}
                          disabled={!email || submitting}
                        >
                          Verificar
                        </Button>
                      </div>
                    )}

                    {(type === 'photo' || type === 'identity') && canRequest && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestVerification(type)}
                        disabled={submitting}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Subir
                      </Button>
                    )}
                  </div>
                </div>

                {latestRequest?.status === 'rejected' && latestRequest.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Motivo del rechazo:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {latestRequest.rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🎯 Beneficios de la verificación
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Mayor confianza de otros usuarios</li>
            <li>• Prioridad en las recomendaciones</li>
            <li>• Acceso a funciones premium</li>
            <li>• Badge de verificación en tu perfil</li>
            <li>• Mayor seguridad en la plataforma</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}