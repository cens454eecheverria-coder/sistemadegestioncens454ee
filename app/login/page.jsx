"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import {
  ShieldAlert,
  UserCheck,
  GraduationCap,
  BookOpen,
  Lock,
  Mail,
  CreditCard,
  ArrowRight,
  School
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginStaff, loginProfesor, loginEstudiante } = useAuth();

  const [activeTab, setActiveTab] = useState('admin'); // admin, preceptor, profesor, estudiante

  // State fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cuil, setCuil] = useState('');
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'admin' || activeTab === 'preceptor') {
        if (!email || !password) {
          throw new Error('Por favor complete su correo y contraseña.');
        }
        await loginStaff(email, password, activeTab);
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido/a!',
          text: `Sesión iniciada como ${activeTab === 'admin' ? 'Directivo' : 'Preceptor/a'}`,
          timer: 1500,
          showConfirmButton: false,
        });
        router.push(activeTab === 'admin' ? '/dashboard' : '/preceptores');
      } else if (activeTab === 'profesor') {
        if (!cuil) {
          throw new Error('Ingrese su número de CUIL o DNI docente.');
        }
        await loginProfesor(cuil);
        Swal.fire({
          icon: 'success',
          title: 'Acceso Docente Concedido',
          text: 'Redirigiendo al Portal de Carga de Notas...',
          timer: 1500,
          showConfirmButton: false,
        });
        router.push('/docentes');
      } else if (activeTab === 'estudiante') {
        if (!dni) {
          throw new Error('Ingrese su DNI para consultar su boletín.');
        }
        await loginEstudiante(dni);
        Swal.fire({
          icon: 'success',
          title: 'Consulta de Boletín',
          text: 'Accediendo a su legajo y calificaciones...',
          timer: 1500,
          showConfirmButton: false,
        });
        router.push('/estudiantes');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Ingreso',
        text: err.message || 'No se pudo iniciar sesión. Verifique los datos.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="card shadow-xl overflow-hidden border border-gray-200">
        {/* Header institucional del card */}
        <div className="bg-gradient-to-r from-[#0D2A3E] to-[#006384] p-6 text-white text-center space-y-2">
          <img
            src="/logo.png"
            alt="Logo CENS 454"
            className="w-16 h-16 mx-auto object-contain bg-white/10 p-1.5 rounded-xl border border-[#F5C442]/50 shadow-md"
          />
          <h2 className="text-xl font-bold font-heading">
            Acceso al Sistema CENS 454
          </h2>
          <p className="text-xs text-gray-200 font-medium">
            Esteban Echeverría (Región 5)
          </p>
        </div>

        {/* Tabs de Selección de Rol */}
        <div className="grid grid-cols-4 bg-[#EEF5FA] border-b border-gray-200 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'admin'
                ? 'bg-white text-[#006384] border-b-2 border-[#006384] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Directivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preceptor')}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'preceptor'
                ? 'bg-white text-[#006384] border-b-2 border-[#006384] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Preceptor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profesor')}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'profesor'
                ? 'bg-white text-[#006384] border-b-2 border-[#006384] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Profesor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('estudiante')}
            className={`py-3 px-1 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'estudiante'
                ? 'bg-white text-[#006384] border-b-2 border-[#006384] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Estudiante
          </button>
        </div>

        {/* Formulario según pestaña seleccionada */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(activeTab === 'admin' || activeTab === 'preceptor') && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 text-[#006384] mt-0.5" />
                <span>
                  Ingreso para <strong>{activeTab === 'admin' ? 'Equipo Directivo' : 'Preceptoría'}</strong> requiere correo y contraseña institucional.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@cens454.edu.ar"
                    className="field-soft pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field-soft pl-9"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'profesor' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                <GraduationCap className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  Ingreso simplificado Docente mediante número de <strong>CUIL o DNI registrado</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Número de CUIL o DNI
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={cuil}
                    onChange={(e) => setCuil(e.target.value)}
                    placeholder="Ej: 20-28192834-5"
                    className="field-soft pl-9"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'estudiante' && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-start gap-2">
                <BookOpen className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
                <span>
                  Consulta pública de Boletín Digital mediante número de <strong>DNI del estudiante</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  DNI del Estudiante
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 38492011"
                    className="field-soft pl-9"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-bold text-sm py-3 mt-2 shadow-md hover:scale-[1.01] transition-transform"
          >
            {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
