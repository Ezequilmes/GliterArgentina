import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Crear Cuenta - Gliter Argentina',
  description: 'Únete a Gliter Argentina y comienza a conectar con personas cerca de ti.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}