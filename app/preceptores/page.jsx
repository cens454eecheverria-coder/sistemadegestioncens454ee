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
  FileText,
  Calendar
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

  const todayStr = new Date().toISOString().split('T')[0];

  const [showInscribirModal, setShowInscribirModal] = useState(false);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [ciudadNacimiento, setCiudadNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
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

  const handleOpenInscribirModal = () => {
    if (selectedCurso) {
      setCursoAsignadoId(selectedCurso.id);
    } else if (cursos.length > 0) {
      setCursoAsignadoId(cursos[0].id);
    }
    setShowInscribirModal(true);
  };

  async function loadEstudiantesYAsistencias(cursoId, fechaSel) {
    try {
      let ids = [];
      const { data: acData } = await supabase.from('alumnos_cursos').select('estudiante_id').eq('curso_id', cursoId);
      if (acData && acData.length > 0) {
        ids = acData.map((ac) => ac.estudiante_id);
      }

      let eData = [];
      if (ids.length > 0) {
        const { data: d1 } = await supabase.from('estudiantes').select('*').in('id', ids).order('apellido');
        eData = d1 || [];
      }

      try {
        const { data: d2 } = await supabase.from('estudiantes').select('*').eq('curso_id', cursoId).order('apellido');
        if (d2 && d2.length > 0) {
          const existingIds = new Set(eData.map((e) => e.id));
          d2.forEach((st) => {
            if (!existingIds.has(st.id)) eData.push(st);
          });
        }
      } catch (e) {
        // Ignorar si la columna curso_id no existe en la vista actual
      }

      setEstudiantes(eData);

      const { data: asData } = await supabase.from('asistencias').select('*').eq('curso_id', cursoId).eq('fecha', fechaSel);
      const asMap = {};
      if (asData) {
        asData.forEach((a) => {
          asMap[a.estudiante_id] = a.estado;
        });
      }
      setAsistencias(asMap);
    } catch (e) {
      console.error(e);
    }
  }
  const handleInscribirLegajoCompleto = async (e) => {
    e.preventDefault();
    const finalCursoId = cursoAsignadoId || (selectedCurso?.id) || (cursos.length > 0 ? cursos[0].id : '');
    
    if (!dni.trim() || !nombre.trim() || !apellido.trim() || !finalCursoId) {
      Swal.fire('Campos Obligatorios', 'Ingrese DNI, Nombre, Apellido y seleccione un Curso.', 'warning');
      return;
    }

    try {
      let payload = {
        dni: dni.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        genero,
        fecha_nacimiento: fechaNacimiento || null,
        ciudad_nacimiento: ciudadNacimiento.trim(),
        direccion: direccion.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        orientacion,
        numero_libro: numeroLibro.trim(),
        numero_folio: numeroFolio.trim(),
        fotocopia_dni: fotocopiaDni,
        partida_nacimiento: partidaNacimiento,
        certificado_estudios: certificadoEstudios,
        tipo_certificado: tipoCertificado.trim(),
        materias_adeudadas: materiasAdeudadas.trim(),
        estado: 'activo',
      };

      let estData = null;
      let { data, error: estErr } = await supabase.from('estudiantes').insert(payload).select().single();

      if (estErr) {
        console.warn('Reintentando insercion con campos base:', estErr.message);
        const basePayload = {
          dni: dni.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          estado: 'activo',
        };
        const { data: bData, error: bErr } = await supabase.from('estudiantes').insert(basePayload).select().single();
        if (bErr) throw bErr;
        estData = bData;
      } else {
        estData = data;
      }

      if (estData && estData.id) {
        await supabase.from('alumnos_cursos').insert({ estudiante_id: estData.id, curso_id: finalCursoId });
        try {
          await supabase.from('estudiantes').update({ curso_id: finalCursoId }).eq('id', estData.id);
        } catch (e) {
          // Ignorar si la columna curso_id no existe en la tabla estudiantes
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Estudiante Inscripto',
        text: 'Se registro el legajo de ' + apellido + ', ' + nombre + '.',
      });

      setShowInscribirModal(false);
      setDni('');
      setNombre('');
      setApellido('');
      setFechaNacimiento('');
      setCiudadNacimiento('');
      setDireccion('');

      const targetCurso = cursos.find((c) => c.id === finalCursoId) || selectedCurso;
      if (targetCurso) {
        setSelectedCurso(targetCurso);
        loadEstudiantesYAsistencias(targetCurso.id, fecha);
      }
    } catch (err) {
      Swal.fire('Error al Inscribir', err.message, 'error');
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

      await supabase.from('asistencias').delete().eq('curso_id', selectedCurso.id).eq('fecha', fecha);
      const { error } = await supabase.from('asistencias').insert(records);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Asistencia Guardada',
        text: 'Se registro el ausentismo del dia ' + fecha + '.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const setFechaAyer = () => {
    const d = new Date(fecha);
    d.setDate(d.getDate() - 1);
    setFecha(d.toISOString().split('T')[0]);
  };
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#006384]" /> Preceptoría & Toma de Asistencia
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registro diario de ausentismo, matriculación y control de asistencias CENS 454
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenInscribirModal}
            className="btn-gold font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4" /> + Inscribir Estudiante (Legajo Completo)
          </button>
          <button
            onClick={handleGuardarAsistencia}
            disabled={saving}
            className="btn-primary font-bold text-xs py-2.5 px-5 rounded-xl bg-[#006384] flex items-center gap-2 shadow-xs"
          >
            {saving ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Seleccionar Curso:</label>
          <select
            value={selectedCurso?.id || ''}
            onChange={(e) => {
              const c = cursos.find((item) => item.id === e.target.value);
              setSelectedCurso(c);
              setCursoAsignadoId(e.target.value);
            }}
            className="field-soft text-xs font-bold border-2 border-blue-500"
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.anio}° "{c.division}" - {c.orientacion} (Turno {c.turno})
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-gray-700">Fecha de Toma (Hoy o anterior):</label>
            <div className="flex gap-1.5 text-[11px] font-bold">
              <button onClick={() => setFecha(todayStr)} className="text-blue-600 hover:underline">
                Hoy
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={setFechaAyer} className="text-gray-600 hover:underline">
                ◀ Día Anterior
              </button>
            </div>
          </div>
          <input
            type="date"
            max={todayStr}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="field-soft text-xs font-bold border-2 border-slate-300"
          />
        </div>
      </div>

      <div className="card p-6 bg-[#FFFFFF] space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold font-heading text-[#0D2A3E]">
            Nómina de Alumnos: {selectedCurso ? selectedCurso.anio + '° "' + selectedCurso.division + '"' : ''} ({estudiantes.length} inscriptos)
          </h3>
          <span className="text-xs text-gray-500 font-semibold">Fecha: {fecha}</span>
        </div>
        {estudiantes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-bold text-gray-500">No hay estudiantes matriculados en este curso.</p>
            <p className="text-[11px]">Haz clic en "+ Inscribir Estudiante" para sumar alumnos al curso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                <tr>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">DNI</th>
                  <th className="py-3 px-4 text-center">Estado de Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {estudiantes.map((est) => {
                  const st = asistencias[est.id] || 'Presente';
                  return (
                    <tr key={est.id} className="hover:bg-[#F4FAFF]">
                      <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                        {est.apellido}, {est.nombre}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">{est.dni || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleAsistenciaChange(est.id, 'Presente')}
                            className={
                              'py-1.5 px-3 rounded-lg text-xs font-bold border ' +
                              (st === 'Presente'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-gray-50 text-gray-500 border-gray-200')
                            }
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => handleAsistenciaChange(est.id, 'Ausente')}
                            className={
                              'py-1.5 px-3 rounded-lg text-xs font-bold border ' +
                              (st === 'Ausente'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-gray-50 text-gray-500 border-gray-200')
                            }
                          >
                            Ausente
                          </button>
                          <button
                            onClick={() => handleAsistenciaChange(est.id, 'Justificado')}
                            className={
                              'py-1.5 px-3 rounded-lg text-xs font-bold border ' +
                              (st === 'Justificado'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-gray-50 text-gray-500 border-gray-200')
                            }
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
        )}
      </div>

      {showInscribirModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#0D2A3E]">Inscribir Estudiante (Legajo Institucional)</h3>
              <button onClick={() => setShowInscribirModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleInscribirLegajoCompleto} className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#006384] uppercase tracking-wider">👤 DATOS PERSONALES</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">DNI *</label>
                    <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="field-soft text-xs font-bold" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Nombre *</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="field-soft text-xs" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Apellido *</label>
                    <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} className="field-soft text-xs font-bold" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Curso Asignado *</label>
                    <select
                      value={cursoAsignadoId}
                      onChange={(e) => setCursoAsignadoId(e.target.value)}
                      className="field-soft text-xs font-bold border-2 border-blue-500 bg-blue-50/30"
                      required
                    >
                      {cursos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.anio}° "{c.division}" - {c.orientacion} ({c.turno})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Fecha de Nacimiento</label>
                    <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Lugar de Nacimiento</label>
                    <input type="text" value={ciudadNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} placeholder="Ej. Esteban Echeverría" className="field-soft text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Dirección / Domicilio</label>
                    <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Av. Fair 1230" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Email (Opcional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Teléfono (Opcional)</label>
                    <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="field-soft text-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold text-gray-700">📖 DATOS DEL LEGAJO INSTITUCIONAL (OPCIONALES)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Número de Libro</label>
                    <input type="text" value={numeroLibro} onChange={(e) => setNumeroLibro(e.target.value)} placeholder="Ej. Libro 12" className="field-soft text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Número de Folio</label>
                    <input type="text" value={numeroFolio} onChange={(e) => setNumeroFolio(e.target.value)} placeholder="Ej. Folio 45" className="field-soft text-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold text-gray-700">📄 DOCUMENTACIÓN ENTREGADA (OPCIONAL)</h4>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={fotocopiaDni} onChange={(e) => setFotocopiaDni(e.target.checked)} className="rounded text-blue-600" /> Fotocopia DNI
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={partidaNacimiento} onChange={(e) => setPartidaNacimiento(e.target.checked)} className="rounded text-blue-600" /> Partida de Nacimiento
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={certificadoEstudios} onChange={(e) => setCertificadoEstudios(e.target.checked)} className="rounded text-blue-600" /> Certificado Últs. Estudios
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowInscribirModal(false)} className="btn-secondary text-xs py-2 px-4">
                  Cancelar
                </button>
                <button type="submit" className="btn-gold font-bold text-xs py-2.5 px-6">
                  Guardar Legajo e Inscribir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}