import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/layout.css';

export const AppLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="layout-root">
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />
      <div className="layout-main-wrapper">
        <Header 
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
        />
        <main className="layout-page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
