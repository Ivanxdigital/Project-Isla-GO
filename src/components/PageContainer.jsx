import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`pt-28 ${className}`}>
      {children}
    </div>
  );
} 