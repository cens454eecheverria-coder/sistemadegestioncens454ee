"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import {
  ClipboardCheck,
  UserPlus,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Users,
  BookOpen,
  FileText
} from 'lucide-react';

export default function PreceptorPage() {
  const { cicloLectivo } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal Inscribir Estudiante Legajo Completo
  const [showInscribirModal, setShowInscribirModal] = useState(false);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudadNacimiento, setCiudadNacimiento] = useState('');
  const [orientacion, setOrientacion] = useState('Ciencias Sociales');
  const [cursoAsignadoId, setCursoAsignadoId] = useState('');
  const [numeroLibro, setNumeroLibro] = useState('');
  const [numeroFolio, setNumeroFolio] = useState('');
  const [fotocopiaDni, setFotocopiaDni] = useState(false);
  const [partidaNacimiento, setPartidaNacimiento] = useState(false);
  const [certificadoEstudios, setCertificadoEstudios] = useState(false);
  const [tipoCertificado, setTipoCertificado] = useState('');
  const [materiasAdeudadas, setMateriasAdeudadas] = useState('');

  useEffect(() => {
    loadCursos();
  }, [cicloLectivo]);

  useEffect(() => {
    if (selectedCurso) {
      loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    }
  }, [selectedCurso, fecha]);

  async function loadCursos() {
    try {
      const { data } = await supabase.from('cursos').select('*').order('anio');
      setCursos(data || []);
      if (data && data.length > 0) {
        setSelectedCurso(data[0]);
        setCursoAsignadoId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadEstudiantesYAsistencias(cursoId, fechaSel) {
    try {
      const { data: acData } = await supabase
        .from('alumnos_cursos')
        .select('estudiantes(*)')
        .eq('curso_id', cursoId);

      const estList = acData?.map((item) => item.estudiantes).filter(Boolean) || [];
      setEstudiantes(estList);

      const { data: asisData } = await supabase
        .from('asistencias')
        .select('*')
        .eq('curso_id', cursoId)
        .eq('fecha', fechaSel);

      const asisMap = {};
      if (asisData) {
        asisData.forEach((a) => {
          asisMap[a.estudiante_id] = a.estado;
        });
      }
      setAsistencias(asisMap);
    } catch (e) {
      console.error(e);
    }
  }

  const handleInscribirLegajoCompleto = async (e) => {
    e.preventDefault();
    if (!dni || !nombre || !apellido || !cursoAsignadoId) {
      Swal.fire('Error', 'Complete los campos obligatorios (*)', 'error');
      return;
    }

    try {
      // 1. Insertar Estudiante en Supabase
      const { data: estData, error: estErr } = await supabase
        .from('estudiantes')
        .insert({
          dni: dni.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          genero,
          fecha_nacimiento: fechaNacimiento || null,
          email: email.trim(),
          telefono: telefono.trim(),
          ciudad_nacimiento: ciudadNacimiento.trim(),
          orientacion,
          numero_libro: numeroLibro.trim(),
          numero_folio: numeroFolio.trim(),
          fotocopia_dni: fotocopiaDni,
          partida_nacimiento: partidaNacimiento,
          certificado_estudios: certificadoEstudios,
          tipo_certificado: tipoCertificado.trim(),
          materias_adeudadas: materiasAdeudadas.trim(),
          estado: 'activo',
        })
        .select()
        .single();

      if (estErr) throw estErr;

      // 2. Matricular en el Curso Asignado
      const { error: acErr } = await supabase.from('alumnos_cursos').insert({
        estudiante_id: estData.id,
        curso_id: cursoAsignadoId,
      });

      if (acErr) console.warn('Error al matricular en curso:', acErr.message);

      Swal.fire({
        icon: 'success',
        title: 'Estudiante Inscripto',
        text: `Legajo completo registrado para ${apellido}, ${nombre}.`,
      });

      setShowInscribirModal(false);
      setDni('');
      setNombre('');
      setApellido('');
      if (selectedCurso) loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleAsistenciaChange = (estId, estado) => {
    setAsistencias((prev) => ({ ...prev, [estId]: estado }));
  };

  const handleGuardarAsistencia = async () => {
    if (!selectedCurso) return;
    setSaving(true);

    try {
      const records = Object.entries(asistencias).map(([estId, estado]) => ({
        curso_id: selectedCurso.id,
        estudiante_id: estId,
        fecha,
        estado,
      }));

      await supabase
        .from('asistencias')
        .delete()
        .eq('curso_id', selectedCurso.id)
        .eq('fecha', fecha);

      if (records.length > 0) {
        await supabase.from('asistencias').insert(records);
      }

      Swal.fire({
        icon: 'success',
        title: 'Asistencia Guardada',
        text: `Planilla del día ${fecha} registrada con éxito.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Preceptoría */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#006384]" />
            Preceptoría & Toma de Asistencia Diaria
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registro diario de ausentismo, matriculación y partes de asistencia oficial CENS 454
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowInscribirModal(true)}
            className="btn-gold font-bold text-xs py-2.5 px-4 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            + Inscribir Estudiante (Legajo Completo)
          </button>
          <button
            onClick={handleGuardarAsistencia}
            disabled={saving}
            className="btn-primary text-xs py-2.5 px-4 font-bold flex items-center gap-2 bg-[#006384]"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      </div>

      {/* Selector de Curso y Fecha */}
      <div className="card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Curso:</label>
          <select
            value={selectedCurso?.id || ''}
            onChange={(e) => {
              const c = cursos.find((item) => item.id === e.target.value);
              setSelectedCurso(c);
              setCursoAsignadoId(c?.id || '');
            }}
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
          <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Toma:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="field-soft font-bold text-xs"
          />
        </div>
      </div>

      {/* Tabla de Asistencia */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <span className="font-heading text-sm">
            Nómina de Alumnos: {selectedCurso?.anio}° "{selectedCurso?.division}" ({estudiantes.length} inscriptos)
          </span>
          <span className="text-xs text-[#006384] font-semibold">
            Fecha: {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">DNI</th>
                <th className="py-3 px-4 text-center">Estado de Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {estudiantes.map((est) => {
                const estEstado = asistencias[est.id] || 'presente';
                return (
                  <tr key={est.id} className="hover:bg-[#F4FAFF]">
                    <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                      {est.apellido}, {est.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">{est.dni}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAsistenciaChange(est.id, 'presente')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                            estEstado === 'presente'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAsistenciaChange(est.id, 'ausente')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                            estEstado === 'ausente'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Ausente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAsistenciaChange(est.id, 'justificado')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                            estEstado === 'justificado'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Justificado
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INSCRIBIR ESTUDIANTE LEGAJO COMPLETO (Capturas 1 y 2) */}
      {showInscribirModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleInscribirLegajoCompleto}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">
                  Inscribir Estudiante (Legajo Completo)
                </h3>
                <p className="text-xs text-gray-500">Carga administrativa oficial de matriculación CENS 454</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInscribirModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                Cerrar ✕
              </button>
            </div>

            {/* SECCIÓN 1: DATOS PERSONALES (Captura 1) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#006384] flex items-center gap-1.5 uppercase tracking-wider">
                👤 Datos Personales
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">DNI *</label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Sin puntos"
                    className="field-soft text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className="field-soft text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Apellido completo"
                    className="field-soft text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Género</label>
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    className="field-soft text-xs"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro / No binario</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="field-soft text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="estudiante@email.com"
                    className="field-soft text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 11 5555-4444"
                    className="field-soft text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ciudad de Nacimiento</label>
                  <input
                    type="text"
                    value={ciudadNacimiento}
                    onChange={(e) => setCiudadNacimiento(e.target.value)}
                    placeholder="Ej. Buenos Aires"
                    className="field-soft text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Orientación</label>
                  <select
                    value={orientacion}
                    onChange={(e) => setOrientacion(e.target.value)}
                    className="field-soft text-xs font-semibold"
                  >
                    <option value="Ciencias Sociales">Ciencias Sociales</option>
                    <option value="Ciencias Naturales">Ciencias Naturales</option>
                    <option value="Economía y Administración">Economía y Administración</option>
                    <option value="Informática">Informática</option>
                    <option value="Artes">Artes</option>
                    <option value="Turismo">Turismo</option>
                    <option value="Agro y Ambiente">Agro y Ambiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Curso Asignado *</label>
                  <select
                    value={cursoAsignadoId}
                    onChange={(e) => setCursoAsignadoId(e.target.value)}
                    className="field-soft text-xs font-bold"
                    required
                  >
                    <option value="">-- Seleccione un curso --</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.anio}° "{c.division}" - {c.orientacion} ({c.turno})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL LEGAJO INSTITUCIONAL (Captura 2) */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-bold text-[#006384] flex items-center gap-1.5 uppercase tracking-wider">
                📖 Datos del Legajo Institucional
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Número de Libro</label>
                  <input
                    type="text"
                    value={numeroLibro}
                    onChange={(e) => setNumeroLibro(e.target.value)}
                    placeholder="Ej. Libro 4"
                    className="field-soft text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Número de Folio</label>
                  <input
                    type="text"
                    value={numeroFolio}
                    onChange={(e) => setNumeroFolio(e.target.value)}
                    placeholder="Ej. Folio 14"
                    className="field-soft text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DOCUMENTACIÓN ENTREGADA (Captura 2) */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-bold text-[#006384] flex items-center gap-1.5 uppercase tracking-wider">
                📄 Documentación Entregada
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#EEF5FA] p-3 rounded-xl">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fotocopiaDni}
                      onChange={(e) => setFotocopiaDni(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006384]"
                    />
                    Fotocopia DNI
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partidaNacimiento}
                      onChange={(e) => setPartidaNacimiento(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006384]"
                    />
                    Partida de Nacimiento
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certificadoEstudios}
                      onChange={(e) => setCertificadoEstudios(e.target.checked)}
                      className="w-4 h-4 rounded text-[#006384]"
                    />
                    Certificado Últimos Estudios
                  </label>
                  <input
                    type="text"
                    value={tipoCertificado}
                    onChange={(e) => setTipoCertificado(e.target.value)}
                    placeholder="Ej. Constancia Título en Trámite"
                    className="field-soft text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Materias Adeudadas Previas <span className="text-gray-400 font-normal">(Visible para todo el staff)</span>
                </label>
                <textarea
                  rows="2"
                  value={materiasAdeudadas}
                  onChange={(e) => setMateriasAdeudadas(e.target.value)}
                  placeholder="Listar materias y año en caso de adeudado (Ej: Geografía 2do, Matemática 1ro)."
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowInscribirModal(false)}
                className="px-4 py-2 bg-gray-200 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-gold text-xs py-2 px-6 font-bold shadow-md">
                Guardar Legajo e Inscribir
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
