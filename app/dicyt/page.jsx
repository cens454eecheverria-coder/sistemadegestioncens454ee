"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { BookMarked, Save, AlertCircle, Pencil, Trash2, X, Check } from 'lucide-react';

const TAREAS_DICYT = [
  'Proyecto Institucional',
  'Seguimiento de Trayectorias de Estudiantes',
  'Trabajo en Círculo Dialógico',
];

export default function LibroDicytPage() {
  const [registros, setRegistros] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tarea, setTarea] = useState(TAREAS_DICYT[0]);
  const [actividades, setActividades] = useState('');
  const [dicyt, setDicyt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editTarea, setEditTarea] = useState('');
  const [editActividades, setEditActividades] = useState('');
  const [editDicyt, setEditDicyt] = useState('');
  const [editFecha, setEditFecha] = useState('');

  useEffect(() => {
    loadDicyt();
  }, []);

  async function loadDicyt() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('libro_dicyt')
        .select('*')
        .order('fecha', { ascending: false });
      setRegistros(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleGuardarRegistro = async (e) => {
    e.preventDefault();
    if (!tarea) return;

    setSaving(true);
    try {
      const newRecord = {
        fecha: fecha,
        modulo: 1,
        contenido_desarrollado: tarea,
        actividades: actividades.trim() || null,
        observaciones: dicyt.trim() ? dicyt.trim() : null,
      };

      const { error } = await supabase.from('libro_dicyt').insert(newRecord);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Registro Guardado',
        text: 'Se guardó la entrada en el Libro DICyT.',
        timer: 1500,
        showConfirmButton: false,
      });

      setTarea(TAREAS_DICYT[0]);
      setActividades('');
      setDicyt('');
      await loadDicyt();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar registro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    const { error } = await supabase.from('libro_dicyt').delete().eq('id', id);
    if (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    } else {
      await loadDicyt();
    }
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setEditTarea(r.contenido_desarrollado || TAREAS_DICYT[0]);
    setEditActividades(r.actividades || '');
    setEditDicyt(r.observaciones || '');
    setEditFecha(r.fecha || '');
  };

  const cancelEdit = () => setEditId(null);

  const handleGuardarEdicion = async (id) => {
    const { error } = await supabase
      .from('libro_dicyt')
      .update({
        fecha: editFecha,
        contenido_desarrollado: editTarea,
        actividades: editActividades.trim() || null,
        observaciones: editDicyt.trim() || null,
      })
      .eq('id', id);

    if (error) {
      Swal.fire({ icon: 'error', title: 'Error al guardar', text: error.message });
    } else {
      setEditId(null);
      await loadDicyt();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-[#006384]" />
            Libro de Temas DICyT - Registro Diario
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Digitalización del Registro de Desempeño Institucional y Curricular por Trayecto - CENS 454
          </p>
        </div>
      </div>

      {/* Formulario de Carga */}
      <form onSubmit={handleGuardarRegistro} className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="text-sm font-bold font-heading text-[#0D2A3E]">
          Cargar Nuevo Registro DICyT
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="field-soft font-semibold text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">DICyT:</label>
            <input
              type="text"
              value={dicyt}
              onChange={(e) => setDicyt(e.target.value)}
              placeholder="Ej: Prof. García"
              className="field-soft text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Tarea: <span className="text-red-500">*</span>
          </label>
          <select
            value={tarea}
            onChange={(e) => setTarea(e.target.value)}
            className="field-soft font-semibold text-xs"
            required
          >
            {TAREAS_DICYT.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Actividades Realizadas:
          </label>
          <textarea
            rows="3"
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
            placeholder="Descripción de las actividades realizadas en la sesión..."
            className="field-soft text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Firmar y Registrar'}
        </button>
      </form>

      {/* Historial de Registros */}
      <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div className="bg-[#0D2A3E] text-white p-4 px-6 font-heading text-xs font-bold flex justify-between items-center">
          <span>Historial de Registros DICyT</span>
          <span className="text-blue-200 font-normal">{registros.length} registro(s)</span>
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500 font-bold">Cargando Libro DICyT...</div>
          ) : registros.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400 font-bold space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-1" />
              <p>No hay registros cargados en el Libro DICyT actualmente.</p>
            </div>
          ) : (
            registros.map((r) =>
              editId === r.id ? (
                // ── MODO EDICIÓN ──────────────────────────────────────
                <div key={r.id} className="p-5 bg-blue-50 border-l-4 border-blue-400 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Fecha:</label>
                      <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} className="field-soft text-xs mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">DICyT:</label>
                      <input type="text" value={editDicyt} onChange={(e) => setEditDicyt(e.target.value)} className="field-soft text-xs mt-1" placeholder="Ej: Prof. García" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Tarea:</label>
                    <select value={editTarea} onChange={(e) => setEditTarea(e.target.value)} className="field-soft text-xs mt-1">
                      {TAREAS_DICYT.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Actividades:</label>
                    <textarea rows="2" value={editActividades} onChange={(e) => setEditActividades(e.target.value)} className="field-soft text-xs mt-1" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => handleGuardarEdicion(r.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition">
                      <Check className="w-3.5 h-3.5" /> Guardar Cambios
                    </button>
                    <button onClick={cancelEdit} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // ── MODO VISTA ────────────────────────────────────────
                <div key={r.id} className="p-5 space-y-2 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#006384] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 text-xs">
                        {r.fecha}
                      </span>
                      <span className="text-xs font-bold text-[#0D2A3E] bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                        {r.contenido_desarrollado}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.observaciones && (
                        <span className="text-gray-500 font-semibold text-xs hidden sm:inline">{r.observaciones}</span>
                      )}
                      <button
                        onClick={() => startEdit(r)}
                        className="text-xs font-bold py-1 px-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1"
                        title="Editar registro"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(r.id)}
                        className="text-xs font-bold py-1 px-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition flex items-center gap-1"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                  {r.actividades && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <strong>Actividades:</strong> {r.actividades}
                    </p>
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
