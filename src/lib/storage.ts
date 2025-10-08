import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadResult {
  url: string;
  path: string;
  metadata: any;
}

// Servicio de almacenamiento
export const storageService = {
  // Subir imagen de perfil
  async uploadProfileImage(
    userId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validaciones
    if (!userId) {
      throw new Error('ID de usuario requerido');
    }
    
    if (!file) {
      throw new Error('Archivo requerido');
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('El archivo es demasiado grande (máximo 5MB)');
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `users/${userId}/profile/${fileName}`;
    const storageRef = ref(storage, filePath);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=3600',
      });
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state as any
            });
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              resolve({
                url,
                path: filePath,
                metadata
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=3600',
        // TODO: Add metadata to snapshot upload here when implementing additional metadata handling
      });
      const url = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);
      
      return {
        url,
        path: filePath,
        metadata
      };
    }
  },

  // Subir fotos adicionales
  async uploadAdditionalPhoto(
    userId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `users/${userId}/photos/${fileName}`;
    const storageRef = ref(storage, filePath);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=3600',
      });
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state as any
            });
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              resolve({
                url,
                path: filePath,
                metadata
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);
      
      return {
        url,
        path: filePath,
        metadata
      };
    }
  },

  // Subir imagen de chat
  async uploadChatImage(
    chatId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `chats/${chatId}/images/${fileName}`;
    const storageRef = ref(storage, filePath);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state as any
            });
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              resolve({
                url,
                path: filePath,
                metadata
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);
      
      return {
        url,
        path: filePath,
        metadata
      };
    }
  },

  // Subir archivo de chat (documentos, audio, etc.)
  async uploadChatFile(
    chatId: string,
    file: File,
    fileType: 'file' | 'audio',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validaciones
    if (!chatId) {
      throw new Error('ID de chat requerido');
    }
    
    if (!file) {
      throw new Error('Archivo requerido');
    }

    // Validaciones específicas por tipo
    if (fileType === 'audio') {
      if (!file.type.startsWith('audio/')) {
        throw new Error('El archivo debe ser de audio');
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB para audio
        throw new Error('El archivo de audio es demasiado grande (máximo 10MB)');
      }
    } else {
      // Validaciones para archivos generales
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido');
      }
      
      if (file.size > 25 * 1024 * 1024) { // 25MB para archivos
        throw new Error('El archivo es demasiado grande (máximo 25MB)');
      }
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `chats/${chatId}/${fileType}s/${fileName}`;
    const storageRef = ref(storage, filePath);

    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state as any
            });
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              resolve({
                url,
                path: filePath,
                metadata
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);
      
      return {
        url,
        path: filePath,
        metadata
      };
    }
  },

  // Eliminar archivo
  async deleteFile(filePath: string): Promise<void> {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  },

  // Obtener URL de descarga
  async getDownloadURL(filePath: string): Promise<string> {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  },

  // Listar archivos de usuario
  async listUserFiles(userId: string, folder: 'profile' | 'photos' = 'photos'): Promise<string[]> {
    const folderRef = ref(storage, `users/${userId}/${folder}`);
    const result = await listAll(folderRef);
    
    const urls = await Promise.all(
      result.items.map(async (itemRef) => {
        return await getDownloadURL(itemRef);
      })
    );
    
    return urls;
  },

  // Obtener metadatos de archivo
  async getFileMetadata(filePath: string): Promise<any> {
    const storageRef = ref(storage, filePath);
    return await getMetadata(storageRef);
  },

  // Actualizar metadatos de archivo
  async updateFileMetadata(filePath: string, metadata: any): Promise<void> {
    const storageRef = ref(storage, filePath);
    await updateMetadata(storageRef, metadata);
  },

  // Validar tipo de archivo
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. El tamaño máximo es 5MB.'
      };
    }

    return { isValid: true };
  },

  // Redimensionar imagen (usando canvas)
  async resizeImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Error al redimensionar la imagen'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Comprimir imagen
  async compressImage(file: File, quality: number = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
};

// Utilidades para manejo de archivos
export const fileUtils = {
  // Convertir bytes a formato legible
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Obtener extensión de archivo
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Generar nombre único para archivo
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(originalName);
    return `${timestamp}_${random}.${extension}`;
  }
};