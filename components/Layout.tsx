import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  sidebarContent: React.ReactNode;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ sidebarContent, children }) => {
  return (
    <div>
      <Sidebar>{sidebarContent}</Sidebar>
      <div className="lg:pl-96">
        <Header />
        <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;