import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import { cn } from '../lib/utils';

const Layout = () => {
  // Default to open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-grainy-gradient transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
