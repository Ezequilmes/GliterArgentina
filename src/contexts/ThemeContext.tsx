'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    // Only run on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(systemPrefersDark);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    // Only run on client side and when loaded
    if (typeof window !== 'undefined' && isLoaded) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDarkMode, isLoaded]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    isLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};