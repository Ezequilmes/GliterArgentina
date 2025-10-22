export interface NotificationData {
  message: string;
  senderName: string;
  soundEnabled: boolean;
  visualEnabled: boolean;
  isChatOpen: boolean;
  type?: 'message' | 'like' | 'match' | 'general';
}

export interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  volume: number;
  toastEnabled?: boolean;
  bubbleEnabled?: boolean;
  microAnimationsEnabled?: boolean;
}

export interface NotificationManagerGlobal {
  showNewMessageNotification: (data: NotificationData) => void;
  showTestNotification: (message?: string) => void;
}

declare global {
  interface Window {
    notificationManager?: NotificationManagerGlobal;
  }
}

export {};