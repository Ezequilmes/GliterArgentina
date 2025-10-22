'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc,
  deleteDoc,
  Timestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import Tabs, { TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Shield, 
  Users, 
  Gift, 
  Calendar, 
  Check, 
  X, 
  Plus,
  Trash2,
  Crown,
  Upload,
  Image,
  Edit
} from 'lucide-react';
import { storageService } from '@/lib/storage';

interface ExclusiveCard {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  instagram?: string;
  biography?: string;
  photos: string[];
  videos: string[];
  subscriptionStatus: 'pending' | 'active' | 'rejected' | 'expired';
  tokenUsed?: string;
  createdAt: any;
  validUntil?: any;
}

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

interface User {
  id: string;
  email: string;
  displayName?: string;
  isPremium?: boolean;
  premiumUntil?: any;
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [exclusiveCards, setExclusiveCards] = useState<ExclusiveCard[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    type: 'free_month' as const,
    maxUses: 100,
    expires: '',
    description: ''
  });

  const [newExclusive, setNewExclusive] = useState({
    name: '',
    email: '',
    whatsapp: '',
    instagram: '',
    biography: '',
    photos: [] as string[],
    videos: [] as string[],
    subscriptionStatus: 'active' as const
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  // Estados para edición
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExclusiveCard | null>(null);

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (!loading && user) {
      // Verificar si el email es el del administrador
      if (user.email === 'admin@gliter.com.ar') {
        setIsAdmin(true);
      } else {
        router.push('/dashboard');
      }
    } else if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Cargar cards exclusivas
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'exclusives'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExclusiveCard[];
      setExclusiveCards(cards);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Cargar códigos promocionales
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'promo_codes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromoCode[];
      setPromoCodes(codes);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Cargar usuarios
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersList);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const approveCard = async (id: string) => {
    try {
      await updateDoc(doc(db, 'exclusives', id), {
        subscriptionStatus: 'active'
      });
    } catch (error) {
      console.error('Error al aprobar card:', error);
    }
  };

  const rejectCard = async (id: string) => {
    try {
      await updateDoc(doc(db, 'exclusives', id), {
        subscriptionStatus: 'rejected'
      });
    } catch (error) {
      console.error('Error al rechazar card:', error);
    }
  };

  const giveFreeMonth = async (id: string) => {
    try {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);
      
      await updateDoc(doc(db, 'exclusives', id), {
        subscriptionStatus: 'active',
        validUntil: Timestamp.fromDate(validUntil)
      });
    } catch (error) {
      console.error('Error al dar mes gratis:', error);
    }
  };

  const giveUserPremium = async (userId: string, months: number) => {
    try {
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + months);
      
      await updateDoc(doc(db, 'users', userId), {
        isPremium: true,
        premiumUntil: Timestamp.fromDate(premiumUntil)
      });
    } catch (error) {
      console.error('Error al dar premium:', error);
    }
  };

  const createPromoCode = async () => {
    try {
      if (!newPromoCode.code || !newPromoCode.expires) return;

      await addDoc(collection(db, 'promo_codes'), {
        code: newPromoCode.code.toUpperCase(),
        type: newPromoCode.type,
        active: true,
        maxUses: newPromoCode.maxUses,
        used: 0,
        expires: newPromoCode.expires,
        description: newPromoCode.description,
        createdAt: Timestamp.now()
      });

      setNewPromoCode({
        code: '',
        type: 'free_month',
        maxUses: 100,
        expires: '',
        description: ''
      });
    } catch (error) {
      console.error('Error al crear código promocional:', error);
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
    } catch (error) {
      console.error('Error al eliminar código:', error);
    }
  };

  const togglePromoCode = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'promo_codes', id), {
        active: !active
      });
    } catch (error) {
      console.error('Error al cambiar estado del código:', error);
    }
  };

  // Funciones para edición de perfiles exclusivos
  const startEditing = (card: ExclusiveCard) => {
    setEditingCard(card.id);
    setEditForm({ ...card });
  };

  const cancelEditing = () => {
    setEditingCard(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm || !editingCard) return;

    try {
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        whatsapp: editForm.whatsapp || '',
        instagram: editForm.instagram || '',
        biography: editForm.biography || '',
        subscriptionStatus: editForm.subscriptionStatus
      };

      await updateDoc(doc(db, 'exclusives', editingCard), updateData);
      
      setEditingCard(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validar que sean imágenes
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      alert('Solo se permiten archivos de imagen');
      return;
    }
    
    // Limitar a 6 fotos máximo
    if (selectedPhotos.length + validFiles.length > 6) {
      alert('Máximo 6 fotos permitidas');
      return;
    }
    
    setSelectedPhotos(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (selectedPhotos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < selectedPhotos.length; i++) {
        const file = selectedPhotos[i];
        setUploadProgress(((i + 1) / selectedPhotos.length) * 100);
        
        // Usar un ID temporal para la subida
        const tempId = `exclusive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const result = await storageService.uploadAdditionalPhoto(tempId, file);
        uploadedUrls.push(result.url);
      }
      
      setUploadingPhotos(false);
      setUploadProgress(0);
      return uploadedUrls;
    } catch (error) {
      setUploadingPhotos(false);
      setUploadProgress(0);
      console.error('Error al subir fotos:', error);
      throw error;
    }
  };

  const createExclusive = async () => {
    try {
      if (!newExclusive.name || !newExclusive.email) {
        alert('Por favor completa al menos el nombre y email');
        return;
      }

      // Verificar si ya existe un perfil exclusivo con ese email
      const existingQuery = query(
        collection(db, 'exclusives'),
        where('email', '==', newExclusive.email)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        alert('Ya existe un perfil exclusivo con ese email');
        return;
      }

      // Subir fotos si hay alguna seleccionada
      let uploadedPhotoUrls: string[] = [];
      if (selectedPhotos.length > 0) {
        uploadedPhotoUrls = await uploadPhotos();
      }

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1); // 1 mes de validez por defecto

      await addDoc(collection(db, 'exclusives'), {
        name: newExclusive.name,
        email: newExclusive.email,
        whatsapp: newExclusive.whatsapp || '',
        instagram: newExclusive.instagram || '',
        photos: uploadedPhotoUrls,
        videos: newExclusive.videos,
        subscriptionStatus: newExclusive.subscriptionStatus,
        createdAt: Timestamp.now(),
        validUntil: Timestamp.fromDate(validUntil),
        tokenUsed: `ADMIN_CREATED_${Date.now()}`
      });

      // Limpiar formulario
      setNewExclusive({
        name: '',
        email: '',
        whatsapp: '',
        instagram: '',
        biography: '',
        photos: [],
        videos: [],
        subscriptionStatus: 'active'
      });
      
      setSelectedPhotos([]);
      setPhotoUrls([]);
      setShowCreateForm(false);
      alert('Perfil exclusivo creado exitosamente');
    } catch (error) {
      console.error('Error al crear perfil exclusivo:', error);
      alert('Error al crear perfil exclusivo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona exclusivos, usuarios y promociones</p>
        </div>

        <Tabs defaultValue="exclusives" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exclusives" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Exclusivos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="promos" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Códigos Promo
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exclusives" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cards Exclusivas</h2>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4 mr-2" />
                {showCreateForm ? 'Cancelar' : 'Crear Perfil Exclusivo'}
              </Button>
            </div>

            {showCreateForm && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Crear Nuevo Perfil Exclusivo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nombre completo"
                    value={newExclusive.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExclusive({...newExclusive, name: e.target.value})}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newExclusive.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExclusive({...newExclusive, email: e.target.value})}
                  />
                  <Input
                    placeholder="WhatsApp (opcional)"
                    value={newExclusive.whatsapp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExclusive({...newExclusive, whatsapp: e.target.value})}
                  />
                  <Input
                    placeholder="Instagram (opcional)"
                    value={newExclusive.instagram}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExclusive({...newExclusive, instagram: e.target.value})}
                  />
                  <textarea
                    className="px-3 py-2 border rounded-md col-span-2 min-h-[100px] resize-vertical"
                    placeholder="Biografía (opcional)"
                    value={newExclusive.biography || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewExclusive({...newExclusive, biography: e.target.value})}
                  />
                  <select
                    className="px-3 py-2 border rounded-md col-span-2"
                    value={newExclusive.subscriptionStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewExclusive({...newExclusive, subscriptionStatus: e.target.value as any})}
                  >
                    <option value="active">Activo</option>
                    <option value="pending">Pendiente</option>
                    <option value="rejected">Rechazado</option>
                    <option value="expired">Expirado</option>
                  </select>
                  
                  {/* Sección de fotos */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fotos (máximo 6)
                    </label>
                    
                    {/* Input para seleccionar fotos */}
                    <div className="mb-4">
                      <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 mr-2" />
                        <span className="text-gray-600">Seleccionar fotos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoSelection}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Vista previa de fotos seleccionadas */}
                    {selectedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {selectedPhotos.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progreso de subida */}
                    {uploadingPhotos && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Subiendo fotos...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={createExclusive} className="col-span-2" disabled={uploadingPhotos}>
                    <Plus className="h-4 w-4 mr-2" />
                    {uploadingPhotos ? 'Subiendo fotos...' : 'Crear Perfil Exclusivo'}
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid gap-4">
              {exclusiveCards.map((card) => (
                <React.Fragment key={card.id}>
                <Card className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{card.name}</h3>
                      <p className="text-gray-600">{card.email}</p>
                      {card.whatsapp && <p className="text-sm">WhatsApp: {card.whatsapp}</p>}
                      {card.instagram && <p className="text-sm">Instagram: {card.instagram}</p>}
                      {card.biography && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          <strong>Biografía:</strong> {card.biography}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Fotos: {card.photos?.length || 0} | Videos: {card.videos?.length || 0}
                      </p>
                      {card.tokenUsed && <p className="text-sm">Token: {card.tokenUsed}</p>}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge 
                        variant={
                          card.subscriptionStatus === 'active' ? 'default' :
                          card.subscriptionStatus === 'pending' ? 'secondary' :
                          'error'
                        }
                      >
                        {card.subscriptionStatus}
                      </Badge>
                      <div className="flex gap-2">
                        {card.subscriptionStatus === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => approveCard(card.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectCard(card.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" onClick={() => giveFreeMonth(card.id)}>
                          +1 Mes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditing(card)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Formulario de edición */}
                {editingCard === card.id && editForm && (
                  <Card className="p-6 mt-4 border-2 border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">Editar Perfil Exclusivo</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Nombre completo"
                        value={editForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, name: e.target.value})}
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={editForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, email: e.target.value})}
                      />
                      <Input
                        placeholder="WhatsApp (opcional)"
                        value={editForm.whatsapp || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, whatsapp: e.target.value})}
                      />
                      <Input
                        placeholder="Instagram (opcional)"
                        value={editForm.instagram || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, instagram: e.target.value})}
                      />
                      <textarea
                        className="px-3 py-2 border rounded-md col-span-2 min-h-[100px] resize-vertical"
                        placeholder="Biografía (opcional)"
                        value={editForm.biography || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({...editForm, biography: e.target.value})}
                      />
                      <select
                        className="px-3 py-2 border rounded-md col-span-2"
                        value={editForm.subscriptionStatus}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm({...editForm, subscriptionStatus: e.target.value as any})}
                      >
                        <option value="active">Activo</option>
                        <option value="pending">Pendiente</option>
                        <option value="rejected">Rechazado</option>
                        <option value="expired">Expirado</option>
                      </select>
                      
                      <div className="col-span-2 flex gap-2 justify-end">
                        <Button variant="outline" onClick={cancelEditing}>
                          Cancelar
                        </Button>
                        <Button onClick={saveEdit}>
                          Guardar Cambios
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </React.Fragment>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
              {users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{user.displayName || user.email}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      {user.isPremium && (
                        <Badge className="mt-1">Premium hasta: {user.premiumUntil?.toDate().toLocaleDateString()}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => giveUserPremium(user.id, 1)}>
                        +1 Mes Premium
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => giveUserPremium(user.id, 3)}>
                        +3 Meses
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="promos" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Crear Código Promocional</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Código (ej: GLITERFREE2025)"
                  value={newPromoCode.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromoCode({...newPromoCode, code: e.target.value})}
                />
                <select
                  className="px-3 py-2 border rounded-md"
                  value={newPromoCode.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPromoCode({...newPromoCode, type: e.target.value as any})}
                >
                  <option value="free_month">Mes Gratis</option>
                  <option value="highlight">Perfil Destacado</option>
                  <option value="discount">Descuento</option>
                </select>
                <Input
                  type="number"
                  placeholder="Máximo usos"
                  value={newPromoCode.maxUses}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromoCode({...newPromoCode, maxUses: parseInt(e.target.value)})}
                />
                <Input
                  type="date"
                  value={newPromoCode.expires}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromoCode({...newPromoCode, expires: e.target.value})}
                />
                <Input
                  placeholder="Descripción"
                  value={newPromoCode.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromoCode({...newPromoCode, description: e.target.value})}
                  className="col-span-2"
                />
                <Button onClick={createPromoCode} className="col-span-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Código
                </Button>
              </div>
            </Card>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Códigos Activos</h2>
              {promoCodes.map((code) => (
                <Card key={code.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{code.code}</h3>
                      <p className="text-gray-600">{code.description}</p>
                      <p className="text-sm">
                        Tipo: {code.type} | Usado: {code.used}/{code.maxUses} | Expira: {code.expires}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={code.active ? 'default' : 'secondary'}>
                        {code.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => togglePromoCode(code.id, code.active)}>
                        {code.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deletePromoCode(code.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Exclusivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exclusiveCards.length}</div>
                  <p className="text-xs text-gray-600">
                    Activos: {exclusiveCards.filter(c => c.subscriptionStatus === 'active').length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-gray-600">
                    Premium: {users.filter(u => u.isPremium).length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="p-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Códigos Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promoCodes.filter(c => c.active).length}</div>
                  <p className="text-xs text-gray-600">
                    Total: {promoCodes.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}