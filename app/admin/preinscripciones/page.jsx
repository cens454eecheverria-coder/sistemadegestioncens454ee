"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { FileCheck, CheckCircle2, XCircle, AlertCircle, Phone, Search } from 'lucide-react';

export default function AdminPreinscripcionesPage() {
  const [preinscripciones, setPreinscripciones] = useState([]);
  const [filterEstado, setFilterEstado] = useState('pendiente');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreinscripciones();
  }, []);

  async function loadPreinscripciones() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('preinscripciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setPreinscripciones(data);
      } else {
        setPreinscripciones([
          {
            id: 'p1',
            dni: '45102938',
            cuil: '20-45102938-2',
            apellido: 'Pérez',
            nombre: 'Gonzalo Valentín',
            email: 'gonzalo.perez@gmail.com',
            telefono: '11-9988-7766',
            orientacion_interes: 'Ciencias Sociales',
            turno_preferido: 'Noche',
            estado: 'pendiente',
            observaciones: 'Pendiente de entrega de analítico previo.',
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleProcesarSolicitud = async (pre, nuevoEstado) => {
    try {
      // 1. Actualizar estado preinscripción
      const { error: errPre } = await supabase
        .from('preinscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', pre.id);

      if (errPre) throw errPre;

      // 2. Si es aprobada, crear automáticamente el legajo oficial en estudiantes
      if (nuevoEstado === 'aprobada') {
        const { error: errEst } = await supabase.from('estudiantes').upsert(
          [
            {
              dni: pre.dni,
              cuil: pre.cuil,
              apellido: pre.apellido,
              nombre: pre.nombre,
              email: pre.email,
              telefono: pre.telefono,
              estado: 'activo',
              observaciones: `Ingreso por preinscripción web (${pre.orientacion_interes} - Turno ${pre.turno_preferido})`,
            },
          ],
          { onConflict: 'dni' }
        );

        if (errEst) console.warn('Aviso al matricular legajo:', errEst.message);
      }

      Swal.fire({
        icon: 'success',
        title: `Solicitud ${nuevoEstado.toUpperCase()}`,
        text: nuevoEstado === 'aprobada' ? 'Se creó automáticamente el legajo oficial del alumno.' : 'Estado actualizado.',
        timer: 1500,
        showConfirmButton: false,
      });

      await loadPreinscripciones();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    }
  };

  const filtered = preinscripciones.filter((p) => {
    const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
    const matchSearch =
      p.apellido.toLowerCase().includes(search.toLowerCase()) ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.dni.includes(search);
    return matchEstado && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-[#006384]" />
            Gestión Interna de Preinscripciones
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Procesamiento de solicitudes web y matriculación automática CENS 454
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aspirante por apellido, nombre o DNI..."
            className="field-soft pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {['pendiente', 'aprobada', 'documentacion_incompleta', 'rechazada', 'todos'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterEstado(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                filterEstado === st ? 'bg-[#006384] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {st.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Preinscripciones */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Aspirante</th>
                <th className="py-3 px-4">DNI / Teléfono</th>
                <th className="py-3 px-4">Orientación & Turno</th>
                <th className="py-3 px-4 text-center">Estado Solicitud</th>
                <th className="py-3 px-4 text-center">Acciones Procesamiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando preinscripciones...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    No hay preinscripciones registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4FAFF] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                      {p.apellido}, {p.nombre}
                      {p.observaciones && (
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">{p.observaciones}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      <div>{p.dni}</div>
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {p.telefono}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-semibold">
                      <div>{p.orientacion_interes || 'Ciencias Sociales'}</div>
                      <div className="text-[10px] text-[#006384] font-bold">Turno {p.turno_preferido || 'Noche'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.estado === 'pendiente' && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          ⏳ Pendiente
                        </span>
                      )}
                      {p.estado === 'aprobada' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          ✅ Aprobada / Matriculado
                        </span>
                      )}
                      {p.estado === 'documentacion_incompleta' && (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                          📄 Incompleta
                        </span>
                      )}
                      {p.estado === 'rechazada' && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                          ❌ Rechazada
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleProcesarSolicitud(p, 'aprobada')}
                        className="btn-gold text-[11px] py-1 px-2.5 font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprobar y Matricular
                      </button>
                      <button
                        onClick={() => handleProcesarSolicitud(p, 'documentacion_incompleta')}
                        className="btn-primary text-[11px] py-1 px-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Docs Incompletos
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
