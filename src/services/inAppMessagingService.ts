// Firebase In-App Messaging no está disponible para aplicaciones web
// Implementamos un sistema personalizado de mensajes in-app

export interface InAppMessage {
  messageId: string;
  title: string;
  body: string;
  actionUrl?: string;
  imageUrl?: string;
  campaignName?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  targetAudience?: string[];
  displayConditions?: {
    minSessionTime?: number;
    maxDisplaysPerDay?: number;
    requiresAuth?: boolean;
  };
}

export interface InAppAction {
  actionLabel: string;
  actionUrl: string;
  messageId: string;
  timestamp: Date;
}

export interface InAppMessagingConfig {
  enabled: boolean;
  apiEndpoint?: string;
  maxMessagesPerSession: number;
  displayInterval: number; // milliseconds
  debugMode: boolean;
}

class InAppMessagingService {
  private isInitialized = false;
  private messageListeners: ((message: InAppMessage) => void)[] = [];
  private actionListeners: ((action: InAppAction) => void)[] = [];
  private messagesSuppressed = false;
  private dataCollectionEnabled = true;
  private config: InAppMessagingConfig;
  private displayedMessages: Set<string> = new Set();
  private sessionStartTime: Date = new Date();
  private messagesDisplayedToday = 0;

  constructor() {
    // Configuración por defecto
    this.config = {
      enabled: process.env.NODE_ENV === 'production' ? true : true, // Habilitado en todos los entornos
      apiEndpoint: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/in-app-messages` : undefined,
      maxMessagesPerSession: process.env.NODE_ENV === 'production' ? 3 : 10,
      displayInterval: process.env.NODE_ENV === 'production' ? 30000 : 5000, // 30s en prod, 5s en dev
      debugMode: process.env.NODE_ENV !== 'production'
    };
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.config.debugMode) {
        console.log('🔔 Initializing custom In-App Messaging service...');
      }
      
      // En producción, cargar configuración remota
      if (this.config.apiEndpoint && process.env.NODE_ENV === 'production') {
        await this.loadRemoteConfig();
      }
      
      // Inicializar contadores desde localStorage
      this.loadSessionData();
      
      this.isInitialized = true;
      
      if (this.config.debugMode) {
        console.log('✅ Custom In-App Messaging service initialized successfully');
      }
      return true;
    } catch (error) {
      console.error('❌ Error initializing custom In-App Messaging service:', error);
      return false;
    }
  }

  private async loadRemoteConfig(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/config`);
      if (response.ok) {
        const remoteConfig = await response.json();
        this.config = { ...this.config, ...remoteConfig };
      }
    } catch (error) {
      if (this.config.debugMode) {
        console.warn('Could not load remote config, using defaults:', error);
      }
    }
  }

  private loadSessionData(): void {
    try {
      const today = new Date().toDateString();
      const lastDate = localStorage.getItem('inapp_last_date');
      
      if (lastDate !== today) {
        // Nuevo día, resetear contador
        this.messagesDisplayedToday = 0;
        localStorage.setItem('inapp_last_date', today);
        localStorage.setItem('inapp_messages_today', '0');
      } else {
        this.messagesDisplayedToday = parseInt(localStorage.getItem('inapp_messages_today') || '0');
      }
    } catch (error) {
      // Ignorar errores de localStorage
    }
  }

  private saveSessionData(): void {
    try {
      localStorage.setItem('inapp_messages_today', this.messagesDisplayedToday.toString());
    } catch (error) {
      // Ignorar errores de localStorage
    }
  }

  /**
   * Simula la recepción de un mensaje in-app (para pruebas y desarrollo)
   * En producción, esto se reemplazaría por llamadas a la API
   */
  simulateMessage(message: Partial<InAppMessage>): void {
    if (!this.isInitialized || !this.config.enabled) {
      if (this.config.debugMode) {
        console.warn('⚠️ In-App Messaging service not initialized or disabled');
      }
      return;
    }

    if (this.messagesSuppressed) {
      if (this.config.debugMode) {
        console.log('🔇 Messages are suppressed, skipping message display');
      }
      return;
    }

    // Validar límites de sesión
    if (this.messagesDisplayedToday >= this.config.maxMessagesPerSession) {
      if (this.config.debugMode) {
        console.log('📊 Daily message limit reached, skipping message');
      }
      return;
    }

    const fullMessage: InAppMessage = {
      messageId: message.messageId || `msg_${Date.now()}`,
      title: message.title || 'Mensaje de prueba',
      body: message.body || 'Este es un mensaje de prueba del sistema In-App Messaging',
      actionUrl: message.actionUrl,
      campaignName: message.campaignName || 'test_campaign',
      data: message.data,
      priority: message.priority || 'normal'
    };

    // Validar condiciones de display
    if (!this.shouldDisplayMessage(fullMessage)) {
      return;
    }

    if (this.config.debugMode) {
      console.log('📱 Simulating In-App Message:', fullMessage);
    }
    
    // Marcar como mostrado
    this.displayedMessages.add(fullMessage.messageId);
    this.messagesDisplayedToday++;
    this.saveSessionData();
    
    // Enviar analytics
    this.trackMessageDisplayed(fullMessage);
    
    // Notificar a todos los listeners
    this.messageListeners.forEach(listener => {
      try {
        listener(fullMessage);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  private shouldDisplayMessage(message: InAppMessage): boolean {
    // Verificar si ya se mostró en esta sesión
    if (this.displayedMessages.has(message.messageId)) {
      return false;
    }

    // Verificar expiración
    if (message.expiresAt && new Date() > message.expiresAt) {
      return false;
    }

    // Verificar condiciones de display
    if (message.displayConditions) {
      const { minSessionTime, requiresAuth } = message.displayConditions;
      
      if (minSessionTime) {
        const sessionTime = Date.now() - this.sessionStartTime.getTime();
        if (sessionTime < minSessionTime) {
          return false;
        }
      }

      if (requiresAuth) {
        // En producción, verificar autenticación real
        // Por ahora asumimos que está autenticado
      }
    }

    return true;
  }

  private trackMessageDisplayed(message: InAppMessage): void {
    if (!this.dataCollectionEnabled) return;

    try {
      // En producción, enviar a analytics
      if (process.env.NODE_ENV === 'production' && this.config.apiEndpoint) {
        fetch(`${this.config.apiEndpoint}/analytics/message-displayed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: message.messageId,
            campaignName: message.campaignName,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side'
          })
        }).catch(error => {
          if (this.config.debugMode) {
            console.warn('Failed to send analytics:', error);
          }
        });
      }
    } catch (error) {
      // Ignorar errores de analytics
    }
  }

  /**
   * Suscribirse a mensajes in-app
   */
  onMessage(callback: (message: InAppMessage) => void): () => void {
    this.messageListeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  /**
   * Suscribirse a acciones de mensajes in-app
   */
  onAction(callback: (action: InAppAction) => void): () => void {
    this.actionListeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.actionListeners.indexOf(callback);
      if (index > -1) {
        this.actionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Simular una acción de mensaje (para pruebas y desarrollo)
   */
  simulateAction(action: Partial<InAppAction>): void {
    if (!this.isInitialized || !this.config.enabled) {
      return;
    }

    const fullAction: InAppAction = {
      actionLabel: action.actionLabel || 'Test Action',
      actionUrl: action.actionUrl || '#',
      messageId: action.messageId || 'unknown',
      timestamp: new Date()
    };

    // Enviar analytics
    this.trackActionClicked(fullAction);

    // Notificar a todos los listeners
    this.actionListeners.forEach(listener => {
      try {
        listener(fullAction);
      } catch (error) {
        console.error('Error in action listener:', error);
      }
    });
  }

  private trackActionClicked(action: InAppAction): void {
    if (!this.dataCollectionEnabled) return;

    try {
      // En producción, enviar a analytics
      if (process.env.NODE_ENV === 'production' && this.config.apiEndpoint) {
        fetch(`${this.config.apiEndpoint}/analytics/action-clicked`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: action.messageId,
            actionLabel: action.actionLabel,
            actionUrl: action.actionUrl,
            timestamp: action.timestamp.toISOString(),
            userAgent: navigator.userAgent
          })
        }).catch(error => {
          if (this.config.debugMode) {
            console.warn('Failed to send action analytics:', error);
          }
        });
      }
    } catch (error) {
      // Ignorar errores de analytics
    }
  }

  /**
   * Suprime los mensajes in-app
   */
  async suppressMessages(suppress: boolean): Promise<void> {
    try {
      this.messagesSuppressed = suppress;
      console.log(`📵 In-App Messages ${suppress ? 'suppressed' : 'enabled'}`);
    } catch (error) {
      console.error('❌ Error suppressing messages:', error);
    }
  }

  /**
   * Habilita o deshabilita la recolección de datos
   */
  async setDataCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      this.dataCollectionEnabled = enabled;
      console.log(`📊 Data collection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error setting data collection:', error);
    }
  }

  /**
   * Verificar si el servicio está inicializado
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtener el estado actual del servicio
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      enabled: this.config.enabled,
      messageListeners: this.messageListeners.length,
      actionListeners: this.actionListeners.length,
      dataCollectionEnabled: this.dataCollectionEnabled,
      messagesSuppressed: this.messagesSuppressed,
      messagesDisplayedToday: this.messagesDisplayedToday,
      maxMessagesPerSession: this.config.maxMessagesPerSession,
      displayInterval: this.config.displayInterval,
      debugMode: this.config.debugMode,
      sessionStartTime: this.sessionStartTime,
      displayedMessagesInSession: this.displayedMessages.size,
      apiEndpoint: this.config.apiEndpoint
    };
  }

  /**
   * Actualizar configuración en tiempo de ejecución
   */
  updateConfig(newConfig: Partial<InAppMessagingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debugMode) {
      console.log('📝 In-App Messaging config updated:', this.config);
    }
  }

  /**
   * Resetear contadores de sesión (útil para testing)
   */
  resetSession(): void {
    this.displayedMessages.clear();
    this.messagesDisplayedToday = 0;
    this.sessionStartTime = new Date();
    this.saveSessionData();
    
    if (this.config.debugMode) {
      console.log('🔄 In-App Messaging session reset');
    }
  }

  /**
   * Limpia todos los listeners
   */
  cleanup(): void {
    this.messageListeners = [];
    this.actionListeners = [];
    console.log('🧹 In-App Messaging Service cleaned up');
  }
}

// Exportar instancia singleton
export const inAppMessagingService = new InAppMessagingService();