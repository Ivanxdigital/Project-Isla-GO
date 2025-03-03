import React, { createContext, useContext, useState } from 'react';

const DriverSidebarContext = createContext();

export const useDriverSidebar = () => {
  const context = useContext(DriverSidebarContext);
  if (!context) {
    throw new Error('useDriverSidebar must be used within a DriverSidebarProvider');
  }
  return context;
};

export const DriverSidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  const openSidebar = () => {
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <DriverSidebarContext.Provider value={{ isOpen, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </DriverSidebarContext.Provider>
  );
};

export default DriverSidebarProvider; 