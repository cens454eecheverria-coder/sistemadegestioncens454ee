"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import {
  GraduationCap,
  Save,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function TeacherPortalPage() {
  const { user, role, cicloLectivo } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedMateriaId, setSelectedMateriaId] = useState('');

  const [alumnos, setAlumnos] = useState([]);
  const [notasMap, setNotasMap] = useState({}); // { [estudianteId]: { q1, q2, final, rie, julAgo, dicFeb } }
  const [actaCerrada, setActaCerrada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCursos();
  }, [cicloLectivo]);

  useEffect(() => {
    if (selectedCursoId) {
      fetchMaterias(selectedCursoId);
    }
  }, [selectedCursoId]);

  useEffect(() => {
    if (selectedCursoId && selectedMateriaId) {
      loadAlumnosYCalificaciones();
    }
  }, [selectedCursoId, selectedMateriaId]);

  async function fetchCursos() {
    try {
      const { data } = await supabase.from('cursos').select('*').order('anio');
      if (data && data.length > 0) {
        setCursos(data);
        setSelectedCursoId(data[0].id);
      } else {
        const defaultCursos = [
          { id: 'c1', anio: 1, division: 'A', orientacion: 'Ciencias Sociales', turno: 'Noche' },
          { id: 'c2', anio: 2, division: 'A', orientacion: 'Perito Mercantil', turno: 'Tarde' },
        ];
        setCursos(defaultCursos);
        setSelectedCursoId('c1');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchMaterias(cursoId) {
    try {
      const { data } = await supabase.from('materias').select('*').eq('curso_id', cursoId);
      if (data && data.length > 0) {
        setMaterias(data);
        setSelectedMateriaId(data[0].id);
      } else {
        const defaultMaterias = [
          { id: 'm1', nombre: 'Lengua y Literatura', horas_semanales: 4 },
          { id: 'm2', nombre: 'Historia Argentina y Latinoamericana', horas_semanales: 3 },
        ];
        setMaterias(defaultMaterias);
        setSelectedMateriaId('m1');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAlumnosYCalificaciones() {
    setLoading(true);
    try {
      // Cargar lista de alumnos del curso
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
      setAlumnos(listEstudiantes);

      // Cargar calificaciones existentes
      const { data: califData } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('materia_id', selectedMateriaId);

      // Cargar notas finales guardadas/sobrescritas
      const { data: finalesData } = await supabase
        .from('notas_finales')
        .select('*')
        .eq('id_curso', selectedCursoId);

      const map = {};
      listEstudiantes.forEach((e) => {
        const cal = califData?.find((c) => c.estudiante_id === e.id) || {};
        const fnC1 = finalesData?.find((f) => f.id_alumno === e.id && f.periodo === 'cuatrimestre1')?.calificacion_final;
        const fnC2 = finalesData?.find((f) => f.id_alumno === e.id && f.periodo === 'cuatrimestre2')?.calificacion_final;
        const fnAnual = finalesData?.find((f) => f.id_alumno === e.id && f.periodo === 'anual')?.calificacion_final;

        const q1Val = fnC1 || (cal.nota_q1 !== undefined && cal.nota_q1 !== null ? cal.nota_q1 : '');
        const q2Val = fnC2 || (cal.nota_q2 !== undefined && cal.nota_q2 !== null ? cal.nota_q2 : '');
        const julAgoVal = cal.cuatrimestre === 'JulAgo' ? cal.nota : '';
        const dicFebVal = cal.cuatrimestre === 'DicFeb' ? cal.nota : '';

        // Regla de cálculo según superpower specs
        let n1 = parseFloat(q1Val);
        let n2 = parseFloat(q2Val);

        if (!isNaN(parseFloat(julAgoVal)) && (!isNaN(n1) && n1 < 7)) {
          n1 = parseFloat(julAgoVal);
        }

        let calculatedFinal = '';
        if (!isNaN(n1) && !isNaN(n2)) {
          calculatedFinal = ((n1 + n2) / 2).toFixed(1);
        } else if (!isNaN(n1)) {
          calculatedFinal = n1.toFixed(1);
        } else if (!isNaN(n2)) {
          calculatedFinal = n2.toFixed(1);
        }

        if (!isNaN(parseFloat(dicFebVal))) {
          calculatedFinal = parseFloat(dicFebVal).toFixed(1);
        }

        const finalDisplay = fnAnual || calculatedFinal || (cal.nota_final !== undefined && cal.nota_final !== null ? cal.nota_final : '');

        map[e.id] = {
          q1: q1Val,
          q2: q2Val,
          julAgo: julAgoVal,
          dicFeb: dicFebVal,
          final: finalDisplay,
        };
      });

      setNotasMap(map);
      setActaCerrada(califData?.[0]?.cerrado || false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleNotaChange = (estudianteId, campo, valor) => {
    setNotasMap((prev) => {
      const copy = { ...prev[estudianteId], [campo]: valor };

      // Recalcular final dinámicamente si cambian q1 o q2
      let n1 = parseFloat(copy.q1);
      let n2 = parseFloat(copy.q2);

      if (!isNaN(parseFloat(copy.julAgo)) && (!isNaN(n1) && n1 < 7)) {
        n1 = parseFloat(copy.julAgo);
      }

      let calc = '';
      if (!isNaN(n1) && !isNaN(n2)) {
        calc = Math.round((n1 + n2) / 2).toString();
      } else if (!isNaN(n1)) {
        calc = n1.toString();
      } else if (!isNaN(n2)) {
        calc = n2.toString();
      }

      if (!isNaN(parseFloat(copy.dicFeb))) {
        calc = copy.dicFeb.toString();
      }

      if (campo !== 'final') {
        copy.final = calc;
      }

      return {
        ...prev,
        [estudianteId]: copy,
      };
    });
  };

  const handleGuardarNotas = async () => {
    if (actaCerrada && role !== 'admin') {
      Swal.fire({
        icon: 'warning',
        title: 'Acta Bloqueada',
        text: 'El período de calificaciones fue cerrado por el Equipo Directivo.',
      });
      return;
    }

    setSaving(true);
    try {
      const recordsCalif = [];
      const recordsFinales = [];

      alumnos.forEach((a) => {
        const data = notasMap[a.id] || {};
        recordsCalif.push({
          estudiante_id: a.id,
          materia_id: selectedMateriaId,
          nota_q1: data.q1 !== '' ? parseFloat(data.q1) : null,
          nota_q2: data.q2 !== '' ? parseFloat(data.q2) : null,
          nota_final: data.final !== '' ? parseFloat(data.final) : null,
          cerrado: actaCerrada,
        });

        if (data.q1 !== '') {
          recordsFinales.push({
            id_curso: selectedCursoId,
            id_alumno: a.id,
            periodo: 'cuatrimestre1',
            calificacion_final: String(data.q1),
          });
        }
        if (data.q2 !== '') {
          recordsFinales.push({
            id_curso: selectedCursoId,
            id_alumno: a.id,
            periodo: 'cuatrimestre2',
            calificacion_final: String(data.q2),
          });
        }
        if (data.final !== '') {
          recordsFinales.push({
            id_curso: selectedCursoId,
            id_alumno: a.id,
            periodo: 'anual',
            calificacion_final: String(data.final),
          });
        }
      });

      if (recordsCalif.length > 0) {
        await supabase
          .from('calificaciones')
          .upsert(recordsCalif, { onConflict: 'estudiante_id,materia_id' });
      }

      if (recordsFinales.length > 0) {
        await supabase
          .from('notas_finales')
          .upsert(recordsFinales, { onConflict: 'id_curso,id_alumno,periodo' });
      }

      Swal.fire({
        icon: 'success',
        title: 'Calificaciones Guardadas',
        text: 'Las notas y actas fueron registradas en el sistema.',
        timer: 1500,
        showConfirmButton: false,
      });

      await loadAlumnosYCalificaciones();
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error al Guardar',
        text: e.message || 'Ocurrió un error al guardar.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleBloqueoActa = async () => {
    if (role !== 'admin') return;
    const nuevoEstado = !actaCerrada;
    setActaCerrada(nuevoEstado);

    try {
      await supabase
        .from('calificaciones')
        .update({ cerrado: nuevoEstado })
        .eq('materia_id', selectedMateriaId);

      Swal.fire({
        icon: 'info',
        title: nuevoEstado ? 'Acta Bloqueada' : 'Acta Desbloqueada',
        text: nuevoEstado
          ? 'Los docentes ya no pueden modificar calificaciones.'
          : 'Se habilitó la edición de notas.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Portal Docente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#006384]" />
            Portal Docente - Carga de Calificaciones
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestión de notas cuatrimestrales, intensificaciones y actas finales CENS 454
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={toggleBloqueoActa}
            className={`text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors ${
              actaCerrada
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
            }`}
          >
            {actaCerrada ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {actaCerrada ? 'Acta Bloqueada (Hacer clic para desbloquear)' : 'Acta Abierta (Bloquear Acta)'}
          </button>
        )}
      </div>

      {/* Selector de Curso y Materia */}
      <div className="card p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Curso / Orientación:
            </label>
            <select
              value={selectedCursoId}
              onChange={(e) => setSelectedCursoId(e.target.value)}
              className="field-soft font-semibold text-sm"
            >
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.anio}° {c.division} - {c.orientacion} ({c.turno})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Asignatura / Espacio Curricular:
            </label>
            <select
              value={selectedMateriaId}
              onChange={(e) => setSelectedMateriaId(e.target.value)}
              className="field-soft font-semibold text-sm"
            >
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.horas_semanales} hs)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Calificaciones */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <span className="font-heading text-sm">
            Acta de Calificaciones ({alumnos.length} estudiantes)
          </span>
          <button
            onClick={handleGuardarNotas}
            disabled={saving || (actaCerrada && role !== 'admin')}
            className="btn-gold text-xs py-1.5 px-4 font-bold"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Calificaciones Finales'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4 text-center">1° Cuatrimestre (Q1)</th>
                <th className="py-3 px-4 text-center">2° Cuatrimestre (Q2)</th>
                <th className="py-3 px-4 text-center">Intensif. Jul/Ago</th>
                <th className="py-3 px-4 text-center">Intensif. Dic/Feb</th>
                <th className="py-3 px-4 text-center">Nota Final Anual</th>
                <th className="py-3 px-4 text-center">Estado Académico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando acta de notas...
                  </td>
                </tr>
              ) : alumnos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 font-semibold">
                    No hay alumnos inscriptos en este curso.
                  </td>
                </tr>
              ) : (
                alumnos.map((a) => {
                  const n = notasMap[a.id] || { q1: '', q2: '', julAgo: '', dicFeb: '', final: '' };
                  const finalVal = parseFloat(n.final);
                  const aprobado = !isNaN(finalVal) && finalVal >= 7;

                  return (
                    <tr key={a.id} className="hover:bg-[#F4FAFF] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0D2A3E]">
                        {a.apellido}, {a.nombre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={n.q1}
                          disabled={actaCerrada && role !== 'admin'}
                          onChange={(e) => handleNotaChange(a.id, 'q1', e.target.value)}
                          className="w-14 text-center font-bold field-soft py-1 text-xs"
                          placeholder="1-10"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={n.q2}
                          disabled={actaCerrada && role !== 'admin'}
                          onChange={(e) => handleNotaChange(a.id, 'q2', e.target.value)}
                          className="w-14 text-center font-bold field-soft py-1 text-xs"
                          placeholder="1-10"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={n.julAgo}
                          disabled={actaCerrada && role !== 'admin'}
                          onChange={(e) => handleNotaChange(a.id, 'julAgo', e.target.value)}
                          className="w-14 text-center font-bold field-soft py-1 text-xs text-amber-700 bg-amber-50"
                          placeholder="Jul/Ago"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={n.dicFeb}
                          disabled={actaCerrada && role !== 'admin'}
                          onChange={(e) => handleNotaChange(a.id, 'dicFeb', e.target.value)}
                          className="w-14 text-center font-bold field-soft py-1 text-xs text-purple-700 bg-purple-50"
                          placeholder="Dic/Feb"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="text"
                          value={n.final}
                          disabled={actaCerrada && role !== 'admin'}
                          onChange={(e) => handleNotaChange(a.id, 'final', e.target.value)}
                          className="w-16 text-center font-extrabold text-sm field-soft py-1 bg-[#EEF5FA] text-[#006384] border-[#006384]"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {n.final !== '' ? (
                          aprobado ? (
                            <span className="badge-final badge-final-aprobado">Aprobado</span>
                          ) : (
                            <span className="badge-final badge-final-recupera">A Intensificación</span>
                          )
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
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
