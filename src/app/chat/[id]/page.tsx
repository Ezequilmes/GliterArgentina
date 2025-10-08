'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Loading from '@/components/ui/Loading';
import { ChatWindow } from '@/components/chat';

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
        <div className="flex items-center justify-center h-screen">
          <Loading />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Error al cargar el chat
            </h2>
            <p className="text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentChat) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Conversación no encontrada
            </h2>
            <p className="text-muted-foreground">
              La conversación que buscas no existe o no tienes acceso a ella.
            </p>
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