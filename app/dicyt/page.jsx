"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { BookMarked, Plus, Calendar, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function LibroDicytPage() {
  const [registros, setRegistros] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [modulo, setModulo] = useState('1');
  const [contenido, setContenido] = useState('');
  const [actividades, setActividades] = useState('');
  const [docenteNombre, setDocenteNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDicyt();
  }, [fecha]);

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
    if (!contenido.trim()) return;

    setSaving(true);
    try {
      const newRecord = {
        fecha: fecha,
        modulo: parseInt(modulo),
        contenido_desarrollado: contenido.trim(),
        actividades: actividades.trim() || null,
        observaciones: docenteNombre.trim() ? Dictado por:  : null,
      };

      const { error } = await supabase.from('libro_dicyt').insert(newRecord);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Clase Registrada',
        text: 'Se guardó la entrada en el Libro de Temas DICYT.',
        timer: 1500,
        showConfirmButton: false,
      });

      setContenido('');
      setActividades('');
      setDocenteNombre('');
      await loadDicyt();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-[#006384]" />
            Libro de Temas DICYT - Registro Diario
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Digitalización del Registro de Desempeño Institucional y Curricular por Trayecto - CENS 454
          </p>
        </div>
      </div>

      {/* Formulario de Carga de Tema */}
      <form onSubmit={handleGuardarRegistro} className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="text-sm font-bold font-heading text-[#0D2A3E]">
          Cargar Nuevo Registro de Clase / Módulo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Clase:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="field-soft font-semibold text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Módulo Horario:</label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="field-soft font-semibold text-xs"
            >
              <option value="1">1º Módulo</option>
              <option value="2">2º Módulo</option>
              <option value="3">3º Módulo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Docente Cargo / Suplente:</label>
            <input
              type="text"
              value={docenteNombre}
              onChange={(e) => setDocenteNombre(e.target.value)}
              placeholder="Ej: Prof. Martínez"
              className="field-soft text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Contenidos Conceptuales Desarrollados:
          </label>
          <textarea
            rows="2"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Detallar unidades y temas explicados..."
            className="field-soft text-xs"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Actividades Pedagógicas Realizadas:
          </label>
          <textarea
            rows="2"
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
            placeholder="Ejercicios, lecturas, evaluaciones o debates..."
            className="field-soft text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-xs py-2.5 px-6 font-bold"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Firmar y Registrar Clase'}
        </button>
      </form>

      {/* Historial de Registros DICYT */}
      <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div className="bg-[#0D2A3E] text-white p-4 px-6 font-heading text-xs font-bold">
          Historial de Partes Diarios Registrados
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500 font-bold">Cargando Libro DICYT...</div>
          ) : registros.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400 font-bold space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-1" />
              <p>No hay registros cargados en el Libro de Temas DICYT actualmente.</p>
            </div>
          ) : (
            registros.map((r) => (
              <div key={r.id} className="p-5 space-y-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#006384] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    Fecha: {r.fecha} • {r.modulo}º Módulo
                  </span>
                  <span className="text-gray-500 font-semibold">{r.observaciones || 'Docente Titular'}</span>
                </div>
                <p className="text-xs font-bold text-[#0D2A3E]">{r.contenido_desarrollado}</p>
                {r.actividades && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <strong>Actividades:</strong> {r.actividades}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}