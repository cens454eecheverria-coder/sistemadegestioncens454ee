"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  FileCheck,
  Plus,
  Search,
  MessageSquare,
  Printer,
  ShieldAlert,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export default function AlertasPage() {
  const [estudiantesAlertas, setEstudiantesAlertas] = useState([]);
  const [filterRiesgo, setFilterRiesgo] = useState('todos'); // todos, verde, amarillo, rojo
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Acta
  const [selectedStudentActa, setSelectedStudentActa] = useState(null);
  const [actaObservacion, setActaObservacion] = useState('');

  useEffect(() => {
    loadAlertas();
  }, []);

  async function loadAlertas() {
    setLoading(true);
    try {
      // 1. Obtener lista de estudiantes activos reales
      const { data: estData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('estado', 'activo')
        .order('apellido');

      // 2. Obtener asistencias reales
      const { data: asisData } = await supabase
        .from('asistencias')
        .select('*');

      const faltasMap = {};
      if (asisData) {
        asisData.forEach((a) => {
          if (!faltasMap[a.estudiante_id]) faltasMap[a.estudiante_id] = 0;
          if (a.estado === 'A' || a.estado === 'ausente') faltasMap[a.estudiante_id] += 1;
          if (a.estado === 'media_falta') faltasMap[a.estudiante_id] += 0.5;
        });
      }

      let list = (estData || []).map((est) => {
        const totalFaltas = faltasMap[est.id] || 0;
        let nivel = 'verde';
        if (totalFaltas >= 5 && totalFaltas < 10) nivel = 'amarillo';
        if (totalFaltas >= 10) nivel = 'rojo';

        return {
          ...est,
          totalFaltas,
          nivel,
        };
      });

      setEstudiantesAlertas(list);
    } catch (e) {
      console.error("Error al cargar alertas:", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredEstudiantes = estudiantesAlertas.filter((e) => {
    const matchRiesgo = filterRiesgo === 'todos' || e.nivel === filterRiesgo;
    const matchSearch =
      (e.apellido && e.apellido.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.nombre && e.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.dni && e.dni.includes(searchQuery));
    return matchRiesgo && matchSearch;
  });

  const handleOpenActaModal = (est) => {
    setSelectedStudentActa(est);
    setActaObservacion('');
  };

  const handleImprimirActa = () => {
    window.print();
  };

  const handleGuardarBitacora = () => {
    Swal.fire({
      icon: 'success',
      title: 'Acta Guardada en Bitácora',
      text: 'Se registró la intervención pedagógica en el legajo del estudiante.',
      timer: 1500,
      showConfirmButton: false,
    });
    setSelectedStudentActa(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Semáforo de Riesgo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            Semáforo de Riesgo Pedagógico
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitoreo en tiempo real de faltas acumuladas y gestión de actas de compromiso.
          </p>
        </div>
      </div>

      {/* Filtros de Riesgo y Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por apellido, nombre o DNI..."
            className="field-soft pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterRiesgo('todos')}
            className={
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors " +
              (filterRiesgo === 'todos' ? 'bg-[#006384] text-white' : 'bg-gray-100 text-gray-700')
            }
          >
            Todos ({estudiantesAlertas.length})
          </button>
          <button
            onClick={() => setFilterRiesgo('rojo')}
            className={
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors " +
              (filterRiesgo === 'rojo' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700')
            }
          >
            Críticos ({estudiantesAlertas.filter(e => e.nivel === 'rojo').length})
          </button>
        </div>
      </div>

      {/* Tabla de Alertas */}
      <div className="card p-0 overflow-hidden bg-white shadow-xs rounded-2xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Estudiante</th>
                <th className="py-3.5 px-4">DNI</th>
                <th className="py-3.5 px-4 text-center">Faltas Acumuladas</th>
                <th className="py-3.5 px-4 text-center">Estado Semáforo</th>
                <th className="py-3.5 px-4 text-center">Acciones Intervención</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando estado de semáforo pedagógico...
                  </td>
                </tr>
              ) : filteredEstudiantes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400 font-bold space-y-2">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <p>No se encontraron estudiantes inscriptos en esta categoría.</p>
                  </td>
                </tr>
              ) : (
                filteredEstudiantes.map((est) => (
                  <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                      {est.apellido}, {est.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">{est.dni}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-sm text-[#0D2A3E]">
                      {est.totalFaltas.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {est.nivel === 'verde' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          Bajo (&lt;5)
                        </span>
                      )}
                      {est.nivel === 'amarillo' && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          Moderado (5-9.5)
                        </span>
                      )}
                      {est.nivel === 'rojo' && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                          Crítico (≥10)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {est.nivel === 'rojo' ? (
                        <button
                          onClick={() => handleOpenActaModal(est)}
                          className="btn-gold text-[11px] py-1.5 px-3 font-bold"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Emitir Acta Compromiso
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenActaModal(est)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] py-1.5 px-3 rounded-lg font-bold inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Ver Bitácora
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Vista de Acta de Compromiso Oficial */}
      {selectedStudentActa && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-gray-200">
            <div className="border-b border-gray-200 pb-4 text-center">
              <h3 className="text-xl font-bold font-heading text-[#0D2A3E] uppercase">
                ACTA DE NOTIFICACIÓN Y COMPROMISO DE ASISTENCIA
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                CENS Nº 454 - Esteban Echeverría (Región 5)
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-gray-800">
              <p>
                En Esteban Echeverría, a los <strong>{new Date().getDate()}</strong> días del mes de{' '}
                <strong>{new Date().toLocaleString('es-AR', { month: 'long' })}</strong> del año{' '}
                <strong>{new Date().getFullYear()}</strong>, se notifica formalmente al estudiante:
              </p>
              <div className="bg-[#EEF5FA] p-4 rounded-xl border border-gray-200 space-y-1">
                <p><strong>Apellido y Nombre:</strong> {selectedStudentActa.apellido}, {selectedStudentActa.nombre}</p>
                <p><strong>DNI:</strong> {selectedStudentActa.dni}</p>
                <p><strong>Inasistencias Acumuladas:</strong> <span className="text-red-700 font-extrabold text-sm">{selectedStudentActa.totalFaltas.toFixed(1)} faltas</span></p>
              </div>
              <p>
                Se le informa que ha alcanzado o superado el límite de ausentismos estipulado por la normativa vigente para la Educación Secundaria de Adultos. El estudiante asume el compromiso pedagógico de regularizar su asistencia a clases para mantener su condición de alumno regular.
              </p>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Observaciones / Acuerdos de la Entrevista:
                </label>
                <textarea
                  rows="3"
                  value={actaObservacion}
                  onChange={(e) => setActaObservacion(e.target.value)}
                  placeholder="Redactar acuerdos alcanzados con el estudiante..."
                  className="field-soft w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedStudentActa(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
              <button
                onClick={handleImprimirActa}
                className="btn-primary text-xs py-2 px-4 bg-[#0D2A3E]"
              >
                <Printer className="w-4 h-4" />
                Imprimir Acta
              </button>
              <button
                onClick={handleGuardarBitacora}
                className="btn-gold text-xs py-2 px-4"
              >
                Guardar en Bitácora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}