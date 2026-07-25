"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, User, Calendar, CheckCircle2, Clock, Award, AlertCircle } from 'lucide-react';

export default function StudentPortalPage() {
  const { user, cicloLectivo } = useAuth();
  const [estudianteInfo, setEstudianteInfo] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [asistenciaSummary, setAsistenciaSummary] = useState({ ausentes: 0, presentes: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user, cicloLectivo]);

  async function loadStudentData() {
    setLoading(true);
    try {
      const dni = user?.dni;
      if (!dni) return;

      // 1. Datos del estudiante real desde Supabase
      const { data: estData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('dni', dni)
        .maybeSingle();

      const currentEst = estData || {
        id: user.id,
        dni: user.dni,
        nombre: user.nombre?.split(', ')[1] || user.nombre || 'Estudiante',
        apellido: user.nombre?.split(', ')[0] || '',
        email: user.email || '',
      };
      setEstudianteInfo(currentEst);

      // 2. Calificaciones reales desde Supabase
      const { data: calData } = await supabase
        .from('calificaciones')
        .select('*, materias(nombre)')
        .eq('estudiante_id', currentEst.id);

      if (calData && calData.length > 0) {
        setCalificaciones(calData);
      } else {
        // Intentar obtener materias asignadas al curso si no hay notas guardadas aún
        let cursoId = currentEst.curso_id;
        if (!cursoId) {
          const { data: acData } = await supabase
            .from('alumnos_cursos')
            .select('curso_id')
            .eq('estudiante_id', currentEst.id)
            .maybeSingle();
          if (acData) cursoId = acData.curso_id;
        }

        if (cursoId) {
          const { data: matData } = await supabase
            .from('materias')
            .select('*')
            .eq('curso_id', cursoId);

          if (matData && matData.length > 0) {
            setCalificaciones(
              matData.map((m) => ({
                id: m.id,
                materias: { nombre: m.nombre },
                nota_q1: null,
                nota_q2: null,
                nota_final: null,
                valoracion: null
              }))
            );
          } else {
            setCalificaciones([]);
          }
        } else {
          setCalificaciones([]);
        }
      }

      // 3. Asistencia real desde Supabase
      const { data: asisData } = await supabase
        .from('asistencias')
        .select('*')
        .eq('estudiante_id', currentEst.id);

      if (asisData && asisData.length > 0) {
        let pres = 0;
        let aus = 0;
        asisData.forEach((a) => {
          if (a.estado === 'P' || a.estado === 'presente') pres += 1;
          if (a.estado === 'A' || a.estado === 'ausente') aus += 1;
          if (a.estado === 'J' || a.estado === 'justificado') pres += 1;
        });
        setAsistenciaSummary({ presentes: pres, ausentes: aus, total: pres + aus });
      } else {
        setAsistenciaSummary({ presentes: 0, ausentes: 0, total: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Boletín */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0D2A3E] to-[#006384] text-white p-6 rounded-2xl shadow-md border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F5C442] text-[#0D2A3E] flex items-center justify-center font-bold text-xl font-heading shadow-md">
            {estudianteInfo?.nombre?.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">
              {estudianteInfo?.apellido ? estudianteInfo.apellido + ", " + estudianteInfo.nombre : estudianteInfo?.nombre}
            </h1>
            <p className="text-xs text-[#F5C442] font-semibold">
              DNI: {estudianteInfo?.dni} | CENS Nº 454 Esteban Echeverría
            </p>
          </div>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-xs font-semibold self-start sm:self-auto">
          Ciclo Lectivo {cicloLectivo}
        </div>
      </div>

      {/* Resumen Inasistencias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-5 bg-white border-l-4 border-l-emerald-500 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase">Días Presente</p>
          <h3 className="text-2xl font-extrabold font-heading text-emerald-700 mt-1">
            {asistenciaSummary.presentes} Días
          </h3>
        </div>
        <div className="card p-5 bg-white border-l-4 border-l-red-500 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase">Inasistencias Acumuladas</p>
          <h3 className="text-2xl font-extrabold font-heading text-red-600 mt-1">
            {asistenciaSummary.ausentes} Faltas
          </h3>
        </div>
        <div className="card p-5 bg-white border-l-4 border-l-[#006384] shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase">Porcentaje Presencia</p>
          <h3 className="text-2xl font-extrabold font-heading text-[#006384] mt-1">
            {asistenciaSummary.total > 0
              ? Math.round((asistenciaSummary.presentes / asistenciaSummary.total) * 100)
              : 100}
            %
          </h3>
        </div>
      </div>

      {/* Boletín de Calificaciones */}
      <div className="card overflow-hidden bg-white shadow-xs rounded-2xl border border-gray-200">
        <div className="card-header p-4 px-6 bg-[#0D2A3E] text-white flex items-center justify-between">
          <span className="font-heading text-xs font-bold tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F5C442]" />
            Boletín Digital de Calificaciones
          </span>
          <span className="text-[11px] font-bold bg-blue-900/60 text-blue-200 px-3 py-1 rounded-full border border-blue-700">
            Ciclo Lectivo {cicloLectivo}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Asignatura</th>
                <th className="py-3.5 px-4 text-center">1º Cuatrimestre</th>
                <th className="py-3.5 px-4 text-center">2º Cuatrimestre</th>
                <th className="py-3.5 px-4 text-center">Calificación Final</th>
                <th className="py-3.5 px-4 text-center">Estado Cursada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando boletín...
                  </td>
                </tr>
              ) : calificaciones.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400 font-bold space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                    <p>No se registran calificaciones cargadas para este ciclo lectivo.</p>
                    <p className="text-[11px] text-gray-400 font-normal">A medida que los profesores carguen las notas en el sistema, aparecerán en este reporte.</p>
                  </td>
                </tr>
              ) : (
                calificaciones.map((c) => {
                  const final = c.nota_final || (c.nota_q1 && c.nota_q2 ? Math.round((c.nota_q1 + c.nota_q2) / 2) : (c.nota || c.valoracion || '-'));
                  const numFinal = typeof final === 'number' ? final : parseFloat(final);
                  const aprobado = !isNaN(numFinal) ? numFinal >= 7 : (final === 'TEA');

                  return (
                    <tr key={c.id} className="hover:bg-[#F4FAFF] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                        {c.materias?.nombre || c.materia_nombre || 'Materia'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {c.nota_q1 !== null && c.nota_q1 !== undefined ? c.nota_q1 : (c.valoracion || '-')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {c.nota_q2 !== null && c.nota_q2 !== undefined ? c.nota_q2 : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-sm text-[#006384]">
                        {final}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {final !== '-' ? (
                          aprobado ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Aprobada</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Intensificación</span>
                          )
                        ) : (
                          <span className="text-gray-400 font-medium">En Cursada</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}