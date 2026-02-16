import React, { createContext, useContext, useEffect, useState } from 'react';

interface KeyboardNavigationContextType {
  isKeyboardMode: boolean;
  setIsKeyboardMode: (value: boolean) => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(
  undefined
);

export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
  }
  return context;
};

export const KeyboardNavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardMode(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardMode(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isKeyboardMode) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }, [isKeyboardMode]);

  return (
    <KeyboardNavigationContext.Provider value={{ isKeyboardMode, setIsKeyboardMode }}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
};
