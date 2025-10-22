'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Gift, Check, X, Sparkles } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  type: 'discount' | 'free_month' | 'highlight';
  active: boolean;
  maxUses: number;
  used: number;
  expires: string;
  description: string;
}

interface PromoCodeInputProps {
  onSuccess?: (benefit: string) => void;
  className?: string;
}

export default function PromoCodeInput({ onSuccess, className = '' }: PromoCodeInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateAndApplyCode = async () => {
    if (!user || !code.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      // Buscar el código promocional
      const q = query(
        collection(db, 'promo_codes'),
        where('code', '==', code.toUpperCase()),
        where('active', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage({ type: 'error', text: 'Código promocional no válido' });
        return;
      }

      const promoDoc = snapshot.docs[0];
      const promoData = promoDoc.data() as PromoCode;

      // Verificar si el código ha expirado
      const expiryDate = new Date(promoData.expires);
      if (expiryDate < new Date()) {
        setMessage({ type: 'error', text: 'Este código promocional ha expirado' });
        return;
      }

      // Verificar si se han agotado los usos
      if (promoData.used >= promoData.maxUses) {
        setMessage({ type: 'error', text: 'Este código promocional ya no está disponible' });
        return;
      }

      // Aplicar el beneficio según el tipo
      let benefitMessage = '';
      const userRef = doc(db, 'users', user?.id || '');

      switch (promoData.type) {
        case 'free_month':
          const premiumUntil = new Date();
          premiumUntil.setMonth(premiumUntil.getMonth() + 1);
          
          await updateDoc(userRef, {
            isPremium: true,
            premiumUntil: Timestamp.fromDate(premiumUntil),
            lastPromoUsed: code.toUpperCase(),
            lastPromoDate: Timestamp.now()
          });
          
          benefitMessage = '¡1 mes de Premium gratis activado! 🎉';
          break;

        case 'highlight':
          const highlightUntil = new Date();
          highlightUntil.setDate(highlightUntil.getDate() + 15);
          
          await updateDoc(userRef, {
            isHighlighted: true,
            highlightUntil: Timestamp.fromDate(highlightUntil),
            lastPromoUsed: code.toUpperCase(),
            lastPromoDate: Timestamp.now()
          });
          
          benefitMessage = '¡Perfil destacado por 15 días activado! ⭐';
          break;

        case 'discount':
          await updateDoc(userRef, {
            hasDiscount: true,
            discountPercentage: 50, // 50% de descuento por defecto
            discountUntil: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 días
            lastPromoUsed: code.toUpperCase(),
            lastPromoDate: Timestamp.now()
          });
          
          benefitMessage = '¡50% de descuento por 30 días activado! 💰';
          break;
      }

      // Incrementar el contador de usos del código
      await updateDoc(doc(db, 'promo_codes', promoDoc.id), {
        used: increment(1)
      });

      setMessage({ type: 'success', text: benefitMessage });
      setCode('');
      
      if (onSuccess) {
        onSuccess(benefitMessage);
      }

    } catch (error) {
      console.error('Error al validar código promocional:', error);
      setMessage({ type: 'error', text: 'Error al procesar el código. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndApplyCode();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          Código Promocional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa tu código promocional"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Los códigos promocionales son de un solo uso por usuario</p>
          <p>• Algunos códigos pueden tener fecha de expiración</p>
          <p>• Los beneficios se aplicarán inmediatamente a tu cuenta</p>
        </div>

        {/* Ejemplos de códigos (solo para desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Códigos de ejemplo:</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">GLITERFREE2025</Badge>
              <Badge variant="outline" className="text-xs">PREMIUM30</Badge>
              <Badge variant="outline" className="text-xs">DESTACADO15</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}