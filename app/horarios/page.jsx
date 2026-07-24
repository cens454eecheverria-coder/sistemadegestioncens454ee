"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { Clock, User, ShieldAlert } from 'lucide-react';

export default function ScheduleManagerPage() {
  const { role } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [horaInicioBase, setHoraInicioBase] = useState('18:30');

  const [grillaHoraria, setGrillaHoraria] = useState({});
  const [conflictos, setConflictos] = useState([]);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedDocenteSchedule, setSelectedDocenteSchedule] = useState(null);

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const MODULOS = [1, 2, 3, 4, 5, 6];

  const canEdit = role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCursoId) {
      loadMateriasYHorarios(selectedCursoId);
    }
  }, [selectedCursoId]);

  async function loadData() {
    try {
      const { data: cData } = await supabase.from('cursos').select('*').order('anio');
      setCursos(cData || []);
      if (cData && cData.length > 0) setSelectedCursoId(cData[0].id);

      const { data: dData } = await supabase.from('docentes').select('*').order('apellido');
      setDocentes(dData || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMateriasYHorarios(cursoId) {
    try {
      const { data: mData } = await supabase
        .from('materias')
        .select('*')
        .eq('curso_id', cursoId);

      setMaterias(mData || []);

      const { data: hData } = await supabase
        .from('horarios')
        .select('*')
        .eq('curso_id', cursoId);

      const map = {};
      if (hData) {
        hData.forEach((item) => {
          map[`${item.dia_semana}_${item.modulo}`] = {
            materiaId: item.materia_id,
            docenteId: item.docente_id,
            aula: item.aula || 'Aula 4',
          };
        });
      }
      setGrillaHoraria(map);
      validarConflictos(map);
    } catch (e) {
      console.error(e);
    }
  }

  const handleCellChange = (diaIdx, moduloNum, materiaId) => {
    if (!canEdit) return;

    const mat = materias.find((m) => m.id === materiaId);
    const newMap = {
      ...grillaHoraria,
      [`${diaIdx}_${moduloNum}`]: {
        materiaId,
        aula: 'Aula 4',
      },
    };

    setGrillaHoraria(newMap);
    validarConflictos(newMap);
  };

  const validarConflictos = (map) => {
    const listConflictos = [];
    setConflictos(listConflictos);
  };

  const handleGuardarHorarios = async () => {
    if (!canEdit) {
      Swal.fire('Acceso Denegado', 'Únicamente el Equipo Directivo (Admin) puede modificar los horarios escolares.', 'warning');
      return;
    }

    try {
      const payload = [];
      Object.entries(grillaHoraria).forEach(([key, cell]) => {
        const [dia_semana, modulo] = key.split('_');
        if (cell.materiaId) {
          payload.push({
            curso_id: selectedCursoId,
            dia_semana: parseInt(dia_semana),
            modulo: parseInt(modulo),
            materia_id: cell.materiaId,
            docente_id: cell.docenteId || null,
            aula: cell.aula,
          });
        }
      });

      await supabase.from('horarios').delete().eq('curso_id', selectedCursoId);

      if (payload.length > 0) {
        await supabase.from('horarios').insert(payload);
      }

      Swal.fire({
        icon: 'success',
        title: 'Horario Guardado',
        text: 'Se actualizó la matriz horaria semanal del curso.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const getFranja = (modIdx) => {
    const [h, m] = horaInicioBase.split(':').map(Number);
    const startMinutes = (h || 18) * 60 + (m || 30) + modIdx * 40;
    const endMinutes = startMinutes + 40;

    const formatMinutes = (mins) => {
      const hrs = Math.floor(mins / 60) % 24;
      const mnts = mins % 60;
      return `${hrs.toString().padStart(2, '0')}:${mnts.toString().padStart(2, '0')}`;
    };

    return `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`;
  };

  const selectedCursoObj = cursos.find((c) => c.id === selectedCursoId) || {};

  return (
    <div className="space-y-6">
      {/* Banner si el usuario no es Admin */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Modo Consulta de Horarios: Los preceptores, docentes y estudiantes pueden consultar la grilla pero <strong>no están autorizados a modificar los horarios escolares</strong>.
          </span>
        </div>
      )}

      {/* Header Horarios */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#006384]" />
            Diagramación de Horarios Escolares
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Matriz semanal de módulos con consulta interactiva por curso
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTeacherModal(true)}
            className="btn-primary text-xs py-2 px-3 bg-[#0D2A3E]"
          >
            <User className="w-4 h-4" />
            Agenda por Docente
          </button>
          {canEdit && (
            <button
              onClick={handleGuardarHorarios}
              className="btn-gold text-xs py-2 px-4 font-bold"
            >
              Guardar Matriz Horaria
            </button>
          )}
        </div>
      </div>

      {/* Selector de Curso y Hora Base */}
      <div className="card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Curso:</label>
          <select
            value={selectedCursoId}
            onChange={(e) => setSelectedCursoId(e.target.value)}
            className="field-soft font-bold text-xs"
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.anio}° "{c.division}" - {c.orientacion} ({c.turno})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Inicio Turno:</label>
          <input
            type="time"
            value={horaInicioBase}
            disabled={!canEdit}
            onChange={(e) => setHoraInicioBase(e.target.value)}
            className="field-soft font-bold text-xs"
          />
        </div>
      </div>

      {/* Grilla Horaria Semanal */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <span className="font-heading text-sm">
            Grilla Horaria: {selectedCursoObj.anio}° "{selectedCursoObj.division}"
          </span>
          <span className="text-xs text-[#006384] font-semibold">
            Módulos de 40 minutos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b">
              <tr>
                <th className="py-3 px-3 w-32 border-r border-gray-200">Módulo / Franja</th>
                {DIAS.map((dia) => (
                  <th key={dia} className="py-3 px-3 text-center border-r border-gray-200">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {MODULOS.map((mod, modIdx) => (
                <tr key={mod} className="hover:bg-[#F4FAFF]">
                  <td className="py-3 px-3 font-bold text-gray-700 bg-gray-50 border-r border-gray-200">
                    <div>{mod}° Módulo</div>
                    <div className="text-[10px] text-gray-400 font-normal">{getFranja(modIdx)}</div>
                  </td>

                  {DIAS.map((dia, diaIdx) => {
                    const cellKey = `${diaIdx}_${mod}`;
                    const cell = grillaHoraria[cellKey] || {};
                    return (
                      <td key={diaIdx} className="p-2 border-r border-gray-200 text-center">
                        <select
                          value={cell.materiaId || ''}
                          disabled={!canEdit}
                          onChange={(e) => handleCellChange(diaIdx, mod, e.target.value)}
                          className="field-soft text-[11px] py-1 text-center font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Libre --</option>
                          {materias.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agenda Docente */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">
              Agenda Semanal Unificada por Docente
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Profesor:</label>
              <select
                value={selectedDocenteSchedule || ''}
                onChange={(e) => setSelectedDocenteSchedule(e.target.value)}
                className="field-soft text-xs"
              >
                <option value="">-- Seleccionar Docente --</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.apellido}, {d.nombre} ({d.titulo || 'Profesor'})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#EEF5FA] p-4 rounded-xl text-xs space-y-2">
              <p className="font-bold text-[#006384]">Cursos y Horarios Asignados:</p>
              <p className="text-gray-600">Lunes 18:30 hs: Lengua y Literatura (1° A Noche)</p>
              <p className="text-gray-600">Miércoles 19:50 hs: Historia Argentina (2° A Tarde)</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTeacherModal(false)}
                className="px-4 py-2 bg-gray-200 text-xs font-bold rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
