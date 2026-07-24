"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { Users, UserPlus, FileText, Trash2, Printer, Search, ShieldAlert } from 'lucide-react';

export default function SecretariaPanelPage() {
  const { role } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Student Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDni, setNewDni] = useState('');
  const [newCuil, setNewCuil] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newDireccion, setNewDireccion] = useState('');

  useEffect(() => {
    loadEstudiantes();
  }, []);

  async function loadEstudiantes() {
    setLoading(true);
    try {
      const { data } = await supabase.from('estudiantes').select('*').order('apellido');
      if (data && data.length > 0) {
        setEstudiantes(data);
      } else {
        setEstudiantes([
          { id: 'e1', dni: '38492011', cuil: '20-38492011-4', apellido: 'García', nombre: 'Carlos Eduardo', estado: 'activo', telefono: '11-4920-1122' },
          { id: 'e2', dni: '40123984', cuil: '27-40123984-3', apellido: 'Rodríguez', nombre: 'María Belén', estado: 'activo', telefono: '11-5839-4455' },
          { id: 'e3', dni: '35881920', cuil: '20-35881920-9', apellido: 'López', nombre: 'Juan Ignacio', estado: 'baja', telefono: '11-3829-1029' },
        ]);
      }
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
      setNewDni('');
      setNewCuil('');
      setNewApellido('');
      setNewNombre('');
      setNewEmail('');
      setNewTelefono('');
      setNewDireccion('');
      await loadEstudiantes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Creación',
        text: err.message,
      });
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('estudiantes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      Swal.fire({
        icon: 'info',
        title: 'Estado Actualizado',
        text: `Estado cambiado a ${nuevoEstado}.`,
        timer: 1200,
        showConfirmButton: false,
      });

      await loadEstudiantes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEliminarDefinitivo = async (id, nombreCompleto) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar Definitivamente?',
      text: `Esta acción borrará todas las asistencias, calificaciones y legajo de ${nombreCompleto}. No se puede deshacer.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar de raíz',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        const { data, error } = await supabase.rpc('rpc_eliminar_estudiante_definitivo', {
          p_estudiante_id: id,
        });

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Legajo y registros purgados del sistema.',
          timer: 1500,
          showConfirmButton: false,
        });

        await loadEstudiantes();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message,
        });
      }
    }
  };

  const handleEmitirCertificado = (est) => {
    const docText = `
====================================================================
CERTIFICADO DE ALUMNO REGULAR - CENS N° 454
ESTEBAN ECHEVERRÍA (REGIÓN 5)
====================================================================

La Dirección del Centro de Estudios de Nivel Secundario N° 454 de Esteban Echeverría CERTIFICA que el/la estudiante:

  APELLIDO Y NOMBRE: ${est.apellido.toUpperCase()}, ${est.nombre.toUpperCase()}
  DNI: ${est.dni}
  CUIL: ${est.cuil || 'S/D'}

Se encuentra registrado/a como ALUMNO/A REGULAR de esta institución durante el Ciclo Lectivo ${new Date().getFullYear()}.

Se expide el presente certificado a pedido del interesado/a para ser presentado ante las autoridades que lo requieran.

Esteban Echeverría, ${new Date().toLocaleDateString('es-AR')}.

__________________________________________
Firma y Sello Dirección CENS N° 454
    `.trim();

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificado_AlumnoRegular_${est.dni}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredEstudiantes = estudiantes.filter((e) =>
    e.apellido.toLowerCase().includes(search.toLowerCase()) ||
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.dni.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#006384]" />
            Secretaría & Gestión de Legajos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Altas, bajas, pases y emisión de certificados CENS 454 (Esteban Echeverría)
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

      {/* Buscador */}
      <div className="card p-4 bg-white">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar legajo por apellido, nombre o DNI..."
            className="field-soft pl-9 text-xs"
          />
        </div>
      </div>

      {/* Tabla de Legajos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold font-heading border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">DNI / CUIL</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4 text-center">Estado Legajo</th>
                <th className="py-3 px-4 text-center">Certificados & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                    Cargando nómina de legajos...
                  </td>
                </tr>
              ) : filteredEstudiantes.map((est) => (
                <tr key={est.id} className="hover:bg-[#F4FAFF] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                    {est.apellido}, {est.nombre}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-600">
                    <div>{est.dni}</div>
                    <div className="text-[10px] text-gray-400">{est.cuil || '-'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{est.telefono || 'Sin registrar'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={est.estado}
                      onChange={(e) => handleCambiarEstado(est.id, e.target.value)}
                      className="field-soft text-[11px] py-1 font-bold text-center"
                    >
                      <option value="activo">🟢 Activo</option>
                      <option value="baja">🔴 Baja / Pase</option>
                      <option value="egresado">🎓 Egresado</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-center space-x-2">
                    <button
                      onClick={() => handleEmitirCertificado(est)}
                      className="btn-primary text-[11px] py-1 px-2.5 bg-[#006384]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Certificado Alumno Regular
                    </button>

                    {role === 'admin' && (
                      <button
                        onClick={() => handleEliminarDefinitivo(est.id, `${est.apellido}, ${est.nombre}`)}
                        className="btn-primary text-[11px] py-1 px-2 bg-red-600 hover:bg-red-700"
                        title="Eliminar definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Legajo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCrearEstudiante} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">
              Crear Nuevo Legajo de Estudiante
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DNI *</label>
                <input
                  type="text"
                  value={newDni}
                  onChange={(e) => setNewDni(e.target.value)}
                  className="field-soft text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CUIL</label>
                <input
                  type="text"
                  value={newCuil}
                  onChange={(e) => setNewCuil(e.target.value)}
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  value={newApellido}
                  onChange={(e) => setNewApellido(e.target.value)}
                  className="field-soft text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="field-soft text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                  className="field-soft text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Domicilio en Esteban Echeverría</label>
              <input
                type="text"
                value={newDireccion}
                onChange={(e) => setNewDireccion(e.target.value)}
                className="field-soft text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-gold text-xs py-2 px-4 font-bold"
              >
                Guardar Legajo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
