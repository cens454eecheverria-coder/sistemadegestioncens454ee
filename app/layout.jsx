"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import PwaRegister from '@/components/PwaRegister';

function MainLayoutContent({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();

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
      <head>
        <title>CENS 454 EE - Sistema de Gesti?n</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#006384" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CENS 454 EE" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased bg-[#F4FAFF]">
        <AuthProvider>
          <PwaRegister />
          <MainLayoutContent>{children}</MainLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
