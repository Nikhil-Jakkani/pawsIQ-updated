import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Load minimized state from localStorage
  useEffect(() => {
    const savedMinimizedState = localStorage.getItem('sidebarMinimized');
    if (savedMinimizedState !== null) {
      setMinimized(JSON.parse(savedMinimizedState));
    }
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMinimized = () => {
    const newState = !minimized;
    setMinimized(newState);
    localStorage.setItem('sidebarMinimized', JSON.stringify(newState));
  };

  return (
    <SidebarContext.Provider value={{ isOpen, minimized, toggleSidebar, toggleMinimized, setMinimized }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
