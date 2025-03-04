import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  // Initialize isOpen based on screen size - default to true for desktop
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pageHeight, setPageHeight] = useState('100vh');
  const location = useLocation();
  
  // Handle sidebar visibility based on screen size and route changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-open on desktop, close on mobile
      setIsOpen(!mobile);
      
      // Update the page height
      updatePageHeight();
    };
    
    const updatePageHeight = () => {
      // Get the document height or viewport height, whichever is greater
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      const viewportHeight = window.innerHeight;
      
      // Use the greater of the two heights
      setPageHeight(`${Math.max(docHeight, viewportHeight)}px`);
    };
    
    // Set initial state
    handleResize();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updatePageHeight);
    
    // Update height when content changes
    const observer = new MutationObserver(updatePageHeight);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      characterData: true 
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updatePageHeight);
      observer.disconnect();
    };
  }, []);
  
  // Ensure sidebar is open on driver routes for desktop
  useEffect(() => {
    const isDriverRoute = location.pathname.startsWith('/driver');
    if (isDriverRoute && !isMobile) {
      console.log('Driver route detected on desktop, ensuring sidebar is open');
      setIsOpen(true);
    }
  }, [location.pathname, isMobile]);

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
    <DriverSidebarContext.Provider value={{ isOpen, isMobile, toggleSidebar, openSidebar, closeSidebar, pageHeight }}>
      {children}
    </DriverSidebarContext.Provider>
  );
}

// For backward compatibility
export default DriverSidebarProvider; 