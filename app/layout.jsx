"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

function MainLayoutContent({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Oculta por defecto según requerimiento
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const showSidebar = user && !isLoginPage;

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      )}
      <div className="flex-1 flex flex-col">
        <Navbar
          showSidebar={showSidebar}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto transition-all duration-300 ${
            showSidebar && sidebarOpen ? 'lg:ml-72' : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#F4FAFF]">
        <AuthProvider>
          <MainLayoutContent>{children}</MainLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
