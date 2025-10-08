import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

// Proveedor de Google
const googleProvider = new GoogleAuthProvider();

// Tipos para autenticación
export interface AuthUser extends FirebaseUser {
  displayName: string;
  email: string;
  photoURL: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  sexualRole: 'active' | 'passive' | 'versatile';
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  bio?: string;
  interests: string[];
}

export interface SignInData {
  email: string;
  password: string;
}

// Crear perfil de usuario en Firestore
const createUserProfile = async (user: FirebaseUser, additionalData: Partial<User> = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();

    try {
      await setDoc(userRef, {
        id: user.uid,
        name: displayName || additionalData.name || '',
        email,
        photos: photoURL ? [photoURL] : [],
        age: additionalData.age || 18,
        gender: additionalData.gender || 'male',
        sexualRole: additionalData.sexualRole || 'versatile',
        location: additionalData.location || {
          latitude: -34.6037,
          longitude: -58.3816,
          city: 'Buenos Aires',
          country: 'Argentina'
        },
        bio: additionalData.bio || '',
        interests: additionalData.interests || [],
        isOnline: true,
        lastSeen: createdAt,
        createdAt,
        updatedAt: createdAt,
        isVerified: false,
        isPremium: false,
        settings: {
          showAge: true,
          showDistance: true,
          showOnlineStatus: true,
          maxDistance: 50,
          ageRange: { min: 18, max: 99 },
          genderPreference: 'all',
          notifications: {
            messages: true,
            matches: true,
            likes: true,
            marketing: false
          }
        }
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  return userRef;
};

// Registrar usuario
export const signUp = async (data: SignUpData): Promise<AuthUser> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    // Actualizar perfil de Firebase Auth
    await updateProfile(user, {
      displayName: data.name
    });

    // Crear perfil en Firestore
    await createUserProfile(user, {
      name: data.name,
      age: data.age,
      gender: data.gender,
      sexualRole: data.sexualRole,
      location: data.location,
      bio: data.bio,
      interests: data.interests
    });

    return user as AuthUser;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Iniciar sesión
export const signIn = async (data: SignInData): Promise<AuthUser> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, data.email, data.password);
    
    // Actualizar estado online
    await updateUserOnlineStatus(user.uid, true);
    
    return user as AuthUser;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Iniciar sesión con Google
export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);
    
    // Crear perfil si no existe
    await createUserProfile(user);
    
    // Actualizar estado online
    await updateUserOnlineStatus(user.uid, true);
    
    return user as AuthUser;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Cerrar sesión
export const logout = async (): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updateUserOnlineStatus(auth.currentUser.uid, false);
    }
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Restablecer contraseña
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Cambiar contraseña
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Reautenticar usuario
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Actualizar contraseña
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error('Error changing password:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Actualizar estado online del usuario
export const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

// Obtener perfil de usuario
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = { id: userSnap.id, ...userSnap.data() } as User;
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Observer de estado de autenticación
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        callback(user as AuthUser);
      } catch (error) {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// Mensajes de error en español
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con este email';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este email';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta más tarde';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    case 'auth/requires-recent-login':
      return 'Debes iniciar sesión nuevamente para realizar esta acción';
    default:
      return 'Error de autenticación. Intenta nuevamente';
  }
};