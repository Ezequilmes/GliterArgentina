'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Crown, User, Phone, Check, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ExclusiveRegistrationFormProps {
  className?: string;
}

interface FormData {
  name: string;
  whatsapp: string;
  type: 'modelo' | 'masajista' | '';
}

interface FormErrors {
  name?: string;
  whatsapp?: string;
  type?: string;
}

export const ExclusiveRegistrationForm: React.FC<ExclusiveRegistrationFormProps> = ({ 
  className 
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    whatsapp: '',
    type: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'El número de WhatsApp es requerido';
    } else if (!/^\+?[\d\s\-\(\)]{8,}$/.test(formData.whatsapp.trim())) {
      newErrors.whatsapp = 'Ingresa un número de WhatsApp válido';
    }

    if (!formData.type) {
      newErrors.type = 'Debes seleccionar una opción';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardar datos en Firestore
      const docRef = await addDoc(collection(db, 'exclusive-registrations'), {
        name: formData.name.trim(),
        whatsapp: formData.whatsapp.trim(),
        type: formData.type,
        status: 'pending', // pending, approved, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Registro exclusivo guardado con ID:', docRef.id);
      
      setIsSubmitted(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({ name: '', whatsapp: '', type: '' });
        setIsSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      // Mostrar error al usuario
      alert('Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <Card className={cn('max-w-md mx-auto', className)}>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¡Solicitud Enviada!
          </h3>
          <p className="text-gray-600 mb-4">
            Gracias por tu interés en formar parte de Los Modelos y Masajistas Exclusivos. 
            Nos pondremos en contacto contigo pronto.
          </p>
          <div className="text-sm text-purple-600 font-medium">
            Te contactaremos por WhatsApp
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('max-w-md mx-auto shadow-xl border-0', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              ¿Querés ser parte de Los Modelos y Masajistas Premium?
            </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            Completá el formulario y nos pondremos en contacto contigo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                className={cn(
                  'pl-10',
                  errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors.name && (
              <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label htmlFor="whatsapp" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Número de WhatsApp *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={formData.whatsapp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('whatsapp', e.target.value)}
                className={cn(
                  'pl-10',
                  errors.whatsapp && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors.whatsapp && (
              <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.whatsapp}
              </div>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              ¿Qué tipo de servicio ofrecés? *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('type', 'modelo')}
                className={cn(
                  'p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm font-medium',
                  formData.type === 'modelo'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300 text-gray-700 hover:bg-purple-50',
                  errors.type && 'border-red-500'
                )}
              >
                💃 Modelo
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('type', 'masajista')}
                className={cn(
                  'p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm font-medium',
                  formData.type === 'masajista'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300 text-gray-700 hover:bg-purple-50',
                  errors.type && 'border-red-500'
                )}
              >
                💆 Masajista
              </button>
            </div>
            {errors.type && (
              <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.type}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 sm:py-3 mt-4 sm:mt-6 text-sm sm:text-base"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </div>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </form>

        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-xs text-gray-500 px-2">
            Al enviar este formulario, aceptás que nos pongamos en contacto contigo por WhatsApp
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExclusiveRegistrationForm;