import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Appearance } from 'react-native';

// Theme Types
export type ThemeType = 'light' | 'dark' | 'system';

// Theme Colors
export const lightTheme = {
  // Primary Colors
  primary: '#00bcd4',
  primaryDark: '#0097a7',
  primaryLight: '#e0f7fa',
  
  // Background Colors
  background: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text Colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',
  
  // Border & Divider Colors
  border: '#e0e0e0',
  divider: '#f0f0f0',
  
  // Overlay Colors
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(255,255,255,0.2)',
  
  // Shadow Colors
  shadow: '#000000',
  
  // Status Bar
  statusBar: 'light-content' as const,
  statusBarBg: '#00bcd4',
  
  // Theme Type
  isDark: false,
};

export const darkTheme = {
  // Primary Colors
  primary: '#00bcd4',
  primaryDark: '#0097a7',
  primaryLight: '#1a1a1a',
  
  // Background Colors
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',
  
  // Text Colors
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',
  
  // Border & Divider Colors
  border: '#404040',
  divider: '#2a2a2a',
  
  // Overlay Colors
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(255,255,255,0.1)',
  
  // Shadow Colors
  shadow: '#000000',
  
  // Status Bar
  statusBar: 'light-content' as const,
  statusBarBg: '#1e1e1e',
  
  // Theme Type
  isDark: true,
};

// Storage keys for persistent settings
const STORAGE_KEYS = {
  THEME: 'theme',
};

// In-memory storage for current session
const sessionStorage: { [key: string]: any } = {};

// Storage utility functions (in-memory for now)
const saveToStorage = async (key: string, value: any) => {
  try {
    sessionStorage[key] = value;
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

const loadFromStorage = async (key: string, defaultValue: any) => {
  try {
    return sessionStorage[key] !== undefined ? sessionStorage[key] : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
};

// Theme Context
interface ThemeContextType {
  theme: typeof lightTheme;
  themeType: ThemeType;
  isDark: boolean;
  setThemeType: (type: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeType, setThemeTypeState] = useState<ThemeType>('system');
  const [isDark, setIsDark] = useState(false);

  // Get current theme based on type and system preference
  const theme = useMemo(() => {
    if (themeType === 'system') {
      const systemColorScheme = Appearance.getColorScheme();
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeType === 'dark' ? darkTheme : lightTheme;
  }, [themeType]);

  // Update isDark state when theme changes
  useEffect(() => {
    setIsDark(theme === darkTheme);
  }, [theme]);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await loadFromStorage(STORAGE_KEYS.THEME, 'system');
        setThemeTypeState(savedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await saveToStorage(STORAGE_KEYS.THEME, themeType);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    saveTheme();
  }, [themeType]);

  const setThemeType = useCallback((type: ThemeType) => {
    setThemeTypeState(type);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeTypeState(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    themeType,
    isDark,
    setThemeType,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



