import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ErrorBoundary } from './ErrorBoundary';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        
        {/* Sidebar Navigation */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* Main Content Pane */}
        <div className="flex flex-col flex-1 min-w-0">
          
          {/* Header Bar */}
          <Header onToggleSidebar={toggleSidebar} />
          
          {/* Main Workspace Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {children}
            </div>
          </main>
          
        </div>
      </div>
    </ErrorBoundary>
  );
}
