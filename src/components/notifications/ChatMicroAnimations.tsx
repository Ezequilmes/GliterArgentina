'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ChatMicroAnimationsProps {
  isAnimating: boolean;
  children: React.ReactNode;
  type?: 'glow' | 'vibrate' | 'pulse' | 'bounce';
}

// Memoizar variantes de animación
const animationVariants = {
  glow: {
    initial: { boxShadow: "0 0 0 rgba(59, 130, 246, 0)" },
    animate: { 
      boxShadow: ["0 0 0 rgba(59, 130, 246, 0)", "0 0 20px rgba(59, 130, 246, 0.5)", "0 0 0 rgba(59, 130, 246, 0)"],
      transition: { duration: 0.6, ease: "easeInOut" as const }
    }
  },
  vibrate: {
    initial: { x: 0 },
    animate: { 
      x: [-2, 2, -2, 2, 0],
      transition: { duration: 0.3, ease: "easeInOut" as const }
    }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.4, ease: "easeInOut" as const }
    }
  },
  bounce: {
    initial: { y: 0 },
    animate: { 
      y: [0, -8, 0],
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
   }
  };

const ChatMicroAnimationsComponent: React.FC<ChatMicroAnimationsProps> = ({
  isAnimating,
  children,
  type = 'glow',
}) => {
  // Memoizar las propiedades de animación
  const animationProps = useMemo(() => {
    const variant = animationVariants[type];
    return {
      initial: variant.initial,
      animate: isAnimating ? variant.animate : variant.initial,
    };
  }, [type, isAnimating]);

  return (
    <motion.div
      className="relative"
      {...animationProps}
    >
      {children}
      
      {/* Overlay glow effect for glow type */}
      {type === 'glow' && isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
            background: [
              'rgba(59, 130, 246, 0)',
              'rgba(59, 130, 246, 0.1)',
              'rgba(59, 130, 246, 0)',
            ],
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const ChatMicroAnimations = React.memo(ChatMicroAnimationsComponent);

export default ChatMicroAnimations;