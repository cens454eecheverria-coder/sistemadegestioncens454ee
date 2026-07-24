"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getMateriasForCurso, FORMACION_ORIENTADA } from '@/lib/curriculumCens';
import Swal from 'sweetalert2';
import {
  BookOpen,
  Plus,
  Users,
  Lock,
  Unlock,
  Layers,
  Clock,
  Zap,
  ShieldAlert,
  Trash2,
  Edit,
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  ArrowRight
} from 'lucide-react';

export default function CourseManagerPage() {
  const { role, cicloLectivo, changeCicloLectivo } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [materiasCurso, setMateriasCurso] = useState([]);
  const [vinculacionesMap, setVinculacionesMap] = useState({});

  // Formulario Nuevo Curso (Captura 1)
  const [newAnio, setNewAnio] = useState('1');
  const [newDivision, setNewDivision] = useState('');
  const [newOrientacion, setNewOrientacion] = useState('Ciencias Sociales');
  const [newTurno, setNewTurno] = useState('Noche');
  const [newCiclo, setNewCiclo] = useState('2026');
  const [newPreceptor, setNewPreceptor] = useState('');
  const [newReplicarId, setNewReplicarId] = useState('');
  const [creating, setCreating] = useState(false);

  // Sub-tabs o secciones
  const [activeTab, setActiveTab] = useState('cursos'); // cursos, ciclos, migrar

  // Ciclos Lectivos (Captura 2)
  const [ciclosList, setCiclosList] = useState([
    { id: 1, anio: 2026, estado: 'ACTIVO', inicio: '01 de marzo de 2026', fin: 'En curso' },
    { id: 2, anio: 2025, estado: 'CERRADO', inicio: '01 de marzo de 2025', fin: '20 de diciembre de 2025' },
    { id: 3, anio: 2024, estado: 'CERRADO', inicio: '01 de marzo de 2024', fin: '20 de diciembre de 2024' },
  ]);

  // System Settings / Bloqueo Global de Notas
  const [gradesLocked, setGradesLocked] = useState(false);

  useEffect(() => {
    loadCursosYDocentes();
    loadSystemSettings();
  }, [cicloLectivo]);

  async function loadCursosYDocentes() {
    try {
      const { data: cData } = await supabase.from('cursos').select('*').order('anio');
      setCursos(cData || []);

      const { data: dData } = await supabase.from('docentes').select('*').order('apellido');
      setDocentes(dData || []);

      if (cData && cData.length > 0) {
        selectCurso(cData[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSystemSettings() {
    try {
      const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (data) {
        setGradesLocked(data.grades_locked);
      }
    } catch (e) {
      console.warn('System settings usará valor por defecto');
    }
  }

  const selectCurso = async (curso) => {
    setSelectedCurso(curso);
    try {
      const { data: mData } = await supabase
        .from('materias')
        .select('*')
        .eq('curso_id', curso.id);

      setMateriasCurso(mData || []);

      const { data: dmData } = await supabase.from('docente_materia').select('*');
      const vMap = {};
      if (dmData) {
        dmData.forEach((dm) => {
          vMap[dm.materia_id] = dm.docente_id;
        });
      }
      setVinculacionesMap(vMap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCrearCurso = async (e) => {
    e.preventDefault();
    if (!newDivision.trim()) {
      Swal.fire('Error', 'Ingrese una denominación para la división (letras o números).', 'error');
      return;
    }

    setCreating(true);
    try {
      // 1. Insertar Curso
      const { data: cursoData, error: cursoErr } = await supabase
        .from('cursos')
        .insert({
          anio: parseInt(newAnio),
          division: newDivision.trim(),
          orientacion: newOrientacion,
          turno: newTurno,
          nombre_materia: `${newAnio}° "${newDivision.trim()}" - ${newOrientacion} (${newTurno})`,
        })
        .select()
        .single();

      if (cursoErr) throw cursoErr;

      // 2. Si se seleccionó replicar estructura desde un curso existente:
      let materiasToInsert = [];
      if (newReplicarId) {
        const { data: origMaterias } = await supabase
          .from('materias')
          .select('*')
          .eq('curso_id', newReplicarId);

        if (origMaterias && origMaterias.length > 0) {
          materiasToInsert = origMaterias.map((m) => ({
            nombre: m.nombre,
            curso_id: cursoData.id,
            horas_semanales: m.horas_semanales || 2,
          }));
        }
      }

      // Si no se replicó o estaba vacío, generar las materias oficiales Res. 2993/22
      if (materiasToInsert.length === 0) {
        const curriculum = getMateriasForCurso(newAnio, newOrientacion);
        materiasToInsert = curriculum.todas.map((m) => ({
          nombre: m.nombre,
          curso_id: cursoData.id,
          horas_semanales: 2,
        }));
      }

      const { error: matErr } = await supabase.from('materias').insert(materiasToInsert);
      if (matErr && matErr.message?.includes('row-level security')) {
        setMateriasCurso(materiasToInsert.map((m, idx) => ({ ...m, id: `local_${idx}` })));
      }

      Swal.fire({
        icon: 'success',
        title: 'Curso Agregado',
        text: `Se creó el curso ${newAnio}° "${newDivision.trim()}" con ${materiasToInsert.length} materias.`,
      });

      setNewDivision('');
      setNewReplicarId('');
      await loadCursosYDocentes();
      if (cursoData) selectCurso(cursoData);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Creación',
        text: err.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEliminarCurso = async (cursoId, nombreCurso) => {
    if (role !== 'admin') {
      Swal.fire('Acceso Denegado', 'Solo el Equipo Directivo puede eliminar cursos.', 'warning');
      return;
    }

    Swal.fire({
      title: `¿Eliminar ${nombreCurso}?`,
      text: 'Esta acción eliminará el curso y todas sus asignaturas registradas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, Eliminar Curso',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await supabase.from('materias').delete().eq('curso_id', cursoId);
          const { error } = await supabase.from('cursos').delete().eq('id', cursoId);
          if (error) throw error;

          Swal.fire('Curso Eliminado', 'El curso fue eliminado de la estructura institucional.', 'success');
          await loadCursosYDocentes();
        } catch (e) {
          Swal.fire('Error', e.message, 'error');
        }
      }
    });
  };

  const handleGenerarMateriasParaCursoExistente = async () => {
    if (!selectedCurso) return;
    try {
      const curriculum = getMateriasForCurso(selectedCurso.anio, selectedCurso.orientacion);
      const materiasToInsert = curriculum.todas.map((m) => ({
        nombre: m.nombre,
        curso_id: selectedCurso.id,
        horas_semanales: 2,
      }));

      const { error } = await supabase.from('materias').insert(materiasToInsert);
      if (error && error.message?.includes('row-level security')) {
        setMateriasCurso(materiasToInsert.map((m, idx) => ({ ...m, id: `temp_${idx}` })));
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Materias Generadas',
        text: `Se crearon ${materiasToInsert.length} asignaturas oficiales.`,
      });

      await selectCurso(selectedCurso);
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleVincularDocenteMateria = async (materiaId, docenteId) => {
    try {
      await supabase.from('docente_materia').delete().eq('materia_id', materiaId);

      if (docenteId) {
        await supabase.from('docente_materia').insert({
          materia_id: materiaId,
          docente_id: docenteId,
          cargo: 'titular',
        });
      }

      setVinculacionesMap((prev) => ({ ...prev, [materiaId]: docenteId }));

      Swal.fire({
        icon: 'success',
        title: 'Docente Vinculado',
        text: 'Se asignó el profesor a la asignatura.',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const toggleBloqueoGlobalNotas = async () => {
    if (role !== 'admin') {
      Swal.fire('Acceso Restringido', 'Sólo el Equipo Directivo puede modificar el bloqueo global.', 'warning');
      return;
    }
    const nuevoEstado = !gradesLocked;
    setGradesLocked(nuevoEstado);

    try {
      await supabase.from('system_settings').upsert({ id: 1, grades_locked: nuevoEstado });
      Swal.fire({
        icon: 'info',
        title: nuevoEstado ? 'Bloqueo Global Activado' : 'Edición Habilitada',
        text: nuevoEstado ? 'Notas bloqueadas globalmente.' : 'Notas abiertas para edición.',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEstadoCiclo = (cicloId) => {
    setCiclosList((prev) =>
      prev.map((c) =>
        c.id === cicloId
          ? { ...c, estado: c.estado === 'ACTIVO' ? 'CERRADO' : 'ACTIVO', fin: c.estado === 'ACTIVO' ? new Date().toLocaleDateString('es-AR') : 'En curso' }
          : c
      )
    );
  };

  const handleNuevoCicloModal = () => {
    Swal.fire({
      title: 'Crear Nuevo Ciclo Lectivo',
      input: 'number',
      inputLabel: 'Año Lectivo (Ej: 2027)',
      inputValue: 2027,
      showCancelButton: true,
      confirmButtonText: 'Crear Ciclo',
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const nAnio = parseInt(res.value);
        setCiclosList((prev) => [
          { id: Date.now(), anio: nAnio, estado: 'ACTIVO', inicio: `01 de marzo de ${nAnio}`, fin: 'En curso' },
          ...prev,
        ]);
        changeCicloLectivo(nAnio.toString());
        Swal.fire('Ciclo Lectivo Creado', `Se dio de alta el Ciclo Lectivo ${nAnio}.`, 'success');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Restricción si no es Admin */}
      {role !== 'admin' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Vista de Lectura / Preceptoría: La edición de cursos y ciclos está reservada al <strong>Equipo Directivo (Administrador)</strong>.
          </span>
        </div>
      )}

      {/* Header Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#006384]" />
            Cursos, Orientaciones y Configuraciones
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Estructura curricular CENS 454 según Res. 2993/22 y rectificativa 3463/22 DGCyE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleBloqueoGlobalNotas}
            className={`text-xs font-bold py-2.5 px-4 rounded-full flex items-center gap-2 border transition-colors ${
              gradesLocked
                ? 'bg-red-100 text-red-800 border-red-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            {gradesLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {gradesLocked ? 'Notas Bloqueadas Globalmente' : 'Notas Abiertas'}
          </button>
        </div>
      </div>

      {/* Selector de Sub-Pestañas */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('cursos')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'cursos' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          Estructura de Cursos y Divisiones
        </button>
        <button
          onClick={() => setActiveTab('ciclos')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'ciclos' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Ciclos Lectivos
        </button>
        <button
          onClick={() => setActiveTab('migrar')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'migrar' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Users className="w-4 h-4" />
          Migración y Promoción Masiva
        </button>
      </div>

      {/* ------------------- VISTA 1: CURSOS EXISTENTES Y NUEVO CURSO (Captura 1) ------------------- */}
      {activeTab === 'cursos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PANEL IZQUIERDO: NUEVO CURSO (Captura 1) */}
          <form onSubmit={handleCrearCurso} className="card p-6 bg-white space-y-4 shadow-xs">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b border-gray-200 pb-3">
              <BookOpen className="w-5 h-5 text-[#006384]" />
              Nuevo Curso
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Año *</label>
              <select
                value={newAnio}
                onChange={(e) => setNewAnio(e.target.value)}
                className="field-soft text-xs font-bold"
              >
                <option value="1">1ro</option>
                <option value="2">2do</option>
                <option value="3">3ro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">División * (Lección/Número Libre)</label>
              <input
                type="text"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                placeholder="Ej. A, B, Única, 1..."
                className="field-soft text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Orientación Oficial</label>
              <select
                value={newOrientacion}
                onChange={(e) => setNewOrientacion(e.target.value)}
                className="field-soft text-xs font-semibold"
              >
                {Object.keys(FORMACION_ORIENTADA).map((or) => (
                  <option key={or} value={or}>
                    {or}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Turno</label>
              <select
                value={newTurno}
                onChange={(e) => setNewTurno(e.target.value)}
                className="field-soft text-xs font-semibold"
              >
                <option value="Noche">Noche</option>
                <option value="Tarde">Tarde</option>
                <option value="Mañana">Mañana</option>
                <option value="Víspera">Víspera</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ciclo Lectivo</label>
              <input
                type="text"
                value={newCiclo}
                onChange={(e) => setNewCiclo(e.target.value)}
                className="field-soft text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preceptor <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={newPreceptor}
                onChange={(e) => setNewPreceptor(e.target.value)}
                placeholder="Nombre del preceptor/a asignado"
                className="field-soft text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Replicar estructura desde <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <select
                value={newReplicarId}
                onChange={(e) => setNewReplicarId(e.target.value)}
                className="field-soft text-xs"
              >
                <option value="">No replicar (curso vacío con materias DGCyE)</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    Replicar desde {c.anio}° "{c.division}" ({c.orientacion})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Copia materias, profesores y estructura (sin alumnos ni notas).
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full btn-primary font-bold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 bg-[#006384]"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creando...' : 'Agregar Curso'}
            </button>
          </form>

          {/* PANEL DERECHO: CURSOS EXISTENTES TABLA Y ELIMINAR (Captura 1) */}
          <div className="lg:col-span-2 card p-6 bg-white space-y-4">
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">
                Cursos Existentes ({cursos.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b">
                  <tr>
                    <th className="py-3 px-4">CICLO</th>
                    <th className="py-3 px-4">AÑO</th>
                    <th className="py-3 px-4">DIVISIÓN</th>
                    <th className="py-3 px-4">ORIENTACIÓN / TURNO</th>
                    <th className="py-3 px-4 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {cursos.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F4FAFF]">
                      <td className="py-3.5 px-4 font-bold text-[#006384]">2026</td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0D2A3E]">{c.anio}ro</td>
                      <td className="py-3.5 px-4 font-bold">{c.division}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div>{c.orientacion}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">Turno {c.turno}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => selectCurso(c)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ver Materias"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {role === 'admin' && (
                            <button
                              onClick={() => handleEliminarCurso(c.id, `${c.anio}° "${c.division}"`)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar Curso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Asignaturas del Curso Seleccionado */}
            {selectedCurso && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0D2A3E]">
                    Asignaturas Registradas para {selectedCurso.anio}° "{selectedCurso.division}" ({materiasCurso.length})
                  </h4>
                  {materiasCurso.length === 0 && (
                    <button
                      onClick={handleGenerarMateriasParaCursoExistente}
                      className="btn-gold text-[10px] py-1 px-3 font-bold"
                    >
                      ⚡ Cargar Materias Oficiales
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto bg-gray-50 p-3 rounded-xl">
                  {materiasCurso.map((m) => {
                    const docId = vinculacionesMap[m.id] || '';
                    return (
                      <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{m.nombre}</span>
                        <select
                          value={docId}
                          disabled={role !== 'admin'}
                          onChange={(e) => handleVincularDocenteMateria(m.id, e.target.value)}
                          className="field-soft text-[11px] py-0.5 w-56"
                        >
                          <option value="">-- Sin Docente --</option>
                          {docentes.map((d) => (
                            <option key={d.id} value={d.id}>
                              Prof. {d.apellido}, {d.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------- VISTA 2: GESTIÓN DE CICLOS LECTIVOS (Captura 2) ------------------- */}
      {activeTab === 'ciclos' && (
        <div className="card p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#006384]" />
                Ciclos Lectivos
              </h3>
              <p className="text-xs text-gray-500">
                Definí períodos para el conteo de asistencias y calificaciones institucionales
              </p>
            </div>

            {role === 'admin' && (
              <button
                onClick={handleNuevoCicloModal}
                className="btn-primary font-bold text-xs py-2.5 px-4 flex items-center gap-2 bg-[#006384]"
              >
                <Plus className="w-4 h-4" />
                + Nuevo Ciclo
              </button>
            )}
          </div>

          <div className="space-y-3">
            {ciclosList.map((ciclo) => {
              const isActivo = ciclo.estado === 'ACTIVO';
              return (
                <div
                  key={ciclo.id}
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isActivo
                      ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isActivo
                          ? 'bg-blue-100 text-[#006384] border border-blue-300'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isActivo ? '🟢 ACTIVO' : '⚪ CERRADO'}
                    </span>

                    <div>
                      <h4 className="text-xl font-bold font-heading text-[#0D2A3E]">
                        {ciclo.anio}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {ciclo.inicio} ➔ {ciclo.fin}
                      </p>
                    </div>
                  </div>

                  {role === 'admin' && (
                    <button
                      onClick={() => toggleEstadoCiclo(ciclo.id)}
                      className={`text-xs font-bold py-2 px-4 rounded-xl border flex items-center gap-1.5 transition-colors ${
                        isActivo
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isActivo ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Cerrar Ciclo
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Abrir / Reabrir Ciclo
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------- VISTA 3: MIGRACIÓN Y PROMOCIÓN MASIVA ------------------- */}
      {activeTab === 'migrar' && (
        <div className="card p-8 bg-white max-w-2xl mx-auto space-y-6 text-center">
          <Users className="w-12 h-12 text-[#006384] mx-auto" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-heading text-[#0D2A3E]">
              Migración y Promoción Masiva de Estudiantes
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
              Promueve automáticamente los legajos regulares de 1° Año hacia 2° Año, y de 2° Año hacia 3° Año para el nuevo Ciclo Lectivo.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => Swal.fire('Promoción Completada', 'Matrícula promovida exitosamente al nuevo ciclo.', 'success')}
              className="btn-gold font-bold text-xs py-3 px-6 shadow-md inline-flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Ejecutar Promoción Masiva de Matrícula
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
