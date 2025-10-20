'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useChat } from '../../../hooks/useChat';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Loading from '../../../components/ui/Loading';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { Send, X, Info, Loader2, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    currentChat, 
    loading, 
    error, 
    selectChat
  } = useChat();
  
  const chatId = params.id as string;

  // Load chat when component mounts
  useEffect(() => {
    if (chatId) {
      selectChat(chatId);
    }
  }, [chatId, selectChat]);



  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-primary/30 rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Cargando conversación
              </h3>
              <p className="text-sm text-muted-foreground">
                Preparando tu chat...
              </p>
            </div>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Error al cargar el chat
              </h2>
              <p className="text-muted-foreground">
                {error}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentChat) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Conversación no encontrada
              </h2>
              <p className="text-muted-foreground">
                La conversación que buscas no existe o no tienes acceso a ella.
              </p>
            </div>
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Volver a mensajes
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ChatWindow
        chat={currentChat}
        onBack={() => router.back()}
      />
    </ProtectedRoute>
  );
}