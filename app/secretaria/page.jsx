"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import {
  Users, UserPlus, FileText, Search, Award, Compass, History, UserX, Briefcase, CheckCircle2, AlertTriangle, Plus, Clock, BookOpen, ShieldAlert
} from 'lucide-react';

export default function SecretariaPanelPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('estudiantes');
  const [docenteSubTab, setDocenteSubTab] = useState('lista'); // lista, ddjj

  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [search, setSearch] = useState('');
  const [searchDocente, setSearchDocente] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Legajo Estudiante
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDni, setNewDni] = useState('');
  const [newCuil, setNewCuil] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newNombre, setNewNombre] = useState('');

  // Modal Registrar Nuevo Docente (Captura 4)
  const [showDocenteModal, setShowDocenteModal] = useState(false);
  const [docCuil, setDocCuil] = useState('');
  const [docDni, setDocDni] = useState('');
  const [docNombre, setDocNombre] = useState('');
  const [docApellido, setDocApellido] = useState('');
  const [docGenero, setDocGenero] = useState('Masculino');
  const [docFechaNac, setDocFechaNac] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docTelefono, setDocTelefono] = useState('');
  const [docTitulo, setDocTitulo] = useState('');
  const [docDomicilio, setDocDomicilio] = useState('');
  const [docLocalidad, setDocLocalidad] = useState('Ezeiza');
  const [docNumLegajo, setDocNumLegajo] = useState('');
  const [docSituacionRevista, setDocSituacionRevista] = useState('Titular');
  const [docFechaIngreso, setDocFechaIngreso] = useState('');

  // Vincular Docente a Materia
  const [selectedCursoVinculo, setSelectedCursoVinculo] = useState('');
  const [selectedMateriaVinculo, setSelectedMateriaVinculo] = useState('');
  const [selectedDocenteVinculo, setSelectedDocenteVinculo] = useState('');

  // DDJJ
  const [extEstablecimiento, setExtEstablecimiento] = useState('');
  const [extHorario, setExtHorario] = useState('18:30 - 22:00');
  const [extDias, setExtDias] = useState('Lunes y Miércoles');
  const [conflictAlert, setConflictAlert] = useState(null);

  const [histStep, setHistStep] = useState(1);

  // Restricción de acceso: Solo Directivo (admin) puede acceder a Secretaría
  if (role !== 'admin') {
    return (
      <div className="card p-8 bg-white max-w-xl mx-auto space-y-4 text-center my-12">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold font-heading text-[#0D2A3E]">Acceso Restringido para Secretaría</h2>
        <p className="text-xs text-gray-600">
          El módulo de Secretaría y Legajos está reservado únicamente para el <strong>Equipo Directivo / Administrador</strong>.
        </p>
      </div>
    );
  }

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

  const handleCrearDocenteModalCompleto = async (e) => {
    e.preventDefault();
    if (!docDni || !docNombre || !docApellido) {
      Swal.fire('Error', 'Ingrese DNI, Nombre y Apellido del docente.', 'error');
      return;
    }

    try {
      const record = {
        cuil: docCuil.trim(),
        dni: docDni.trim(),
        nombre: docNombre.trim(),
        apellido: docApellido.trim(),
        genero: docGenero,
        fecha_nacimiento: docFechaNac || null,
        email: docEmail.trim(),
        telefono: docTelefono.trim(),
        titulo: docTitulo.trim() || 'Profesor/a Secundario',
        domicilio: docDomicilio.trim(),
        localidad: docLocalidad.trim(),
        numero_legajo: docNumLegajo.trim(),
        situacion_revista: docSituacionRevista,
        fecha_ingreso: docFechaIngreso || null,
        activo: true,
      };

      const { error } = await supabase.from('docentes').insert(record);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Docente Registrado',
        text: `Prof. ${docApellido}, ${docNombre} incorporado a la plantilla de legajos docentes.`,
      });

      setShowDocenteModal(false);
      setDocCuil('');
      setDocDni('');
      setDocNombre('');
      setDocApellido('');
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
  const filteredDocentes = docentes.filter((d) => d.apellido.toLowerCase().includes(searchDocente.toLowerCase()) || d.nombre.toLowerCase().includes(searchDocente.toLowerCase()) || (d.dni && d.dni.includes(searchDocente)));

  return (
    <div className="space-y-6">
      {/* Header Principal de Secretaría */}
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
            <UserPlus className="w-4 h-4" /> + Registrar Docente
          </button>
        </div>
      </div>

      {/* Selector de Sub-Pestañas Oficiales */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold">
        <button onClick={() => setActiveTab('estudiantes')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'estudiantes' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Users className="w-4 h-4" /> 1. Estudiantes</button>
        <button onClick={() => setActiveTab('titulos')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'titulos' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Award className="w-4 h-4" /> 2. Títulos y Egresados</button>
        <button onClick={() => setActiveTab('salidas')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'salidas' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Compass className="w-4 h-4" /> 3. Salidas Educativas</button>
        <button onClick={() => setActiveTab('historica')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'historica' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><History className="w-4 h-4" /> 4. Carga Histórica</button>
        <button onClick={() => setActiveTab('bajas')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'bajas' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><UserX className="w-4 h-4" /> 5. Bajas y Pases</button>
        <button onClick={() => setActiveTab('docentes_ddjj')} className={`py-3 px-4 flex items-center gap-2 border-b-2 ${activeTab === 'docentes_ddjj' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'}`}><Briefcase className="w-4 h-4" /> 🎓 Docentes y DDJJ</button>
      </div>

      {/* ------------------- SUB-PESTAÑA 1: ESTUDIANTES ------------------- */}
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

      {/* ------------------- SUB-PESTAÑA 6: DOCENTES Y DDJJ (Capturas 3 y 4) ------------------- */}
      {activeTab === 'docentes_ddjj' && (
        <div className="space-y-6">
          {/* Sub-Header Píldoras: Lista de Docentes | Declaraciones Juradas (Captura 3) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDocenteSubTab('lista')}
                className={`py-2 px-5 rounded-full text-xs font-bold transition-all ${
                  docenteSubTab === 'lista'
                    ? 'bg-[#006384] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎓 Lista de Docentes
              </button>
              <button
                onClick={() => setDocenteSubTab('ddjj')}
                className={`py-2 px-5 rounded-full text-xs font-bold transition-all ${
                  docenteSubTab === 'ddjj'
                    ? 'bg-[#006384] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 Declaraciones Juradas
              </button>
            </div>

            {/* Búsqueda + Botón Registrar Docente (Captura 3) */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchDocente}
                  onChange={(e) => setSearchDocente(e.target.value)}
                  placeholder="Buscar docente por apellido, nombre o DNI..."
                  className="field-soft pl-9 text-xs py-1.5 w-64"
                />
              </div>

              <button
                onClick={() => setShowDocenteModal(true)}
                className="btn-gold font-bold text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs"
              >
                + Registrar Docente
              </button>
            </div>
          </div>

          {/* Formulario Vincular Docente a Materia */}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">3. Docente a Asignar:</label>
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

          {/* VISTA A: Lista de Docentes */}
          {docenteSubTab === 'lista' && (
            <div className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <span className="font-heading text-sm">Nómina Oficial de Docentes ({filteredDocentes.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                    <tr>
                      <th className="py-3 px-4">Docente</th>
                      <th className="py-3 px-4">DNI / CUIL</th>
                      <th className="py-3 px-4">Título Principal</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredDocentes.map((d) => (
                      <tr key={d.id} className="hover:bg-[#F4FAFF]">
                        <td className="py-3 px-4 font-bold">{d.apellido}, {d.nombre}</td>
                        <td className="py-3 px-4 font-mono">{d.dni} <span className="text-[10px] text-gray-400">({d.cuil || '-'})</span></td>
                        <td className="py-3 px-4">{d.titulo || 'Profesor/a Secundario'}</td>
                        <td className="py-3 px-4 text-gray-600">{d.email || d.telefono || 'Sin datos'}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">🟢 Activo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA B: Declaraciones Juradas */}
          {docenteSubTab === 'ddjj' && (
            <div className="card p-6 bg-white space-y-4">
              <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#006384]" /> Declaración Jurada de Cargos (DDJJ) e Incompatibilidad
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={extEstablecimiento} onChange={(e) => setExtEstablecimiento(e.target.value)} placeholder="Establecimiento Externo Declarado" className="field-soft text-xs" />
                <input type="text" value={extHorario} onChange={(e) => setExtHorario(e.target.value)} placeholder="Horario Externo (Ej: 18:30 a 21:00 hs)" className="field-soft text-xs" />
              </div>

              <div className="pt-2">
                <button onClick={handleVerificarConflictoDDJJ} className="btn-gold text-xs py-2 px-5">Verificar Incompatibilidad Horaria</button>
              </div>

              {conflictAlert && <div className="p-3 rounded-xl bg-amber-50 border text-xs font-bold text-amber-900">{conflictAlert}</div>}
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO DOCENTE (Captura 4) */}
      {showDocenteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCrearDocenteModalCompleto} className="bg-[#0D2A3E] rounded-2xl max-w-2xl w-full text-white overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0D2A3E]">
              <h3 className="text-lg font-bold font-heading text-white">Registrar Nuevo Docente</h3>
              <button type="button" onClick={() => setShowDocenteModal(false)} className="text-gray-300 hover:text-white font-bold text-xs">Cerrar ✕</button>
            </div>

            <div className="p-6 space-y-6 bg-white text-gray-800 overflow-y-auto flex-1">
              {/* DATOS PERSONALES (Captura 4) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#006384] uppercase tracking-wider">
                  Datos Personales
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">CUIL (Sin guiones)</label>
                    <input type="text" value={docCuil} onChange={(e) => setDocCuil(e.target.value)} placeholder="Ej: 20345678901" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">DNI (Sin guiones) *</label>
                    <input type="text" value={docDni} onChange={(e) => setDocDni(e.target.value)} placeholder="Ej: 34567890" className="field-soft text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nombre *</label>
                    <input type="text" value={docNombre} onChange={(e) => setDocNombre(e.target.value)} placeholder="Nombre" className="field-soft text-xs" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Apellido *</label>
                    <input type="text" value={docApellido} onChange={(e) => setDocApellido(e.target.value)} placeholder="Apellido" className="field-soft text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Género</label>
                    <select value={docGenero} onChange={(e) => setDocGenero(e.target.value)} className="field-soft text-xs">
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fecha Nacimiento</label>
                    <input type="date" value={docFechaNac} onChange={(e) => setDocFechaNac(e.target.value)} className="field-soft text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={docEmail} onChange={(e) => setDocEmail(e.target.value)} placeholder="docente@gmail.com" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Teléfono</label>
                    <input type="text" value={docTelefono} onChange={(e) => setDocTelefono(e.target.value)} placeholder="11 2345-6789" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Título Principal</label>
                    <input type="text" value={docTitulo} onChange={(e) => setDocTitulo(e.target.value)} placeholder="Ej: Prof. de Historia" className="field-soft text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Domicilio</label>
                    <input type="text" value={docDomicilio} onChange={(e) => setDocDomicilio(e.target.value)} placeholder="Domicilio" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Localidad</label>
                    <input type="text" value={docLocalidad} onChange={(e) => setDocLocalidad(e.target.value)} placeholder="Ezeiza" className="field-soft text-xs" />
                  </div>
                </div>
              </div>

              {/* CONTROL DE LEGAJO ADMINISTRATIVO (Captura 4) */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-bold text-[#006384] uppercase tracking-wider">
                  Control de Legajo Administrativo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Número de Legajo</label>
                    <input type="text" value={docNumLegajo} onChange={(e) => setDocNumLegajo(e.target.value)} placeholder="Ej. LEG-2026-09" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Situación de Revista</label>
                    <select value={docSituacionRevista} onChange={(e) => setDocSituacionRevista(e.target.value)} className="field-soft text-xs">
                      <option value="Titular">Titular</option>
                      <option value="Provisional">Provisional</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fecha Ingreso Escuela</label>
                    <input type="date" value={docFechaIngreso} onChange={(e) => setDocFechaIngreso(e.target.value)} className="field-soft text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDocenteModal(false)} className="px-4 py-2 bg-gray-300 text-gray-700 text-xs font-bold rounded-lg">Cancelar</button>
              <button type="submit" className="btn-gold text-xs py-2 px-6 font-bold shadow-md">Registrar Docente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
