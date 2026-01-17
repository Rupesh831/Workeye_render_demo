import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}
