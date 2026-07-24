"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { School, User, Calendar, Bell } from 'lucide-react';

export default function Navbar() {
  const { user, role, cicloLectivo } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:ml-72">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-heading font-bold text-gray-800 text-sm md:text-base">
              CENS N° 454 - Esteban Echeverría
            </span>
            <span className="bg-[#006384] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Región 5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-[#EEF5FA] px-3 py-1.5 rounded-lg border border-gray-200">
            <Calendar className="w-4 h-4 text-[#006384]" />
            <span>Ciclo Lectivo <strong>{cicloLectivo}</strong></span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-[#EEF5FA] text-[#0D2A3E] px-3 py-1.5 rounded-lg font-semibold border border-gray-200">
                👤 {user.nombre} ({user.role})
              </span>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary text-xs py-1.5 px-4 font-semibold"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
