"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
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
  Calendar,
  Edit,
  Eye,
  Printer,
  GraduationCap,
  Search,
  Send,
  Check,
  Award,
  TrendingUp
} from "lucide-react";

export default function PreceptorPage() {
  const { cicloLectivo } = useAuth();
  const [activePreceptorTab, setActivePreceptorTab] = useState("asistencia");

  const [cursos, setCursos] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // Calificador state
  const [searchCalificador, setSearchCalificador] = useState("");
  const [selectedCalificadorStudent, setSelectedCalificadorStudent] = useState(null);

  // Planillas tab state
  const [selectedPlanillaCursoId, setSelectedPlanillaCursoId] = useState("");
  const [planillaFilterMode, setPlanillaFilterMode] = useState("nota_final");
  const [planillaMaterias, setPlanillaMaterias] = useState([]);
  const [planillaDocentesMap, setPlanillaDocentesMap] = useState({});
  const [planillaCalificacionesMap, setPlanillaCalificacionesMap] = useState({});

  // Modal Inscribir
  const [showInscribirModal, setShowInscribirModal] = useState(false);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [ciudadNacimiento, setCiudadNacimiento] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [orientacion, setOrientacion] = useState("Ciencias Sociales");
  const [cursoAsignadoId, setCursoAsignadoId] = useState("");
  const [fotocopiaDni, setFotocopiaDni] = useState(false);
  const [partidaNacimiento, setPartidaNacimiento] = useState(false);
  const [certificadoEstudios, setCertificadoEstudios] = useState(false);
  const [numeroLibro, setNumeroLibro] = useState("");
  const [numeroFolio, setNumeroFolio] = useState("");

  // Modales Legajo y Boletín
  const [showLegajoModal, setShowLegajoModal] = useState(false);
  const [selectedLegajoStudent, setSelectedLegajoStudent] = useState(null);
  const [showBoletinModal, setShowBoletinModal] = useState(false);
  const [selectedBoletinStudent, setSelectedBoletinStudent] = useState(null);

  useEffect(() => {
    loadCursos();
  }, [cicloLectivo]);

  useEffect(() => {
    if (selectedCurso) {
      loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    }
  }, [selectedCurso, fecha]);

  useEffect(() => {
    if (selectedPlanillaCursoId) {
      loadPlanillaConsolidadaData(selectedPlanillaCursoId);
    }
  }, [selectedPlanillaCursoId]);

  async function loadCursos() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cursos").select("*").order("anio");
      if (error) throw error;
      if (data && data.length > 0) {
        setCursos(data);
        setSelectedCurso(data[0]);
        setCursoAsignadoId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadEstudiantesYAsistencias(cursoId, dateStr) {
    try {
      let estList = [];
      const { data: acData } = await supabase
        .from("alumnos_cursos")
        .select("estudiante_id, estudiantes(*)")
        .eq("curso_id", cursoId);

      if (acData && acData.length > 0) {
        estList = acData.map((item) => item.estudiantes).filter(Boolean);
      } else {
        const { data: estDirect } = await supabase
          .from("estudiantes")
          .select("*")
          .eq("curso_id", cursoId)
          .order("apellido");

        estList = estDirect || [];
      }

      setEstudiantes(estList);
      if (estList.length > 0) {
        setSelectedCalificadorStudent(estList[0]);
      } else {
        setSelectedCalificadorStudent(null);
      }

      const { data: asisData } = await supabase
        .from("asistencias")
        .select("*")
        .eq("curso_id", cursoId)
        .eq("fecha", dateStr);

      const map = {};
      if (asisData) {
        asisData.forEach((a) => {
          map[a.estudiante_id] = a.estado;
        });
      }
      setAsistencias(map);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPlanillaConsolidadaData(cursoId) {
    try {
      let estList = [];
      const { data: acData } = await supabase
        .from("alumnos_cursos")
        .select("estudiante_id, estudiantes(*)")
        .eq("curso_id", cursoId);

      if (acData && acData.length > 0) {
        estList = acData.map((item) => item.estudiantes).filter(Boolean);
      } else {
        const { data: estDirect } = await supabase
          .from("estudiantes")
          .select("*")
          .eq("curso_id", cursoId)
          .order("apellido");

        estList = estDirect || [];
      }
      setEstudiantes(estList);

      const { data: matList } = await supabase.from("materias").select("*").eq("curso_id", cursoId);
      setPlanillaMaterias(matList || []);

      if (matList && matList.length > 0) {
        const matIds = matList.map(m => m.id);
        const { data: dmData } = await supabase.from("docente_materia").select("materia_id, docentes(nombre, apellido)").in("materia_id", matIds);
        const docMap = {};
        if (dmData) {
          dmData.forEach(item => {
            if (item.docentes) {
              docMap[item.materia_id] = "Prof. " + item.docentes.nombre + " " + item.docentes.apellido;
            }
          });
        }
        setPlanillaDocentesMap(docMap);

        const { data: calData } = await supabase.from("calificaciones").select("*").in("materia_id", matIds);
        const gradeMap = {};
        if (calData) {
          calData.forEach(c => {
            if (!gradeMap[c.estudiante_id]) gradeMap[c.estudiante_id] = {};
            gradeMap[c.estudiante_id][c.materia_id] = c.nota_final || c.nota || c.valoracion || "-";
          });
        }
        setPlanillaCalificacionesMap(gradeMap);
      }
    } catch (e) { console.error(e); }
  }
  const handleSelectCursoById = (cId) => {
    const found = cursos.find((c) => c.id === cId);
    if (found) {
      setSelectedCurso(found);
    }
  };

  const handleMandarATitular = async (student) => {
    if (!student) return;
    try {
      const confirm = await Swal.fire({
        title: "¿Mandar a Titular?",
        text: "Se marcará a " + student.apellido + ", " + student.nombre + " en condición de titularización para el Módulo de Secretaría (Títulos y Egresados).",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        confirmButtonText: "Sí, Mandar a Titular",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        try {
          await supabase.from("estudiantes").update({ en_condicion_titulo: true, estado_titulo: "En Trámite" }).eq("id", student.id);
        } catch (errCol) {
          await supabase.from("estudiantes").update({ estado: "egresado" }).eq("id", student.id);
        }

        setSelectedCalificadorStudent((prev) => ({ ...prev, en_condicion_titulo: true, estado_titulo: "En Trámite" }));
        Swal.fire({
          icon: "success",
          title: "¡Estudiante Enviado a Titularización!",
          text: student.apellido + ", " + student.nombre + " ya figura disponible en el Módulo de Secretaría (Títulos y Egresados).",
          timer: 2000,
          showConfirmButton: false
        });
        if (selectedCurso) loadEstudiantesYAsistencias(selectedCurso.id, fecha);
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleAsistenciaChange = (estudianteId, estado) => {
    setAsistencias((prev) => ({ ...prev, [estudianteId]: estado }));
  };

  const handleGuardarAsistencias = async () => {
    if (!selectedCurso) return;
    setSaving(true);
    try {
      const records = Object.keys(asistencias).map((estId) => ({
        estudiante_id: estId,
        curso_id: selectedCurso.id,
        fecha: fecha,
        estado: asistencias[estId]
      }));

      if (records.length > 0) {
        const { error } = await supabase.from("asistencias").upsert(records, {
          onConflict: "estudiante_id,fecha,curso_id"
        });
        if (error) throw error;
      }

      Swal.fire({
        icon: "success",
        title: "Asistencia Guardada",
        text: "Se registraron " + records.length + " asistencias para el " + fecha + ".",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInscribirEstudiante = async (e) => {
    e.preventDefault();
    if (!dni.trim() || !nombre.trim() || !apellido.trim()) {
      Swal.fire("Error", "Debe ingresar DNI, Nombre y Apellido del estudiante.", "error");
      return;
    }

    try {
      const studentData = {
        dni: dni.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        genero,
        fecha_nacimiento: fechaNacimiento || null,
        ciudad_nacimiento: ciudadNacimiento.trim() || null,
        direccion: direccion.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        orientacion,
        fotocopia_dni: fotocopiaDni,
        partida_nacimiento: partidaNacimiento,
        certificado_estudios: certificadoEstudios,
        numero_libro: numeroLibro.trim() || null,
        numero_folio: numeroFolio.trim() || null,
        curso_id: cursoAsignadoId || null,
        estado: "activo"
      };

      const { data: newEst, error: estErr } = await supabase
        .from("estudiantes")
        .insert(studentData)
        .select()
        .single();

      if (estErr) throw estErr;

      if (newEst && cursoAsignadoId) {
        await supabase.from("alumnos_cursos").insert({
          estudiante_id: newEst.id,
          curso_id: cursoAsignadoId
        });
      }

      Swal.fire({
        icon: "success",
        title: "Inscripción Exitosa",
        text: "Estudiante " + apellido + ", " + nombre + " inscripto correctamente.",
        timer: 1500,
        showConfirmButton: false
      });

      setShowInscribirModal(false);
      setDni(""); setNombre(""); setApellido(""); setFechaNacimiento(""); setCiudadNacimiento(""); setDireccion(""); setNumeroLibro(""); setNumeroFolio("");
      if (selectedCurso) loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    } catch (err) {
      Swal.fire("Error al inscribir", err.message, "error");
    }
  };

  const handleUpdateLegajoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLegajoStudent) return;
    try {
      const { error } = await supabase
        .from("estudiantes")
        .update({
          dni: selectedLegajoStudent.dni,
          nombre: selectedLegajoStudent.nombre,
          apellido: selectedLegajoStudent.apellido,
          genero: selectedLegajoStudent.genero,
          fecha_nacimiento: selectedLegajoStudent.fecha_nacimiento || null,
          ciudad_nacimiento: selectedLegajoStudent.ciudad_nacimiento || null,
          direccion: selectedLegajoStudent.direccion || null,
          email: selectedLegajoStudent.email || null,
          telefono: selectedLegajoStudent.telefono || null,
          numero_libro: selectedLegajoStudent.numero_libro || null,
          numero_folio: selectedLegajoStudent.numero_folio || null,
          fotocopia_dni: selectedLegajoStudent.fotocopia_dni || false,
          partida_nacimiento: selectedLegajoStudent.partida_nacimiento || false,
          certificado_estudios: selectedLegajoStudent.certificado_estudios || false
        })
        .eq("id", selectedLegajoStudent.id);

      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Legajo Actualizado",
        text: "Se guardaron las modificaciones en Supabase.",
        timer: 1500,
        showConfirmButton: false
      });
      setShowLegajoModal(false);
      if (selectedCurso) loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filteredStudentsCalificador = estudiantes.filter((e) => {
    const q = searchCalificador.toLowerCase();
    return (
      e.apellido?.toLowerCase().includes(q) ||
      e.nombre?.toLowerCase().includes(q) ||
      (e.dni && e.dni.includes(q))
    );
  });

  const selectedPlanillaCurso = cursos.find((c) => c.id === selectedPlanillaCursoId);