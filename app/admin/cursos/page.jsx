"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getMateriasForCurso, FORMACION_ORIENTADA } from '@/lib/curriculumCens';
import Swal from 'sweetalert2';
import {
  BookOpen, Plus, Users, Lock, Unlock, Layers, Clock, Zap, ShieldAlert, Trash2, Edit, Calendar, CheckCircle2, XCircle, Copy, ArrowRight, UserCheck, GraduationCap
} from 'lucide-react';

export default function CourseManagerPage() {
  const { role, cicloLectivo, changeCicloLectivo } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [materiasCurso, setMateriasCurso] = useState([]);
  const [vinculacionesMap, setVinculacionesMap] = useState({});

  const [newAnio, setNewAnio] = useState('1');
  const [newDivision, setNewDivision] = useState('');
  const [newOrientacion, setNewOrientacion] = useState('Ciencias Sociales');
  const [newTurno, setNewTurno] = useState('Noche');
  const [newCiclo, setNewCiclo] = useState('2026');
  const [newPreceptor, setNewPreceptor] = useState('');
  const [newReplicarId, setNewReplicarId] = useState('');
  const [creating, setCreating] = useState(false);

  const [activeTab, setActiveTab] = useState('cursos');

  const [ciclosList, setCiclosList] = useState([
    { id: 1, anio: 2026, estado: 'ACTIVO', inicio: '01 de marzo de 2026', fin: 'En curso' },
    { id: 2, anio: 2025, estado: 'CERRADO', inicio: '01 de marzo de 2025', fin: '20 de diciembre de 2025' },
    { id: 3, anio: 2024, estado: 'CERRADO', inicio: '01 de marzo de 2024', fin: '20 de diciembre de 2024' },
  ]);

  const [migrarOrigenId, setMigrarOrigenId] = useState('');
  const [migrarDestinoId, setMigrarDestinoId] = useState('');
  const [migrando, setMigrando] = useState(false);

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
      const { data: mData } = await supabase.from('materias').select('*').eq('curso_id', curso.id);
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
      Swal.fire('Error', 'Ingrese una denominación para la división.', 'error');
      return;
    }

    setCreating(true);
    try {
      const nombreMatStr = newAnio + '° "' + newDivision.trim() + '" - ' + newOrientacion + ' (' + newTurno + ')';
      const { data: cursoData, error: cursoErr } = await supabase
        .from('cursos')
        .insert({
          anio: parseInt(newAnio),
          division: newDivision.trim(),
          orientacion: newOrientacion,
          turno: newTurno,
          nombre_materia: nombreMatStr,
        })
        .select()
        .single();

      if (cursoErr) throw cursoErr;

      let materiasToInsert = [];
      if (newReplicarId) {
        const { data: origMaterias } = await supabase.from('materias').select('*').eq('curso_id', newReplicarId);
        if (origMaterias && origMaterias.length > 0) {
          materiasToInsert = origMaterias.map((m) => ({
            nombre: m.nombre,
            curso_id: cursoData.id,
            horas_semanales: m.horas_semanales || 2,
          }));
        }
      }

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
        setMateriasCurso(materiasToInsert.map((m, idx) => ({ ...m, id: 'local_' + idx })));
      }

      Swal.fire({
        icon: 'success',
        title: 'Curso Agregado',
        text: 'Se creó el curso ' + newAnio + '° "' + newDivision.trim() + '" con ' + materiasToInsert.length + ' materias.',
      });

      setNewDivision('');
      setNewReplicarId('');
      await loadCursosYDocentes();
      if (cursoData) selectCurso(cursoData);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error de Creación', text: err.message });
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
      title: '¿Eliminar ' + nombreCurso + '?',
      text: 'Esta acción eliminará el curso y todas sus asignaturas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, Eliminar Curso',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await supabase.from('materias').delete().eq('curso_id', cursoId);
          const { error } = await supabase.from('cursos').delete().eq('id', cursoId);
          if (error) throw error;

          Swal.fire('Curso Eliminado', 'El curso fue eliminado.', 'success');
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
        setMateriasCurso(materiasToInsert.map((m, idx) => ({ ...m, id: 'temp_' + idx })));
        return;
      }

      Swal.fire({ icon: 'success', title: 'Materias Generadas', text: 'Se crearon ' + materiasToInsert.length + ' asignaturas.' });
      await selectCurso(selectedCurso);
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleVincularDocenteMateria = async (materiaId, docenteId) => {
    try {
      await supabase.from('docente_materia').delete().eq('materia_id', materiaId);
      if (docenteId) {
        await supabase.from('docente_materia').insert({ materia_id: materiaId, docente_id: docenteId, cargo: 'titular' });
      }
      setVinculacionesMap((prev) => ({ ...prev, [materiaId]: docenteId }));
      Swal.fire({ icon: 'success', title: 'Docente Vinculado', text: 'Se asignó el profesor.', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleEjecutarMigracionInteractivas = async () => {
    if (!migrarOrigenId || !migrarDestinoId) {
      Swal.fire('Error', 'Seleccione el Curso Origen y el Destino de Migración.', 'error');
      return;
    }

    setMigrando(true);
    try {
      const cursoOrigen = cursos.find((c) => c.id === migrarOrigenId);

      if (migrarDestinoId === 'EGRESAR') {
        const { data: alumnosOrigen } = await supabase.from('alumnos_cursos').select('estudiante_id').eq('curso_id', migrarOrigenId);
        if (alumnosOrigen && alumnosOrigen.length > 0) {
          const ids = alumnosOrigen.map((a) => a.estudiante_id);
          await supabase.from('estudiantes').update({ estado: 'egresado' }).in('id', ids);
          await supabase.from('alumnos_cursos').delete().eq('curso_id', migrarOrigenId);
        }
        Swal.fire({ icon: 'success', title: '🎓 Alumnos Egresados', text: 'Se graduó la plantilla de ' + (cursoOrigen ? cursoOrigen.anio + '° "' + cursoOrigen.division + '"' : 'estudiantes') + '.' });
      } else {
        const cursoDestino = cursos.find((c) => c.id === migrarDestinoId);
        const { data: alumnosOrigen } = await supabase.from('alumnos_cursos').select('estudiante_id').eq('curso_id', migrarOrigenId);
        if (alumnosOrigen && alumnosOrigen.length > 0) {
          await supabase.from('alumnos_cursos').delete().eq('curso_id', migrarOrigenId);
          const newRecords = alumnosOrigen.map((a) => ({ estudiante_id: a.estudiante_id, curso_id: migrarDestinoId }));
          await supabase.from('alumnos_cursos').insert(newRecords);
        }
        Swal.fire({ icon: 'success', title: 'Migración Exitosa', text: 'Se promovieron los estudiantes de ' + (cursoOrigen ? cursoOrigen.anio + '° "' + cursoOrigen.division + '"' : '') + ' a ' + (cursoDestino ? cursoDestino.anio + '° "' + cursoDestino.division + '"' : '') + '.' });
      }

      setMigrarOrigenId('');
      setMigrarDestinoId('');
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setMigrando(false);
    }
  };

  const toggleBloqueoGlobalNotas = async () => {
    if (role !== 'admin') {
      Swal.fire('Acceso Restringido', 'Solo el Equipo Directivo puede modificar el bloqueo global.', 'warning');
      return;
    }
    const nuevoEstado = !gradesLocked;
    setGradesLocked(nuevoEstado);
    try {
      await supabase.from('system_settings').upsert({ id: 1, grades_locked: nuevoEstado });
      Swal.fire({ icon: 'info', title: nuevoEstado ? 'Bloqueo Global Activado' : 'Edición Habilitada' });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEstadoCiclo = (cicloId) => {
    setCiclosList((prev) =>
      prev.map((c) =>
        c.id === cicloId ? { ...c, estado: c.estado === 'ACTIVO' ? 'CERRADO' : 'ACTIVO', fin: c.estado === 'ACTIVO' ? new Date().toLocaleDateString('es-AR') : 'En curso' } : c
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
        setCiclosList((prev) => [{ id: Date.now(), anio: nAnio, estado: 'ACTIVO', inicio: '01 de marzo de ' + nAnio, fin: 'En curso' }, ...prev]);
        changeCicloLectivo(nAnio.toString());
        Swal.fire('Ciclo Lectivo Creado', 'Se dio de alta el Ciclo Lectivo ' + nAnio + '.', 'success');
      }
    });
  };

  return (
    <div className="space-y-6">
      {role !== 'admin' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Vista de Lectura: Reservada al <strong>Equipo Directivo</strong>.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#006384]" /> Cursos, Orientaciones y Configuraciones
          </h1>
          <p className="text-xs text-gray-500 mt-1">Estructura curricular CENS 454 según Res. 2993/22 y rectificativa 3463/22 DGCyE</p>
        </div>

        <button
          onClick={toggleBloqueoGlobalNotas}
          className={
            gradesLocked
              ? "text-xs font-bold py-2.5 px-4 rounded-full flex items-center gap-2 border bg-red-100 text-red-800 border-red-300"
              : "text-xs font-bold py-2.5 px-4 rounded-full flex items-center gap-2 border bg-emerald-100 text-emerald-800 border-emerald-300"
          }
        >
          {gradesLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {gradesLocked ? 'Notas Bloqueadas' : 'Notas Abiertas'}
        </button>
      </div>

      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('cursos')}
          className={activeTab === 'cursos' ? "py-3 px-4 flex items-center gap-2 border-b-2 border-[#006384] text-[#006384]" : "py-3 px-4 flex items-center gap-2 border-b-2 border-transparent text-gray-500"}
        >
          <Layers className="w-4 h-4" /> Estructura de Cursos
        </button>
        <button
          onClick={() => setActiveTab('ciclos')}
          className={activeTab === 'ciclos' ? "py-3 px-4 flex items-center gap-2 border-b-2 border-[#006384] text-[#006384]" : "py-3 px-4 flex items-center gap-2 border-b-2 border-transparent text-gray-500"}
        >
          <Calendar className="w-4 h-4" /> Ciclos Lectivos
        </button>
        <button
          onClick={() => setActiveTab('migrar')}
          className={activeTab === 'migrar' ? "py-3 px-4 flex items-center gap-2 border-b-2 border-[#006384] text-[#006384]" : "py-3 px-4 flex items-center gap-2 border-b-2 border-transparent text-gray-500"}
        >
          <Users className="w-4 h-4" /> Migración y Promoción Masiva
        </button>
      </div>

      {activeTab === 'cursos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCrearCurso} className="card p-6 bg-white space-y-4 shadow-xs">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] border-b pb-3">Nuevo Curso</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Año *</label>
              <select value={newAnio} onChange={(e) => setNewAnio(e.target.value)} className="field-soft text-xs font-bold">
                <option value="1">1ro</option><option value="2">2do</option><option value="3">3ro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">División *</label>
              <input type="text" value={newDivision} onChange={(e) => setNewDivision(e.target.value)} placeholder="Ej. A, B, 1..." className="field-soft text-xs font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Orientación</label>
              <select value={newOrientacion} onChange={(e) => setNewOrientacion(e.target.value)} className="field-soft text-xs font-semibold">
                {Object.keys(FORMACION_ORIENTADA).map((or) => (<option key={or} value={or}>{or}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Turno</label>
              <select value={newTurno} onChange={(e) => setNewTurno(e.target.value)} className="field-soft text-xs">
                <option value="Noche">Noche</option><option value="Tarde">Tarde</option><option value="Mañana">Mañana</option><option value="Víspera">Víspera</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Replicar estructura desde</label>
              <select value={newReplicarId} onChange={(e) => setNewReplicarId(e.target.value)} className="field-soft text-xs">
                <option value="">No replicar (curso vacío con materias DGCyE)</option>
                {cursos.map((c) => (<option key={c.id} value={c.id}>Replicar desde {c.anio}° "{c.division}"</option>))}
              </select>
            </div>
            <button type="submit" disabled={creating} className="w-full btn-primary font-bold text-xs py-3 rounded-xl bg-[#006384]">
              + Agregar Curso
            </button>
          </form>

          <div className="lg:col-span-2 card p-6 bg-white space-y-4">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Cursos Existentes ({cursos.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">CICLO</th><th className="py-3 px-4">AÑO</th><th className="py-3 px-4">DIVISIÓN</th><th className="py-3 px-4">ORIENTACIÓN? / TURNO</th><th className="py-3 px-4 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {cursos.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F4FAFF]">
                      <td className="py-3.5 px-4 font-bold text-[#006384]">2026</td>
                      <td className="py-3.5 px-4 font-extrabold">{c.anio}ro</td>
                      <td className="py-3.5 px-4 font-bold">{c.division}</td>
                      <td className="py-3.5 px-4 text-gray-600">{c.orientacion} (Turno {c.turno})</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => selectCurso(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                          {role === 'admin' && (<button onClick={() => handleEliminarCurso(c.id, c.anio + '° "' + c.division + '"')} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCurso && (
              <div className="pt-4 border-t space-y-3">
                <h4 className="text-xs font-bold text-[#0D2A3E]">Asignaturas de {selectedCurso.anio}° "{selectedCurso.division}" ({materiasCurso.length})</h4>
                <div className="divide-y max-h-[300px] overflow-y-auto bg-gray-50 p-3 rounded-xl">
                  {materiasCurso.map((m) => (
                    <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">{m.nombre}</span>
                      <select value={vinculacionesMap[m.id] || ''} disabled={role !== 'admin'} onChange={(e) => handleVincularDocenteMateria(m.id, e.target.value)} className="field-soft text-[11px] py-0.5 w-56">
                        <option value="">-- Sin Docente --</option>
                        {docentes.map((d) => (<option key={d.id} value={d.id}>Prof. {d.apellido}, {d.nombre}</option>))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ciclos' && (
        <div className="card p-6 bg-white space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Ciclos Lectivos</h3>
              <p className="text-xs text-gray-500">Definí períodos para el conteo de asistencias</p>
            </div>
            {role === 'admin' && (<button onClick={handleNuevoCicloModal} className="btn-primary text-xs py-2.5 px-4 bg-[#006384]">+ Nuevo Ciclo</button>)}
          </div>

          <div className="space-y-3">
            {ciclosList.map((ciclo) => (
              <div key={ciclo.id} className={ciclo.estado === 'ACTIVO' ? "p-5 rounded-2xl border flex items-center justify-between bg-blue-50/50 border-blue-200" : "p-5 rounded-2xl border flex items-center justify-between bg-gray-50"}>
                <div>
                  <span className={ciclo.estado === 'ACTIVO' ? "px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-[#006384]" : "px-3 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600"}>{ciclo.estado}</span>
                  <h4 className="text-xl font-bold text-[#0D2A3E] mt-1">{ciclo.anio}</h4>
                  <p className="text-xs text-gray-500">{ciclo.inicio} ➔ {ciclo.fin}</p>
                </div>
                {role === 'admin' && (
                  <button onClick={() => toggleEstadoCiclo(ciclo.id)} className="text-xs font-bold py-2 px-4 rounded-xl border bg-white">
                    {ciclo.estado === 'ACTIVO' ? '❌ Cerrar Ciclo' : '▶ Abrir Ciclo'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'migrar' && (
        <div className="card p-6 bg-white space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Migración y Promoción de Estudiantes</h3>
              <p className="text-xs text-gray-500">Mueve fácilmente toda la plantilla de inscriptos de un curso hacia el siguiente año y/o ciclo lectivo.</p>
            </div>
          </div>

          <div className="bg-[#F9FAFB] p-6 rounded-2xl border border-gray-200 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4">
              <div className="md:col-span-5 space-y-1">
                <label className="block text-xs font-bold text-gray-700">Curso ORIGEN</label>
                <div className="border-l-4 border-amber-500 rounded-lg">
                  <select value={migrarOrigenId} onChange={(e) => setMigrarOrigenId(e.target.value)} className="field-soft text-xs font-semibold w-full">
                    <option value="">Selecciona qué curso vaciar...</option>
                    {cursos.map((c) => (<option key={c.id} value={c.id}>{c.anio}ro {c.division} ({c.orientacion}) - Ciclo 2026</option>))}
                  </select>
                </div>
                <p className="text-[11px] italic text-gray-400">Todos los estudiantes matriculados a ese curso...</p>
              </div>

              <div className="md:col-span-1 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-purple-500 hidden md:block" />
              </div>

              <div className="md:col-span-5 space-y-1">
                <label className="block text-xs font-bold text-gray-700">Curso DESTINO</label>
                <div className="border-l-4 border-emerald-500 rounded-lg">
                  <select value={migrarDestinoId} onChange={(e) => setMigrarDestinoId(e.target.value)} className="field-soft text-xs font-semibold w-full">
                    <option value="">Selecciona dónde migrarlos...</option>
                    <option value="EGRESAR" className="font-bold text-red-600 bg-red-50">🎓 EGRESAR ALUMNOS (Fin de ciclo)</option>
                    {cursos.map((c) => (<option key={c.id} value={c.id}>{c.anio}ro {c.division} (Ciclo 2026)</option>))}
                  </select>
                </div>
                <p className="text-[11px] italic text-gray-400">...serán promovidos / reasignados hacia aquí.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button onClick={handleEjecutarMigracionInteractivas} disabled={migrando} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs py-3 px-8 rounded-xl shadow-lg flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> {migrando ? 'Migrando...' : 'Ejecutar Migración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}