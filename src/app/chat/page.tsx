'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { userService } from '@/lib/firestore';
import { User } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Loading } from '@/components/ui';
import { 
  MessageCircle, 
  ArrowLeft
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    chats,
    currentChat,
    messages,
    isTyping,
    otherUserTyping,
    loading,
    error,
    hasMoreMessages,
    sendMessage,
    createChat,
    selectChat,
    loadMoreMessages,
    markAsRead,
    editMessage,
    addReaction,
    removeReaction,
    setTyping
  } = useChat();

  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loadingOtherUser, setLoadingOtherUser] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Load other user when current chat changes
  useEffect(() => {
    loadOtherUser();
  }, [currentChat, user]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    selectChat(chatId);
  };

  const handleSendMessage = (content: string, replyTo?: string) => {
    if (selectedChatId) {
      sendMessage(selectedChatId, content, 'text', replyTo);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(undefined);
    selectChat(null);
  };

  const loadOtherUser = async () => {
    if (!currentChat || !user) {
      setOtherUser(null);
      return;
    }
    
    const otherUser = currentChat.participants.find(p => p.id !== user.id);
    if (!otherUser) {
      setOtherUser(null);
      return;
    }
    
    setOtherUser(otherUser);
  };

  if (loading && chats.length === 0) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-screen">
            <Loading size="lg" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Error al cargar los chats
              </h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-screen flex bg-background">
          {/* Chat List - Hidden on mobile when chat is selected */}
          <div className={`${
            isMobile && selectedChatId ? 'hidden' : 'flex'
          } flex-col w-full md:w-1/3 lg:w-1/4 border-r border-border`}>
            <ChatList
              chats={chats}
              currentUser={user!}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              onCreateChat={createChat}
              isLoading={loading}
            />
          </div>

          {/* Chat Window - Hidden on mobile when no chat is selected */}
          <div className={`${
            isMobile && !selectedChatId ? 'hidden' : 'flex'
          } flex-1 flex flex-col`}>
            {selectedChatId && currentChat ? (
              <>
                {/* Mobile back button */}
                {isMobile && (
                  <div className="flex items-center p-4 border-b border-border bg-background">
                    <button
                      onClick={handleBackToList}
                      className="mr-3 p-2 hover:bg-accent rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                      {loadingOtherUser ? (
                        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                      ) : otherUser ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent-end rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                      )}
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {loadingOtherUser ? 'Cargando...' : otherUser?.name || 'Usuario'}
                        </h2>
                        {otherUserTyping && (
                          <p className="text-sm text-accent-end">
                            Escribiendo...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {currentChat ? (
                  <ChatWindow
                    chat={currentChat}
                    onBack={handleBackToList}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <Loading />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Selecciona una conversación
                  </h2>
                  <p className="text-muted-foreground">
                    Elige un chat de la lista para comenzar a conversar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}