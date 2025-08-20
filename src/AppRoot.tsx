import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { TimerProvider } from './contexts/TimerContext';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <TimerProvider>
        <AppNavigator />
      </TimerProvider>
    </ThemeProvider>
  );
}


