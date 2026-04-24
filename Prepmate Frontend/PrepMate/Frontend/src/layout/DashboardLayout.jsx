import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import FloatingTimer from '../components/FloatingTimer';
import ToastHost from '../components/ui/ToastHost';

const DashboardLayout = () => {
  // Manage sidebar state for mobile responsiveness
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    /* The outermost wrapper is locked to 100vh to prevent formation collapse */
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR: Remains fixed on the left */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MAIN VIEWPORT SECTION */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* TOPBAR: Remains fixed at the top */}
        <Topbar onMenuClick={toggleSidebar} />

        {/* SCROLLABLE CONTENT AREA: Only this section scrolls */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Timer — persists across all pages */}
      <FloatingTimer />
      <ToastHost />
    </div>
  );
};

export default DashboardLayout;
