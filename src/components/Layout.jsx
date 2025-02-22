import React from 'react';
import NavigationMenu from './NavigationMenu.jsx';
import Footer from './Footer.jsx';

export default function Layout({ children, noTopPadding = false }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <NavigationMenu />
      <main className={`flex-grow ${!noTopPadding ? 'pt-16' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
} 