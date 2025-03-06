import React from 'react';
import NavigationMenu from './NavigationMenu.jsx';
import Footer from './Footer.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import { Outlet } from 'react-router-dom';

export default function Layout({ children, noTopPadding = false }) {
  // Use either children or Outlet, with children taking precedence
  const content = children || <Outlet />;
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollToTop />
      <NavigationMenu />
      <main className={`flex-grow ${!noTopPadding ? 'pt-16' : ''}`}>
        {/* Add error boundary wrapper */}
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          {content}
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
} 