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
  UserCheck
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
      // 1. Obtener lista de estudiantes activos
      const { data: estData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('estado', 'activo');

      // 2. Obtener asistencias
      const { data: asisData } = await supabase
        .from('asistencias')
        .select('*');

      const faltasMap = {};
      if (asisData) {
        asisData.forEach((a) => {
          if (!faltasMap[a.estudiante_id]) faltasMap[a.estudiante_id] = 0;
          if (a.estado === 'ausente') faltasMap[a.estudiante_id] += 1;
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

      // Si no hay datos en DB aún, generar lista demo
      if (list.length === 0) {
        list = [
          { id: 'e1', dni: '38492011', apellido: 'García', nombre: 'Carlos Eduardo', totalFaltas: 12.5, nivel: 'rojo' },
          { id: 'e2', dni: '40123984', apellido: 'Rodríguez', nombre: 'María Belén', totalFaltas: 7.0, nivel: 'amarillo' },
          { id: 'e3', dni: '35881920', apellido: 'López', nombre: 'Juan Ignacio', totalFaltas: 2.0, nivel: 'verde' },
          { id: 'e4', dni: '42901823', apellido: 'Fernández', nombre: 'Sofía Lucía', totalFaltas: 10.0, nivel: 'rojo' },
        ];
      }

      setEstudiantesAlertas(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredEstudiantes = estudiantesAlertas.filter((e) => {
    const matchRiesgo = filterRiesgo === 'todos' || e.nivel === filterRiesgo;
    const matchSearch =
      e.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.dni.includes(searchQuery);
    return matchRiesgo && matchSearch;
  });

  const handleOpenActaModal = (est) => {
    setSelectedStudentActa(est);
    setActaObservacion('');
  };

  const handleImprimirActa = () => {
    window.print();
  };

  const handleGuardarBitacora = async () => {
    if (!actaObservacion.trim() || !selectedStudentActa) return;

    try {
      const { error } = await supabase.from('bitacora_observaciones').insert({
        estudiante_id: selectedStudentActa.id,
        detalle: actaObservacion,
        responsable: 'Equipo Preceptoría / Directivo',
        tipo: 'Acta de Compromiso',
      });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Intervención Registrada',
        text: 'Se guardó la observación en la bitácora del estudiante.',
        timer: 1500,
        showConfirmButton: false,
      });

      setSelectedStudentActa(null);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message,
      });
    }
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Header Alertas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Semáforo de Riesgo Pedagógico y Ausentismo
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitoreo preventivo de inasistencias e intervenciones institucionales - CENS 454
          </p>
        </div>
      </div>

      {/* Tarjetas resumen del semáforo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
        <div
          onClick={() => setFilterRiesgo('verde')}
          className={`card p-5 cursor-pointer border-l-4 border-l-emerald-500 transition-all ${
            filterRiesgo === 'verde' ? 'ring-2 ring-emerald-500 shadow-md' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase">Riesgo Bajo (Verde)</p>
              <h3 className="text-2xl font-extrabold font-heading text-emerald-900 mt-1">
                {estudiantesAlertas.filter((e) => e.nivel === 'verde').length} Alumnos
              </h3>
              <p className="text-xs text-gray-500 mt-1">Menos de 5 inasistencias</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              🟢
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterRiesgo('amarillo')}
          className={`card p-5 cursor-pointer border-l-4 border-l-amber-500 transition-all ${
            filterRiesgo === 'amarillo' ? 'ring-2 ring-amber-500 shadow-md' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase">Riesgo Moderado (Amarillo)</p>
              <h3 className="text-2xl font-extrabold font-heading text-amber-900 mt-1">
                {estudiantesAlertas.filter((e) => e.nivel === 'amarillo').length} Alumnos
              </h3>
              <p className="text-xs text-gray-500 mt-1">Entre 5 y 9.5 inasistencias</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              🟡
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterRiesgo('rojo')}
          className={`card p-5 cursor-pointer border-l-4 border-l-red-500 transition-all ${
            filterRiesgo === 'rojo' ? 'ring-2 ring-red-500 shadow-md' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-red-800 uppercase">Riesgo Crítico (Rojo)</p>
              <h3 className="text-2xl font-extrabold font-heading text-red-900 mt-1">
                {estudiantesAlertas.filter((e) => e.nivel === 'rojo').length} Alumnos
              </h3>
              <p className="text-xs text-gray-500 mt-1">10 o más inasistencias</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg pulse-glow-red">
              🔴
            </div>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="card p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative w-full sm:w-80">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterRiesgo === 'todos' ? 'bg-[#006384] text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todos ({estudiantesAlertas.length})
          </button>
        </div>
      </div>

      {/* Tabla de Alertas */}
      <div className="card overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4 text-center">Faltas Acumuladas</th>
                <th className="py-3 px-4 text-center">Estado Semáforo</th>
                <th className="py-3 px-4 text-center">Acciones Intervención</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando estado de semáforo pedagógico...
                  </td>
                </tr>
              ) : filteredEstudiantes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    No se encontraron estudiantes en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredEstudiantes.map((est) => (
                  <tr key={est.id} className="hover:bg-[#F4FAFF] transition-colors">
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
                          🟢 Bajo (&lt;5)
                        </span>
                      )}
                      {est.nivel === 'amarillo' && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          🟡 Moderado (5-9.5)
                        </span>
                      )}
                      {est.nivel === 'rojo' && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px] pulse-glow-red">
                          🔴 Crítico (≥10)
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
                          className="btn-primary text-[11px] py-1.5 px-3 bg-gray-600 hover:bg-gray-700"
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
                CENS N° 454 - Esteban Echeverría (Región 5)
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
