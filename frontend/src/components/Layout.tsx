import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;