"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  BookMarked,
  Users,
  FileCheck,
  LogOut,
  User,
  X,
  FileText,
  Clock,
  Layers,
  ChevronLeft
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, role, logout, cicloLectivo, changeCicloLectivo } = useAuth();

  // Matriz de Accesos por Rol
  const menuItems = [
    { name: 'Dashboard General', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Toma de Asistencia', href: '/preceptores', icon: ClipboardCheck, roles: ['admin', 'preceptor'] },
    { name: 'Semáforo de Riesgo', href: '/alertas', icon: AlertTriangle, roles: ['admin', 'preceptor'] },
    { name: 'Portal Docente', href: '/docentes', icon: GraduationCap, roles: ['admin', 'profesor'] },
    { name: 'Boletín Estudiante', href: '/estudiantes', icon: BookOpen, roles: ['admin', 'estudiante'] },
    { name: 'Libro DICYT', href: '/dicyt', icon: BookMarked, roles: ['admin', 'preceptor', 'profesor'] },
    { name: 'Secretaría y Legajos', href: '/secretaria', icon: Users, roles: ['admin'] }, // RESTRINGIDO A SOLO ADMIN
    { name: 'Cursos & Orientaciones', href: '/admin/cursos', icon: Layers, roles: ['admin'] },
    { name: 'Horarios Escolares', href: '/horarios', icon: Clock, roles: ['admin', 'preceptor', 'profesor', 'estudiante'] },
    { name: 'Gestión Preinscripción', href: '/admin/preinscripciones', icon: FileCheck, roles: ['admin', 'preceptor'] },
    { name: 'Form Preinscripción', href: '/preinscripcion', icon: FileText, roles: ['admin', 'preceptor', 'profesor', 'estudiante', null] },
  ];

  // Filtrar estrictamente según el rol activo
  const filteredItems = menuItems.filter((item) => {
    if (!role) return item.roles.includes(null);
    if (role === 'admin') return true;
    return item.roles.includes(role);
  });

  return (
    <>
      {/* Backdrop móvil */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Principal (Oculta por defecto, desplegable) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-[#0D2A3E] text-white z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header Sidebar con Botón para Ocultar */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo CENS 454"
                className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1 border border-[#F5C442]/40"
              />
              <div>
                <h2 className="font-heading text-base font-bold text-white tracking-tight leading-tight">
                  CENS N° 454
                </h2>
                <p className="text-[10px] text-[#F5C442] font-semibold tracking-wide uppercase">
                  Esteban Echeverría
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Ocultar Barra Lateral"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Ciclo Lectivo */}
          <div className="p-4 mx-4 my-3 bg-white/5 rounded-xl border border-white/10">
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Ciclo Lectivo Activo:
            </label>
            <select
              value={cicloLectivo}
              onChange={(e) => changeCicloLectivo(e.target.value)}
              className="w-full bg-[#006384] text-white font-bold text-sm px-3 py-1.5 rounded-lg outline-none cursor-pointer border border-[#C1E8FF]/30"
            >
              <option value="2026">Ciclo Lectivo 2026</option>
              <option value="2025">Ciclo Lectivo 2025</option>
              <option value="2024">Ciclo Lectivo 2024</option>
            </select>
          </div>

          {/* Menú de Navegación Exclusivo por Rol */}
          <nav className="px-3 space-y-1 mt-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#006384] text-white shadow-md border-r-4 border-[#F5C442] font-semibold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#F5C442]' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Usuario */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-[#F5C442] text-[#0D2A3E] flex items-center justify-center font-bold font-heading text-sm">
                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.nombre}
                  </p>
                  <p className="text-xs text-[#F5C442] capitalize font-medium">
                    Rol: {user.role || 'Invitado'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full btn-gold text-center py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Ingresar al Sistema
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
