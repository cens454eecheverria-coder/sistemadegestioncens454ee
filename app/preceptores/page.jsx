"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { generateAnexo4Docx } from '@/lib/generateAnexoDocx';
import Swal from 'sweetalert2';
import {
  ClipboardCheck,
  Calendar,
  Filter,
  Save,
  Printer,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck
} from 'lucide-react';

export default function PreceptoresPanelPage() {
  const { cicloLectivo } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistenciasMap, setAsistenciasMap] = useState({});
  const [asistenciasAcumuladas, setAsistenciasAcumuladas] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCursos();
  }, [cicloLectivo]);

  useEffect(() => {
    if (selectedCursoId) {
      loadCursoEstudiantesYAsistencia();
    }
  }, [selectedCursoId, fecha]);

  async function fetchCursos() {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('anio', { ascending: true });

      if (data && data.length > 0) {
        setCursos(data);
        setSelectedCursoId(data[0].id);
      } else {
        // Cursos por defecto CENS 454
        const defaultCursos = [
          { id: 'c1', anio: 1, division: 'A', orientacion: 'Ciencias Sociales', turno: 'Noche' },
          { id: 'c2', anio: 2, division: 'A', orientacion: 'Perito Mercantil', turno: 'Tarde' },
          { id: 'c3', anio: 3, division: 'A', orientacion: 'Ciencias Naturales', turno: 'Mañana' },
        ];
        setCursos(defaultCursos);
        setSelectedCursoId('c1');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadCursoEstudiantesYAsistencia() {
    setLoading(true);
    try {
      // Cargar estudiantes inscriptos en el curso seleccionado
      const { data: estData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('estado', 'activo')
        .order('apellido');

      let listEstudiantes = estData || [];
      if (listEstudiantes.length === 0) {
        listEstudiantes = [
          { id: 'e1', dni: '38492011', apellido: 'García', nombre: 'Carlos Eduardo' },
          { id: 'e2', dni: '40123984', apellido: 'Rodríguez', nombre: 'María Belén' },
          { id: 'e3', dni: '35881920', apellido: 'López', nombre: 'Juan Ignacio' },
          { id: 'e4', dni: '42901823', apellido: 'Fernández', nombre: 'Sofía Lucía' },
        ];
      }
      setEstudiantes(listEstudiantes);

      // Cargar asistencias registradas para la fecha seleccionada
      const { data: asisFecha } = await supabase
        .from('asistencias')
        .select('*')
        .eq('curso_id', selectedCursoId)
        .eq('fecha', fecha);

      const mapFecha = {};
      if (asisFecha) {
        asisFecha.forEach((item) => {
          mapFecha[item.estudiante_id] = item.estado;
        });
      }
      setAsistenciasMap(mapFecha);

      // Cargar asistencias acumuladas en todo el ciclo lectivo
      const { data: asisAcum } = await supabase
        .from('asistencias')
        .select('*')
        .eq('curso_id', selectedCursoId);

      const stats = {};
      if (asisAcum) {
        asisAcum.forEach((a) => {
          if (!stats[a.estudiante_id]) {
            stats[a.estudiante_id] = { presentes: 0, ausentes: 0, justificados: 0, mediasFaltas: 0, totalComputable: 0 };
          }
          if (a.estado === 'presente') stats[a.estudiante_id].presentes += 1;
          if (a.estado === 'ausente') {
            stats[a.estudiante_id].ausentes += 1;
            stats[a.estudiante_id].totalComputable += 1;
          }
          if (a.estado === 'justificado') stats[a.estudiante_id].justificados += 1;
          if (a.estado === 'media_falta') {
            stats[a.estudiante_id].mediasFaltas += 1;
            stats[a.estudiante_id].totalComputable += 0.5;
          }
        });
      }
      setAsistenciasAcumuladas(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleEstadoChange = (estudianteId, nuevoEstado) => {
    setAsistenciasMap((prev) => ({
      ...prev,
      [estudianteId]: nuevoEstado,
    }));
  };

  const handleMarcarTodos = (estado) => {
    const newMap = {};
    estudiantes.forEach((e) => {
      newMap[e.id] = estado;
    });
    setAsistenciasMap(newMap);
  };

  const handleGuardarAsistencias = async () => {
    setSaving(true);
    try {
      const records = estudiantes.map((e) => ({
        estudiante_id: e.id,
        curso_id: selectedCursoId,
        fecha: fecha,
        estado: asistenciasMap[e.id] || 'presente',
      }));

      const { error } = await supabase
        .from('asistencias')
        .upsert(records, { onConflict: 'estudiante_id,curso_id,fecha' });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Asistencia Guardada',
        text: `Se registraron las asistencias del día ${fecha} correctamente.`,
        timer: 1500,
        showConfirmButton: false,
      });

      await loadCursoEstudiantesYAsistencia();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al Guardar',
        text: err.message || 'No se pudieron guardar los datos.',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCursoObj = cursos.find((c) => c.id === selectedCursoId) || {};

  const handleExportAnexo4 = () => {
    generateAnexo4Docx({
      curso: selectedCursoObj,
      mes: new Date(fecha).toLocaleString('es-AR', { month: 'long' }),
      anio: cicloLectivo,
      alumnos: estudiantes,
      asistenciasResumen: asistenciasAcumuladas,
    });
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Header Panel Preceptores (Oculto en impresión) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#006384]" />
            Panel de Preceptores - Toma de Asistencia Diaria
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registro oficial y planilla consolidada CENS 454 (Esteban Echeverría)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-primary text-xs py-2 px-3 bg-[#0D2A3E]"
          >
            <Printer className="w-4 h-4" />
            Imprimir Planilla A4
          </button>
          <button
            onClick={handleExportAnexo4}
            className="btn-gold text-xs py-2 px-3"
          >
            <Download className="w-4 h-4" />
            Exportar Anexo 4 DOCX
          </button>
        </div>
      </div>

      {/* Filtros de Curso y Fecha (Oculto en impresión) */}
      <div className="card p-5 bg-white space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Seleccionar Curso / Orientación:
            </label>
            <select
              value={selectedCursoId}
              onChange={(e) => setSelectedCursoId(e.target.value)}
              className="field-soft font-semibold text-sm"
            >
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.anio}° {c.division} - {c.orientacion} (Turno {c.turno})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Fecha de Asistencia:
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="field-soft font-semibold text-sm"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => handleMarcarTodos('presente')}
              className="btn-primary text-xs py-2 px-3 flex-1 bg-emerald-700 hover:bg-emerald-800"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Todos Presentes
            </button>
          </div>
        </div>
      </div>

      {/* Encabezado Oficial A4 visible al imprimir */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <h2 className="text-xl font-bold uppercase">CENS N° 454 - ESTEBAN ECHEVERRÍA</h2>
        <p className="text-sm font-semibold">PLANILLA OFICIAL DE ASISTENCIA DIARIA - ANEXO 4</p>
        <p className="text-xs">
          Curso: {selectedCursoObj.anio}° {selectedCursoObj.division} - {selectedCursoObj.orientacion} | Turno: {selectedCursoObj.turno} | Fecha: {fecha}
        </p>
      </div>

      {/* Tabla de Alumnos y Asistencia */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between print:hidden">
          <span className="font-heading text-sm">
            Nómina de Estudiantes ({estudiantes.length} inscriptos)
          </span>
          <button
            onClick={handleGuardarAsistencias}
            disabled={saving}
            className="btn-primary text-xs py-1.5 px-4 font-bold"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Asistencia del Día'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4 text-center">Estado Día ({fecha})</th>
                <th className="py-3 px-4 text-center">Inasistencias Acumuladas</th>
                <th className="py-3 px-4 text-center print:hidden">Semáforo Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando nómina de asistencia...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                    No hay estudiantes registrados en este curso.
                  </td>
                </tr>
              ) : (
                estudiantes.map((e, idx) => {
                  const estadoActual = asistenciasMap[e.id] || 'presente';
                  const stat = asistenciasAcumuladas[e.id] || { totalComputable: 0 };
                  const totalFaltas = stat.totalComputable;

                  let semaforoBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      🟢 Bajo (&lt;5)
                    </span>
                  );
                  if (totalFaltas >= 5 && totalFaltas < 10) {
                    semaforoBadge = (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        🟡 Moderado (5-9.5)
                      </span>
                    );
                  } else if (totalFaltas >= 10) {
                    semaforoBadge = (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[10px] pulse-glow-red">
                        🔴 Crítico (≥10)
                      </span>
                    );
                  }

                  return (
                    <tr key={e.id} className="hover:bg-[#F4FAFF] transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-[#0D2A3E]">
                        {e.apellido}, {e.nombre}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">{e.dni}</td>

                      {/* Selector de Estado */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleEstadoChange(e.id, 'presente')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              estadoActual === 'presente'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEstadoChange(e.id, 'ausente')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              estadoActual === 'ausente'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Ausente (1)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEstadoChange(e.id, 'justificado')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              estadoActual === 'justificado'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Justificado
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEstadoChange(e.id, 'media_falta')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                              estadoActual === 'media_falta'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            0.5 Falta
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-sm text-[#0D2A3E]">
                        {totalFaltas.toFixed(1)} faltas
                      </td>

                      <td className="py-3 px-4 text-center print:hidden">
                        {semaforoBadge}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firma al Imprimir A4 */}
      <div className="hidden print:flex justify-between pt-12 text-xs font-bold text-center">
        <div>
          <p>_____________________________________</p>
          <p className="mt-1">Firma y Aclaración Preceptor/a</p>
        </div>
        <div>
          <p>_____________________________________</p>
          <p className="mt-1">Firma y Sello Equipo Directivo</p>
        </div>
      </div>
    </div>
  );
}
