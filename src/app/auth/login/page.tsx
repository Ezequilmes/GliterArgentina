import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Gliter Argentina',
  description: 'Inicia sesión en Gliter Argentina para conectar con personas cerca de ti.',
};

export default function LoginPage() {
  return <LoginForm />;
}