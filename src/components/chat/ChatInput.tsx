'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useToast } from '@/components/ui/Toast';
import { useSounds } from '@/hooks/useSounds';
import { Button } from '@/components/ui';
import UploadProgress from './UploadProgress';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  MapPin, 
  Smile,
  Mic,
  X,
  Plus,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageService } from '@/lib/storage';

export interface ChatInputProps {
  chatId: string;
  otherUserId?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function ChatInput({
  chatId,
  otherUserId,
  disabled = false,
  placeholder = "Escribe un mensaje...",
  className,
  onTypingStart,
  onTypingStop
}: ChatInputProps) {
  const { user } = useAuth();
  const { sendMessage, setTyping } = useChat();
  const { addToast } = useToast();
  const { playSendChatSound } = useSounds();
  
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<{ name: string; type: 'image' | 'file' | 'audio' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || disabled || !chatId) return;

    try {
      await sendMessage(chatId, message.trim(), 'text');
      
      // Reproducir sonido de envío
      playSendChatSound();
      
      setMessage('');
      setTyping(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Mostrar notificación de error
    }
  }, [message, disabled, chatId, sendMessage, setTyping, playSendChatSound]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    // Typing indicator con debounce usando tiempo real
    if (chatId) {
      // Usar el hook useChat para compatibilidad con Firestore
      setTyping(value.length > 0);
      
      // Usar los handlers de tiempo real si están disponibles
      if (value.length > 0 && onTypingStart) {
        onTypingStart();
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      if (value.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
          if (onTypingStop) {
            onTypingStop();
          }
        }, 2000);
      } else if (onTypingStop) {
        onTypingStop();
      }
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'file' | 'audio'): Promise<{ url: string; metadata: any }> => {
    if (!chatId) throw new Error('Chat ID requerido');
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadingFile({ name: file.name, type });
    
    try {
      let result;
      
      if (type === 'image') {
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
          throw new Error('El archivo debe ser una imagen');
        }
        
        result = await storageService.uploadChatImage(chatId, file, (progress) => {
          setUploadProgress(progress.progress);
        });
      } else if (type === 'audio') {
        // Para archivos de audio
        result = await storageService.uploadChatFile(chatId, file, 'audio', (progress) => {
          setUploadProgress(progress.progress);
        });
      } else {
        // Para archivos generales
        result = await storageService.uploadChatFile(chatId, file, 'file', (progress) => {
          setUploadProgress(progress.progress);
        });
      }
      
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFile(null);
      
      return {
        url: result.url,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          storagePath: result.path,
          ...result.metadata
        }
      };
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFile(null);
      throw error;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    try {
      const { url, metadata } = await uploadFile(file, 'file');
      await sendMessage(chatId, url, 'file', undefined, metadata);
      setShowAttachments(false);
      addToast({
        type: 'success',
        title: 'Archivo enviado',
        message: 'El archivo se ha enviado correctamente'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast({
        type: 'error',
        title: 'Error al enviar archivo',
        message: error instanceof Error ? error.message : 'No se pudo enviar el archivo'
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    try {
      const { url, metadata } = await uploadFile(file, 'image');
      await sendMessage(chatId, url, 'image', undefined, {
        ...metadata,
        width: 0, // TODO: Obtener dimensiones reales
        height: 0
      });
      setShowAttachments(false);
      addToast({
        type: 'success',
        title: 'Imagen enviada',
        message: 'La imagen se ha enviado correctamente'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      addToast({
        type: 'error',
        title: 'Error al enviar imagen',
        message: error instanceof Error ? error.message : 'No se pudo enviar la imagen'
      });
    }
  };

  const handleLocationShare = () => {
    if (!navigator.geolocation || !chatId) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await sendMessage(chatId, `${latitude},${longitude}`, 'location', undefined, {
            latitude,
            longitude
          });
          setShowAttachments(false);
        } catch (error) {
          console.error('Error sending location:', error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        addToast({
          type: 'error',
          title: 'Error de ubicación',
          message: 'No se pudo obtener tu ubicación. Verifica los permisos.'
        });
      }
    );
  };

  const startRecording = async () => {
    if (!chatId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        try {
          const { url, metadata } = await uploadFile(new File([blob], 'audio.wav', { type: 'audio/wav' }), 'audio');
          await sendMessage(chatId, url, 'audio', undefined, {
            ...metadata,
            duration: 0 // TODO: Calcular duración real
          });
          addToast({
            type: 'success',
            title: 'Audio enviado',
            message: 'Tu mensaje de audio se ha enviado correctamente.'
          });
        } catch (error) {
          console.error('Error sending audio:', error);
          addToast({
            type: 'error',
            title: 'Error al enviar audio',
            message: 'No se pudo enviar el mensaje de audio. Inténtalo de nuevo.'
          });
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 60 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 60000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Manejar diferentes tipos de errores de permisos
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            addToast({
              type: 'error',
              title: 'Permisos de micrófono denegados',
              message: 'Para enviar mensajes de audio, permite el acceso al micrófono en la configuración del navegador.'
            });
            break;
          case 'NotFoundError':
            addToast({
              type: 'error',
              title: 'Micrófono no encontrado',
              message: 'No se detectó ningún micrófono en tu dispositivo.'
            });
            break;
          case 'NotReadableError':
            addToast({
              type: 'error',
              title: 'Error de micrófono',
              message: 'El micrófono está siendo usado por otra aplicación.'
            });
            break;
          default:
            addToast({
              type: 'error',
              title: 'Error de grabación',
              message: 'No se pudo iniciar la grabación de audio.'
            });
        }
      } else {
        addToast({
          type: 'error',
          title: 'Error de grabación',
          message: 'No se pudo iniciar la grabación de audio.'
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  // Emojis populares
  const popularEmojis = ['😀', '😂', '😍', '🥰', '😘', '😊', '👍', '❤️', '🔥', '💯', '🎉', '😎'];

  return (
    <div className={cn("relative", className)}>
      {/* Upload Progress */}
      {isUploading && uploadingFile && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4">
          <UploadProgress
            isUploading={isUploading}
            fileName={uploadingFile.name}
            fileType={uploadingFile.type}
            progress={uploadProgress}
            onCancel={() => {
              setIsUploading(false);
              setUploadProgress(0);
              setUploadingFile(null);
            }}
          />
        </div>
      )}

      {/* Attachments Menu */}
      {showAttachments && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 sm:mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors min-h-[60px] sm:min-h-auto"
                disabled={isUploading}
              >
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-1" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Imagen</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors min-h-[60px] sm:min-h-auto"
                disabled={isUploading}
              >
                <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mb-1" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Archivo</span>
              </button>
              
              <button
                onClick={handleLocationShare}
                className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors min-h-[60px] sm:min-h-auto"
                disabled={isUploading}
              >
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mb-1" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Ubicación</span>
              </button>
              
              <button
                onClick={() => setShowAttachments(false)}
                className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors min-h-[60px] sm:min-h-auto"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 mb-1" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Cerrar</span>
              </button>
            </div>
            
            {/* Emojis rápidos */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {popularEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base sm:text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="flex items-end space-x-2 p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAttachments(!showAttachments)}
          disabled={disabled || isUploading}
          className="shrink-0 p-2 sm:p-2 rounded-full w-10 h-10 sm:w-auto sm:h-auto"
        >
          <Plus className={cn(
            "w-5 h-5 transition-transform",
            showAttachments && "rotate-45"
          )} />
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            rows={1}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl flex items-center justify-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Subiendo... {uploadProgress}%
              </div>
            </div>
          )}
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <Button
            onClick={handleSendMessage}
            disabled={disabled || isUploading}
            className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={disabled || isUploading}
            className={cn(
              "shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all flex items-center justify-center",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Mic className={cn(
              "w-4 h-4 sm:w-5 sm:h-5",
              isRecording ? "text-white animate-pulse" : "text-gray-600 dark:text-gray-300"
            )} />
          </button>
        )}

        {/* Emoji Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAttachments(!showAttachments)}
          disabled={disabled || isUploading}
          className="shrink-0 p-2 sm:p-2 rounded-full w-10 h-10 sm:w-auto sm:h-auto"
        >
          <Smile className="w-5 h-5" />
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm font-medium">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Grabando... Suelta para enviar</span>
          </div>
        </div>
      )}
    </div>
  );
}