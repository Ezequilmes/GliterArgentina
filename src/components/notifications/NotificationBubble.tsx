'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Zap } from 'lucide-react';

interface NotificationBubbleProps {
  isVisible: boolean;
  type?: 'message' | 'like' | 'match' | 'general';
  message?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  duration?: number;
  onComplete?: () => void;
}

// Memoizar mapas para evitar recreaciones
const iconMap = {
  message: MessageCircle,
  like: Heart,
  match: Zap,
  general: MessageCircle,
} as const;

const colorMap = {
  message: 'from-blue-500 to-blue-600',
  like: 'from-pink-500 to-red-500',
  match: 'from-purple-500 to-pink-500',
  general: 'from-gray-500 to-gray-600',
} as const;

const positionMap = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
} as const;

// Memoizar variantes de animación
const bubbleVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    y: -20,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

const NotificationBubbleComponent: React.FC<NotificationBubbleProps> = ({
  isVisible,
  type = 'message',
  message,
  position = 'top-right',
  duration = 3000,
  onComplete,
}) => {
  // Memoizar valores derivados
  const Icon = useMemo(() => iconMap[type], [type]);
  const colorClass = useMemo(() => colorMap[type], [type]);
  const positionClass = useMemo(() => positionMap[position], [position]);

  // Memoizar callback de timeout
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    if (isVisible && handleComplete) {
      const timer = setTimeout(handleComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, handleComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${positionClass} z-50 pointer-events-none`}
          variants={bubbleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${colorClass} rounded-full blur-lg opacity-60`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Main bubble */}
          <motion.div
            className={`relative bg-gradient-to-r ${colorClass} rounded-full p-3 shadow-lg`}
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>

          {/* Message text if provided */}
          {message && (
            <motion.div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.div>
          )}

          {/* Ripple effect */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${colorClass} rounded-full`}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ 
              scale: [1, 2, 3], 
              opacity: [0.8, 0.3, 0] 
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const NotificationBubble = React.memo(NotificationBubbleComponent);

export default NotificationBubble;