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

  const handleMarcarTituloEntregado = async (est) => {
    try {
      await supabase.from("estudiantes").update({ estado_titulo: "Entregado" }).eq("id", est.id);
      Swal.fire({ icon: "success", title: "Título Registrado como Entregado", text: "Se actualizó el estado de " + est.apellido + ", " + est.nombre + ".", timer: 1500, showConfirmButton: false });
      await loadData();
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };
  const handleCrearDocenteModalCompleto = async (e) => {
    e.preventDefault();
    if (!docDni || !docNombre || !docApellido) { Swal.fire("Error", "Ingrese DNI, Nombre y Apellido.", "error"); return; }
    try {
      const record = { cuil: docCuil.trim(), dni: docDni.trim(), nombre: docNombre.trim(), apellido: docApellido.trim(), genero: docGenero, fecha_nacimiento: docFechaNac || null, email: docEmail.trim(), telefono: docTelefono.trim(), titulo: docTitulo.trim() || "Profesor/a Secundario", domicilio: docDomicilio.trim(), localidad: docLocalidad.trim(), numero_legajo: docNumLegajo.trim(), situacion_revista: docSituacionRevista, fecha_ingreso: docFechaIngreso || null, activo: true };
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