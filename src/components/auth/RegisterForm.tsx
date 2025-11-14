'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm as RegisterFormType } from '@/types';
import { isValidEmail, isValidPassword } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
  { value: 'non-binary', label: 'No binario' },
  { value: 'other', label: 'Otro' },
];

const SEXUAL_ROLE_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'passive', label: 'Pasivo' },
  { value: 'versatile', label: 'Versátil' },
];

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormType>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: 0,
    gender: '',
    sexualRole: '',
  });
  const [ageInput, setAgeInput] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof (RegisterFormType & { confirmPassword: string }), string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const { register } = useAuth();
  const router = useRouter();

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof (RegisterFormType & { confirmPassword: string }), string>> = {};

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else {
      const passwordValidation = isValidPassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormType, string>> = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar edad
    if (!ageInput.trim()) {
      newErrors.age = 'La edad es requerida';
    } else if (formData.age < 18) {
      newErrors.age = 'Debes ser mayor de 18 años';
    } else if (formData.age > 100) {
      newErrors.age = 'Edad inválida';
    }

    // Validar género
    if (!formData.gender) {
      newErrors.gender = 'Selecciona tu género';
    }

    // Validar rol sexual
    if (!formData.sexualRole) {
      newErrors.sexualRole = 'Selecciona tu rol sexual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (error: any) {
      setSubmitError(error.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof (RegisterFormType & { confirmPassword: string }), value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Limpiar error general
    if (submitError) {
      setSubmitError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
      <Card className="w-full max-w-md p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 p-3 sm:p-3.5 md:p-4">
            <Image 
              src="/logo.svg?v=1" 
              alt="Gliter Logo" 
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Únete a Gliter
          </h1>
          <p className="text-muted-foreground">
            Paso {currentStep} de 2
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-accent-start to-accent-end h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>

        {/* Error general */}
        {submitError && (
          <div className="bg-destructive-faint border border-destructive-strong/30 rounded-lg p-3">
            <p className="text-destructive-strong text-sm">{submitError}</p>
          </div>
        )}

        {/* Step 1: Credenciales */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center text-foreground">
              Credenciales de acceso
            </h2>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('password', e.target.value)}
                error={errors.password}
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                autoComplete="new-password"
              />
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirmar contraseña
              </label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                autoComplete="new-password"
              />
            </div>

            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Información personal */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-center text-foreground">
              Información personal
            </h2>

            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Nombre
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                error={errors.name}
                icon={<User className="w-4 h-4" />}
                autoComplete="given-name"
              />
            </div>

            {/* Edad */}
            <div className="space-y-2">
              <label htmlFor="age" className="text-sm font-medium text-foreground">
                Edad
              </label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                placeholder="Tu edad"
                inputMode="numeric"
                value={ageInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  setAgeInput(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) {
                    setFormData(prev => ({ ...prev, age: parsed }));
                  }
                }}
                error={errors.age}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>

            {/* Género */}
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium text-foreground">
                Género
              </label>
              <Select
                id="gender"
                value={formData.gender}
                onChange={(value) => handleChange('gender', value)}
                options={GENDER_OPTIONS}
                placeholder="Selecciona tu género"
                error={errors.gender}
              />
            </div>

            {/* Rol sexual */}
            <div className="space-y-2">
              <label htmlFor="sexualRole" className="text-sm font-medium text-foreground">
                Rol sexual
              </label>
              <Select
                id="sexualRole"
                value={formData.sexualRole}
                onChange={(value) => handleChange('sexualRole', value)}
                options={SEXUAL_ROLE_OPTIONS}
                placeholder="Selecciona tu rol"
                error={errors.sexualRole}
                icon={<Heart className="w-4 h-4" />}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>
          </form>
        )}

        {/* Link a login */}
        <div className="text-center">
          <span className="text-muted-foreground text-sm">
            ¿Ya tienes cuenta?{' '}
          </span>
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </Card>
    </div>
  );
}
