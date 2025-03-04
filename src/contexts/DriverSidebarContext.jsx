import React, { createContext, useContext, useState, useEffect } from 'react';

const DriverSidebarContext = createContext();

// Custom hook to use the sidebar context
export function useDriverSidebar() {
  const context = useContext(DriverSidebarContext);
  if (!context) {
    throw new Error('useDriverSidebar must be used within a DriverSidebarProvider');
  }
  return context;
}

// Provider component
export function DriverSidebarProvider({ children }) {
  // Initialize isOpen to false for all devices
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-open on desktop, close on mobile
      setIsOpen(!mobile);
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    console.log('Toggle sidebar called. Current state:', isOpen);
    setIsOpen(prev => !prev);
    console.log('Toggle sidebar completed. New state will be:', !isOpen);
  };

  const openSidebar = () => {
    console.log('Opening sidebar');
    setIsOpen(true);
  };

  const closeSidebar = () => {
    console.log('Closing sidebar');
    setIsOpen(false);
  };

  return (
    <DriverSidebarContext.Provider value={{ isOpen, isMobile, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </DriverSidebarContext.Provider>
  );
}

// For backward compatibility
export default DriverSidebarProvider; 