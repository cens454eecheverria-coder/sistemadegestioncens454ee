"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

function MainLayoutContent({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isLoginPage = pathname === '/login';
  const showSidebar = user && !isLoginPage;

  return (
    <div className="min-h-screen flex flex-col">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Navbar showSidebar={showSidebar} />
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${showSidebar ? 'lg:ml-72' : ''}`}>
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
