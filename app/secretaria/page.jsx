"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import {
  Users, UserPlus, FileText, Search, Award, Compass, History, UserX, Briefcase, CheckCircle2, AlertTriangle, Plus, Clock, BookOpen
} from 'lucide-react';

export default function SecretariaPanelPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('estudiantes');

  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDni, setNewDni] = useState('');
  const [newCuil, setNewCuil] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newNombre, setNewNombre] = useState('');

  const [showDocenteModal, setShowDocenteModal] = useState(false);
  const [docDni, setDocDni] = useState('');
  const [docCuil, setDocCuil] = useState('');
  const [docApellido, setDocApellido] = useState('');
  const [docNombre, setDocNombre] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docTelefono, setDocTelefono] = useState('');
  const [docTitulo, setDocTitulo] = useState('Profesor/a Secundario');

  const [selectedCursoVinculo, setSelectedCursoVinculo] = useState('');
  const [selectedMateriaVinculo, setSelectedMateriaVinculo] = useState('');
  const [selectedDocenteVinculo, setSelectedDocenteVinculo] = useState('');

  const [extEstablecimiento, setExtEstablecimiento] = useState('');
  const [extHorario, setExtHorario] = useState('18:30 - 22:00');
  const [extDias, setExtDias] = useState('Lunes y Miércoles');
  const [conflictAlert, setConflictAlert] = useState(null);

  const [histStep, setHistStep] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: estData } = await supabase.from('estudiantes').select('*').order('apellido');
      setEstudiantes(estData || []);

      const { data: docData } = await supabase.from('docentes').select('*').order('apellido');
      setDocentes(docData || []);

      const { data: curData } = await supabase.from('cursos').select('*').order('anio');
      setCursos(curData || []);

      const { data: matData } = await supabase.from('materias').select('*');
      setMaterias(matData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCrearEstudiante = async (e) => {
    e.preventDefault();
    try {
      const record = { dni: newDni.trim(), cuil: newCuil.trim(), apellido: newApellido.trim(), nombre: newNombre.trim(), estado: 'activo' };
      const { error } = await supabase.from('estudiantes').insert(record);
      if (error) throw error;

      Swal.fire({ icon: 'success', title: 'Legajo Creado', text: `Se creó el legajo de ${newApellido}, ${newNombre} con éxito.`, timer: 1500, showConfirmButton: false });
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleCrearDocente = async (e) => {
    e.preventDefault();
    try {
      const record = { dni: docDni.trim(), cuil: docCuil.trim(), apellido: docApellido.trim(), nombre: docNombre.trim(), email: docEmail.trim(), telefono: docTelefono.trim(), titulo: docTitulo.trim(), activo: true };
      const { error } = await supabase.from('docentes').insert(record);
      if (error) throw error;

      Swal.fire({ icon: 'success', title: 'Docente Registrado', text: `Prof. ${docApellido}, ${docNombre} incorporado a la plantilla de legajos docentes.` });
      setShowDocenteModal(false);
      await loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleVincularMateriaEnSecretaria = async (e) => {
    e.preventDefault();
    if (!selectedMateriaVinculo || !selectedDocenteVinculo) {
      Swal.fire('Error', 'Seleccione la materia y el docente a vincular.', 'error');
      return;
    }

    try {
      await supabase.from('docente_materia').delete().eq('materia_id', selectedMateriaVinculo);
      const { error } = await supabase.from('docente_materia').insert({ materia_id: selectedMateriaVinculo, docente_id: selectedDocenteVinculo, cargo: 'titular' });
      if (error) throw error;

      Swal.fire({ icon: 'success', title: 'Vinculación Exitosa', text: 'Se asignó el docente a la materia seleccionada.' });
      setSelectedMateriaVinculo('');
      setSelectedDocenteVinculo('');
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    }
  };

  const handleVerificarConflictoDDJJ = () => {
    if (extHorario.includes('18:30') || extHorario.includes('19:00') || extHorario.includes('20:00')) {
      setConflictAlert('⚠️ POSIBLE INCOMPATIBILIDAD HORARIA: El horario declarado en la escuela externa se superpone con el Turno Noche del CENS 454 (18:30 a 22:15 hs).');
    } else {
      setConflictAlert('✅ SIN CONFLICTO DETECTADO: El horario externo declarado es compatible.');
    }
  };

  const handleEmitirCertificado = (est, tipo) => {
    const docText = `====================================================================\n${tipo.toUpperCase()} - CENS N° 454 ESTEBAN ECHEVERRÍA\n====================================================================\n\nEstudiante: ${est.apellido.toUpperCase()}, ${est.nombre.toUpperCase()}\nDNI: ${est.dni}\nFecha: ${new Date().toLocaleDateString('es-AR')}`;
    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo.replaceAll(' ', '_')}_${est.dni}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredEstudiantes = estudiantes.filter((e) => e.apellido.toLowerCase().includes(search.toLowerCase()) || e.nombre.toLowerCase().includes(search.toLowerCase()) || e.dni.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#006384]" />
            Módulo de Secretaría & Gestión Administrativa
          </h1>
          <p className="text-xs text-gray-500 mt-1">CENS N° 454 - Esteban Echeverría (Región 5)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-gold font-bold text-xs py-2.5 px-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Crear Legajo Estudiante
          </button>
          <button onClick={() => setShowDocenteModal(true)} className="btn-primary font-bold text-xs py-2.5 px-4 flex items-center gap-2 bg-[#006384]">
            <UserPlus className="w-4 h-4" /> Registrar Docente
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold">
        <button onClick={() => setActiveTab('estudiantes')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'estudiantes' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Users className="w-4 h-4" /> 1. Estudiantes</button>
        <button onClick={() => setActiveTab('titulos')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'titulos' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Award className="w-4 h-4" /> 2. Títulos y Egresados</button>
        <button onClick={() => setActiveTab('salidas')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'salidas' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Compass className="w-4 h-4" /> 3. Salidas Educativas</button>
        <button onClick={() => setActiveTab('historica')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'historica' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><History className="w-4 h-4" /> 4. Carga Histórica</button>
        <button onClick={() => setActiveTab('bajas')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'bajas' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><UserX className="w-4 h-4" /> 5. Bajas y Pases</button>
        <button onClick={() => setActiveTab('docentes_ddjj')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'docentes_ddjj' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Briefcase className="w-4 h-4" /> 6. Docentes, DDJJ y Materias</button>
      </div>

      {activeTab === 'estudiantes' && (
        <div className="space-y-4">
          <div className="card p-4 bg-white">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Búsqueda por DNI o Nombre..." className="field-soft pl-9 text-xs" />
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                <tr>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">DNI</th>
                  <th className="py-3 px-4 text-center">Calificador Inline</th>
                  <th className="py-3 px-4 text-center">Constancias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredEstudiantes.map((est) => (
                  <tr key={est.id} className="hover:bg-[#F4FAFF]">
                    <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{est.apellido}, {est.nombre}</td>
                    <td className="py-3.5 px-4 font-mono">{est.dni}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">1°: 8.5</span>
                        <span className="px-2 py-0.5 rounded bg-[#F5C442]/30 text-amber-900">2°: 6.0</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">3°: 9.0</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-1">
                      <button onClick={() => handleEmitirCertificado(est, 'Certificado Alumno Regular')} className="btn-primary text-[10px] py-1 px-2 bg-[#006384]">Alumno Regular</button>
                      <button onClick={() => handleEmitirCertificado(est, 'Constancia Examen')} className="btn-primary text-[10px] py-1 px-2 bg-[#0B7EA5]">Constancia Examen</button>
                      <button onClick={() => handleEmitirCertificado(est, 'Analítico Parcial')} className="btn-gold text-[10px] py-1 px-2">Analítico Parcial</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'docentes_ddjj' && (
        <div className="space-y-6">
          <form onSubmit={handleVincularMateriaEnSecretaria} className="card p-6 bg-white space-y-4">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#006384]" /> Vincular Docente a Materia Existente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">1. Curso:</label>
                <select value={selectedCursoVinculo} onChange={(e) => setSelectedCursoVinculo(e.target.value)} className="field-soft text-xs font-semibold">
                  <option value="">-- Seleccionar Curso --</option>
                  {cursos.map((c) => (<option key={c.id} value={c.id}>{c.anio}° "{c.division}" - {c.orientacion} ({c.turno})</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">2. Asignatura del Curso:</label>
                <select value={selectedMateriaVinculo} onChange={(e) => setSelectedMateriaVinculo(e.target.value)} className="field-soft text-xs font-semibold">
                  <option value="">-- Seleccionar Materia --</option>
                  {materias.filter((m) => !selectedCursoVinculo || m.curso_id === selectedCursoVinculo).map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">3. Docente:</label>
                <select value={selectedDocenteVinculo} onChange={(e) => setSelectedDocenteVinculo(e.target.value)} className="field-soft text-xs font-semibold">
                  <option value="">-- Seleccionar Docente --</option>
                  {docentes.map((d) => (<option key={d.id} value={d.id}>Prof. {d.apellido}, {d.nombre}</option>))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-gold text-xs py-2 px-6 font-bold">Confirmar Vinculación Docente-Materia</button>
            </div>
          </form>

          <div className="card p-6 bg-white space-y-4">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#006384]" /> Declaración Jurada de Cargos (DDJJ) e Incompatibilidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" value={extEstablecimiento} onChange={(e) => setExtEstablecimiento(e.target.value)} placeholder="Establecimiento Externo" className="field-soft text-xs" />
              <input type="text" value={extHorario} onChange={(e) => setExtHorario(e.target.value)} placeholder="Horario Externo (Ej: 18:30 a 21:00 hs)" className="field-soft text-xs" />
            </div>

            <div className="pt-2">
              <button onClick={handleVerificarConflictoDDJJ} className="btn-gold text-xs py-2 px-5">Verificar Incompatibilidad Horaria</button>
            </div>

            {conflictAlert && <div className="p-3 rounded-xl bg-amber-50 border text-xs font-bold text-amber-900">{conflictAlert}</div>}
          </div>

          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <span className="font-heading text-sm">Nómina de Legajos Docentes ({docentes.length})</span>
              <button onClick={() => setShowDocenteModal(true)} className="btn-primary text-xs py-1.5 px-3">+ Registrar Docente</button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                <tr>
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-4">DNI / CUIL</th>
                  <th className="py-3 px-4">Título Habilitante</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {docentes.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F4FAFF]">
                    <td className="py-3 px-4 font-bold">{d.apellido}, {d.nombre}</td>
                    <td className="py-3 px-4 font-mono">{d.dni} ({d.cuil || '-'})</td>
                    <td className="py-3 px-4">{d.titulo || 'Profesor/a Secundario'}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">🟢 Activo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCrearEstudiante} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Crear Legajo de Estudiante</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="DNI *" value={newDni} onChange={(e) => setNewDni(e.target.value)} className="field-soft text-xs" required />
              <input type="text" placeholder="CUIL" value={newCuil} onChange={(e) => setNewCuil(e.target.value)} className="field-soft text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Apellido *" value={newApellido} onChange={(e) => setNewApellido(e.target.value)} className="field-soft text-xs" required />
              <input type="text" placeholder="Nombre *" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} className="field-soft text-xs" required />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-xs font-bold rounded-lg">Cancelar</button>
              <button type="submit" className="btn-gold text-xs py-2 px-4 font-bold">Guardar Legajo</button>
            </div>
          </form>
        </div>
      )}

      {showDocenteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCrearDocente} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Registrar Nuevo Legajo Docente</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="DNI *" value={docDni} onChange={(e) => setDocDni(e.target.value)} className="field-soft text-xs" required />
              <input type="text" placeholder="CUIL *" value={docCuil} onChange={(e) => setDocCuil(e.target.value)} className="field-soft text-xs" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Apellido *" value={docApellido} onChange={(e) => setDocApellido(e.target.value)} className="field-soft text-xs" required />
              <input type="text" placeholder="Nombre *" value={docNombre} onChange={(e) => setDocNombre(e.target.value)} className="field-soft text-xs" required />
            </div>
            <input type="text" placeholder="Título Habilitante" value={docTitulo} onChange={(e) => setDocTitulo(e.target.value)} className="field-soft text-xs" />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowDocenteModal(false)} className="px-4 py-2 bg-gray-200 text-xs font-bold rounded-lg">Cancelar</button>
              <button type="submit" className="btn-gold text-xs py-2 px-4 font-bold">Registrar Docente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
