"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, User, Calendar, CheckCircle2, Clock, Award, AlertCircle, Filter } from 'lucide-react';

export default function StudentPortalPage() {
  const { user, role, cicloLectivo } = useAuth();

  const isStaff = role === 'admin' || role === 'preceptor' || role === 'profesor' || !user?.dni;

  const [cursos, setCursos] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('todos');
  const [allEstudiantes, setAllEstudiantes] = useState([]);
  const [filteredEstudiantesSelect, setFilteredEstudiantesSelect] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');

  const [estudianteInfo, setEstudianteInfo] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [asistenciaSummary, setAsistenciaSummary] = useState({ ausentes: 0, presentes: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStaff) {
      loadCursosYEstudiantes();
    } else if (user?.dni) {
      loadStudentByDni(user.dni);
    }
  }, [user, cicloLectivo]);

  async function loadCursosYEstudiantes() {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from('cursos').select('*').order('anio');
      setCursos(cData || []);

      const { data: eData } = await supabase.from('estudiantes').select('*').order('apellido');
      setAllEstudiantes(eData || []);
      setFilteredEstudiantesSelect(eData || []);

      if (eData && eData.length > 0) {
        const firstEst = eData[0];
        setSelectedEstudianteId(firstEst.id);
        await loadStudentDetails(firstEst);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  const handleCursoChange = (cursoId) => {
    setSelectedCursoId(cursoId);
    let list = allEstudiantes;
    if (cursoId !== 'todos') {
      list = allEstudiantes.filter(e => e.curso_id === cursoId);
    }
    setFilteredEstudiantesSelect(list);

    if (list.length > 0) {
      const targetEst = list[0];
      setSelectedEstudianteId(targetEst.id);
      loadStudentDetails(targetEst);
    } else {
      setSelectedEstudianteId('');
      setEstudianteInfo(null);
      setCalificaciones([]);
      setAsistenciaSummary({ ausentes: 0, presentes: 0, total: 0 });
    }
  };

  const handleEstudianteSelect = (estId) => {
    setSelectedEstudianteId(estId);
    const targetEst = allEstudiantes.find(e => e.id === estId);
    if (targetEst) {
      loadStudentDetails(targetEst);
    }
  };

  async function loadStudentByDni(dni) {
    setLoading(true);
    try {
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

      await loadStudentDetails(currentEst);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadStudentDetails(studentObj) {
    setLoading(true);
    try {
      setEstudianteInfo(studentObj);

      // 1. Calificaciones reales desde Supabase
      const { data: calData } = await supabase
        .from('calificaciones')
        .select('*, materias(nombre)')
        .eq('estudiante_id', studentObj.id);

      if (calData && calData.length > 0) {
        setCalificaciones(calData);
      } else {
        // Intentar obtener materias asignadas al curso si no hay notas guardadas aún
        let cursoId = studentObj.curso_id;
        if (!cursoId) {
          const { data: acData } = await supabase
            .from('alumnos_cursos')
            .select('curso_id')
            .eq('estudiante_id', studentObj.id)
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

      // 2. Asistencia real desde Supabase
      const { data: asisData } = await supabase
        .from('asistencias')
        .select('*')
        .eq('estudiante_id', studentObj.id);

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
      console.error("Error al cargar detalles de boletín:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Selector para Administrador / Preceptor / Docente */}
      {isStaff && (
        <div className="card p-5 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#006384]" /> 1. Filtrar por Curso / División:
            </label>
            <select
              value={selectedCursoId}
              onChange={(e) => handleCursoChange(e.target.value)}
              className="field-soft font-bold text-xs border-2 border-blue-500"
            >
              <option value="todos">-- Todos los Cursos --</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.anio}? "{c.division}" - {c.orientacion} ({c.turno})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-600" /> 2. Seleccionar Estudiante (Nómina):
            </label>
            <select
              value={selectedEstudianteId}
              onChange={(e) => handleEstudianteSelect(e.target.value)}
              className="field-soft font-bold text-xs border-2 border-emerald-500"
            >
              {filteredEstudiantesSelect.length === 0 ? (
                <option value="">-- No hay estudiantes en este curso --</option>
              ) : (
                filteredEstudiantesSelect.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.apellido}, {e.nombre} (DNI: {e.dni})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {/* Header Boletín */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0D2A3E] to-[#006384] text-white p-6 rounded-2xl shadow-md border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F5C442] text-[#0D2A3E] flex items-center justify-center font-bold text-xl font-heading shadow-md">
            {estudianteInfo?.nombre?.charAt(0) || 'E'}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">
              {estudianteInfo?.apellido ? estudianteInfo.apellido + ", " + estudianteInfo.nombre : (estudianteInfo?.nombre || 'Seleccione un estudiante')}
            </h1>
            <p className="text-xs text-[#F5C442] font-semibold">
              DNI: {estudianteInfo?.dni || '-'} | CENS Nº 454 Esteban Echeverría
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
                <th className="py-3.5 px-4 text-center">1? Cuatrimestre</th>
                <th className="py-3.5 px-4 text-center">2? Cuatrimestre</th>
                <th className="py-3.5 px-4 text-center">Calificación Final</th>
                <th className="py-3.5 px-4 text-center">Estado Cursada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando boletín del estudiante...
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
