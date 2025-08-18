import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Create a context for shared timer
const TimerContext = createContext({ currentTime: new Date() });

// Timer Provider Component
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const value = useMemo(() => ({ currentTime }), [currentTime]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

// Hook to use shared timer
export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

// Format date function (moved outside of hooks context)
export const formatDate = (date: Date | number | string, format: string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'DD/MM/YYYY HH:mm:ss':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    case 'MM/DD/YYYY HH:mm:ss':
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'DD-MM-YYYY HH:mm:ss':
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    default:
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
};



