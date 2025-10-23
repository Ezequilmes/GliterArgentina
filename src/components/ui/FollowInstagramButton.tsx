'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FollowInstagramButtonProps {
  className?: string;
  onClick?: () => void;
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const FollowInstagramButton: React.FC<FollowInstagramButtonProps> = ({ 
  className, 
  onClick 
}) => {
  const handleInstagramRedirect = () => {
    const instagramUrl = 'https://www.instagram.com/gliterapp/';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Instagram app first, fallback to web
      const instagramAppUrl = 'instagram://user?username=gliterapp';
      
      // Create a temporary link to test if Instagram app is available
      const tempLink = document.createElement('a');
      tempLink.href = instagramAppUrl;
      
      // Try to open Instagram app
      try {
        window.location.href = instagramAppUrl;
        
        // Fallback to web version after a short delay if app doesn't open
        setTimeout(() => {
          window.open(instagramUrl, '_blank', 'noopener,noreferrer');
        }, 1000);
      } catch (error) {
        // If Instagram app fails, open web version
        window.open(instagramUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Desktop: open in new tab
      window.open(instagramUrl, '_blank', 'noopener,noreferrer');
    }
    
    // Call optional onClick handler
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleInstagramRedirect}
      className={cn(
        'w-full flex items-center px-4 sm:px-4 py-3 sm:py-3 rounded-lg transition-all duration-300 touch-manipulation group',
        'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-400',
        'hover:from-purple-600 hover:via-pink-600 hover:to-blue-500',
        'hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]',
        'active:scale-[0.98] active:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        className
      )}
    >
      <div className="w-10 h-10 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-white/30 transition-colors">
        <InstagramIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <h4 className="font-semibold text-sm sm:text-base truncate text-white">
          💖 Seguinos en Instagram
        </h4>
        <p className="text-xs sm:text-sm text-white/80 truncate">
          @gliterapp - Contenido exclusivo
        </p>
      </div>
      <div className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 group-hover:bg-white/30 transition-colors">
        NUEVO
      </div>
    </button>
  );
};

export default FollowInstagramButton;