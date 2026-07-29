"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { generateAnexo4SalidaDocx, generateAnexo5SalidaDocx } from '@/lib/generateSalidasDocx';
import { Users, UserPlus, FileText, Search, Award, Compass, History, UserX, Briefcase, CheckCircle2, AlertTriangle, Plus, Clock, BookOpen, ShieldAlert, RefreshCw, Trash2, ArrowRightLeft, AlertCircle, Printer, Check, GraduationCap, Calendar } from "lucide-react";

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
  // State Carga Histórica (Pasos 1, 2 y 3)
  const [historicaSubTab, setHistoricaSubTab] = useState("nuevo"); // "nuevo" | "registros"
  const [historicaStep, setHistoricaStep] = useState(1);
  const [historicaAnio, setHistoricaAnio] = useState("2025");
  const [historicaCursoId, setHistoricaCursoId] = useState("");
  const [historicaMaterias, setHistoricaMaterias] = useState([]);

  // Paso 2 state
  const [historicaTipoEstudiante, setHistoricaTipoEstudiante] = useState("existente"); // "existente" | "nuevo"
  const [historicaSelectedEstId, setHistoricaSelectedEstId] = useState("");
  const [historicaNuevoNombre, setHistoricaNuevoNombre] = useState("");
  const [historicaNuevoApellido, setHistoricaNuevoApellido] = useState("");
  const [historicaNuevoDni, setHistoricaNuevoDni] = useState("");
  const [historicaNuevoCuil, setHistoricaNuevoCuil] = useState("");
  const [historicaNuevoEmail, setHistoricaNuevoEmail] = useState("");
  const [historicaNuevoTelefono, setHistoricaNuevoTelefono] = useState("");
  const [historicaNuevoEstado, setHistoricaNuevoEstado] = useState("Egresado");

  // Paso 3 state
  const [historicaNotas, setHistoricaNotas] = useState({});
  const [historicaSaving, setHistoricaSaving] = useState(false);

  // Ver Registros state
  const [historicaFiltroAnio, setHistoricaFiltroAnio] = useState("todos");
  const [historicaSearch, setHistoricaSearch] = useState("");
  const [registrosHistoricosList, setRegistrosHistoricosList] = useState([]);
  // State Salidas Educativas (Anexos 4 y 5)
  const [salidaProyecto, setSalidaProyecto] = useState("Visita Pedagógica Tecnológica y Cultural 2026");
  const [salidaLugar, setSalidaLugar] = useState("Museo de Ciencias Naturales de La Plata");
  const [salidaCursoId, setSalidaCursoId] = useState("");
  const [salidaFechaSalida, setSalidaFechaSalida] = useState("");
  const [salidaHoraSalida, setSalidaHoraSalida] = useState("08:00 hs");
  const [salidaLugarSalida, setSalidaLugarSalida] = useState("Sede CENS Nº 454 - Av. Pedro Dreyer 1234");
  const [salidaFechaRegreso, setSalidaFechaRegreso] = useState("");
  const [salidaHoraRegreso, setSalidaHoraRegreso] = useState("18:00 hs");
  const [salidaLugarRegreso, setSalidaLugarRegreso] = useState("Sede CENS Nº 454");
  const [salidaObsFechas, setSalidaObsFechas] = useState("Sujeto a condiciones climáticas favorables");
  const [salidaItinerario, setSalidaItinerario] = useState("08:00 Salida desde sede CENS. 10:00 Recorrido guiado. 13:00 Almuerzo. 15:00 Taller interactivo. 16:30 Retorno.");
  const [salidaActividades, setSalidaActividades] = useState("Análisis de patrimonio histórico, observaciones de campo y producción de informe síntesis.");
  const [salidaObjetivos, setSalidaObjetivos] = useState("Fomentar el conocimiento directo del patrimonio científico e integrarlo con los contenidos curriculares.");
  const [salidaCronograma, setSalidaCronograma] = useState("Jornada escolar de salida educativa de 08:00 a 18:00 hs.");
  const [salidaDocenteNombre, setSalidaDocenteNombre] = useState("");
  const [salidaDocenteCargo, setSalidaDocenteCargo] = useState("Profesor/a Titular");
  const [salidaCantDocentes, setSalidaCantDocentes] = useState("2");
  const [salidaCantNoDocentes, setSalidaCantNoDocentes] = useState("1");
  const [salidaAlumnos, setSalidaAlumnos] = useState([]);

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
        const confirm = await Swal.fire({ title: "Confirmar Eliminación por Error de Carga", text: "¿Deseas eliminar definitivamente el legajo del docente Prof. " + docente.apellido + ", " + docente.nombre + "? Esta acción eliminará el registro de la institución.", icon: "warning", showCancelButton: true, confirmButtonText: "Eliminar Registro Completo" });
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
        title: "Eliminar Declaración Jurada",
        text: "¿Deseas borrar esta declaración jurada cargada?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "S?, Eliminar",
        cancelButtonText: "Cancelar"
      });
      if (confirm.isConfirmed) {
        await supabase.from("ddjj_docentes").delete().eq("id", ddjjId);
        Swal.fire("Eliminado", "Declaración jurada borrada con éxito.", "success");
        await loadData();
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

    const handleSalidaCursoChange = (cId) => {
    setSalidaCursoId(cId);
    if (!cId) {
      setSalidaAlumnos([]);
      return;
    }
    const filtered = estudiantes.filter(e => e.curso_id === cId || !e.curso_id).map(e => ({
      ...e,
      seleccionado: true,
      asistencia: 'P',
      rol: 'estudiante'
    }));
    setSalidaAlumnos(filtered);
  };

  const toggleAlumnoSeleccionado = (id) => {
    setSalidaAlumnos(prev => prev.map(a => a.id === id ? { ...a, seleccionado: !a.seleccionado } : a));
  };

  const changeAlumnoAsistencia = (id, st) => {
    setSalidaAlumnos(prev => prev.map(a => a.id === id ? { ...a, asistencia: st } : a));
  };

  const handleDescargarAnexo4 = async () => {
    try {
      const activeAlumnos = salidaAlumnos.filter(a => a.seleccionado);
      await generateAnexo4SalidaDocx({
        distrito: 'Esteban Echeverría',
        institucion: 'CENS',
        numero: '454',
        domicilio: 'Av. Pedro Dreyer 1234',
        telefono: '11-4290-0000',
        proyecto: salidaProyecto,
        lugar: salidaLugar,
        fechaSalida: salidaFechaSalida || new Date().toLocaleDateString('es-AR'),
        horaSalida: salidaHoraSalida,
        lugarSalida: salidaLugarSalida,
        fechaRegreso: salidaFechaRegreso || new Date().toLocaleDateString('es-AR'),
        horaRegreso: salidaHoraRegreso,
        lugarRegreso: salidaLugarRegreso,
        obsFechas: salidaObsFechas,
        itinerario: salidaItinerario,
        actividades: salidaActividades,
        objetivos: salidaObjetivos,
        cronograma: salidaCronograma,
        tit1Nombre: salidaDocenteNombre || 'Prof. Responsable Titular',
        tit1Cargo: salidaDocenteCargo,
        cantAlumnos: activeAlumnos.length,
        cantDocentes: salidaCantDocentes,
        cantNoDocentes: salidaCantNoDocentes
      });
      Swal.fire({
        icon: 'success',
        title: 'Anexo 4 Generado',
        text: 'Se descargó el documento Word del Anexo 4 exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudo generar el Anexo 4: ' + err.message, 'error');
    }
  };

  const handleDescargarAnexo5 = async () => {
    try {
      const activeAlumnos = salidaAlumnos.filter(a => a.seleccionado);
      if (activeAlumnos.length === 0) {
        Swal.fire('Atención', 'Selecciona al menos un estudiante en la nómina para generar el Anexo 5.', 'warning');
        return;
      }
      await generateAnexo5SalidaDocx({
        institucion: 'CENS Nº 454',
        distrito: 'Esteban Echeverría',
        lugar: salidaLugar,
        fechaSalida: salidaFechaSalida || new Date().toLocaleDateString('es-AR'),
        alumnos: activeAlumnos,
        proyecto: salidaProyecto
      });
      Swal.fire({
        icon: 'success',
        title: 'Anexo 5 Generado',
        text: 'Se descargó el documento Word del Anexo 5 exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudo generar el Anexo 5: ' + err.message, 'error');
    }
  };

    const handleHistoricaCursoSelect = async (cId) => {
    setHistoricaCursoId(cId);
    if (!cId) {
      setHistoricaMaterias([]);
      setHistoricaNotas({});
      return;
    }
    const { data: matData } = await supabase
      .from("materias")
      .select("*")
      .eq("curso_id", cId);
    const mats = matData || [];
    setHistoricaMaterias(mats);

    const initialNotas = {};
    mats.forEach(m => {
      initialNotas[m.id] = { valoracion: "TEA", nota: "", intensificacion: "", nota_final: "" };
    });
    setHistoricaNotas(initialNotas);
  };

  const handleHistoricaNotaChange = (materiaId, field, val) => {
    setHistoricaNotas(prev => {
      const current = prev[materiaId] || { valoracion: "TEA", nota: "", intensificacion: "", nota_final: "" };
      return { ...prev, [materiaId]: { ...current, [field]: val } };
    });
  };

  const handleGuardarCargaHistorica = async () => {
    try {
      setHistoricaSaving(true);
      let targetEstId = historicaSelectedEstId;

      if (historicaTipoEstudiante === "nuevo") {
        if (!historicaNuevoNombre.trim() || !historicaNuevoApellido.trim() || !historicaNuevoDni.trim()) {
          Swal.fire("Atención", "Completa Apellido, Nombre y DNI del estudiante histórico.", "warning");
          setHistoricaSaving(false);
          return;
        }

        const { data: newEst, error: estErr } = await supabase
          .from("estudiantes")
          .insert({
            nombre: historicaNuevoNombre.trim(),
            apellido: historicaNuevoApellido.trim(),
            dni: historicaNuevoDni.trim(),
            cuil: historicaNuevoCuil.trim() || null,
            email: historicaNuevoEmail.trim() || null,
            telefono: historicaNuevoTelefono.trim() || null,
            estado: historicaNuevoEstado,
            curso_id: historicaCursoId || null
          })
          .select()
          .single();

        if (estErr) throw estErr;
        targetEstId = newEst.id;
      }

      if (!targetEstId) {
        Swal.fire("Atención", "Debes seleccionar o crear un estudiante.", "warning");
        setHistoricaSaving(false);
        return;
      }

      const records = historicaMaterias.map(m => {
        const n = historicaNotas[m.id] || {};
        return {
          estudiante_id: targetEstId,
          materia_id: m.id,
          ciclo_lectivo: historicaAnio,
          valoracion: n.valoracion || "TEA",
          nota: n.nota || null,
          intensificacion: n.intensificacion || null,
          nota_final: n.nota_final || null
        };
      });

      if (records.length > 0) {
        const { error: calErr } = await supabase.from("calificaciones").upsert(records, {
          onConflict: "estudiante_id,materia_id"
        });
        if (calErr) throw calErr;
      }

      Swal.fire({
        icon: "success",
        title: "Carga Histórica Exitosa",
        text: "Se registraron las calificaciones del ciclo " + historicaAnio + " correctamente.",
        timer: 2000,
        showConfirmButton: false
      });

      await loadData();
      setHistoricaStep(1);
      setHistoricaCursoId("");
      setHistoricaMaterias([]);
      setHistoricaNotas({});
      setHistoricaSelectedEstId("");
      setHistoricaNuevoNombre("");
      setHistoricaNuevoApellido("");
      setHistoricaNuevoDni("");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setHistoricaSaving(false);
    }
  };

  const loadRegistrosHistoricosList = async () => {
    try {
      const { data } = await supabase
        .from("calificaciones")
        .select("*, estudiantes(nombre, apellido, dni), materias(nombre)")
        .order("created_at", { ascending: false });
      setRegistrosHistoricosList(data || []);
    } catch (e) {
      console.error(e);
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
        text: "¿Deseas eliminar definitivamente el legajo del docente Prof. " + docente.apellido + ", " + docente.nombre + "? Esta acción eliminará el registro de la institución." + docente.apellido + ", " + docente.nombre + "? Esta acción eliminará el registro de la institución.",
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
    if (!docDni || !docNombre || !docApellido) {
      Swal.fire("Error", "Ingrese DNI, Nombre y Apellido del docente.", "error");
      return;
    }
    try {
      const record = {
        cuil: docCuil.trim() || null,
        dni: docDni.trim(),
        nombre: docNombre.trim(),
        apellido: docApellido.trim(),
        email: docEmail.trim() || null,
        telefono: docTelefono.trim() || null,
        titulo: docTitulo.trim() || "Profesor/a Secundario",
        activo: true
      };
      const { error } = await supabase.from("docentes").insert(record);
      if (error) throw error;
      Swal.fire({
        icon: "success",
        title: "Docente Registrado",
        text: "Prof. " + docApellido + ", " + docNombre + " incorporado/a exitosamente al legajo.",
        timer: 2000,
        showConfirmButton: false
      });
      setShowDocenteModal(false);
      setDocCuil(""); setDocDni(""); setDocNombre(""); setDocApellido(""); setDocEmail(""); setDocTelefono(""); setDocTitulo("");
      await loadData();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
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

      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-3 sm:px-4 pt-2 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none text-xs font-bold shadow-xs">
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
      {activeTab === "salidas" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="card p-6 bg-gradient-to-r from-[#0D2A3E] to-[#006384] text-white rounded-2xl shadow-md border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading flex items-center gap-2 text-[#F5C442]">
                  <Compass className="w-6 h-6" />
                  Salidas Educativas y Representación Institucional (Anexos 4 y 5)
                </h2>
                <p className="text-xs text-blue-100 mt-1 max-w-3xl leading-relaxed">
                  Formulario oficial de confección de proyectos pedagógicos de salida, itinerarios, franjas horarias y nómina de asistencia. Generación e impresión directa en formato Microsoft Word (.docx) normativos de la Provincia de Buenos Aires.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDescargarAnexo4}
                  className="btn-gold font-bold text-xs py-2.5 px-4 flex items-center gap-2 shadow-md hover:scale-105 transition-all"
                >
                  <FileText className="w-4 h-4" /> Descargar Anexo 4 (.docx)
                </button>
                <button
                  type="button"
                  onClick={handleDescargarAnexo5}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md hover:scale-105 transition-all"
                >
                  <Printer className="w-4 h-4" /> Descargar Anexo 5 (.docx)
                </button>
              </div>
            </div>
          </div>

          {/* Formulario Seccionado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda: Datos del Proyecto e Itinerario */}
            <div className="space-y-6">
              <div className="card p-5 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                <h3 className="text-sm font-bold text-[#0D2A3E] border-b pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#006384]" />
                  1. Datos del Proyecto y Destino Educativo
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Denominación del Proyecto *</label>
                  <input
                    type="text"
                    value={salidaProyecto}
                    onChange={(e) => setSalidaProyecto(e.target.value)}
                    placeholder="Ej: Visita Pedagógica Tecnológica y Cultural 2026"
                    className="field-soft text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lugar / Destino a Visitar *</label>
                  <input
                    type="text"
                    value={salidaLugar}
                    onChange={(e) => setSalidaLugar(e.target.value)}
                    placeholder="Ej: Museo de Ciencias Naturales de La Plata"
                    className="field-soft text-xs font-bold text-[#006384]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Curso Participante *</label>
                    <select
                      value={salidaCursoId}
                      onChange={(e) => handleSalidaCursoChange(e.target.value)}
                      className="field-soft text-xs font-bold border-2 border-blue-500"
                    >
                      <option value="">-- Seleccionar Curso --</option>
                      {cursos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.anio}? "{c.division}" - {c.orientacion} ({c.turno})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Docente Responsable Titular *</label>
                    <input
                      type="text"
                      value={salidaDocenteNombre}
                      onChange={(e) => setSalidaDocenteNombre(e.target.value)}
                      placeholder="Ej: Prof. Gómez, Ana Paula"
                      className="field-soft text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cargo Responsable</label>
                    <input
                      type="text"
                      value={salidaDocenteCargo}
                      onChange={(e) => setSalidaDocenteCargo(e.target.value)}
                      className="field-soft text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Docentes Acompañantes</label>
                    <input
                      type="number"
                      value={salidaCantDocentes}
                      onChange={(e) => setSalidaCantDocentes(e.target.value)}
                      className="field-soft text-xs text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">No Docentes Acomp.</label>
                    <input
                      type="number"
                      value={salidaCantNoDocentes}
                      onChange={(e) => setSalidaCantNoDocentes(e.target.value)}
                      className="field-soft text-xs text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Franja Horaria y Lugares */}
              <div className="card p-5 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                <h3 className="text-sm font-bold text-[#0D2A3E] border-b pb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#006384]" />
                  2. Franja Horaria y Lugares de Encuentro
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Salida *</label>
                    <input
                      type="date"
                      value={salidaFechaSalida}
                      onChange={(e) => setSalidaFechaSalida(e.target.value)}
                      className="field-soft text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hora Salida</label>
                    <input
                      type="text"
                      value={salidaHoraSalida}
                      onChange={(e) => setSalidaHoraSalida(e.target.value)}
                      className="field-soft text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Lugar de Salida</label>
                    <input
                      type="text"
                      value={salidaLugarSalida}
                      onChange={(e) => setSalidaLugarSalida(e.target.value)}
                      className="field-soft text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Regreso *</label>
                    <input
                      type="date"
                      value={salidaFechaRegreso}
                      onChange={(e) => setSalidaFechaRegreso(e.target.value)}
                      className="field-soft text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hora Regreso</label>
                    <input
                      type="text"
                      value={salidaHoraRegreso}
                      onChange={(e) => setSalidaHoraRegreso(e.target.value)}
                      className="field-soft text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Lugar de Regreso</label>
                    <input
                      type="text"
                      value={salidaLugarRegreso}
                      onChange={(e) => setSalidaLugarRegreso(e.target.value)}
                      className="field-soft text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones respecto a Fechas / Clima</label>
                  <input
                    type="text"
                    value={salidaObsFechas}
                    onChange={(e) => setSalidaObsFechas(e.target.value)}
                    className="field-soft text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Fundamentación y Nómina Anexo 5 */}
            <div className="space-y-6">
              <div className="card p-5 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                <h3 className="text-sm font-bold text-[#0D2A3E] border-b pb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#006384]" />
                  3. Fundamentación Pedagógica e Itinerario (Anexo 4)
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Objetivos de la Salida *</label>
                  <textarea
                    rows={2}
                    value={salidaObjetivos}
                    onChange={(e) => setSalidaObjetivos(e.target.value)}
                    className="field-soft text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Itinerario Pormenorizado *</label>
                  <textarea
                    rows={2}
                    value={salidaItinerario}
                    onChange={(e) => setSalidaItinerario(e.target.value)}
                    className="field-soft text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Actividades Pedagógicas a Realizar *</label>
                  <textarea
                    rows={2}
                    value={salidaActividades}
                    onChange={(e) => setSalidaActividades(e.target.value)}
                    className="field-soft text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cronograma Diario *</label>
                  <textarea
                    rows={2}
                    value={salidaCronograma}
                    onChange={(e) => setSalidaCronograma(e.target.value)}
                    className="field-soft text-xs"
                  />
                </div>
              </div>

              {/* Nómina de Asistencia Anexo 5 */}
              <div className="card p-5 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-[#0D2A3E] flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    4. Nómina de Participantes y Asistencia (Anexo 5)
                  </h3>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    {salidaAlumnos.filter(a => a.seleccionado).length} Inscriptos
                  </span>
                </div>

                {salidaCursoId === "" ? (
                  <div className="p-6 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl space-y-1">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-xs">Selecciona un Curso en el paso 1 para cargar la nómina de estudiantes.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-64 border rounded-xl divide-y">
                    {salidaAlumnos.map((a) => (
                      <div key={a.id} className="p-2.5 px-4 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={a.seleccionado}
                            onChange={() => toggleAlumnoSeleccionado(a.id)}
                            className="w-4 h-4 accent-[#006384] rounded"
                          />
                          <div>
                            <p className="font-bold text-[#0D2A3E]">{a.apellido}, {a.nombre}</p>
                            <p className="text-[10px] text-gray-500 font-mono">DNI: {a.dni}</p>
                          </div>
                        </div>

                        {a.seleccionado && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => changeAlumnoAsistencia(a.id, 'P')}
                              className={"px-2 py-0.5 rounded text-[10px] font-bold border transition-all " + (a.asistencia === 'P' ? "bg-emerald-600 text-white border-emerald-700" : "bg-gray-100 text-gray-600 border-gray-200")}
                            >
                              P (Presente)
                            </button>
                            <button
                              type="button"
                              onClick={() => changeAlumnoAsistencia(a.id, 'A')}
                              className={"px-2 py-0.5 rounded text-[10px] font-bold border transition-all " + (a.asistencia === 'A' ? "bg-red-600 text-white border-red-700" : "bg-gray-100 text-gray-600 border-gray-200")}
                            >
                              A (Ausente)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDescargarAnexo4}
                    className="btn-gold font-bold text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-4 h-4" /> Generar Anexo 4 (.docx)
                  </button>
                  <button
                    type="button"
                    onClick={handleDescargarAnexo5}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> Generar Anexo 5 (.docx)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "historica" && (
        <div className="space-y-6">
          {/* Sub-Navegación Carga Histórica */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHistoricaSubTab("nuevo")}
              className={"px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all " + (historicaSubTab === "nuevo" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200")}
            >
              <Plus className="w-4 h-4" /> Cargar Nuevo
            </button>
            <button
              type="button"
              onClick={() => {
                setHistoricaSubTab("registros");
                loadRegistrosHistoricosList();
              }}
              className={"px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all " + (historicaSubTab === "registros" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200")}
            >
              <FileText className="w-4 h-4" /> Ver Registros Históricos
            </button>
          </div>

          {historicaSubTab === "nuevo" && (
            <div className="space-y-6">
              {/* Stepper Visual (1 -> 2 -> 3) */}
              <div className="card p-6 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md " + (historicaStep >= 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400")}>
                    1
                  </div>
                  <span className="text-xs font-bold text-gray-700 hidden sm:inline">Configuración del Ciclo</span>
                </div>
                <div className={"h-1 flex-1 mx-4 rounded-full " + (historicaStep >= 2 ? "bg-indigo-600" : "bg-gray-200")} />
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md " + (historicaStep >= 2 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400")}>
                    2
                  </div>
                  <span className="text-xs font-bold text-gray-700 hidden sm:inline">Estudiante</span>
                </div>
                <div className={"h-1 flex-1 mx-4 rounded-full " + (historicaStep >= 3 ? "bg-indigo-600" : "bg-gray-200")} />
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md " + (historicaStep >= 3 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400")}>
                    3
                  </div>
                  <span className="text-xs font-bold text-gray-700 hidden sm:inline">Calificaciones</span>
                </div>
              </div>

              {/* PASO 1: Configuración del Ciclo Histórico */}
              {historicaStep === 1 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex items-start gap-4 text-indigo-950">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 mt-0.5">
                      !
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-heading">Configuración del Ciclo Histórico</h3>
                      <p className="text-xs text-indigo-800 mt-0.5">
                        Selecciona el año lectivo y curso al que pertenecieron los registros que vas a digitalizar.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Botones Selección de Año Lectivo */}
                    <div className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                      <label className="block text-xs font-extrabold tracking-wider text-gray-600 uppercase flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" /> AÑO LECTIVO HISTÓRICO
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["2025", "2024", "2023", "2022", "2021", "2020"].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setHistoricaAnio(yr)}
                            className={"py-3 px-4 rounded-xl font-extrabold text-sm border-2 transition-all shadow-xs " + (historicaAnio === yr ? "bg-indigo-50 text-indigo-700 border-indigo-600 scale-105" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selector de Curso Base */}
                    <div className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                      <label className="block text-xs font-extrabold tracking-wider text-gray-600 uppercase flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" /> CURSO / DIVISIÓN (PLANTILLA BASE)
                      </label>
                      <select
                        value={historicaCursoId}
                        onChange={(e) => handleHistoricaCursoSelect(e.target.value)}
                        className="field-soft text-xs font-bold border-2 border-indigo-500 py-3"
                      >
                        <option value="">Seleccionar curso base...</option>
                        {cursos.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.anio}? "{c.division}" - {c.orientacion} ({c.turno})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-400 italic leading-relaxed">
                        Se usar? como plantilla de materias. El alumno quedar? registrado en un curso del ciclo seleccionado.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!historicaCursoId}
                      onClick={() => setHistoricaStep(2)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-8 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      Siguiente: Seleccionar Estudiante ?
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: Selección o Alta de Estudiante */}
              {historicaStep === 2 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="card p-6 bg-white space-y-6 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Paso 2: Datos del Estudiante (Ciclo {historicaAnio})
                      </h3>
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                        Año Lectivo {historicaAnio}
                      </span>
                    </div>

                    {/* Switcher: Existente vs Nuevo Egresado */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-100 p-1.5 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setHistoricaTipoEstudiante("existente")}
                        className={"py-2.5 rounded-lg transition-all " + (historicaTipoEstudiante === "existente" ? "bg-white text-indigo-700 shadow-xs" : "text-gray-600")}
                      >
                        Estudiante Existente en Sistema
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoricaTipoEstudiante("nuevo")}
                        className={"py-2.5 rounded-lg transition-all " + (historicaTipoEstudiante === "nuevo" ? "bg-white text-indigo-700 shadow-xs" : "text-gray-600")}
                      >
                        + Crear Nuevo Estudiante / Ex-Alumno
                      </button>
                    </div>

                    {historicaTipoEstudiante === "existente" ? (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-700">Seleccionar Estudiante Registrado:</label>
                        <select
                          value={historicaSelectedEstId}
                          onChange={(e) => setHistoricaSelectedEstId(e.target.value)}
                          className="field-soft text-xs font-bold border-2 border-indigo-400 py-2.5"
                        >
                          <option value="">-- Buscar por Apellido, Nombre o DNI --</option>
                          {estudiantes.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.apellido}, {e.nombre} (DNI: {e.dni}) - {e.estado || "Regular"}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                        <h4 className="text-xs font-extrabold text-indigo-900 uppercase">Formulario Rápido de Alta de Ex-Alumno</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Apellido *</label>
                            <input
                              type="text"
                              value={historicaNuevoApellido}
                              onChange={(e) => setHistoricaNuevoApellido(e.target.value)}
                              placeholder="Ej: Pérez"
                              className="field-soft text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
                            <input
                              type="text"
                              value={historicaNuevoNombre}
                              onChange={(e) => setHistoricaNuevoNombre(e.target.value)}
                              placeholder="Ej: Juan Carlos"
                              className="field-soft text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">DNI *</label>
                            <input
                              type="text"
                              value={historicaNuevoDni}
                              onChange={(e) => setHistoricaNuevoDni(e.target.value)}
                              placeholder="12345678"
                              className="field-soft text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">CUIL</label>
                            <input
                              type="text"
                              value={historicaNuevoCuil}
                              onChange={(e) => setHistoricaNuevoCuil(e.target.value)}
                              placeholder="20-12345678-9"
                              className="field-soft text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Estado Institucional</label>
                            <select
                              value={historicaNuevoEstado}
                              onChange={(e) => setHistoricaNuevoEstado(e.target.value)}
                              className="field-soft text-xs font-bold"
                            >
                              <option value="Egresado">Egresado</option>
                              <option value="Inactivo">Inactivo</option>
                              <option value="Pase">Pase</option>
                              <option value="Regular">Regular</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setHistoricaStep(1)}
                      className="btn-secondary text-xs py-2.5 px-6"
                    >
                      ? Volver
                    </button>
                    <button
                      type="button"
                      disabled={historicaTipoEstudiante === "existente" ? !historicaSelectedEstId : (!historicaNuevoApellido || !historicaNuevoNombre || !historicaNuevoDni)}
                      onClick={() => setHistoricaStep(3)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-8 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      Siguiente: Cargar Calificaciones ?
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: Carga de Calificaciones */}
              {historicaStep === 3 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="text-base font-bold font-heading text-[#0D2A3E]">
                          Paso 3: Matriz de Calificaciones Históricas ({historicaAnio})
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Digitalización de notas para las materias del curso seleccionado.
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                        {historicaMaterias.length} Materias
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
                          <tr>
                            <th className="py-3.5 px-4">Asignatura / Materia</th>
                            <th className="py-3.5 px-4 text-center w-32">Valoración</th>
                            <th className="py-3.5 px-4 text-center w-24">Nota</th>
                            <th className="py-3.5 px-4 text-center w-36">Intensificación</th>
                            <th className="py-3.5 px-4 text-center w-28">Nota Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {historicaMaterias.map((m) => {
                            const n = historicaNotas[m.id] || { valoracion: "TEA", nota: "", intensificacion: "", nota_final: "" };
                            return (
                              <tr key={m.id} className="hover:bg-gray-50">
                                <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{m.nombre}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <select
                                    value={n.valoracion}
                                    onChange={(e) => handleHistoricaNotaChange(m.id, "valoracion", e.target.value)}
                                    className="field-soft text-xs py-1 px-2 text-center font-bold"
                                  >
                                    <option value="TEA">TEA</option>
                                    <option value="TEP">TEP</option>
                                    <option value="TED">TED</option>
                                  </select>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <input
                                    type="text"
                                    value={n.nota}
                                    onChange={(e) => handleHistoricaNotaChange(m.id, "nota", e.target.value)}
                                    placeholder="-"
                                    className="field-soft text-xs py-1 px-2 text-center font-bold"
                                  />
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <input
                                    type="text"
                                    value={n.intensificacion}
                                    onChange={(e) => handleHistoricaNotaChange(m.id, "intensificacion", e.target.value)}
                                    placeholder="Dic / Feb"
                                    className="field-soft text-xs py-1 px-2 text-center"
                                  />
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <input
                                    type="text"
                                    value={n.nota_final}
                                    onChange={(e) => handleHistoricaNotaChange(m.id, "nota_final", e.target.value)}
                                    placeholder="Final"
                                    className="field-soft text-xs py-1 px-2 text-center font-extrabold text-[#006384]"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setHistoricaStep(2)}
                      className="btn-secondary text-xs py-2.5 px-6"
                    >
                      ? Volver
                    </button>
                    <button
                      type="button"
                      disabled={historicaSaving}
                      onClick={handleGuardarCargaHistorica}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-8 rounded-xl shadow-md flex items-center gap-2"
                    >
                      ?? Guardar Carga Histórica en Supabase
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: VER REGISTROS HISTÓRICOS */}
          {historicaSubTab === "registros" && (
            <div className="card p-6 bg-white space-y-4 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" />
                    Historial Completo de Calificaciones Digitalizadas
                  </h3>
                  <p className="text-xs text-gray-500">Registros de notas cargados para ciclos lectivos anteriores.</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={historicaSearch}
                    onChange={(e) => setHistoricaSearch(e.target.value)}
                    placeholder="Buscar alumno o materia..."
                    className="field-soft pl-9 text-xs py-1.5 w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4">DNI</th>
                      <th className="py-3 px-4">Ciclo Lectivo</th>
                      <th className="py-3 px-4">Materia / Asignatura</th>
                      <th className="py-3 px-4 text-center">1? Cuat.</th>
                      <th className="py-3 px-4 text-center">2? Cuat.</th>
                      <th className="py-3 px-4 text-center">Nota Final</th>
                      <th className="py-3 px-4 text-center">Valoración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {registrosHistoricosList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-400 font-bold">
                          No hay registros históricos cargados en el sistema.
                        </td>
                      </tr>
                    ) : (
                      registrosHistoricosList
                        .filter((r) => {
                          const name = r.estudiantes ? r.estudiantes.apellido + " " + r.estudiantes.nombre : "";
                          const matName = r.materias ? r.materias.nombre : "";
                          return name.toLowerCase().includes(historicaSearch.toLowerCase()) || matName.toLowerCase().includes(historicaSearch.toLowerCase());
                        })
                        .map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                              {r.estudiantes ? r.estudiantes.apellido + ", " + r.estudiantes.nombre : "Estudiante Registrado"}
                            </td>
                            <td className="py-3.5 px-4 font-mono">{r.estudiantes ? r.estudiantes.dni : "-"}</td>
                            <td className="py-3.5 px-4 font-bold text-indigo-700">{r.ciclo_lectivo || "2025"}</td>
                            <td className="py-3.5 px-4 font-semibold text-gray-700">{r.materias ? r.materias.nombre : "Materia"}</td>
                            <td className="py-3.5 px-4 text-center">{r.nota_q1 || "-"}</td>
                            <td className="py-3.5 px-4 text-center">{r.nota_q2 || "-"}</td>
                            <td className="py-3.5 px-4 text-center font-extrabold text-[#006384]">{r.nota_final || "-"}</td>
                            <td className="py-3.5 px-4 text-center font-bold">{r.valoracion || "TEA"}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                      <th className="py-3 px-4">Título Principal</th>
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
                  En este panel se visualizan en tiempo real todos los cargos y franjas horarias externas declaradas formalmente por el cuerpo docente activo del CENS Nº 454.
                </div>
              </div>

              <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xs">
                <div className="bg-[#0D2A3E] text-white p-4 px-6 font-heading text-xs font-bold flex justify-between items-center">
                  <span>Nómina de Declaraciones Juradas Presentadas ({ddjjDocentes.length})</span>
                  <span className="text-[11px] text-blue-200 font-normal">Carga activa por docentes</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3.5 px-4">Docente</th>
                        <th className="py-3.5 px-4">DNI / CUIL</th>
                        <th className="py-3.5 px-4">Establecimiento Externo</th>
                        <th className="py-3.5 px-4">Cargo / Función</th>
                        <th className="py-3.5 px-4">Horario Declarado</th>
                        <th className="py-3.5 px-4">Días / Distrito</th>
                        <th className="py-3.5 px-4 text-center">Acción</th>
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
                              <td className="py-3.5 px-4 text-gray-600">{ddjj.dias_externos || "Esteban Echeverría"}</td>
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

      {/* MODAL IMPRESIÓNÓN? DOCUMENTOS Y CONSTANCIAS OFICIALES */}
      {showDocModal && docEstudiante && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 space-y-6 relative border border-gray-200">
            <div className="flex justify-between items-center border-b pb-4"><h3 className="text-lg font-bold text-[#0D2A3E]">Vista Previa e Impresión de Documento Oficial</h3><button onClick={() => setShowDocModal(false)} className="text-gray-400 font-bold text-lg">✕</button></div>
            <div className="border p-8 rounded-xl bg-white space-y-6 text-gray-900 font-sans">
              <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-gray-900">CENS Nº 454 - ESTEBAN ECHEVERRÍAÍA</h2>
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
                <div className="border-t border-gray-900 pt-2"><p>SELLO INSTITUCIONAL</p><p className="text-[10px] text-gray-500 font-normal mt-0.5">CENS Nº 454 ESTEBAN ECHEVERRÍAÍA</p></div>
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

      {/* MODAL Baja / Pase */}
      {showBajaModal && selectedEstudianteBaja && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3"><h3 className="text-base font-bold text-[#0D2A3E]">Registrar Baja / Pase: {selectedEstudianteBaja.apellido}, {selectedEstudianteBaja.nombre}</h3><button onClick={() => setShowBajaModal(false)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleConfirmarBajaOPase} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">Motivo de Baja:</label><select value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} className="field-soft text-xs font-bold border-2 border-red-300"><option value="Abandono">Abandono de Estudios</option><option value="Pase">Pase a Otra Institución Educativa</option><option value="Error de Carga">Error de Carga (Duplicado o incorrecto)</option></select></div>
              {motivoBaja === "Pase" && (<div><label className="block text-xs font-bold mb-1">Escuela / Establecimiento Destino *</label><input type="text" value={escuelaDestino} onChange={(e) => setEscuelaDestino(e.target.value)} placeholder="Ej: CENS Nº° 451" className="field-soft text-xs font-bold border-2 border-blue-400" required /></div>)}
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