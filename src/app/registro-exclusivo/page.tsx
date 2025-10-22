'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  Crown, 
  Upload, 
  X, 
  Phone, 
  Instagram, 
  Mail,
  MapPin,
  DollarSign,
  Star,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import Image from 'next/image';

const VALID_TOKENS = [
  'MODELO-INVITE-2025',
  'MASAJISTA-VIP-2025',
  'EXCLUSIVO-PREMIUM-2025',
  'GLITER-SPECIAL-2025'
];

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  instagram: string;
  description: string;
  location: string;
  services: string[];
  price: string;
  photos: File[];
  videos: File[];
}

function RegistroExclusivoContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidToken, setIsValidToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newService, setNewService] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    whatsapp: '',
    instagram: '',
    description: '',
    location: '',
    services: [],
    price: '',
    photos: [],
    videos: []
  });

  // Verificar token
  useEffect(() => {
    if (token && VALID_TOKENS.includes(token)) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (files: FileList | null, type: 'photos' | 'videos') => {
    if (!files) return;

    const maxFiles = type === 'photos' ? 5 : 2;
    const currentFiles = formData[type];
    const newFiles = Array.from(files);
    
    if (currentFiles.length + newFiles.length > maxFiles) {
      alert(`Máximo ${maxFiles} ${type === 'photos' ? 'fotos' : 'videos'} permitidos`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...newFiles]
    }));
  };

  const removeFile = (index: number, type: 'photos' | 'videos') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }));
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }));
  };

  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `${folder}/${user!.id}/${fileName}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValidToken) return;

    setSubmitting(true);

    try {
      // Subir fotos y videos
      const photoUrls = await uploadFiles(formData.photos, 'exclusives/photos');
      const videoUrls = await uploadFiles(formData.videos, 'exclusives/videos');

      // Guardar en Firestore
      await setDoc(doc(db, 'exclusives', user.id), {
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        description: formData.description,
        location: formData.location,
        services: formData.services,
        price: formData.price,
        photos: photoUrls,
        videos: videoUrls,
        subscriptionStatus: 'pending',
        tokenUsed: token,
        createdAt: serverTimestamp(),
        userId: user.id
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error al enviar el formulario. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Token Inválido</h1>
            <p className="text-gray-600 mb-4">
              El token de invitación no es válido o ha expirado.
            </p>
            <p className="text-sm text-gray-500">
              Contacta al administrador para obtener un nuevo enlace de invitación.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Crown className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h1>
            <p className="text-gray-600 mb-4">
              Tu solicitud ha sido enviada correctamente.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              El administrador revisará tu perfil y te notificará cuando sea aprobado.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Registro Exclusivo</h1>
          </div>
          <p className="text-gray-600">Completa tu perfil para formar parte de Gliter Exclusivos</p>
          <Badge className="mt-2">Token válido: {token}</Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre Artístico *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Sofia Bella"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp *</label>
                  <Input
                    required
                    value={formData.whatsapp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('whatsapp', e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <Input
                    value={formData.instagram}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('instagram', e.target.value)}
                    placeholder="@tuinstagram"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ubicación *</label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('location', e.target.value)}
                    placeholder="Ej: CABA, Palermo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Precio Base</label>
                  <Input
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('price', e.target.value)}
                    placeholder="Ej: $50.000/hora"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción *</label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Describe tus servicios, personalidad y lo que te hace especial..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Servicios Ofrecidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService(e.target.value)}
                  placeholder="Ej: Masajes relajantes, Compañía, etc."
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addService())}
                />
                <Button type="button" onClick={addService}>
                  Agregar
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeService(service)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Fotos (Máximo 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e.target.files, 'photos')}
                  className="hidden"
                  id="photos-upload"
                />
                <label htmlFor="photos-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="w-full pointer-events-none">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Fotos ({formData.photos.length}/5)
                  </Button>
                </label>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Foto ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeFile(index, 'photos')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Videos (Máximo 2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e.target.files, 'videos')}
                  className="hidden"
                  id="videos-upload"
                />
                <label htmlFor="videos-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="w-full pointer-events-none">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Videos ({formData.videos.length}/2)
                  </Button>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.videos.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-600">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeFile(index, 'videos')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botón de envío */}
          <Card>
            <CardContent className="p-6">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Al enviar esta solicitud, aceptas que tu información sea revisada por el administrador.
                Tu perfil será visible públicamente solo después de la aprobación.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default function RegistroExclusivoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <RegistroExclusivoContent />
    </Suspense>
  );
}