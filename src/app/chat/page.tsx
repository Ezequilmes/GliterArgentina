'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { User } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { 
  MessageCircle, 
  ArrowLeft
} from 'lucide-react';

export default function ChatPage() {
  const _router = useRouter();
  const { user } = useAuth();
  const {
    chats,
    currentChat,
    otherUserTyping,
    loading,
    error,
    sendMessage,
    createChat,
    selectChat
  } = useChat();

  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loadingOtherUser, _setLoadingOtherUser] = useState(false);

  const loadOtherUser = useCallback(async () => {
    if (!currentChat || !user) {
      setOtherUser(null);
      return;
    }
    const otherUserFound = currentChat.participants.find(p => p.id !== user.id);
    if (!otherUserFound) {
      setOtherUser(null);
      return;
    }
    setOtherUser(otherUserFound);
  }, [currentChat, user]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      } else {
        setIsMobile(false);
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
  }, [loadOtherUser]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    selectChat(chatId);
  };

  const _handleSendMessage = (content: string, replyTo?: string) => {
    if (selectedChatId) {
      sendMessage(selectedChatId, content, 'text', replyTo);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(undefined);
    selectChat(null);
  };

  

  if (loading && chats.length === 0) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-screen p-4">
            <div className="text-center space-y-6 max-w-md mx-auto">
              {/* Animated Chat Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-green-500/20 border border-blue-500/30 flex items-center justify-center mx-auto animate-pulse">
                <MessageCircle className="w-10 h-10 text-blue-500 animate-bounce" />
              </div>

              {/* Loading Dots */}
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>

              {/* Title and Message */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Cargando chats
                </h3>
                <p className="text-muted-foreground">
                  Conectando con tus conversaciones...
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Estableciendo conexión en tiempo real
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"
                  style={{ width: '85%', animation: 'pulse 2s infinite' }}
                />
              </div>

              {/* Tip */}
              <div className="text-xs text-muted-foreground/60 italic">
                💬 Conectando con Firebase en tiempo real
              </div>
            </div>
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
                onClick={() => typeof window !== 'undefined' && window.location.reload()}
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
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center space-y-4">
                      {/* Animated Loading Icon */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto animate-pulse">
                        <MessageCircle className="w-8 h-8 text-blue-500 animate-bounce" />
                      </div>

                      {/* Loading Dots */}
                      <div className="flex justify-center space-x-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>

                      {/* Message */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Cargando conversación
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Preparando el chat...
                        </p>
                      </div>
                    </div>
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
