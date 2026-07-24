"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { Users, UserPlus, FileText, Search, Award, Compass, History, UserX, Briefcase, CheckCircle2, AlertTriangle, Plus, Clock, BookOpen, ShieldAlert, RefreshCw, Trash2, ArrowRightLeft, AlertCircle } from "lucide-react";

export default function SecretariaPanelPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("estudiantes");
  const [docenteSubTab, setDocenteSubTab] = useState("lista");

  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [bajasPases, setBajasPases] = useState([]);

  const [search, setSearch] = useState("");
  const [searchDocente, setSearchDocente] = useState("");
  const [searchBaja, setSearchBaja] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDni, setNewDni] = useState("");
  const [newCuil, setNewCuil] = useState("");
  const [newApellido, setNewApellido] = useState("");
  const [newNombre, setNewNombre] = useState("");

  const [showDocenteModal, setShowDocenteModal] = useState(false);
  const [docCuil, setDocCuil] = useState("");
  const [docDni, setDocDni] = useState("");
  const [docNombre, setDocNombre] = useState("");
  const [docApellido, setDocApellido] = useState("");
  const [docGenero, setDocGenero] = useState("Masculino");
  const [docFechaNac, setDocFechaNac] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docTelefono, setDocTelefono] = useState("");
  const [docTitulo, setDocTitulo] = useState("");
  const [docDomicilio, setDocDomicilio] = useState("");
  const [docLocalidad, setDocLocalidad] = useState("Ezeiza");
  const [docNumLegajo, setDocNumLegajo] = useState("");
  const [docSituacionRevista, setDocSituacionRevista] = useState("Titular");
  const [docFechaIngreso, setDocFechaIngreso] = useState("");

  const [selectedCursoVinculo, setSelectedCursoVinculo] = useState("");
  const [selectedMateriaVinculo, setSelectedMateriaVinculo] = useState("");
  const [selectedDocenteVinculo, setSelectedDocenteVinculo] = useState("");

  const [showBajaModal, setShowBajaModal] = useState(false);
  const [selectedEstudianteBaja, setSelectedEstudianteBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState("Abandono");
  const [escuelaDestino, setEscuelaDestino] = useState("");
  const [observacionesBaja, setObservacionesBaja] = useState("");

  const [extEstablecimiento, setExtEstablecimiento] = useState("");
  const [extHorario, setExtHorario] = useState("18:30 - 22:00");
  const [conflictAlert, setConflictAlert] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: estData } = await supabase.from("estudiantes").select("*").order("apellido");
      setEstudiantes(estData || []);
      const { data: docData } = await supabase.from("docentes").select("*").order("apellido");
      setDocentes(docData || []);
      const { data: curData } = await supabase.from("cursos").select("*").order("anio");
      setCursos(curData || []);
      const { data: matData } = await supabase.from("materias").select("*");
      setMaterias(matData || []);
      const { data: bpData } = await supabase.from("bajas_pases").select("*, estudiantes(nombre, apellido, dni)").order("created_at", { ascending: false });
      setBajasPases(bpData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const handleCrearEstudiante = async (e) => {
    e.preventDefault();
    try {
      const record = { dni: newDni.trim(), cuil: newCuil.trim(), apellido: newApellido.trim(), nombre: newNombre.trim(), estado: "activo" };
      const { error } = await supabase.from("estudiantes").insert(record);
      if (error) throw error;
      Swal.fire({ icon: "success", title: "Legajo Creado", text: "Se creó el legajo con éxito.", timer: 1500, showConfirmButton: false });
      setShowAddModal(false); await loadData();
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleOpenBajaModal = (est) => {
    setSelectedEstudianteBaja(est); setMotivoBaja("Abandono"); setEscuelaDestino(""); setObservacionesBaja(""); setShowBajaModal(true);
  };

  const handleConfirmarBajaOPase = async (e) => {
    e.preventDefault();
    if (!selectedEstudianteBaja) return;
    try {
      if (motivoBaja === "Pase" && !escuelaDestino.trim()) {
        Swal.fire("Atención", "Ingrese la Escuela o Establecimiento Destino para el Pase.", "warning"); return;
      }
      if (motivoBaja === "Error de Carga") {
        const confirm = await Swal.fire({ title: "Confirmar Eliminación por Error de Carga", text: "¿Deseas eliminar definitivamente el legajo cargado por error?", icon: "warning", showCancelButton: true, confirmButtonText: "Eliminar Registro Completo" });
        if (confirm.isConfirmed) {
          await supabase.from("estudiantes").delete().eq("id", selectedEstudianteBaja.id);
          Swal.fire("Eliminado", "Se eliminó el estudiante cargado por error.", "success");
          setShowBajaModal(false); await loadData(); return;
        }
      }
      const nuevoEstado = motivoBaja === "Pase" ? "Pase" : "inactivo";
      await supabase.from("estudiantes").update({ estado: nuevoEstado }).eq("id", selectedEstudianteBaja.id);
      await supabase.from("bajas_pases").insert({ estudiante_id: selectedEstudianteBaja.id, escuela_destino: motivoBaja === "Pase" ? escuelaDestino.trim() : null, estado: motivoBaja, observaciones: observacionesBaja.trim() || null, fecha_solicitud: new Date().toISOString().split("T")[0] });
      Swal.fire({ icon: "success", title: "Baja / Pase Registrado", text: "Se registró " + motivoBaja + "." });
      setShowBajaModal(false); await loadData();
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleReactivarEstudiante = async (est) => {
    try {
      const confirm = await Swal.fire({ title: "Reactivar Estudiante", text: "¿Desea reactivar a " + est.apellido + ", " + est.nombre + " como alumno regular?", icon: "question", showCancelButton: true, confirmButtonText: "Sí, Reactivar" });
      if (confirm.isConfirmed) {
        await supabase.from("estudiantes").update({ estado: "activo" }).eq("id", est.id || est.estudiante_id);
        Swal.fire({ icon: "success", title: "Estudiante Reactivado", timer: 1500, showConfirmButton: false });
        await loadData();
      }
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleEliminarBajaDefinitiva = async (record) => {
    try {
      const confirm = await Swal.fire({ title: "Eliminación Definitiva", text: "Esta acción eliminará al estudiante y todo su historial. ¿Continuar?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Eliminar Definitivamente" });
      if (confirm.isConfirmed) {
        const estId = record.estudiante_id || record.id;
        if (record.id) await supabase.from("bajas_pases").delete().eq("id", record.id);
        if (estId) await supabase.from("estudiantes").delete().eq("id", estId);
        Swal.fire("Eliminado", "Se borró el registro definitivamente.", "success");
        await loadData();
      }
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleCrearDocenteModalCompleto = async (e) => {
    e.preventDefault();
    if (!docDni || !docNombre || !docApellido) { Swal.fire("Error", "Ingrese DNI, Nombre y Apellido.", "error"); return; }
    try {
      const record = { cuil: docCuil.trim(), dni: docDni.trim(), nombre: docNombre.trim(), apellido: docApellido.trim(), genero: docGenero, fecha_nacimiento: docFechaNac || null, email: docEmail.trim(), telefono: docTelefono.trim(), titulo: docTitulo.trim() || "Profesor/a Secundario", domicilio: docDomicilio.trim(), localidad: docLocalidad.trim(), numero_legajo: docNumLegajo.trim(), situacion_revista: docSituacionRevista, fecha_ingreso: docFechaIngreso || null, activo: true };
      const { error } = await supabase.from("docentes").insert(record);
      if (error) throw error;
      Swal.fire({ icon: "success", title: "Docente Registrado" });
      setShowDocenteModal(false); await loadData();
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleVincularMateriaEnSecretaria = async (e) => {
    e.preventDefault();
    if (!selectedMateriaVinculo || !selectedDocenteVinculo) { Swal.fire("Error", "Seleccione la materia y docente.", "error"); return; }
    try {
      await supabase.from("docente_materia").delete().eq("materia_id", selectedMateriaVinculo);
      const { error } = await supabase.from("docente_materia").insert({ materia_id: selectedMateriaVinculo, docente_id: selectedDocenteVinculo, cargo: "titular" });
      if (error) throw error;
      Swal.fire({ icon: "success", title: "Vinculación Exitosa" });
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleEmitirCertificado = (est, tipo) => {
    Swal.fire({ title: "Emitir Documento", text: "Se generó " + tipo + " para " + est.apellido + ", " + est.nombre + ".", icon: "success" });
  };

  const filteredEstudiantes = estudiantes.filter((e) => e.apellido.toLowerCase().includes(search.toLowerCase()) || e.nombre.toLowerCase().includes(search.toLowerCase()) || (e.dni && e.dni.includes(search)));
  const filteredDocentes = docentes.filter((d) => d.apellido.toLowerCase().includes(searchDocente.toLowerCase()) || d.nombre.toLowerCase().includes(searchDocente.toLowerCase()) || (d.dni && d.dni.includes(searchDocente)));
  const filteredBajasPases = bajasPases.filter((bp) => {
    const name = bp.estudiantes ? bp.estudiantes.apellido + " " + bp.estudiantes.nombre : "";
    const dniVal = bp.estudiantes ? bp.estudiantes.dni : "";
    return name.toLowerCase().includes(searchBaja.toLowerCase()) || dniVal.includes(searchBaja);
  });

  if (role !== "admin") {
    return (
      <div className="card p-8 bg-white max-w-xl mx-auto space-y-4 text-center my-12">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold font-heading text-[#0D2A3E]">Acceso Restringido para Secretaría</h2>
        <p className="text-xs text-gray-600">El módulo de Secretaría está reservado para Dirección/Administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2"><Users className="w-6 h-6 text-[#006384]" /> Módulo de Secretaría & Gestión Administrativa</h1>
          <p className="text-xs text-gray-500 mt-1">CENS Nº 454 - Esteban Echeverría (Región 5)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-gold font-bold text-xs py-2.5 px-4 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Crear Legajo Estudiante</button>
          <button onClick={() => setShowDocenteModal(true)} className="btn-primary font-bold text-xs py-2.5 px-4 flex items-center gap-2 bg-[#006384]"><UserPlus className="w-4 h-4" /> + Registrar Docente</button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold shadow-xs">
        <button onClick={() => setActiveTab("estudiantes")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "estudiantes" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><Users className="w-4 h-4" /> 1. Estudiantes</button>
        <button onClick={() => setActiveTab("titulos")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "titulos" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><Award className="w-4 h-4" /> 2. Títulos y Egresados</button>
        <button onClick={() => setActiveTab("salidas")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "salidas" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><Compass className="w-4 h-4" /> 3. Salidas Educativas</button>
        <button onClick={() => setActiveTab("historica")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "historica" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><History className="w-4 h-4" /> 4. Carga Histórica</button>
        <button onClick={() => setActiveTab("bajas")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "bajas" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><UserX className="w-4 h-4" /> 5. Bajas y Pases</button>
        <button onClick={() => setActiveTab("docentes_ddjj")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "docentes_ddjj" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><Briefcase className="w-4 h-4" /> Docentes y DDJJ</button>
      </div>

      {activeTab === "estudiantes" && (
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
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Calificador Inline</th>
                  <th className="py-3 px-4 text-center">Constancias</th>
                  <th className="py-3 px-4 text-center">Acciones Baja / Pase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredEstudiantes.map((est) => {
                  const isInactive = est.estado === "inactivo" || est.estado === "Pase";
                  return (
                    <tr key={est.id} className="hover:bg-[#F4FAFF]">
                      <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{est.apellido}, {est.nombre}</td>
                      <td className="py-3.5 px-4 font-mono">{est.dni}</td>
                      <td className="py-3.5 px-4 text-center font-bold">{isInactive ? <span className="px-2.5 py-1 rounded-full text-[10px] bg-red-100 text-red-800">🔴 Inactivo</span> : <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-100 text-emerald-800">🟢 Regular</span>}</td>
                      <td className="py-3.5 px-4 text-center"><div className="inline-flex gap-1.5 text-[10px] font-bold"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">1º: 8.5</span><span className="px-2 py-0.5 rounded bg-[#F5C442]/30 text-amber-900">2º: 6.0</span><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">3º: 9.0</span></div></td>
                      <td className="py-3.5 px-4 text-center space-x-1">
                        <button onClick={() => handleEmitirCertificado(est, "Certificado Alumno Regular")} className="btn-primary text-[10px] py-1 px-2 bg-[#006384]">Alumno Regular</button>
                        <button onClick={() => handleEmitirCertificado(est, "Constancia Examen")} className="btn-primary text-[10px] py-1 px-2 bg-[#0B7EA5]">Constancia Examen</button>
                        <button onClick={() => handleEmitirCertificado(est, "Analítico Parcial")} className="btn-gold text-[10px] py-1 px-2">Analítico Parcial</button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isInactive ? (
                          <button onClick={() => handleReactivarEstudiante(est)} className="bg-emerald-600 text-white font-bold text-[11px] py-1 px-3 rounded-lg flex items-center gap-1 mx-auto"><RefreshCw className="w-3.5 h-3.5" /> Reactivar</button>
                        ) : (
                          <button onClick={() => handleOpenBajaModal(est)} className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] py-1 px-3 rounded-lg border border-red-200 flex items-center gap-1 mx-auto"><UserX className="w-3.5 h-3.5" /> Dar de Baja / Pase</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "bajas" && (
        <div className="space-y-6">
          <div className="card p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div><h3 className="text-lg font-bold font-heading text-[#0D2A3E] flex items-center gap-2"><UserX className="w-5 h-5 text-red-600" /> Registro de Bajas, Pases y Salidas de Alumnos</h3><p className="text-xs text-gray-500">Historial completo de estudiantes inactivos o pase.</p></div>
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" /><input type="text" value={searchBaja} onChange={(e) => setSearchBaja(e.target.value)} placeholder="Buscar por DNI o Nombre..." className="field-soft pl-9 text-xs py-1.5 w-64" /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                  <tr><th className="py-3 px-4">Estudiante</th><th className="py-3 px-4">DNI</th><th className="py-3 px-4">Motivo / Tipo</th><th className="py-3 px-4">Escuela Destino (Pase)</th><th className="py-3 px-4">Fecha Solicitud</th><th className="py-3 px-4 text-center">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredBajasPases.length === 0 ? (
                    <tr><td colSpan="6" className="py-8 text-center text-gray-400">No hay registros de bajas o pases actualmente.</td></tr>
                  ) : (
                    filteredBajasPases.map((bp) => {
                      const estName = bp.estudiantes ? bp.estudiantes.apellido + ", " + bp.estudiantes.nombre : "Estudiante registrado";
                      const estDni = bp.estudiantes ? bp.estudiantes.dni : "-";
                      return (
                        <tr key={bp.id} className="hover:bg-gray-50">
                          <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{estName}</td>
                          <td className="py-3.5 px-4 font-mono">{estDni}</td>
                          <td className="py-3.5 px-4 font-semibold text-red-700"><span className="px-2 py-0.5 rounded bg-red-50 border border-red-200">{bp.estado || "Abandono"}</span></td>
                          <td className="py-3.5 px-4 text-gray-700 font-medium">{bp.escuela_destino || "N/A (CENS 454)"}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">{bp.fecha_solicitud || bp.created_at?.split("T")[0]}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleReactivarEstudiante(bp)} className="bg-emerald-50 text-emerald-700 font-bold text-xs py-1 px-3 rounded-lg border border-emerald-200 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Reactivar</button>
                              <button onClick={() => handleEliminarBajaDefinitiva(bp)} className="bg-red-600 text-white font-bold text-xs py-1 px-3 rounded-lg flex items-center gap-1 shadow-xs"><Trash2 className="w-3.5 h-3.5" /> Eliminar Definitivamente</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showBajaModal && selectedEstudianteBaja && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3"><h3 className="text-base font-bold text-[#0D2A3E]">Registrar Baja / Pase: {selectedEstudianteBaja.apellido}, {selectedEstudianteBaja.nombre}</h3><button onClick={() => setShowBajaModal(false)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleConfirmarBajaOPase} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">Motivo de Baja:</label><select value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} className="field-soft text-xs font-bold border-2 border-red-300"><option value="Abandono">Abandono de Estudios</option><option value="Pase">Pase a Otra Institución Educativa</option><option value="Error de Carga">Error de Carga (Duplicado o incorrecto)</option></select></div>
              {motivoBaja === "Pase" && (<div><label className="block text-xs font-bold mb-1">Escuela / Establecimiento Destino *</label><input type="text" value={escuelaDestino} onChange={(e) => setEscuelaDestino(e.target.value)} placeholder="Ej: CENS N° 451" className="field-soft text-xs font-bold border-2 border-blue-400" required /></div>)}
              <div><label className="block text-xs font-semibold mb-1">Observaciones / Detalle</label><textarea value={observacionesBaja} onChange={(e) => setObservacionesBaja(e.target.value)} placeholder="Detalle de la baja o constancia..." className="field-soft text-xs h-20" /></div>
              <div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={() => setShowBajaModal(false)} className="btn-secondary text-xs py-2 px-4">Cancelar</button><button type="submit" className="bg-red-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl">Confirmar Baja / Pase</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
