import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user, updateTheme } = useAuth();
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then user preference, then default to light
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Update theme when user changes
  useEffect(() => {
    if (user && user.theme && user.theme !== theme) {
      setTheme(user.theme);
      localStorage.setItem('theme', user.theme);
    }
  }, [user, theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update user preference if logged in
    if (user) {
      await updateTheme(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
