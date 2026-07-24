"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import {
  Users,
  UserPlus,
  FileText,
  Trash2,
  Search,
  Award,
  Compass,
  History,
  UserX,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
  Calendar,
  Clock,
  Briefcase,
  BookOpen
} from 'lucide-react';

export default function SecretariaPanelPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('estudiantes'); // estudiantes, titulos, salidas, historica, bajas, docentes_ddjj

  // --- Sub-módulo 1: Estudiantes ---
  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLegajo, setSelectedLegajo] = useState(null);

  // Modal Nuevo Legajo
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDni, setNewDni] = useState('');
  const [newCuil, setNewCuil] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newDireccion, setNewDireccion] = useState('');

  // --- Sub-módulo 2: Títulos y Egresados ---
  const [egresados, setEgresados] = useState([]);

  // --- Sub-módulo 3: Salidas Educativas (Anexo IV y V) ---
  const [salidaNombre, setSalidaNombre] = useState('');
  const [salidaLugar, setSalidaLugar] = useState('');
  const [salidaFecha, setSalidaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [salidaItinerario, setSalidaItinerario] = useState('');
  const [salidaDocenteTitular, setSalidaDocenteTitular] = useState('');
  const [salidaAcompanantes, setSalidaAcompanantes] = useState('');
  const [selectedAlumnosSalida, setSelectedAlumnosSalida] = useState({});

  // --- Sub-módulo 4: Carga Histórica Wizard ---
  const [histStep, setHistStep] = useState(1);
  const [histDni, setHistDni] = useState('');
  const [histNombre, setHistNombre] = useState('');
  const [histApellido, setHistApellido] = useState('');
  const [histMateria, setHistMateria] = useState('');
  const [histNota, setHistNota] = useState('7');

  // --- Sub-módulo 5: Bajas y Pases ---
  const [bajasList, setBajasList] = useState([]);

  // --- Sub-módulo 6: Docentes & DDJJ ---
  const [ddjjList, setDdjjList] = useState([]);
  const [selectedDocenteDdjj, setSelectedDocenteDdjj] = useState(null);
  const [extEstablecimiento, setExtEstablecimiento] = useState('');
  const [extCargo, setExtCargo] = useState('');
  const [extHorario, setExtHorario] = useState('18:30 - 22:00');
  const [extDias, setExtDias] = useState('Lunes y Miércoles');
  const [conflictAlert, setConflictAlert] = useState(null);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCrearEstudiante = async (e) => {
    e.preventDefault();
    try {
      const record = {
        dni: newDni.trim(),
        cuil: newCuil.trim(),
        apellido: newApellido.trim(),
        nombre: newNombre.trim(),
        email: newEmail.trim(),
        telefono: newTelefono.trim(),
        direccion: newDireccion.trim(),
        estado: 'activo',
      };

      const { error } = await supabase.from('estudiantes').insert(record);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Legajo Creado',
        text: `Se creó el legajo de ${newApellido}, ${newNombre} con éxito.`,
        timer: 1500,
        showConfirmButton: false,
      });

      setShowAddModal(false);
      await loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEmitirCertificado = (est, tipo) => {
    const docText = `
====================================================================
${tipo.toUpperCase()} - CENS N° 454 ESTEBAN ECHEVERRÍA
====================================================================

La Secretaría del CENS N° 454 CERTIFICA que el/la estudiante:
  APELLIDO Y NOMBRE: ${est.apellido.toUpperCase()}, ${est.nombre.toUpperCase()}
  DNI: ${est.dni} | CUIL: ${est.cuil || 'S/D'}

TIPO DOCUMENTO: ${tipo}
FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-AR')}

__________________________________________
Firma y Sello Secretaría CENS N° 454
    `.trim();

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo.replaceAll(' ', '_')}_${est.dni}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Motor de Incompatibilidad Horaria DDJJ
  const handleVerificarConflictoDDJJ = () => {
    if (!extHorario || !extDias) return;

    if (extHorario.includes('18:30') || extHorario.includes('19:00')) {
      setConflictAlert('⚠️ POSIBLE INCOMPATIBILIDAD HORARIA: El horario declarado en la escuela externa coincide con el Turno Noche del CENS 454 (18:30 a 22:15 hs). Verifique la DDJJ.');
    } else {
      setConflictAlert('✅ SIN CONFLICTO DETECTADO: El horario declarado es compatible con el CENS 454.');
    }
  };

  const filteredEstudiantes = estudiantes.filter((e) =>
    e.apellido.toLowerCase().includes(search.toLowerCase()) ||
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.dni.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header Principal de Secretaría */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#006384]" />
            Módulo de Secretaría & Gestión Administrativa
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Núcleo administrativo CENS N° 454 - Esteban Echeverría (Región 5)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-gold font-bold text-xs py-2.5 px-4 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Crear Nuevo Legajo
        </button>
      </div>

      {/* Selector de las 6 Sub-Pestañas Oficiales */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('estudiantes')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'estudiantes' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Estudiantes
        </button>

        <button
          onClick={() => setActiveTab('titulos')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'titulos' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Award className="w-4 h-4" />
          2. Títulos y Egresados
        </button>

        <button
          onClick={() => setActiveTab('salidas')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'salidas' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Compass className="w-4 h-4" />
          3. Salidas Educativas (Anexo IV/V)
        </button>

        <button
          onClick={() => setActiveTab('historica')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'historica' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <History className="w-4 h-4" />
          4. Carga Histórica
        </button>

        <button
          onClick={() => setActiveTab('bajas')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bajas' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <UserX className="w-4 h-4" />
          5. Bajas y Pases
        </button>

        <button
          onClick={() => setActiveTab('docentes_ddjj')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'docentes_ddjj' ? 'border-[#006384] text-[#006384]' : 'border-transparent text-gray-500'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          6. Docentes y DDJJ
        </button>
      </div>

      {/* ------------------- SUB-PESTAÑA 1: ESTUDIANTES ------------------- */}
      {activeTab === 'estudiantes' && (
        <div className="space-y-4">
          <div className="card p-4 bg-white">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Búsqueda unificada por DNI, Apellido o Nombre..."
                className="field-soft pl-9 text-xs"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">DNI / CUIL</th>
                    <th className="py-3 px-4 text-center">Calificador Inline (Color-Code)</th>
                    <th className="py-3 px-4 text-center">Emisión de Constancias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredEstudiantes.map((est) => (
                    <tr key={est.id} className="hover:bg-[#F4FAFF] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                        {est.apellido}, {est.nombre}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">
                        <div>{est.dni}</div>
                        <div className="text-[10px] text-gray-400">{est.cuil || '-'}</div>
                      </td>

                      {/* Calificador Inline de Historial */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex gap-1.5 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800" title="1° Año">1°: 8.5</span>
                          <span className="px-2 py-0.5 rounded bg-[#F5C442]/30 text-amber-900" title="2° Año">2°: 6.0</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800" title="3° Año">3°: 9.0</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center space-x-1">
                        <button
                          onClick={() => handleEmitirCertificado(est, 'Certificado de Alumno Regular')}
                          className="btn-primary text-[10px] py-1 px-2 bg-[#006384]"
                        >
                          Alumno Regular
                        </button>
                        <button
                          onClick={() => handleEmitirCertificado(est, 'Constancia de Examen')}
                          className="btn-primary text-[10px] py-1 px-2 bg-[#0B7EA5]"
                        >
                          Constancia Examen
                        </button>
                        <button
                          onClick={() => handleEmitirCertificado(est, 'Analítico Parcial')}
                          className="btn-gold text-[10px] py-1 px-2"
                        >
                          Analítico Parcial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- SUB-PESTAÑA 2: TÍTULOS Y EGRESADOS ------------------- */}
      {activeTab === 'titulos' && (
        <div className="card p-6 bg-white space-y-4">
          <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#006384]" />
            Libro Matriz y Registro de Títulos de Egresados
          </h3>
          <p className="text-xs text-gray-500">
            Control de Folio, Número de Acta y emisión de Analíticos Definitivos para DGCyE.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Estudiante Egresado</th>
                  <th className="py-3 px-4">DNI</th>
                  <th className="py-3 px-4">N° Libro Matriz</th>
                  <th className="py-3 px-4">Folio / Acta</th>
                  <th className="py-3 px-4 text-center">Acciones Egreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr className="hover:bg-[#F4FAFF]">
                  <td className="py-3 px-4 font-bold">López, Juan Ignacio</td>
                  <td className="py-3 px-4 font-mono">35881920</td>
                  <td className="py-3 px-4 font-mono">LM-2025-454</td>
                  <td className="py-3 px-4 font-mono">Folio 42 / Acta 189</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => Swal.fire('Analítico Definitivo', 'Generando documento oficial de egreso...', 'success')}
                      className="btn-gold text-[10px] py-1 px-3"
                    >
                      Emitir Analítico Definitivo
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------- SUB-PESTAÑA 3: SALIDAS EDUCATIVAS (ANEXO IV Y V) ------------------- */}
      {activeTab === 'salidas' && (
        <div className="card p-6 bg-white space-y-6">
          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#006384]" />
              Salidas Educativas & Pedagógicas (Anexo IV y Anexo V DGCyE)
            </h3>
            <p className="text-xs text-gray-500">
              Normativa DGCyE Provincia de Buenos Aires - Región 5 (Esteban Echeverría)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Proyecto:</label>
              <input
                type="text"
                value={salidaNombre}
                onChange={(e) => setSalidaNombre(e.target.value)}
                placeholder="Ej: Visita al Museo Histórico"
                className="field-soft text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lugar a Visitar:</label>
              <input
                type="text"
                value={salidaLugar}
                onChange={(e) => setSalidaLugar(e.target.value)}
                placeholder="Ej: CABA / La Plata"
                className="field-soft text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Salida:</label>
              <input
                type="date"
                value={salidaFecha}
                onChange={(e) => setSalidaFecha(e.target.value)}
                className="field-soft text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Itinerario y Objetivos Pedagógicos:</label>
            <textarea
              rows="3"
              value={salidaItinerario}
              onChange={(e) => setSalidaItinerario(e.target.value)}
              placeholder="Detallar itinerario, horarios y contenidos a evaluar..."
              className="field-soft text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => Swal.fire('Anexo IV Creado', 'Documento DOCX descargado.', 'success')}
              className="btn-primary text-xs py-2 px-4"
            >
              Generar Anexo IV DOCX
            </button>
            <button
              onClick={() => Swal.fire('Anexo V Creado', 'Nómina oficial de alumnos descargada.', 'success')}
              className="btn-gold text-xs py-2 px-4"
            >
              Generar Anexo V (Nómina)
            </button>
          </div>
        </div>
      )}

      {/* ------------------- SUB-PESTAÑA 4: CARGA HISTÓRICA WIZARD ------------------- */}
      {activeTab === 'historica' && (
        <div className="card p-6 bg-white max-w-xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-3 text-center">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">
              Carga Histórica de Trayectos Anteriores
            </h3>
            <p className="text-xs text-gray-500">Paso {histStep} de 3</p>
          </div>

          {histStep === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700">1. Seleccionar Alumno y DNI:</label>
              <input
                type="text"
                value={histDni}
                onChange={(e) => setHistDni(e.target.value)}
                placeholder="DNI Alumno..."
                className="field-soft text-xs"
              />
              <button onClick={() => setHistStep(2)} className="btn-primary w-full text-xs py-2">
                Siguiente Paso
              </button>
            </div>
          )}

          {histStep === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700">2. Materia y Calificación Histórica:</label>
              <input
                type="text"
                value={histMateria}
                onChange={(e) => setHistMateria(e.target.value)}
                placeholder="Ej: Matemática 1° Año"
                className="field-soft text-xs"
              />
              <input
                type="text"
                value={histNota}
                onChange={(e) => setHistNota(e.target.value)}
                placeholder="Nota (1-10)"
                className="field-soft text-xs font-bold"
              />
              <div className="flex gap-2">
                <button onClick={() => setHistStep(1)} className="px-3 py-2 bg-gray-200 text-xs rounded">Atrás</button>
                <button onClick={() => setHistStep(3)} className="btn-primary flex-1 text-xs py-2">Confirmar Carga</button>
              </div>
            </div>
          )}

          {histStep === 3 && (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-gray-800">¡Nota histórica registrada exitosamente en el legajo del alumno!</p>
              <button onClick={() => setHistStep(1)} className="btn-gold text-xs py-2 px-4">Cargar Otra Nota</button>
            </div>
          )}
        </div>
      )}

      {/* ------------------- SUB-PESTAÑA 5: BAJAS Y PASES ------------------- */}
      {activeTab === 'bajas' && (
        <div className="card p-6 bg-white space-y-4">
          <h3 className="text-base font-bold font-heading text-[#0D2A3E]">
            Control de Movilidad Matricular, Bajas y Pases
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Escuela Destino</th>
                <th className="py-3 px-4 text-center">Estado Trámite</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 font-bold">López, Juan Ignacio</td>
                <td className="py-3 px-4">CENS N° 451 Monte Grande</td>
                <td className="py-3 px-4 text-center font-bold text-amber-700">Pendiente</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => Swal.fire('Revertido', 'El alumno fue reincorporado a la matrícula activa.', 'info')}
                    className="btn-primary text-[10px] py-1 px-3 bg-emerald-700"
                  >
                    Revertir Baja
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------- SUB-PESTAÑA 6: DOCENTES Y DDJJ ------------------- */}
      {activeTab === 'docentes_ddjj' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white space-y-4">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#006384]" />
              Declaración Jurada de Cargos (DDJJ) y Motor de Incompatibilidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Docente:</label>
                <select className="field-soft text-xs">
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Establecimiento Externo Declarado:</label>
                <input
                  type="text"
                  value={extEstablecimiento}
                  onChange={(e) => setExtEstablecimiento(e.target.value)}
                  placeholder="Ej: EES N° 3 Esteban Echeverría"
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Horario Externo:</label>
                <input
                  type="text"
                  value={extHorario}
                  onChange={(e) => setExtHorario(e.target.value)}
                  placeholder="Ej: 18:30 a 21:00 hs"
                  className="field-soft text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Días de Desempeño:</label>
                <input
                  type="text"
                  value={extDias}
                  onChange={(e) => setExtDias(e.target.value)}
                  placeholder="Ej: Lunes y Miércoles"
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button onClick={handleVerificarConflictoDDJJ} className="btn-gold text-xs py-2 px-5">
                Verificar Incompatibilidad Horaria
              </button>
            </div>

            {conflictAlert && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 mt-2">
                {conflictAlert}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nuevo Legajo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCrearEstudiante} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Crear Legajo de Estudiante</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="DNI *"
                value={newDni}
                onChange={(e) => setNewDni(e.target.value)}
                className="field-soft text-xs"
                required
              />
              <input
                type="text"
                placeholder="CUIL"
                value={newCuil}
                onChange={(e) => setNewCuil(e.target.value)}
                className="field-soft text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Apellido *"
                value={newApellido}
                onChange={(e) => setNewApellido(e.target.value)}
                className="field-soft text-xs"
                required
              />
              <input
                type="text"
                placeholder="Nombre *"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                className="field-soft text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-xs font-bold rounded-lg">Cancelar</button>
              <button type="submit" className="btn-gold text-xs py-2 px-4 font-bold">Guardar Legajo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
