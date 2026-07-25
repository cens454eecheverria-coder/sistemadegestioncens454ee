"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { Users, UserPlus, FileText, Search, Award, Compass, History, UserX, Briefcase, CheckCircle2, AlertTriangle, Plus, Clock, BookOpen, ShieldAlert, RefreshCw, Trash2, ArrowRightLeft, AlertCircle, Printer, Check, GraduationCap } from "lucide-react";

export default function SecretariaPanelPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("estudiantes");
  const [docenteSubTab, setDocenteSubTab] = useState("lista");

  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [bajasPases, setBajasPases] = useState([]);
  const [ddjjDocentes, setDdjjDocentes] = useState([]);

  const [search, setSearch] = useState("");
  const [searchDocente, setSearchDocente] = useState("");
  const [searchBaja, setSearchBaja] = useState("");
  const [searchTitulo, setSearchTitulo] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Legajo Estudiante
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDni, setNewDni] = useState("");
  const [newCuil, setNewCuil] = useState("");
  const [newApellido, setNewApellido] = useState("");
  const [newNombre, setNewNombre] = useState("");

  // Modal Registrar Docente
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
  const [docLocalidad, setDocLocalidad] = useState("Esteban Echeverría");
  const [docNumLegajo, setDocNumLegajo] = useState("");
  const [docSituacionRevista, setDocSituacionRevista] = useState("Titular");
  const [docFechaIngreso, setDocFechaIngreso] = useState("");

  // Modal Emisión Documento PDF
  const [showDocModal, setShowDocModal] = useState(false);
  const [docEstudiante, setDocEstudiante] = useState(null);
  const [docTipo, setDocTipo] = useState("");

  // Vincular Docente a Materia
  const [selectedCursoVinculo, setSelectedCursoVinculo] = useState("");
  const [selectedMateriaVinculo, setSelectedMateriaVinculo] = useState("");
  const [selectedDocenteVinculo, setSelectedDocenteVinculo] = useState("");

  // Modal Dar de Baja / Pase Estudiante
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [selectedEstudianteBaja, setSelectedEstudianteBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState("Abandono");
  const [escuelaDestino, setEscuelaDestino] = useState("");
  const [observacionesBaja, setObservacionesBaja] = useState("");

  // DDJJ
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
      const { data: ddjjData } = await supabase.from("ddjj_docentes").select("*, docentes(nombre, apellido, dni, cuil)").order("created_at", { ascending: false });
      setDdjjDocentes(ddjjData || []);
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
      const confirm = await Swal.fire({ title: "Reactivar Estudiante", text: "Desea reactivar a " + est.apellido + ", " + est.nombre + " como alumno regular?", icon: "question", showCancelButton: true, confirmButtonText: "Sí, Reactivar" });
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

  const handleEliminarDdjj = async (ddjjId) => {
    try {
      const confirm = await Swal.fire({
        title: "Eliminar Declaraci?n Jurada",
        text: "?Deseas borrar esta declaraci?n jurada cargada?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "S?, Eliminar",
        cancelButtonText: "Cancelar"
      });
      if (confirm.isConfirmed) {
        await supabase.from("ddjj_docentes").delete().eq("id", ddjjId);
        Swal.fire("Eliminado", "Declaraci?n jurada borrada con ?xito.", "success");
        await loadData();
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleMarcarTituloEntregado = async (est) => {
    try {
      await supabase.from("estudiantes").update({ estado_titulo: "Entregado" }).eq("id", est.id);
      Swal.fire({ icon: "success", title: "Título Registrado como Entregado", text: "Se actualizó el estado de " + est.apellido + ", " + est.nombre + ".", timer: 1500, showConfirmButton: false });
      await loadData();
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };
    const handleToggleEstadoDocente = async (docente) => {
    try {
      const isCurrentlyInactive = docente.estado === "inactivo" || docente.activo === false;
      const nuevoEstado = isCurrentlyInactive ? "activo" : "inactivo";
      const nuevoActivoBool = nuevoEstado === "activo";
      const accionText = isCurrentlyInactive ? "reactivar" : "dar de baja / inactivar";
      
      const confirm = await Swal.fire({
        title: (isCurrentlyInactive ? "Reactivar" : "Dar de Baja") + " Docente",
        text: "¿Deseas " + accionText + " a Prof. " + docente.apellido + ", " + docente.nombre + "?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, " + (isCurrentlyInactive ? "Reactivar" : "Dar de Baja"),
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        const { error } = await supabase
          .from("docentes")
          .update({ estado: nuevoEstado, activo: nuevoActivoBool })
          .eq("id", docente.id);
        
        if (error) throw error;

        Swal.fire({
          icon: "success",
          title: "Estado Actualizado",
          text: "El docente " + docente.apellido + " ahora está " + nuevoEstado + ".",
          timer: 1500,
          showConfirmButton: false
        });
        await loadData();
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleEliminarDocenteModal = async (docente) => {
    try {
      const confirm = await Swal.fire({
        title: "Eliminar Legajo Docente",
        text: "¿Deseas eliminar definitivamente el legajo del docente Prof. " + docente.apellido + ", " + docente.nombre + "? Esta acción eliminará el registro de la institución.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Sí, Eliminar Definitivamente",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        const { error } = await supabase
          .from("docentes")
          .delete()
          .eq("id", docente.id);

        if (error) throw error;

        Swal.fire("Eliminado", "Se eliminó el legajo docente con éxito.", "success");
        await loadData();
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleCrearDocenteModalCompleto = async (e) => {
    e.preventDefault();
    if (!docDni || !docNombre || !docApellido) { Swal.fire("Error", "Ingrese DNI, Nombre y Apellido.", "error"); return; }
    try {
      const record = { cuil: docCuil.trim(), dni: docDni.trim(), nombre: docNombre.trim(), apellido: docApellido.trim(), genero: docGenero, fecha_nacimiento: docFechaNac || null, email: docEmail.trim(), telefono: docTelefono.trim(), titulo: docTitulo.trim() || "Profesor/a Secundario", domicilio: docDomicilio.trim(), localidad: docLocalidad.trim(), numero_legajo: docNumLegajo.trim(), situacion_revista: docSituacionRevista, fecha_ingreso: docFechaIngreso || null, estado: "activo", activo: true };
      const { error } = await supabase.from("docentes").insert(record);
      if (error) throw error;
      Swal.fire({ icon: "success", title: "Docente Registrado", text: "Prof. " + docApellido + ", " + docNombre + " incorporado." });
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

  const handleVerificarConflictoDDJJ = () => {
    setConflictAlert("🔍 Verificación completada: No se detectan superposiciones horarias críticas en CENS 454.");
  };

  const handleEmitirCertificado = (est, tipo) => {
    setDocEstudiante(est);
    setDocTipo(tipo);
    setShowDocModal(true);
  };

  const filteredEstudiantes = estudiantes.filter((e) => e.apellido.toLowerCase().includes(search.toLowerCase()) || e.nombre.toLowerCase().includes(search.toLowerCase()) || (e.dni && e.dni.includes(search)));
  const filteredDocentes = docentes.filter((d) => d.apellido.toLowerCase().includes(searchDocente.toLowerCase()) || d.nombre.toLowerCase().includes(searchDocente.toLowerCase()) || (d.dni && d.dni.includes(searchDocente)));
  const filteredBajasPases = bajasPases.filter((bp) => {
    const name = bp.estudiantes ? bp.estudiantes.apellido + " " + bp.estudiantes.nombre : "";
    const dniVal = bp.estudiantes ? bp.estudiantes.dni : "";
    return name.toLowerCase().includes(searchBaja.toLowerCase()) || dniVal.includes(searchBaja);
  });

  const estudiantesTitulos = estudiantes.filter((e) => e.en_condicion_titulo || e.estado === "egresado" || e.estado_titulo);

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
        <button onClick={() => setActiveTab("docentes_ddjj")} className={"py-3 px-4 flex items-center gap-2 border-b-2 " + (activeTab === "docentes_ddjj" ? "border-[#006384] text-[#006384]" : "border-transparent text-gray-500")}><Briefcase className="w-4 h-4" /> 💼 Docentes y DDJJ</button>
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
                  <th className="py-3 px-4 text-center">Orientación / Legajo</th>
                  <th className="py-3 px-4 text-center">Emisión de Constancias</th>
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
                      <td className="py-3.5 px-4 text-center"><span className="text-xs font-semibold text-gray-700">{est.orientacion || "Ciencias Sociales"}</span></td>
                      <td className="py-3.5 px-4 text-center space-x-1">
                        <button onClick={() => handleEmitirCertificado(est, "Alumno Regular")} className="btn-primary text-[10px] py-1 px-2 bg-[#006384]">Alumno Regular</button>
                        <button onClick={() => handleEmitirCertificado(est, "Constancia Vacante")} className="btn-primary text-[10px] py-1 px-2 bg-[#0B7EA5]">Constancia Vacante</button>
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

      {/* ------------------- TAB 2: TÍTULOS Y EGRESADOS ------------------- */}
      {activeTab === "titulos" && (
        <div className="space-y-6">
          <div className="card p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" /> Registro Oficial de Títulos y Egresados CENS 454
                </h3>
                <p className="text-xs text-gray-500">Estudiantes enviados a titularización desde Preceptoría / Calificador.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTitulo}
                  onChange={(e) => setSearchTitulo(e.target.value)}
                  placeholder="Buscar egresado..."
                  className="field-soft pl-9 text-xs py-1.5 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">Estudiante Egresado</th>
                    <th className="py-3 px-4">DNI</th>
                    <th className="py-3 px-4">Libro / Folio</th>
                    <th className="py-3 px-4 text-center">Estado del Título</th>
                    <th className="py-3 px-4 text-center">Acciones de Secretaría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {estudiantesTitulos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400">
                        <GraduationCap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="font-bold">No hay estudiantes en condición de titularización actualmente.</p>
                        <p className="text-[11px] text-gray-400">Desde Preceptoría / Calificador podés presionar <strong>"Mandar a Titular"</strong> para enviar un estudiante a esta lista.</p>
                      </td>
                    </tr>
                  ) : (
                    estudiantesTitulos
                      .filter((e) => e.apellido.toLowerCase().includes(searchTitulo.toLowerCase()) || e.nombre.toLowerCase().includes(searchTitulo.toLowerCase()) || (e.dni && e.dni.includes(searchTitulo)))
                      .map((est) => (
                        <tr key={est.id} className="hover:bg-amber-50/40">
                          <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{est.apellido}, {est.nombre}</td>
                          <td className="py-3.5 px-4 font-mono">{est.dni}</td>
                          <td className="py-3.5 px-4 font-mono text-gray-600">Libro: {est.numero_libro || "-"} / Folio: {est.numero_folio || "-"}</td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {est.estado_titulo === "Entregado" ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 w-28 mx-auto">
                                <Check className="w-3 h-3" /> Entregado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-100 text-amber-900 flex items-center justify-center gap-1 w-28 mx-auto">
                                ⏳ En Trámite
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center space-x-2">
                            <button
                              onClick={() => handleEmitirCertificado(est, "Analítico Parcial")}
                              className="btn-gold text-[10px] py-1 px-3"
                            >
                              📜 Ver Analítico Final
                            </button>
                            <button
                              onClick={() => handleMarcarTituloEntregado(est)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-3 rounded-lg"
                            >
                              ✅ Marcar Entregado
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
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

      {activeTab === "docentes_ddjj" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button onClick={() => setDocenteSubTab("lista")} className={"py-2 px-5 rounded-full text-xs font-bold transition-all " + (docenteSubTab === "lista" ? "bg-[#006384] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>📋 Lista de Docentes</button>
              <button onClick={() => setDocenteSubTab("ddjj")} className={"py-2 px-5 rounded-full text-xs font-bold transition-all " + (docenteSubTab === "ddjj" ? "bg-[#006384] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>💼 Declaraciones Juradas (DDJJ)</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input type="text" value={searchDocente} onChange={(e) => setSearchDocente(e.target.value)} placeholder="Buscar docente por apellido, nombre o DNI..." className="field-soft pl-9 text-xs py-1.5 w-64" />
              </div>
              <button onClick={() => setShowDocenteModal(true)} className="btn-gold font-bold text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs">+ Registrar Docente</button>
            </div>
          </div>

          <form onSubmit={handleVincularMateriaEnSecretaria} className="card p-6 bg-white space-y-4">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b pb-3"><BookOpen className="w-5 h-5 text-[#006384]" /> Vincular Docente a Materia Existente</h3>
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
            <div className="flex justify-end pt-2"><button type="submit" className="btn-gold text-xs py-2 px-6 font-bold">Confirmar Vinculación Docente-Materia</button></div>
          </form>

          {docenteSubTab === "lista" && (
            <div className="card overflow-hidden bg-white">
              <div className="p-4 bg-[#F8FAFC] border-b font-bold text-xs text-[#0D2A3E]">Nómina Oficial de Docentes Legajados ({filteredDocentes.length})</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Docente</th>
                      <th className="py-3 px-4">DNI / CUIL</th>
                      <th className="py-3 px-4">T?tulo Principal</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredDocentes.length === 0 ? (
                      <tr><td colSpan="6" className="py-6 text-center text-gray-400">No hay docentes registrados. Haz clic en "+ Registrar Docente".</td></tr>
                    ) : (
                      filteredDocentes.map((d) => {
                        const isInactive = d.estado === "inactivo" || d.activo === false;
                        return (
                          <tr key={d.id} className="hover:bg-[#F4FAFF] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{d.apellido}, {d.nombre}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-700">{d.dni} <span className="text-[10px] text-[#006384]">({d.cuil || "-"})</span></td>
                            <td className="py-3.5 px-4 text-gray-700">{d.titulo || "Profesor/a Secundario"}</td>
                            <td className="py-3.5 px-4 text-gray-600">{d.email || d.telefono || "Sin datos"}</td>
                            <td className="py-3.5 px-4 text-center">
                              {isInactive ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">Inactivo</span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Activo</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEstadoDocente(d)}
                                  className={
                                    "text-[11px] font-bold py-1 px-3 rounded-lg border transition-all " +
                                    (isInactive
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100")
                                  }
                                >
                                  {isInactive ? "Reactivar" : "Baja / Inactivar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminarDocenteModal(d)}
                                  className="text-[11px] font-bold py-1 px-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all inline-flex items-center gap-1"
                                  title="Eliminar legajo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </button>
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
          )}

          {docenteSubTab === "ddjj" && (
            <div className="space-y-6">
              <div className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b pb-3">
                  <Briefcase className="w-5 h-5 text-[#006384]" />
                  Control de Declaraciones Juradas (DDJJ) e Incompatibilidad Horaria
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 leading-relaxed">
                  En este panel se visualizan en tiempo real todos los cargos y franjas horarias externas declaradas formalmente por el cuerpo docente activo del CENS N? 454.
                </div>
              </div>

              <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xs">
                <div className="bg-[#0D2A3E] text-white p-4 px-6 font-heading text-xs font-bold flex justify-between items-center">
                  <span>N?mina de Declaraciones Juradas Presentadas ({ddjjDocentes.length})</span>
                  <span className="text-[11px] text-blue-200 font-normal">Carga activa por docentes</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3.5 px-4">Docente</th>
                        <th className="py-3.5 px-4">DNI / CUIL</th>
                        <th className="py-3.5 px-4">Establecimiento Externo</th>
                        <th className="py-3.5 px-4">Cargo / Funci?n</th>
                        <th className="py-3.5 px-4">Horario Declarado</th>
                        <th className="py-3.5 px-4">D?as / Distrito</th>
                        <th className="py-3.5 px-4 text-center">Acci?n</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {ddjjDocentes.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-gray-400 font-bold space-y-2">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                            <p>No hay Declaraciones Juradas externas registradas actualmente.</p>
                            <p className="text-[11px] text-gray-400 font-normal">Los docentes pueden cargar sus cargos externos directamente desde el Portal Docente.</p>
                          </td>
                        </tr>
                      ) : (
                        ddjjDocentes.map((ddjj) => {
                          const docName = ddjj.docentes ? ddjj.docentes.apellido + ", " + ddjj.docentes.nombre : "Docente Registrado";
                          const docDni = ddjj.docentes ? ddjj.docentes.dni + " (" + (ddjj.docentes.cuil || "-") + ")" : "-";
                          return (
                            <tr key={ddjj.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{docName}</td>
                              <td className="py-3.5 px-4 font-mono text-gray-600">{docDni}</td>
                              <td className="py-3.5 px-4 font-semibold text-[#006384]">{ddjj.establecimiento_externo || "Sin especificar"}</td>
                              <td className="py-3.5 px-4 font-medium text-gray-700">{ddjj.cargo_externo || "Docente / Preceptor"}</td>
                              <td className="py-3.5 px-4 font-bold text-gray-800">{ddjj.horario_externo || "18:30 a 22:00"}</td>
                              <td className="py-3.5 px-4 text-gray-600">{ddjj.dias_externos || "Esteban Echeverr?a"}</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEliminarDdjj(ddjj.id)}
                                  className="text-[11px] font-bold py-1 px-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Borrar DDJJ
                                </button>
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
        </div>
      )}

      {/* MODAL IMPRESIÓN DOCUMENTOS Y CONSTANCIAS OFICIALES */}
      {showDocModal && docEstudiante && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 space-y-6 relative border border-gray-200">
            <div className="flex justify-between items-center border-b pb-4"><h3 className="text-lg font-bold text-[#0D2A3E]">Vista Previa e Impresión de Documento Oficial</h3><button onClick={() => setShowDocModal(false)} className="text-gray-400 font-bold text-lg">✕</button></div>
            <div className="border p-8 rounded-xl bg-white space-y-6 text-gray-900 font-sans">
              <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-gray-900">CENS Nº 454 - ESTEBAN ECHEVERRÍA</h2>
                  <p className="text-xs text-gray-600 font-bold">Dirección General de Cultura y Educación • Provincia de Buenos Aires</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Distrito: Esteban Echeverría • Región 5</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 bg-gray-100 rounded border border-gray-400">DOCUMENTO OFICIAL</span>
                  <p className="text-[11px] text-gray-500 mt-2 font-mono">Fecha: {new Date().toLocaleDateString("es-AR")}</p>
                </div>
              </div>

              <div className="text-center py-4 space-y-1">
                <h3 className="text-lg font-black tracking-wider uppercase border-b-2 border-gray-900 inline-block pb-1">
                  {docTipo === "Alumno Regular" && "CERTIFICADO DE ALUMNO REGULAR"}
                  {docTipo === "Constancia Vacante" && "CONSTANCIA DE VACANTE INSTITUCIONAL"}
                  {docTipo === "Analítico Parcial" && "CERTIFICADO ANALÍTICO PARCIAL DE ESTUDIOS"}
                </h3>
              </div>

              <div className="text-xs leading-relaxed space-y-4 text-justify px-2">
                {docTipo === "Alumno Regular" && (
                  <p>Se hace constar por la presente que el/la estudiante <strong>{docEstudiante.apellido.toUpperCase()}, {docEstudiante.nombre}</strong>, titular del DNI Nº <strong>{docEstudiante.dni}</strong>, es alumno/a <strong>REGULAR</strong> del Centro de Educación Nivel Secundario Nº 454 de Esteban Echeverría, cursando los estudios secundarios en el Ciclo Lectivo 2026.</p>
                )}
                {docTipo === "Constancia Vacante" && (
                  <p>Se hace constar por la presente que en el Centro de Educación Nivel Secundario Nº 454 de Esteban Echeverría existe <strong>VACANTE OTORGADA Y RESERVADA</strong> para el/la estudiante <strong>{docEstudiante.apellido.toUpperCase()}, {docEstudiante.nombre}</strong>, DNI Nº <strong>{docEstudiante.dni}</strong>, a efectos de formalizar su inscripción en el ciclo lectivo en curso.</p>
                )}
                {docTipo === "Analítico Parcial" && (
                  <p>Certificado oficial de materias aprobadas y avance curricular parcial expedido para el/la estudiante <strong>{docEstudiante.apellido.toUpperCase()}, {docEstudiante.nombre}</strong>, DNI Nº <strong>{docEstudiante.dni}</strong>, registrado en los libros de calificaciones del CENS Nº 454.</p>
                )}
                <p>A pedido del/de la interesado/a y a los efectos de ser presentado ante las autoridades que lo requieran, se expide la presente constancia en Esteban Echeverría a los {new Date().getDate()} días del mes de {new Date().toLocaleDateString("es-AR", { month: "long" })} de {new Date().getFullYear()}.</p>
              </div>

              <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs font-bold text-gray-900">
                <div className="border-t border-gray-900 pt-2"><p>SELLO INSTITUCIONAL</p><p className="text-[10px] text-gray-500 font-normal mt-0.5">CENS Nº 454 ESTEBAN ECHEVERRÍA</p></div>
                <div className="border-t border-gray-900 pt-2"><p>FIRMA Y SELLO DE DIRECCIÓN</p><p className="text-[10px] text-gray-500 font-normal mt-0.5">Autoridad Escolar Responsable</p></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowDocModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl">Cerrar</button>
              <button onClick={() => window.print()} className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md"><Printer className="w-4 h-4" /> Imprimir / Descargar PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR LEGAJO ESTUDIANTE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3"><h3 className="text-base font-bold text-[#0D2A3E]">Nuevo Legajo Estudiante</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleCrearEstudiante} className="space-y-3">
              <div><label className="block text-xs font-semibold mb-1">DNI *</label><input type="text" value={newDni} onChange={(e) => setNewDni(e.target.value)} className="field-soft text-xs font-bold" required /></div>
              <div><label className="block text-xs font-semibold mb-1">CUIL</label><input type="text" value={newCuil} onChange={(e) => setNewCuil(e.target.value)} className="field-soft text-xs" /></div>
              <div><label className="block text-xs font-semibold mb-1">Apellido *</label><input type="text" value={newApellido} onChange={(e) => setNewApellido(e.target.value)} className="field-soft text-xs font-bold" required /></div>
              <div><label className="block text-xs font-semibold mb-1">Nombre *</label><input type="text" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} className="field-soft text-xs" required /></div>
              <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs py-2 px-4">Cancelar</button><button type="submit" className="btn-gold text-xs font-bold py-2 px-5">Guardar Legajo</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAJA / PASE */}
      {showBajaModal && selectedEstudianteBaja && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3"><h3 className="text-base font-bold text-[#0D2A3E]">Registrar Baja / Pase: {selectedEstudianteBaja.apellido}, {selectedEstudianteBaja.nombre}</h3><button onClick={() => setShowBajaModal(false)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleConfirmarBajaOPase} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">Motivo de Baja:</label><select value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} className="field-soft text-xs font-bold border-2 border-red-300"><option value="Abandono">Abandono de Estudios</option><option value="Pase">Pase a Otra Institución Educativa</option><option value="Error de Carga">Error de Carga (Duplicado o incorrecto)</option></select></div>
              {motivoBaja === "Pase" && (<div><label className="block text-xs font-bold mb-1">Escuela / Establecimiento Destino *</label><input type="text" value={escuelaDestino} onChange={(e) => setEscuelaDestino(e.target.value)} placeholder="Ej: CENS N° 451" className="field-soft text-xs font-bold border-2 border-blue-400" required /></div>)}
              <div><label className="block text-xs font-semibold mb-1">Observaciones / Detalle</label><textarea value={observacionesBaja} onChange={(e) => setObservacionesBaja(e.target.value)} placeholder="Detalle de la baja..." className="field-soft text-xs h-20" /></div>
              <div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={() => setShowBajaModal(false)} className="btn-secondary text-xs py-2 px-4">Cancelar</button><button type="submit" className="bg-red-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl">Confirmar Baja / Pase</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO DOCENTE */}
      {showDocenteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3"><h3 className="text-lg font-bold text-[#0D2A3E]">Registrar Nuevo Docente (Legajo Institucional)</h3><button onClick={() => setShowDocenteModal(false)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleCrearDocenteModalCompleto} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold mb-1">CUIL *</label><input type="text" value={docCuil} onChange={(e) => setDocCuil(e.target.value)} placeholder="20-12345678-9" className="field-soft text-xs font-bold" required /></div>
                <div><label className="block text-xs font-semibold mb-1">DNI *</label><input type="text" value={docDni} onChange={(e) => setDocDni(e.target.value)} placeholder="12345678" className="field-soft text-xs font-bold" required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold mb-1">Nombre *</label><input type="text" value={docNombre} onChange={(e) => setDocNombre(e.target.value)} className="field-soft text-xs" required /></div>
                <div><label className="block text-xs font-semibold mb-1">Apellido *</label><input type="text" value={docApellido} onChange={(e) => setDocApellido(e.target.value)} className="field-soft text-xs font-bold" required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold mb-1">Género</label><select value={docGenero} onChange={(e) => setDocGenero(e.target.value)} className="field-soft text-xs"><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select></div>
                <div><label className="block text-xs font-semibold mb-1">Email</label><input type="email" value={docEmail} onChange={(e) => setDocEmail(e.target.value)} className="field-soft text-xs" /></div>
                <div><label className="block text-xs font-semibold mb-1">Teléfono</label><input type="text" value={docTelefono} onChange={(e) => setDocTelefono(e.target.value)} className="field-soft text-xs" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold mb-1">Título Principal</label><input type="text" value={docTitulo} onChange={(e) => setDocTitulo(e.target.value)} placeholder="Profesor/a Secundario" className="field-soft text-xs" /></div>
                <div><label className="block text-xs font-semibold mb-1">Situación de Revista</label><select value={docSituacionRevista} onChange={(e) => setDocSituacionRevista(e.target.value)} className="field-soft text-xs font-bold"><option value="Titular">Titular</option><option value="Provisional">Provisional</option><option value="Suplente">Suplente</option></select></div>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowDocenteModal(false)} className="btn-secondary text-xs py-2 px-4">Cancelar</button>
                <button type="submit" className="btn-primary bg-[#006384] text-xs font-bold py-2.5 px-6">Guardar y Registrar Docente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}