"use client";

import React from 'react';
import Link from 'next/link';
import {
  School,
  UserCheck,
  GraduationCap,
  ClipboardList,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  BookOpen
} from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida Institucional */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D2A3E] via-[#006384] to-[#0B7EA5] text-white p-8 md:p-12 shadow-xl border border-white/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5C442] text-[#0D2A3E] font-bold text-xs tracking-wider uppercase shadow-xs">
            <School className="w-4 h-4" />
            Educación Secundaria de Adultos
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight">
            Centro de Estudios de Nivel Secundario N° 454
          </h1>
          <p className="text-base md:text-lg text-gray-100 font-normal leading-relaxed">
            Sistema Oficial de Gestión Académica, Asistencia, Boletines Digitales y Preinscripciones de Esteban Echeverría.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/preinscripcion"
              className="btn-gold font-bold text-sm px-6 py-3 shadow-lg hover:scale-105 transition-transform"
            >
              Formulario de Preinscripción {new Date().getFullYear()}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-full backdrop-blur-sm border border-white/30 transition-all"
            >
              Ingreso de Usuarios
            </Link>
          </div>
        </div>

        {/* Logo de fondo sutil */}
        <div className="absolute right-4 -bottom-6 opacity-20 hidden md:block">
          <img src="/logo.png" alt="Escudo CENS 454" className="w-80 h-80 object-contain" />
        </div>
      </div>

      {/* Tarjetas de Accesos Rápidos por Perfil */}
      <div>
        <h2 className="text-2xl font-bold font-heading text-[#0D2A3E] mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#006384]" />
          Portales y Módulos Institucionales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Directivos & Preceptores */}
          <div className="card hover:shadow-lg transition-all duration-300 group border-t-4 border-t-[#006384]">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EEF5FA] text-[#006384] flex items-center justify-center font-bold group-hover:bg-[#006384] group-hover:text-white transition-colors">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-gray-900">
                Preceptoría & Gestión
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Toma de asistencia diaria por curso, cálculo automático de ausentismos e impresión de planillas A4.
              </p>
              <Link
                href="/preceptores"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006384] hover:text-[#0B7EA5] pt-2"
              >
                Acceder al Panel <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Alertas & Riesgo */}
          <div className="card hover:shadow-lg transition-all duration-300 group border-t-4 border-t-[#F5C442]">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center font-bold group-hover:bg-[#F5C442] group-hover:text-[#0D2A3E] transition-colors">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-gray-900">
                Semáforo de Riesgo
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Detección temprana de inasistencias (menos de 5, 5 a 9.5, 10 o más faltas) y emisión de Actas de Compromiso.
              </p>
              <Link
                href="/alertas"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006384] hover:text-[#0B7EA5] pt-2"
              >
                Ver Alertas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Portal Docente */}
          <div className="card hover:shadow-lg transition-all duration-300 group border-t-4 border-t-[#0B7EA5]">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EEF5FA] text-[#0B7EA5] flex items-center justify-center font-bold group-hover:bg-[#0B7EA5] group-hover:text-white transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-gray-900">
                Portal Docente
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Carga de notas cuatrimestrales (Q1, Q2), promedio final y períodos de intensificación (RIE/Dic/Feb).
              </p>
              <Link
                href="/docentes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006384] hover:text-[#0B7EA5] pt-2"
              >
                Cargar Notas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Portal Estudiante */}
          <div className="card hover:shadow-lg transition-all duration-300 group border-t-4 border-t-emerald-600">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-gray-900">
                Boletín Estudiante
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Consulta rápida de calificaciones por asignatura, inasistencias acumuladas y estado de cursada.
              </p>
              <Link
                href="/estudiantes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2"
              >
                Consultar Boletín <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Informativa Institucional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="card p-6 bg-white flex items-start gap-4">
          <MapPin className="w-8 h-8 text-[#006384] shrink-0" />
          <div>
            <h4 className="font-bold text-sm font-heading text-gray-900">Ubicación</h4>
            <p className="text-xs text-gray-600 mt-1">Esteban Echeverría, Provincia de Buenos Aires (Región 5)</p>
          </div>
        </div>

        <div className="card p-6 bg-white flex items-start gap-4">
          <Clock className="w-8 h-8 text-[#006384] shrink-0" />
          <div>
            <h4 className="font-bold text-sm font-heading text-gray-900">Turnos de Cursada</h4>
            <p className="text-xs text-gray-600 mt-1">Turno Mañana, Tarde y Noche (Orientaciones Adultos)</p>
          </div>
        </div>

        <div className="card p-6 bg-white flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-[#006384] shrink-0" />
          <div>
            <h4 className="font-bold text-sm font-heading text-gray-900">Seguridad & RLS</h4>
            <p className="text-xs text-gray-600 mt-1">Infraestructura Supabase con Row Level Security de datos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
