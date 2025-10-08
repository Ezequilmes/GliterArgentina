import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verificationService, VerificationRequest, VerificationStatus } from '@/lib/verificationService';
import { toast } from 'react-hot-toast';

export function useVerification() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStats, setVerificationStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });

  // Cargar solicitudes de verificación
  const loadVerificationRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userRequests = await verificationService.getUserVerificationRequests(user.id);
      setRequests(userRequests);

      const stats = await verificationService.getVerificationStats(user.id);
      setVerificationStats(stats);
    } catch (error) {
      console.error('Error loading verification requests:', error);
      toast.error('Error al cargar las solicitudes de verificación');
    } finally {
      setLoading(false);
    }
  };

  // Solicitar verificación
  const requestVerification = async (
    type: VerificationRequest['type'], 
    documents?: string[]
  ) => {
    if (!user?.id) return;

    try {
      setSubmitting(true);

      // Verificar si puede solicitar este tipo de verificación
      if (!verificationService.canRequestVerification(requests, type)) {
        toast.error('Ya tienes una solicitud pendiente o reciente para este tipo de verificación');
        return;
      }

      const requestId = await verificationService.requestVerification(user.id, type, documents);
      
      toast.success('Solicitud de verificación enviada correctamente');
      
      // Recargar las solicitudes
      await loadVerificationRequests();
      
      return requestId;
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast.error('Error al enviar la solicitud de verificación');
    } finally {
      setSubmitting(false);
    }
  };

  // Verificar teléfono
  const verifyPhone = async (phoneNumber: string, code: string) => {
    if (!user?.id) return false;

    try {
      setSubmitting(true);
      const success = await verificationService.verifyPhone(user.id, phoneNumber, code);
      
      if (success) {
        toast.success('Teléfono verificado correctamente');
        await loadVerificationRequests();
      } else {
        toast.error('Código de verificación inválido');
      }
      
      return success;
    } catch (error) {
      console.error('Error verifying phone:', error);
      toast.error('Error al verificar el teléfono');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Verificar email
  const verifyEmail = async (email: string) => {
    if (!user?.id) return false;

    try {
      setSubmitting(true);
      const success = await verificationService.verifyEmail(user.id, email);
      
      if (success) {
        toast.success('Email verificado correctamente');
        await loadVerificationRequests();
      } else {
        toast.error('Error al verificar el email');
      }
      
      return success;
    } catch (error) {
      console.error('Error verifying email:', error);
      toast.error('Error al verificar el email');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener estado de verificación del usuario
  const getVerificationStatus = (): VerificationStatus => {
    const photoVerified = requests.some(r => r.type === 'photo' && r.status === 'approved');
    const phoneVerified = requests.some(r => r.type === 'phone' && r.status === 'approved');
    const emailVerified = requests.some(r => r.type === 'email' && r.status === 'approved');
    const identityVerified = requests.some(r => r.type === 'identity' && r.status === 'approved');

    const verifiedCount = [photoVerified, phoneVerified, emailVerified, identityVerified]
      .filter(Boolean).length;

    let verificationLevel: VerificationStatus['verificationLevel'] = 'none';
    if (verifiedCount === 1) verificationLevel = 'basic';
    else if (verifiedCount >= 2 && verifiedCount < 4) verificationLevel = 'verified';
    else if (verifiedCount === 4) verificationLevel = 'premium';

    return {
      photoVerified,
      phoneVerified,
      emailVerified,
      identityVerified,
      verificationLevel
    };
  };

  // Verificar si puede solicitar un tipo de verificación
  const canRequestVerification = (type: VerificationRequest['type']) => {
    return verificationService.canRequestVerification(requests, type);
  };

  // Obtener la última solicitud de un tipo
  const getLatestRequest = (type: VerificationRequest['type']) => {
    return requests.find(r => r.type === type);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadVerificationRequests();
    }
  }, [user?.id]);

  return {
    requests,
    loading,
    submitting,
    verificationStats,
    verificationStatus: getVerificationStatus(),
    requestVerification,
    verifyPhone,
    verifyEmail,
    canRequestVerification,
    getLatestRequest,
    refreshRequests: loadVerificationRequests
  };
}