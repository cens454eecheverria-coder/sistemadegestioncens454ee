"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { Clock, Calendar, Save, ShieldAlert, User, CheckCircle2, AlertCircle } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MODULOS = [1, 2, 3, 4, 5, 6];

export default function HorariosPage() {
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [cursos, setCursos] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [grillaHoraria, setGrillaHoraria] = useState({});
  const [horaInicioBase, setHoraInicioBase] = useState('18:30');

  // Modal Agenda Docente
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedDocenteSchedule, setSelectedDocenteSchedule] = useState('');
  const [docenteHorariosList, setDocenteHorariosList] = useState([]);

  useEffect(() => {
    loadCursosYDocentes();
  }, []);

  useEffect(() => {
    if (selectedCursoId) {
      loadMateriasYHorarios(selectedCursoId);
    }
  }, [selectedCursoId]);

  useEffect(() => {
    if (selectedDocenteSchedule) {
      loadHorariosDocente(selectedDocenteSchedule);
    } else {
      setDocenteHorariosList([]);
    }
  }, [selectedDocenteSchedule]);

  async function loadCursosYDocentes() {
    try {
      const { data: cData } = await supabase.from('cursos').select('*').order('anio');
      const { data: dData } = await supabase.from('docentes').select('*').order('apellido');

      setCursos(cData || []);
      setDocentes(dData || []);

      if (cData && cData.length > 0) {
        setSelectedCursoId(cData[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMateriasYHorarios(cursoId) {
    try {
      const { data: matData } = await supabase
        .from('materias')
        .select('*')
        .eq('curso_id', cursoId);

      setMaterias(matData || []);

      const { data: horData } = await supabase
        .from('horarios')
        .select('*')
        .eq('curso_id', cursoId);

      const map = {};
      if (horData) {
        horData.forEach((h) => {
          map[h.dia_semana + "_" + h.modulo] = {
            materiaId: h.materia_id,
            docenteId: h.docente_id,
          };
        });
      }
      setGrillaHoraria(map);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadHorariosDocente(docenteId) {
    try {
      const { data } = await supabase
        .from('horarios')
        .select('*, materias(nombre), cursos(anio, division, turno)')
        .eq('docente_id', docenteId);

      if (data && data.length > 0) {
        const formatted = data.map((h) => {
          const diaNombre = DIAS[h.dia_semana] || 'Día';
          const materiaNombre = h.materias?.nombre || 'Materia';
          const cursoNombre = h.cursos ? h.cursos.anio + "º " + h.cursos.division + " (" + h.cursos.turno + ")" : 'Curso';
          return diaNombre + " " + h.modulo + "º Módulo: " + materiaNombre + " (" + cursoNombre + ")";
        });
        setDocenteHorariosList(formatted);
      } else {
        setDocenteHorariosList([]);
      }
    } catch (e) {
      console.error(e);
      setDocenteHorariosList([]);
    }
  }

  const handleCellChange = (diaIdx, moduloNum, materiaId) => {
    const key = diaIdx + "_" + moduloNum;
    setGrillaHoraria((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        materiaId: materiaId || null,
      },
    }));
  };

  const handleGuardarHorarios = async () => {
    if (!selectedCursoId) return;

    try {
      const records = [];
      Object.keys(grillaHoraria).forEach((key) => {
        const parts = key.split('_');
        const diaStr = parts[0];
        const modStr = parts[1];
        const item = grillaHoraria[key];
        if (item.materiaId) {
          records.push({
            curso_id: selectedCursoId,
            dia_semana: parseInt(diaStr),
            modulo: parseInt(modStr),
            materia_id: item.materiaId,
          });
        }
      });

      await supabase.from('horarios').delete().eq('curso_id', selectedCursoId);

      if (records.length > 0) {
        const { error } = await supabase.from('horarios').insert(records);
        if (error) throw error;
      }

      Swal.fire({
        icon: 'success',
        title: 'Horarios Guardados',
        text: 'Se actualizó la matriz horaria en Supabase.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const getFranja = (modIdx) => {
    const parts = horaInicioBase.split(':').map(Number);
    const h = parts[0];
    const m = parts[1];
    const startMinutes = (h || 18) * 60 + (m || 30) + modIdx * 40;
    const endMinutes = startMinutes + 40;

    const formatMinutes = (mins) => {
      const hrs = Math.floor(mins / 60) % 24;
      const mnts = mins % 60;
      return (hrs < 10 ? '0' + hrs : hrs) + ":" + (mnts < 10 ? '0' + mnts : mnts);
    };

    return formatMinutes(startMinutes) + " - " + formatMinutes(endMinutes);
  };

  const selectedCursoObj = cursos.find((c) => c.id === selectedCursoId) || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
            className="btn-primary text-xs py-2.5 px-4 bg-[#0D2A3E] flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            Agenda por Docente
          </button>
          {canEdit && (
            <button
              onClick={handleGuardarHorarios}
              className="btn-gold text-xs py-2.5 px-5 font-bold"
            >
              Guardar Matriz Horaria
            </button>
          )}
        </div>
      </div>

      {/* Selector de Curso y Hora Base */}
      <div className="card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Curso:</label>
          <select
            value={selectedCursoId}
            onChange={(e) => setSelectedCursoId(e.target.value)}
            className="field-soft font-bold text-xs border-2 border-blue-500"
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.anio}º "{c.division}" - {c.orientacion} ({c.turno})
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
      <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div className="bg-[#0D2A3E] text-white p-4 px-6 flex items-center justify-between">
          <span className="font-heading text-xs font-bold tracking-wide">
            Grilla Horaria: <span className="text-[#F5C442]">{selectedCursoObj.anio ? selectedCursoObj.anio + "º " + selectedCursoObj.division : "-"}</span>
          </span>
          <span className="text-[11px] font-bold bg-blue-900/60 text-blue-200 px-3 py-1 rounded-full border border-blue-700">
            Módulos de 40 minutos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
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
                <tr key={mod} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-bold text-gray-700 bg-gray-50 border-r border-gray-200">
                    <div>{mod}º Módulo</div>
                    <div className="text-[10px] text-gray-400 font-normal">{getFranja(modIdx)}</div>
                  </td>

                  {DIAS.map((dia, diaIdx) => {
                    const cellKey = diaIdx + "_" + mod;
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">
              Agenda Semanal Unificada por Docente
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Profesor:</label>
              <select
                value={selectedDocenteSchedule || ''}
                onChange={(e) => setSelectedDocenteSchedule(e.target.value)}
                className="field-soft text-xs font-bold"
              >
                <option value="">-- Seleccionar Docente --</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.apellido}, {d.nombre} ({d.titulo || 'Profesor'})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#EEF5FA] p-4 rounded-xl text-xs space-y-2 border border-blue-100 min-h-[100px]">
              <p className="font-bold text-[#006384] border-b pb-1">Cursos y Horarios Asignados:</p>
              {docenteHorariosList.length === 0 ? (
                <p className="text-gray-400 font-medium py-2">
                  {selectedDocenteSchedule ? "El docente seleccionado no posee módulos horarios asignados en la grilla actual." : "Seleccione un docente arriba para consultar su carga horaria."}
                </p>
              ) : (
                docenteHorariosList.map((item, idx) => (
                  <p key={idx} className="text-gray-700 font-semibold">• {item}</p>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowTeacherModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
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