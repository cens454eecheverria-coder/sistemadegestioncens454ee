"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { PAISES_NACIONALIDAD } from "@/lib/nacionalidades";
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
  TrendingUp,
  User,
  FileCheck2,
  Filter,
  CheckCircle,
  ArrowUpDown,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight,
  Info,
  SearchX
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
  const [planillaMateriaFilter, setPlanillaMateriaFilter] = useState("todas"); // "todas", "Q1", "Q2"
  const [planillaDisplayMode, setPlanillaDisplayMode] = useState("mixto"); // "num", "conceptual", "mixto"
  const [searchPlanilla, setSearchPlanilla] = useState("");
  const [planillaEstadoFilter, setPlanillaEstadoFilter] = useState("todos"); // "todos", "aprobados", "intensificacion", "pendientes"
  const [loadingPlanilla, setLoadingPlanilla] = useState(false);
  const [planillaMaterias, setPlanillaMaterias] = useState([]);
  const [planillaDocentesMap, setPlanillaDocentesMap] = useState({});
  const [planillaCalificacionesMap, setPlanillaCalificacionesMap] = useState({});

  // Modal Inscribir state
  const [showInscribirModal, setShowInscribirModal] = useState(false);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [genero, setGenero] = useState("");
  const [nacionalidad, setNacionalidad] = useState("Argentina");
  const [nacionalidadOtra, setNacionalidadOtra] = useState("");
  const [lugarNacimiento, setLugarNacimiento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [ciudadNacimiento, setCiudadNacimiento] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [orientacion, setOrientacion] = useState("");
  const [cursoAsignadoId, setCursoAsignadoId] = useState("");
  const [fotocopiaDni, setFotocopiaDni] = useState(false);
  const [partidaNacimiento, setPartidaNacimiento] = useState(false);
  const [certificadoEstudios, setCertificadoEstudios] = useState(false);
  const [tipoCertificado, setTipoCertificado] = useState("");
  const [materiasAdeudadas, setMateriasAdeudadas] = useState("");
  const [numeroLibro, setNumeroLibro] = useState("");
  const [numeroFolio, setNumeroFolio] = useState("");

  // Modales Legajo y Boletín state
  const [showLegajoModal, setShowLegajoModal] = useState(false);
  const [selectedLegajoStudent, setSelectedLegajoStudent] = useState(null);

  const [showBoletinModal, setShowBoletinModal] = useState(false);
  const [selectedBoletinStudent, setSelectedBoletinStudent] = useState(null);

  // Sábana Académica State
  const [showSabanaModal, setShowSabanaModal] = useState(false);
  const [selectedSabanaStudent, setSelectedSabanaStudent] = useState(null);
  const [sabanaCalificaciones, setSabanaCalificaciones] = useState([]);
  const [sabanaAsistencia, setSabanaAsistencia] = useState({ presentes: 0, ausentes: 0, total: 0, porcentaje: 100 });
  const [sabanaStats, setSabanaStats] = useState({ total: 0, aprobadas: 0, intensificacion: 0, promedio: "-" });
  const [loadingSabana, setLoadingSabana] = useState(false);
  const [planillaViewMode, setPlanillaViewMode] = useState("matriz"); // "matriz" | "sabana"
  const [boletinCalificaciones, setBoletinCalificaciones] = useState([]);
  const [boletinAsistencia, setBoletinAsistencia] = useState({ presentes: 0, ausentes: 0, total: 0 });
  const [loadingBoletin, setLoadingBoletin] = useState(false);
  const [inasistenciasDocentes, setInasistenciasDocentes] = useState([]);

  useEffect(() => {
    loadCursos();
  }, [cicloLectivo]);

  useEffect(() => {
    if (activePreceptorTab === "inasistencias_docentes") {
      loadInasistenciasDocentes();
    }
  }, [activePreceptorTab]);

  async function loadInasistenciasDocentes() {
    try {
      const { data, error } = await supabase
        .from("inasistencias_docentes")
        .select("*, docentes(nombre, apellido, dni, email, telefono)")
        .order("created_at", { ascending: false });
      if (!error && data) {
        const activeNotices = data.filter(item => item.estado !== "Procesado / Archivado" && item.archivado !== true);
        setInasistenciasDocentes(activeNotices);
      }
    } catch (err) {
      console.warn("inasistencias_docentes warning:", err);
    }
  }

  useEffect(() => {
    if (selectedCurso) {
      loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    }
  }, [selectedCurso, fecha]);

  useEffect(() => {
    if (selectedPlanillaCursoId) {
      loadPlanillaConsolidadaData(selectedPlanillaCursoId);
    }
  }, [selectedPlanillaCursoId, activePreceptorTab]);

  async function loadCursos() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cursos").select("*").order("anio");
      if (error) throw error;
      if (data && data.length > 0) {
        setCursos(data);
        setSelectedCurso(data[0]);
        setCursoAsignadoId(data[0].id);
        if (!selectedPlanillaCursoId) {
          setSelectedPlanillaCursoId(data[0].id);
        }
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
          map[a.estudiante_id] = a.estado === "P" ? "presente" : a.estado === "A" ? "ausente" : a.estado === "J" ? "justificado" : a.estado;
        });
      }
      setAsistencias(map);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPlanillaConsolidadaData(cursoId) {
    if (!cursoId) return;
    setLoadingPlanilla(true);
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

      const { data: matList } = await supabase
        .from("materias")
        .select("*")
        .eq("curso_id", cursoId)
        .order("nombre");
      setPlanillaMaterias(matList || []);

      if (matList && matList.length > 0) {
        const matIds = matList.map((m) => m.id);
        const { data: dmData } = await supabase
          .from("docente_materia")
          .select("materia_id, cargo, docentes(nombre, apellido)")
          .in("materia_id", matIds);
        const docMap = {};
        if (dmData) {
          dmData.forEach((item) => {
            if (item.docentes) {
              const nameStr = "Prof. " + item.docentes.apellido + ", " + item.docentes.nombre;
              if (item.cargo === "suplente" || item.cargo === "provisorio") {
                if (docMap[item.materia_id]) {
                  docMap[item.materia_id] += " (Suplente: " + item.docentes.apellido + ", " + item.docentes.nombre + ")";
                } else {
                  docMap[item.materia_id] = nameStr + " (Suplente)";
                }
              } else {
                docMap[item.materia_id] = nameStr;
              }
            }
          });
        }
        setPlanillaDocentesMap(docMap);

        const { data: calData } = await supabase
          .from("calificaciones")
          .select("*")
          .in("materia_id", matIds);

        const gradeMap = {};
        if (calData) {
          calData.forEach((c) => {
            if (!gradeMap[c.estudiante_id]) gradeMap[c.estudiante_id] = {};
            const finalVal = c.nota_final != null ? c.nota_final : (c.nota != null ? c.nota : null);
            gradeMap[c.estudiante_id][c.materia_id] = {
              id: c.id,
              nota: c.nota != null ? c.nota : null,
              nota_final: finalVal,
              nota_rie: c.nota_rie != null ? c.nota_rie : (c.intensificacion != null ? c.intensificacion : null),
              valoracion: c.evaluacion_nombre || c.valoracion || null,
              raw: c
            };
          });
        }
        setPlanillaCalificacionesMap(gradeMap);
      } else {
        setPlanillaDocentesMap({});
        setPlanillaCalificacionesMap({});
      }
    } catch (e) {
      console.error("Error al cargar planilla consolidada:", e);
    } finally {
      setLoadingPlanilla(false);
    }
  }

  async function loadBoletinData(student) {
    if (!student) return;
    setLoadingBoletin(true);
    try {
      let matList = [];
      if (selectedCurso) {
        const { data: mData } = await supabase.from("materias").select("*").eq("curso_id", selectedCurso.id);
        matList = mData || [];
      } else if (student.curso_id) {
        const { data: mData } = await supabase.from("materias").select("*").eq("curso_id", student.curso_id);
        matList = mData || [];
      }

      const { data: calData } = await supabase
        .from("calificaciones")
        .select("*, materias(nombre)")
        .eq("estudiante_id", student.id);

      const calMap = {};
      if (calData) {
        calData.forEach((c) => {
          calMap[c.materia_id] = c;
        });
      }

      let list = matList.map((m) => {
        const entry = calMap[m.id] || {};
        return {
          id: m.id,
          materia_nombre: m.nombre,
          nota_q1: entry.nota_q1 !== undefined && entry.nota_q1 !== null ? entry.nota_q1 : null,
          nota_q2: entry.nota_q2 !== undefined && entry.nota_q2 !== null ? entry.nota_q2 : null,
          nota_final: entry.nota_final || entry.nota || entry.valoracion || null
        };
      });

      if (list.length === 0) {
        list = [
          { id: "1", materia_nombre: "Lengua y Literatura", nota_q1: null, nota_q2: null, nota_final: null },
          { id: "2", materia_nombre: "Matemática", nota_q1: null, nota_q2: null, nota_final: null },
          { id: "3", materia_nombre: "Historia / Geografía", nota_q1: null, nota_q2: null, nota_final: null },
          { id: "4", materia_nombre: "Física / Química", nota_q1: null, nota_q2: null, nota_final: null }
        ];
      }

      setBoletinCalificaciones(list);

      const { data: asisData } = await supabase
        .from("asistencias")
        .select("*")
        .eq("estudiante_id", student.id);

      let pres = 0;
      let aus = 0;
      if (asisData && asisData.length > 0) {
        asisData.forEach((a) => {
          if (a.estado === "P" || a.estado === "presente") pres += 1;
          if (a.estado === "A" || a.estado === "ausente") aus += 1;
          if (a.estado === "J" || a.estado === "justificado") pres += 1;
        });
      }
      setBoletinAsistencia({ presentes: pres, ausentes: aus, total: pres + aus });
    } catch (e) {
      console.error("Error al cargar boletín:", e);
    } finally {
      setLoadingBoletin(false);
    }
  }

  async function loadSabanaData(student) {
    if (!student) return;
    setLoadingSabana(true);
    try {
      const cId = student.curso_id || selectedPlanillaCurso?.id || selectedCurso?.id;
      let matList = [];
      if (cId) {
        const { data: mData } = await supabase
          .from("materias")
          .select("*")
          .eq("curso_id", cId)
          .order("nombre");
        matList = mData || [];
      } else if (planillaMaterias && planillaMaterias.length > 0) {
        matList = planillaMaterias;
      }

      const matIds = matList.map((m) => m.id);
      let docMap = {};
      if (matIds.length > 0) {
        const { data: dmData } = await supabase
          .from("docente_materia")
          .select("materia_id, cargo, docentes(nombre, apellido)")
          .in("materia_id", matIds);
        if (dmData) {
          dmData.forEach((item) => {
            if (item.docentes) {
              const nameStr = "Prof. " + item.docentes.apellido + ", " + item.docentes.nombre;
              docMap[item.materia_id] = nameStr;
            }
          });
        }
      }

      const { data: calData } = await supabase
        .from("calificaciones")
        .select("*, materias(nombre)")
        .eq("estudiante_id", student.id);

      const calMap = {};
      if (calData) {
        calData.forEach((c) => {
          calMap[c.materia_id] = c;
        });
      }

      let list = matList.map((m) => {
        const entry = calMap[m.id] || {};
        const regularNote = entry.nota != null ? Number(entry.nota) : null;
        const rie = entry.nota_rie != null ? Number(entry.nota_rie) : (entry.intensificacion != null ? Number(entry.intensificacion) : null);
        const finalGrade = entry.nota_final != null ? Number(entry.nota_final) : (regularNote != null ? regularNote : null);
        const val = entry.evaluacion_nombre || entry.valoracion || null;
        const cuat = getMateriaCuatrimestre(m);

        let estado = "En Cursada";
        if (finalGrade != null) {
          estado = finalGrade >= 7 ? "Acreditado" : "En Intensificación";
        } else if (val) {
          estado = val === "TEA" ? "Acreditado" : "En Intensificación";
        }

        return {
          id: m.id,
          materia_nombre: m.nombre,
          docente: docMap[m.id] || planillaDocentesMap[m.id] || "Docente sin asignar",
          cuatrimestre: cuat === "Q1" ? "1° Cuatrimestre" : cuat === "Q2" ? "2° Cuatrimestre" : "Anual",
          valoracion: val,
          nota: regularNote,
          nota_rie: rie,
          nota_final: finalGrade,
          estado
        };
      });

      if (list.length === 0) {
        list = [
          { id: "1", materia_nombre: "Lengua y Literatura", docente: "Docente sin asignar", cuatrimestre: "1° Cuatrimestre", valoracion: "-", nota: null, nota_rie: null, nota_final: null, estado: "En Cursada" },
          { id: "2", materia_nombre: "Matemática", docente: "Docente sin asignar", cuatrimestre: "1° Cuatrimestre", valoracion: "-", nota: null, nota_rie: null, nota_final: null, estado: "En Cursada" },
          { id: "3", materia_nombre: "Historia / Geografía", docente: "Docente sin asignar", cuatrimestre: "2° Cuatrimestre", valoracion: "-", nota: null, nota_rie: null, nota_final: null, estado: "En Cursada" },
          { id: "4", materia_nombre: "Ciencias Naturales", docente: "Docente sin asignar", cuatrimestre: "2° Cuatrimestre", valoracion: "-", nota: null, nota_rie: null, nota_final: null, estado: "En Cursada" }
        ];
      }

      setSabanaCalificaciones(list);

      const { data: asisData } = await supabase
        .from("asistencias")
        .select("*")
        .eq("estudiante_id", student.id);

      let pres = 0;
      let aus = 0;
      if (asisData && asisData.length > 0) {
        asisData.forEach((a) => {
          if (a.estado === "P" || a.estado === "presente" || a.estado === "J" || a.estado === "justificado") pres += 1;
          if (a.estado === "A" || a.estado === "ausente") aus += 1;
        });
      }
      const totalAsis = pres + aus;
      const pct = totalAsis > 0 ? Math.round((pres / totalAsis) * 100) : 100;
      setSabanaAsistencia({ presentes: pres, ausentes: aus, total: totalAsis, porcentaje: pct });

      const totalMat = list.length;
      const aprobadas = list.filter((item) => item.estado === "Acreditado").length;
      const intens = list.filter((item) => item.estado === "En Intensificación").length;
      let sum = 0;
      let count = 0;
      list.forEach((item) => {
        if (item.nota_final != null && !isNaN(item.nota_final)) {
          sum += item.nota_final;
          count++;
        }
      });
      const avg = count > 0 ? (sum / count).toFixed(2) : "-";

      setSabanaStats({
        total: totalMat,
        aprobadas,
        intensificacion: intens,
        promedio: avg
      });
    } catch (e) {
      console.error("Error al cargar datos de la sábana:", e);
    } finally {
      setLoadingSabana(false);
    }
  }

  const exportarSabanaIndividualCSV = () => {
    if (!selectedSabanaStudent) return;
    const headers = [
      "N°",
      "Materia / Módulo",
      "Docente",
      "Cuatrimestre",
      "Valoración Pedagógica",
      "Calificación Cursada",
      "Intensificación RIE",
      "Calificación Final",
      "Estado"
    ];
    const rows = sabanaCalificaciones.map((c, idx) => {
      return [
        idx + 1,
        '"' + (c.materia_nombre || '').replace(/"/g, '""') + '"',
        '"' + (c.docente || '').replace(/"/g, '""') + '"',
        c.cuatrimestre || "Anual",
        c.valoracion || "-",
        c.nota != null ? c.nota : "-",
        c.nota_rie != null ? c.nota_rie : "-",
        c.nota_final != null ? c.nota_final : "-",
        c.estado || "-"
      ].join(";");
    });
    const cursoNombre = selectedPlanillaCurso ? (selectedPlanillaCurso.anio + "° " + selectedPlanillaCurso.division + "° (" + selectedPlanillaCurso.turno + ")") : "CENS 454";
    const meta = [
      '"SÁBANA ACADÉMICA - CENS Nº 454 ESTEBAN ECHEVERRÍA"',
      '"Estudiante: ' + selectedSabanaStudent.apellido + ', ' + selectedSabanaStudent.nombre + ' - DNI: ' + (selectedSabanaStudent.dni || 'S/D') + '"',
      '"Curso: ' + cursoNombre + ' - Ciclo Lectivo: ' + (cicloLectivo || 2026) + '"',
      '"Promedio Final: ' + sabanaStats.promedio + ' - Aprobadas: ' + sabanaStats.aprobadas + '/' + sabanaStats.total + '"',
      ""
    ];
    const csvContent = "\uFEFF" + [...meta, headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      "Sabana_" + selectedSabanaStudent.apellido + "_" + selectedSabanaStudent.nombre + "_2026.csv"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      const records = estudiantes.map((est) => ({
        estudiante_id: est.id,
        curso_id: selectedCurso.id,
        fecha: fecha,
        estado: asistencias[est.id] === "A" || asistencias[est.id] === "ausente" ? "ausente" : asistencias[est.id] === "J" || asistencias[est.id] === "justificado" ? "justificado" : asistencias[est.id] === "media_falta" ? "media_falta" : "presente"
      }));

      if (records.length > 0) {
        const { error } = await supabase.from("asistencias").upsert(records, {
          onConflict: "estudiante_id,curso_id,fecha"
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
      const finalNacionalidad = nacionalidad === "Otra" ? (nacionalidadOtra.trim() || "Argentina") : (nacionalidad || "Argentina");
      const finalLugarNac = lugarNacimiento.trim() || null;

      const studentData = {
        dni: dni.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        genero: genero || "Masculino",
        fecha_nacimiento: fechaNacimiento || null,
        nacionalidad: finalNacionalidad,
        lugar_nacimiento: finalLugarNac,
        ciudad_nacimiento: finalLugarNac,
        direccion: direccion.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        orientacion: orientacion || "Ciencias Sociales",
        fotocopia_dni: fotocopiaDni,
        partida_nacimiento: partidaNacimiento,
        certificado_estudios: certificadoEstudios,
        tipo_certificado: tipoCertificado.trim() || null,
        materias_adeudadas: materiasAdeudadas.trim() || null,
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
        try {
          await supabase.from("alumnos_cursos").insert({
            estudiante_id: newEst.id,
            curso_id: cursoAsignadoId
          });
        } catch (acErr) {
          console.log("alumnos_cursos notice:", acErr);
        }
      }

      Swal.fire({
        icon: "success",
        title: "Inscripción Exitosa",
        text: "Estudiante " + apellido + ", " + nombre + " inscripto correctamente con todos sus datos.",
        timer: 1500,
        showConfirmButton: false
      });

      setShowInscribirModal(false);
      setDni(""); setNombre(""); setApellido(""); setGenero(""); setNacionalidad("Argentina"); setNacionalidadOtra(""); setLugarNacimiento(""); setFechaNacimiento(""); setCiudadNacimiento(""); setDireccion(""); setEmail(""); setTelefono(""); setOrientacion(""); setTipoCertificado(""); setMateriasAdeudadas(""); setNumeroLibro(""); setNumeroFolio(""); setFotocopiaDni(false); setPartidaNacimiento(false); setCertificadoEstudios(false);
      if (selectedCurso) loadEstudiantesYAsistencias(selectedCurso.id, fecha);
    } catch (err) {
      Swal.fire("Error al inscribir", err.message, "error");
    }
  };

  const handleUpdateLegajoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLegajoStudent) return;
    try {
      const finalNacionalidad = selectedLegajoStudent.nacionalidad === "Otra"
        ? "Argentina"
        : (selectedLegajoStudent.nacionalidad?.trim() || "Argentina");
      const finalLugarNac = (selectedLegajoStudent.lugar_nacimiento ?? selectedLegajoStudent.ciudad_nacimiento)?.trim() || null;

      const { error } = await supabase
        .from("estudiantes")
        .update({
          dni: selectedLegajoStudent.dni,
          nombre: selectedLegajoStudent.nombre,
          apellido: selectedLegajoStudent.apellido,
          genero: selectedLegajoStudent.genero || "Masculino",
          fecha_nacimiento: selectedLegajoStudent.fecha_nacimiento || null,
          nacionalidad: finalNacionalidad,
          lugar_nacimiento: finalLugarNac,
          ciudad_nacimiento: finalLugarNac,
          direccion: selectedLegajoStudent.direccion || null,
          email: selectedLegajoStudent.email || null,
          telefono: selectedLegajoStudent.telefono || null,
          orientacion: selectedLegajoStudent.orientacion || null,
          numero_libro: selectedLegajoStudent.numero_libro || null,
          numero_folio: selectedLegajoStudent.numero_folio || null,
          fotocopia_dni: selectedLegajoStudent.fotocopia_dni || false,
          partida_nacimiento: selectedLegajoStudent.partida_nacimiento || false,
          certificado_estudios: selectedLegajoStudent.certificado_estudios || false,
          tipo_certificado: selectedLegajoStudent.tipo_certificado || null,
          materias_adeudadas: selectedLegajoStudent.materias_adeudadas || null
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
      setSelectedCalificadorStudent((prev) => {
        if (prev && prev.id === selectedLegajoStudent.id) {
          return {
            ...prev,
            ...selectedLegajoStudent,
            nacionalidad: finalNacionalidad,
            lugar_nacimiento: finalLugarNac,
            ciudad_nacimiento: finalLugarNac
          };
        }
        return prev;
      });
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

  const getMateriaCuatrimestre = (m) => {
    if (!m) return "MODULO";
    if (m.cuatrimestre === "Q1" || m.cuatrimestre === 1 || m.cuatrimestre === "1") return "Q1";
    if (m.cuatrimestre === "Q2" || m.cuatrimestre === 2 || m.cuatrimestre === "2") return "Q2";
    const lower = (m.nombre || "").toLowerCase();
    if (lower.includes("1° cuatr") || lower.includes("1er cuatr") || lower.includes("(1°") || lower.includes("q1")) return "Q1";
    if (lower.includes("2° cuatr") || lower.includes("2do cuatr") || lower.includes("(2°") || lower.includes("q2")) return "Q2";
    return "MODULO";
  };

  // Cada materia es tratada como un módulo curricular individual con su calificación
  const getStudentGradeInfo = (estId, materia) => {
    const data = planillaCalificacionesMap[estId]?.[materia.id];
    if (!data) {
      return {
        nota: null,
        nota_final: null,
        nota_rie: null,
        valoracion: null,
        hasGrade: false
      };
    }

    const finalGrade = data.nota_final != null ? Number(data.nota_final) : (data.nota != null ? Number(data.nota) : null);
    const regularNote = data.nota != null ? Number(data.nota) : null;
    const rie = data.nota_rie != null ? Number(data.nota_rie) : null;
    const val = data.valoracion || null;
    const hasGrade = finalGrade != null || regularNote != null || val != null;

    return {
      nota: regularNote,
      nota_final: finalGrade,
      nota_rie: rie,
      valoracion: val,
      hasGrade
    };
  };

  const filteredPlanillaMaterias = React.useMemo(() => {
    if (planillaMateriaFilter === "todas") {
      return planillaMaterias;
    }
    return planillaMaterias.filter((m) => {
      const q = getMateriaCuatrimestre(m);
      if (planillaMateriaFilter === "Q1") return q === "Q1";
      if (planillaMateriaFilter === "Q2") return q === "Q2";
      return true;
    });
  }, [planillaMaterias, planillaMateriaFilter]);

  // Obtiene el estado académico real del estudiante considerando las materias del filtro activo
  const getStudentAcademicStatus = (estId, materiaList = filteredPlanillaMaterias) => {
    const targetList = materiaList.length > 0 ? materiaList : planillaMaterias;
    const totalMats = targetList.length;
    let gradedCount = 0;
    let approvedCount = 0;
    let intensCount = 0;
    let sum = 0;
    let numericCount = 0;

    targetList.forEach((m) => {
      const g = getStudentGradeInfo(estId, m);
      const val = g.nota_final ?? g.nota;
      if (g.hasGrade) {
        gradedCount++;
        if (val != null && !isNaN(Number(val))) {
          sum += Number(val);
          numericCount++;
          if (Number(val) >= 7) approvedCount++;
          else intensCount++;
        } else if (g.valoracion === "TEA") {
          approvedCount++;
        } else if (g.valoracion === "TEP" || g.valoracion === "TED") {
          intensCount++;
        }
      }
    });

    const avg = numericCount > 0 ? sum / numericCount : 0;
    const isFullyGraded = totalMats > 0 && gradedCount === totalMats;

    let condicion = "Sin calificaciones";
    let condicionTipo = "sin_notas"; // "promociona", "intensifica", "cursando", "sin_notas"

    if (gradedCount === 0) {
      condicion = "Sin notas";
      condicionTipo = "sin_notas";
    } else if (isFullyGraded) {
      if (intensCount === 0 && avg >= 7) {
        condicion = "Promociona";
        condicionTipo = "promociona";
      } else {
        condicion = "Intensifica (" + intensCount + ")";
        condicionTipo = "intensifica";
      }
    } else {
      if (intensCount > 0) {
        condicion = "En Cursada (" + intensCount + " RIE)";
        condicionTipo = "intensifica";
      } else {
        condicion = "En Cursada (" + gradedCount + "/" + totalMats + ")";
        condicionTipo = "cursando";
      }
    }

    return {
      totalMats,
      gradedCount,
      approvedCount,
      intensCount,
      pendingCount: totalMats - gradedCount,
      avg,
      condicion,
      condicionTipo
    };
  };

  const getStudentAverage = (estId) => {
    const st = getStudentAcademicStatus(estId, filteredPlanillaMaterias);
    return st.avg;
  };

  const filteredPlanillaStudents = React.useMemo(() => {
    return estudiantes.filter((est) => {
      if (searchPlanilla.trim()) {
        const q = searchPlanilla.toLowerCase();
        const match =
          est.apellido?.toLowerCase().includes(q) ||
          est.nombre?.toLowerCase().includes(q) ||
          (est.dni && est.dni.includes(q));
        if (!match) return false;
      }
      const st = getStudentAcademicStatus(est.id, filteredPlanillaMaterias);
      if (planillaEstadoFilter === "aprobados") {
        return st.condicionTipo === "promociona" || (st.gradedCount > 0 && st.intensCount === 0 && st.avg >= 7);
      }
      if (planillaEstadoFilter === "intensificacion") {
        return st.intensCount > 0 || st.condicionTipo === "intensifica";
      }
      if (planillaEstadoFilter === "pendientes") {
        return st.pendingCount > 0;
      }
      return true;
    });
  }, [estudiantes, searchPlanilla, planillaEstadoFilter, filteredPlanillaMaterias, planillaCalificacionesMap]);

  const planillaStats = React.useMemo(() => {
    if (!selectedPlanillaCurso || estudiantes.length === 0 || filteredPlanillaMaterias.length === 0) {
      return { avg: "-", passRate: "-", filledRate: "0%", totalRisk: 0, totalAprobados: 0, totalEnCursada: 0, totalGradedCells: 0 };
    }
    let totalSum = 0;
    let totalNumericCount = 0;
    const totalCells = estudiantes.length * filteredPlanillaMaterias.length;
    let filledCells = 0;
    let fullyApproved = 0;
    let inRisk = 0;
    let inCursadaWithPass = 0;

    estudiantes.forEach((est) => {
      const st = getStudentAcademicStatus(est.id, filteredPlanillaMaterias);
      if (st.avg > 0) {
        totalSum += st.avg;
        totalNumericCount++;
      }
      filledCells += st.gradedCount;

      if (st.condicionTipo === "promociona") {
        fullyApproved++;
      } else if (st.intensCount > 0) {
        inRisk++;
      } else if (st.gradedCount > 0 && st.approvedCount > 0) {
        inCursadaWithPass++;
      }
    });

    const avg = totalNumericCount > 0 ? (totalSum / totalNumericCount).toFixed(1) : "-";
    const passRate = estudiantes.length > 0 ? Math.round(((fullyApproved + inCursadaWithPass) / estudiantes.length) * 100) + "%" : "-";
    const filledRate = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) + "%" : "0%";

    return {
      avg,
      passRate,
      filledRate,
      totalRisk: inRisk,
      totalAprobados: fullyApproved,
      totalEnCursada: inCursadaWithPass,
      totalGradedCells: filledCells
    };
  }, [selectedPlanillaCurso, estudiantes, filteredPlanillaMaterias, planillaCalificacionesMap]);

  const getMateriaStats = (materiaId) => {
    let sum = 0;
    let count = 0;
    let passes = 0;
    estudiantes.forEach((est) => {
      const g = getStudentGradeInfo(est.id, { id: materiaId });
      const val = g.nota_final ?? g.nota;
      if (val != null && !isNaN(Number(val))) {
        sum += Number(val);
        count++;
        if (Number(val) >= 7) passes++;
      }
    });
    const avg = count > 0 ? (sum / count).toFixed(1) : "-";
    const rate = count > 0 ? Math.round((passes / count) * 100) + "%" : "-";
    return { avg, rate, count };
  };

  const getGradeBadgeClass = (grade, val) => {
    if (val === "TEA" || (typeof grade === "number" && grade >= 7)) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (val === "TEP" || (typeof grade === "number" && grade >= 4 && grade < 7)) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (val === "TED" || (typeof grade === "number" && grade > 0 && grade < 4)) {
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    return "text-slate-400 bg-slate-50 border-slate-200";
  };

  const handleExportPlanillaCsv = () => {
    if (!selectedPlanillaCurso || estudiantes.length === 0) {
      Swal.fire("Atención", "No hay datos para exportar en este curso.", "info");
      return;
    }

    const headers = [
      "N°",
      "Estudiante",
      "DNI",
      ...filteredPlanillaMaterias.map((m) => `"${m.nombre.replace(/"/g, '""')}"`),
      "Promedio General",
      "Condición"
    ];

    const rows = filteredPlanillaStudents.map((est, idx) => {
      const studentGrades = filteredPlanillaMaterias.map((m) => {
        const g = getStudentGradeInfo(est.id, m);
        const val = g.nota_final ?? g.nota;
        return val != null ? val : (g.valoracion || "-");
      });
      const avg = getStudentAverage(est.id);
      const cond = avg >= 7 ? "Promociona" : avg > 0 ? "Intensifica" : "Regular";
      return [
        idx + 1,
        `"${est.apellido}, ${est.nombre}"`,
        est.dni || "",
        ...studentGrades,
        avg > 0 ? avg.toFixed(1) : "-",
        cond
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Planilla_Calificaciones_${selectedPlanillaCurso.anio}_${selectedPlanillaCurso.division}_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Panel Preceptores */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E]">Panel de Preceptores</h1>
          <p className="text-xs text-[#006384] font-bold mt-1">MODO: CICLO ACTUAL (2026)</p>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-blue-50 text-[#006384] text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
            <Calendar className="w-3.5 h-3.5" /> Ciclo Lectivo: 2026
          </div>
        </div>
        <button
          onClick={() => setShowInscribirModal(true)}
          className="btn-primary font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 bg-[#006384] shadow-md hover:scale-[1.01] transition-transform"
        >
          <UserPlus className="w-4 h-4" /> + Nuevo Estudiante
        </button>
      </div>

      {/* Tabs de Preceptoría */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs text-xs font-bold">
        <button
          onClick={() => setActivePreceptorTab("asistencia")}
          className={"py-3 px-6 rounded-xl transition-all flex items-center gap-2 " + (activePreceptorTab === "asistencia" ? "bg-[#006384] text-white shadow-xs" : "text-gray-600 hover:bg-gray-50")}
        >
          <Calendar className="w-4 h-4" /> Asistencia
        </button>
        <button
          onClick={() => setActivePreceptorTab("calificador")}
          className={"py-3 px-6 rounded-xl transition-all flex items-center gap-2 " + (activePreceptorTab === "calificador" ? "bg-[#006384] text-white shadow-xs" : "text-gray-600 hover:bg-gray-50")}
        >
          <GraduationCap className="w-4 h-4" /> Calificador
        </button>
        <button
          onClick={() => setActivePreceptorTab("planillas")}
          className={"py-3 px-6 rounded-xl transition-all flex items-center gap-2 " + (activePreceptorTab === "planillas" ? "bg-[#006384] text-white shadow-xs" : "text-gray-600 hover:bg-gray-50")}
        >
          <FileSpreadsheet className="w-4 h-4" /> Planillas de Calificación
        </button>
        <button
          onClick={() => setActivePreceptorTab("inasistencias_docentes")}
          className={"py-3 px-6 rounded-xl transition-all flex items-center gap-2 " + (activePreceptorTab === "inasistencias_docentes" ? "bg-[#006384] text-white shadow-xs" : "text-gray-600 hover:bg-gray-50")}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" /> Avisos Inasistencia Docente
        </button>
      </div>

      {/* ----------------- TAB 1: ASISTENCIA DE PRECEPTORÍA ----------------- */}
      {activePreceptorTab === "asistencia" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Seleccionar Curso</label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedCurso?.id || ""}
                    onChange={(e) => handleSelectCursoById(e.target.value)}
                    className="field-soft text-xs font-bold border-2 border-blue-500 py-2 px-3 bg-white"
                  >
                    <option value="">-- Seleccione un curso --</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.anio}° "{c.division}" - {c.orientacion} ({c.turno})
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-1.5 ml-1">
                    {cursos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCurso(c)}
                        className={"py-1.5 px-3 rounded-xl text-xs font-bold transition-all " + (selectedCurso?.id === c.id ? "bg-[#006384] text-white shadow-xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                      >
                        {c.anio}° "{c.division}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Fecha de Toma</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fecha}
                  max={todayStr}
                  onChange={(e) => setFecha(e.target.value)}
                  className="field-soft text-xs font-bold py-1.5 px-3 border-2 border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setFecha(todayStr)}
                  className="btn-primary text-[10px] py-1.5 px-3 bg-[#006384]"
                >
                  Hoy
                </button>
              </div>
            </div>
          </div>

          {/* Tabla Estudiantes Asistencia */}
          <div className="card p-0 overflow-hidden bg-white shadow-xs rounded-2xl border border-gray-200">
            <div className="bg-[#0D2A3E] text-white p-4 px-6 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide">
                Curso: <span className="text-[#F5C442] font-extrabold">{selectedCurso ? selectedCurso.anio + "ro " + selectedCurso.division : "-"}</span> • Total: {estudiantes.length} Estudiantes
              </h3>
              <button
                onClick={handleGuardarAsistencias}
                disabled={saving}
                className="btn-gold font-bold text-xs py-2 px-5 rounded-xl shadow-md"
              >
                {saving ? "Guardando..." : "Guardar Presentismo"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                  <tr>
                    <th className="py-3.5 px-4">ESTUDIANTE</th>
                    <th className="py-3.5 px-4 text-center">DNI</th>
                    <th className="py-3.5 px-4 text-center">TOMA DE ASISTENCIA</th>
                    <th className="py-3.5 px-4 text-center">ACCIONES PRECEPTORÍA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {estudiantes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-400 font-bold">
                        No hay estudiantes inscriptos en este curso actualmente.
                      </td>
                    </tr>
                  ) : (
                    estudiantes.map((est) => {
                      const rawState = asistencias[est.id] || "presente"; const estState = rawState === "P" ? "presente" : rawState === "A" ? "ausente" : rawState === "J" ? "justificado" : rawState;
                      return (
                        <tr key={est.id} className="hover:bg-gray-50/80">
                          <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{est.apellido}, {est.nombre}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-gray-600">{est.dni}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleAsistenciaChange(est.id, "presente")}
                                className={"py-1 px-3 rounded-lg text-xs font-bold transition-all " + (estState === "presente" ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200")}
                              >
                                Presente
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAsistenciaChange(est.id, "ausente")}
                                className={"py-1 px-3 rounded-lg text-xs font-bold transition-all " + (estState === "ausente" ? "bg-red-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200")}
                              >
                                Ausente
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAsistenciaChange(est.id, "justificado")}
                                className={"py-1 px-3 rounded-lg text-xs font-bold transition-all " + (estState === "justificado" ? "bg-amber-500 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200")}
                              >
                                Justificado
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center space-x-2">
                            <button
                              onClick={() => { setSelectedLegajoStudent(est); setShowLegajoModal(true); }}
                              className="bg-blue-50 hover:bg-blue-100 text-[#006384] font-bold text-xs py-1.5 px-3 rounded-xl border border-blue-200 inline-flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" /> Legajo
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSabanaStudent(est);
                                loadSabanaData(est);
                                setShowSabanaModal(true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-1.5 px-3 rounded-xl border border-emerald-200 inline-flex items-center gap-1"
                              title="Ver Sábana Académica Oficial"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" /> Sábana
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBoletinStudent(est);
                                loadBoletinData(est);
                                setShowBoletinModal(true);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs py-1.5 px-3 rounded-xl border border-amber-200 inline-flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Boletín
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
      {/* ----------------- TAB 2: CALIFICADOR & TITULARIZACIÓN? ----------------- */}
      {activePreceptorTab === "calificador" && (
        <div className="space-y-6">
          <div className="card p-6 bg-white space-y-3">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <Search className="w-5 h-5 text-[#006384]" /> Buscar Estudiante
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchCalificador}
                onChange={(e) => setSearchCalificador(e.target.value)}
                placeholder="Buscar por nombre, apellido o DNI..."
                className="field-soft pl-11 text-xs py-3 w-full bg-gray-50 border-gray-200"
              />
            </div>

            {searchCalificador.trim() && filteredStudentsCalificador.length > 0 && (
              <div className="mt-2 border rounded-xl divide-y max-h-48 overflow-y-auto bg-white shadow-lg">
                {filteredStudentsCalificador.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedCalificadorStudent(st);
                      setSearchCalificador("");
                    }}
                    className="w-full text-left p-3 hover:bg-blue-50 text-xs font-semibold flex items-center justify-between"
                  >
                    <span>{st.apellido}, {st.nombre}</span>
                    <span className="font-mono text-gray-500">DNI: {st.dni}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCalificadorStudent ? (
            <div className="space-y-6">
              <div className="bg-[#1E293B] text-white p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xl border-2 border-slate-600">
                      <Users className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-wide">
                        {selectedCalificadorStudent.apellido}, {selectedCalificadorStudent.nombre}
                      </h2>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">
                        DNI: {selectedCalificadorStudent.dni}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMandarATitular(selectedCalificadorStudent)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Mandar a Titular
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/60 text-xs font-bold">
                  <span className="bg-slate-800 text-blue-300 px-3 py-1 rounded-lg border border-slate-700">
                    {selectedCurso ? selectedCurso.anio + "ro " + selectedCurso.division : "Curso Asignado"} • Ciclo 2026
                  </span>
                  <span className="bg-slate-800 text-emerald-400 px-3 py-1 rounded-lg border border-slate-700">
                    {selectedCalificadorStudent.orientacion || "Ciencias Sociales"}
                  </span>
                  {selectedCalificadorStudent.en_condicion_titulo ? (
                    <span className="bg-emerald-900/60 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> En condición de titular
                    </span>
                  ) : (
                    <span className="bg-amber-900/40 text-amber-300 px-3 py-1 rounded-lg border border-amber-800/60">
                      Sin condición de titular
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 bg-white space-y-4">
                  <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b pb-3">
                    <Users className="w-5 h-5 text-[#006384]" /> Datos Personales
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Nacionalidad:</span>
                      <span className="font-bold text-[#0D2A3E]">{selectedCalificadorStudent.nacionalidad || "Argentina"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Género:</span>
                      <span className="font-bold text-[#0D2A3E]">{selectedCalificadorStudent.genero || "No especificado"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Fecha de Nac.:</span>
                      <span className="font-mono font-bold text-[#0D2A3E]">{selectedCalificadorStudent.fecha_nacimiento || "Sin registrar"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Lugar de Nac.:</span>
                      <span className="font-bold text-[#0D2A3E]">{selectedCalificadorStudent.lugar_nacimiento || selectedCalificadorStudent.ciudad_nacimiento || "Esteban Echeverría"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 font-medium">Domicilio:</span>
                      <span className="font-bold text-[#0D2A3E]">{selectedCalificadorStudent.direccion || "Sin registrar"}</span>
                    </div>
                  </div>
                </div>

                <div className="card p-6 bg-white space-y-4">
                  <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b pb-3">
                    <BookOpen className="w-5 h-5 text-[#006384]" /> Legajo Institucional
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Libro Nº:</span>
                      <span className="font-mono font-bold text-[#0D2A3E]">{selectedCalificadorStudent.numero_libro || "Pendiente"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Folio Nº:</span>
                      <span className="font-mono font-bold text-[#0D2A3E]">{selectedCalificadorStudent.numero_folio || "Pendiente"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Fotocopia DNI:</span>
                      <span className={"font-bold " + (selectedCalificadorStudent.fotocopia_dni ? "text-emerald-700" : "text-amber-700")}>{selectedCalificadorStudent.fotocopia_dni ? "Presentado" : "Pendiente"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 font-medium">Certificado de Estudios:</span>
                      <span className={"font-bold " + (selectedCalificadorStudent.certificado_estudios ? "text-emerald-700" : "text-amber-700")}>{selectedCalificadorStudent.certificado_estudios ? "Presentado" : "Pendiente"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 bg-white text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-gray-400 mx-auto" />
              <h4 className="font-bold text-sm text-[#0D2A3E]">Seleccione un estudiante en el buscador</h4>
              <p className="text-xs text-gray-500">Utilice el campo de búsqueda arriba para cargar la ficha del estudiante y enviarlo a titularización.</p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 3: PLANILLAS DE CALIFICACIÓN? ----------------- */}
      {/* ----------------- TAB 4: AVISOS DE INASISTENCIA DOCENTE ----------------- */}
      {activePreceptorTab === "inasistencias_docentes" && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Control de Avisos de Inasistencia Docente
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Registro oficial de inasistencias cargadas por los docentes para coordinar la cobertura de clases y guardia pedagógica.
              </p>
            </div>
            <div className="bg-amber-50 text-amber-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-200 self-start sm:self-auto">
              Total Avisos: {inasistenciasDocentes.length}
            </div>
          </div>

          {inasistenciasDocentes.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
              No hay avisos de inasistencia docente registrados actualmente en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <th className="p-3.5 border border-gray-200">Docente</th>
                    <th className="p-3.5 border border-gray-200">DNI / Contacto</th>
                    <th className="p-3.5 border border-gray-200">Causa / Tipo</th>
                    <th className="p-3.5 border border-gray-200 text-center">Días</th>
                    <th className="p-3.5 border border-gray-200">Período Afectado</th>
                    <th className="p-3.5 border border-gray-200">Observaciones</th>
                    <th className="p-3.5 border border-gray-200 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {inasistenciasDocentes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 border border-gray-200 font-bold text-gray-900">
                        {item.docentes ? item.docentes.apellido + ", " + item.docentes.nombre : "Docente"}
                      </td>
                      <td className="p-3.5 border border-gray-200 text-gray-600">
                        <div>DNI: {item.docentes?.dni || "N/D"}</div>
                        {item.docentes?.telefono && (
                          <div className="text-[10px] text-gray-400">Tel: {item.docentes.telefono}</div>
                        )}
                      </td>
                      <td className="p-3.5 border border-gray-200">
                        <span className={"inline-block px-2.5 py-1 rounded text-[11px] font-bold " + (item.tipo === "Causas Particulares" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-blue-100 text-blue-800 border border-blue-300")}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="p-3.5 border border-gray-200 text-center font-bold text-gray-800">
                        {item.cantidad_dias} día(s)
                      </td>
                      <td className="p-3.5 border border-gray-200 font-medium text-gray-700">
                        Desde {item.fecha_inicio} al {item.fecha_fin || item.fecha_inicio}
                      </td>
                      <td className="p-3.5 border border-gray-200 text-gray-600 max-w-xs">
                        {item.observaciones || "Sin observaciones"}
                      </td>
                      <td className="p-3.5 border border-gray-200 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {item.estado || "Notificado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activePreceptorTab === "planillas" && (
        <div className="space-y-6">
          {/* Top Control Bar: Curso, Cuatrimestre, Formato y Acciones */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Selector de Curso */}
              <div className="flex-1 max-w-xl space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#006384]" /> Curso y División
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedPlanillaCursoId}
                    onChange={(e) => setSelectedPlanillaCursoId(e.target.value)}
                    className="field-soft text-xs font-bold border-2 border-blue-500 py-2.5 px-3 bg-white min-w-[240px]"
                  >
                    <option value="">-- Seleccione un curso --</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.anio}° "{c.division}" - {c.orientacion} ({c.turno})
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-1">
                    {cursos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedPlanillaCursoId(c.id)}
                        className={"py-2 px-3 rounded-xl text-xs font-bold transition-all " + (selectedPlanillaCursoId === c.id ? "bg-[#006384] text-white shadow-xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                      >
                        {c.anio}° "{c.division}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              {selectedPlanillaCurso && (
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
                  <button
                    onClick={handleExportPlanillaCsv}
                    title="Exportar planilla actual a formato CSV / Excel"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                  >
                    <Download className="w-4 h-4" /> Exportar Excel / CSV
                  </button>

                  <button
                    onClick={() => window.print()}
                    title="Imprimir Planilla Oficial"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Planilla
                  </button>
                </div>
              )}
            </div>

            {selectedPlanillaCurso && (
              <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Selector de Materias (Módulos Individuales) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#006384]" /> Módulos / Materias:
                  </span>
                  <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                    <button
                      onClick={() => setPlanillaMateriaFilter("todas")}
                      className={"py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 " + (planillaMateriaFilter === "todas" ? "bg-white text-[#006384] shadow-xs font-extrabold" : "text-gray-600 hover:text-gray-900")}
                    >
                      <span>📚</span>
                      <span>Todas las Materias ({planillaMaterias.length})</span>
                    </button>
                    <button
                      onClick={() => setPlanillaMateriaFilter("Q1")}
                      className={"py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 " + (planillaMateriaFilter === "Q1" ? "bg-blue-600 text-white shadow-xs font-extrabold" : "text-gray-600 hover:text-gray-900")}
                    >
                      <span>📘</span>
                      <span>Materias 1° Cuatr.</span>
                    </button>
                    <button
                      onClick={() => setPlanillaMateriaFilter("Q2")}
                      className={"py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 " + (planillaMateriaFilter === "Q2" ? "bg-amber-500 text-white shadow-xs font-extrabold" : "text-gray-600 hover:text-gray-900")}
                    >
                      <span>📙</span>
                      <span>Materias 2° Cuatr.</span>
                    </button>
                  </div>
                </div>

                {/* Selector de Modo de Vista: Matriz Resumen vs Sábana Completa */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-gray-400" /> Vista:
                  </span>
                  <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
                    <button
                      onClick={() => setPlanillaViewMode("matriz")}
                      className={"py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 " + (planillaViewMode === "matriz" ? "bg-white text-[#006384] shadow-xs font-bold" : "text-gray-600 hover:text-gray-900")}
                    >
                      <Layers className="w-3 h-3 text-[#006384]" /> Matriz
                    </button>
                    <button
                      onClick={() => setPlanillaViewMode("sabana")}
                      className={"py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 " + (planillaViewMode === "sabana" ? "bg-white text-emerald-800 shadow-xs font-bold" : "text-gray-600 hover:text-gray-900")}
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Sábana Completa
                    </button>
                  </div>
                </div>

                {/* Formato de Visualización */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-400" /> Formato:
                  </span>
                  <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
                    <button
                      onClick={() => setPlanillaDisplayMode("mixto")}
                      className={"py-1 px-2.5 rounded-lg transition-all " + (planillaDisplayMode === "mixto" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-600 hover:text-gray-900")}
                    >
                      Mixto
                    </button>
                    <button
                      onClick={() => setPlanillaDisplayMode("num")}
                      className={"py-1 px-2.5 rounded-lg transition-all " + (planillaDisplayMode === "num" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-600 hover:text-gray-900")}
                    >
                      Numérico
                    </button>
                    <button
                      onClick={() => setPlanillaDisplayMode("conceptual")}
                      className={"py-1 px-2.5 rounded-lg transition-all " + (planillaDisplayMode === "conceptual" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-600 hover:text-gray-900")}
                    >
                      Conceptual (TEA/TEP/TED)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!selectedPlanillaCurso ? (
            <div className="card p-12 bg-white text-center space-y-4 border border-gray-200 rounded-2xl shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#006384] flex items-center justify-center mx-auto border border-blue-100">
                <BookOpen className="w-8 h-8 text-[#006384]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-[#0D2A3E]">Planilla de Calificaciones</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Seleccione un curso y división en la sección superior para visualizar la matriz consolidada de notas, filtrar por cuatrimestre e imprimir o exportar los registros.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tarjetas de Métricas en Tiempo Real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5 bg-white border border-gray-200 border-l-4 border-l-[#006384] flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Promedio General</p>
                    <h3 className="text-2xl font-black text-[#0D2A3E] mt-0.5">
                      {planillaStats.avg}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Calificaciones del período</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#006384] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="card p-5 bg-white border border-gray-200 border-l-4 border-l-emerald-500 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tasa de Aprobación</p>
                    <h3 className="text-2xl font-black text-emerald-700 mt-0.5">
                      {planillaStats.passRate}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{planillaStats.totalAprobados} alumnos con promedio ≥ 7</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="card p-5 bg-white border border-gray-200 border-l-4 border-l-blue-500 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Carga Docente</p>
                    <h3 className="text-2xl font-black text-[#006384] mt-0.5">
                      {planillaStats.filledRate}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{filteredPlanillaMaterias.length} materias auditadas</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>

                <div className="card p-5 bg-white border border-gray-200 border-l-4 border-l-amber-500 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">En Intensificación</p>
                    <h3 className="text-2xl font-black text-amber-700 mt-0.5">
                      {planillaStats.totalRisk}
                    </h3>
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">Alumnos con materias pendientes</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Sub-Barra de Búsqueda y Filtro de Estado de Alumnos */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchPlanilla}
                    onChange={(e) => setSearchPlanilla(e.target.value)}
                    placeholder="Buscar estudiante por apellido, nombre o DNI..."
                    className="field-soft pl-10 pr-8 py-2 text-xs w-full bg-gray-50 border-gray-200"
                  />
                  {searchPlanilla && (
                    <button
                      onClick={() => setSearchPlanilla("")}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <span className="text-gray-400 text-[11px] mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Estado:
                  </span>
                  <button
                    onClick={() => setPlanillaEstadoFilter("todos")}
                    className={"py-1.5 px-3 rounded-xl transition-all " + (planillaEstadoFilter === "todos" ? "bg-[#0D2A3E] text-white font-bold" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                  >
                    Todos ({estudiantes.length})
                  </button>
                  <button
                    onClick={() => setPlanillaEstadoFilter("aprobados")}
                    className={"py-1.5 px-3 rounded-xl transition-all " + (planillaEstadoFilter === "aprobados" ? "bg-emerald-700 text-white font-bold" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                  >
                    Aprobados ({planillaStats.totalAprobados})
                  </button>
                  <button
                    onClick={() => setPlanillaEstadoFilter("intensificacion")}
                    className={"py-1.5 px-3 rounded-xl transition-all " + (planillaEstadoFilter === "intensificacion" ? "bg-amber-600 text-white font-bold" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                  >
                    Intensificación ({planillaStats.totalRisk})
                  </button>
                  <button
                    onClick={() => setPlanillaEstadoFilter("pendientes")}
                    className={"py-1.5 px-3 rounded-xl transition-all " + (planillaEstadoFilter === "pendientes" ? "bg-blue-600 text-white font-bold" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                  >
                    Con Pendientes
                  </button>
                </div>
              </div>

              {/* Matriz Dinámica Consolidada */}
              <div className="card p-0 overflow-hidden bg-white shadow-xs rounded-2xl border border-gray-200">
                {/* Cabecera institucional de la planilla */}
                <div className="bg-[#0D2A3E] text-white p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-[#F5C442]" />
                    <div>
                      <h4 className="text-xs font-bold tracking-wide">
                        Planilla Oficial: <span className="text-[#F5C442] font-extrabold">{selectedPlanillaCurso.anio}° "{selectedPlanillaCurso.division}"</span> ({selectedPlanillaCurso.orientacion})
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        {planillaMateriaFilter === "Q1" ? "Mostrando: Materias de 1° Cuatrimestre" : planillaMateriaFilter === "Q2" ? "Mostrando: Materias de 2° Cuatrimestre" : "Mostrando: Todos los módulos curriculares"} • Calificaciones Individuales por Materia • Turno {selectedPlanillaCurso.turno}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-blue-900/60 text-blue-200 px-3 py-1 rounded-full border border-blue-700">
                      Ciclo Lectivo 2026
                    </span>
                    <span className="text-[11px] font-bold bg-slate-800 text-[#F5C442] px-3 py-1 rounded-full border border-slate-700">
                      {filteredPlanillaStudents.length} alumno(s)
                    </span>
                  </div>
                </div>

                {filteredPlanillaMaterias.length > 0 && planillaStats.totalGradedCells === 0 && !loadingPlanilla && (
                  <div className="bg-amber-50 border-b border-amber-200 p-3.5 px-6 flex items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Período sin calificaciones cargadas:</strong> Los módulos seleccionados ({planillaMateriaFilter === "Q2" ? "2° Cuatrimestre" : planillaMateriaFilter === "Q1" ? "1° Cuatrimestre" : "este período"}) aún no tienen actas de calificaciones volcadas por los docentes titulares en la base de datos.
                      </span>
                    </div>
                    {planillaMateriaFilter !== "todas" && (
                      <button
                        onClick={() => setPlanillaMateriaFilter("todas")}
                        className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 shrink-0"
                      >
                        Ver todos los módulos
                      </button>
                    )}
                  </div>
                )}

                {loadingPlanilla ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-[#006384] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-gray-600">Cargando matriz de materias y calificaciones...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b border-gray-200 sticky top-0 z-30 shadow-xs">
                        <tr>
                          {/* Columna Estudiante Fija (Sticky Left) */}
                          <th className="sticky left-0 z-30 bg-[#EEF5FA] py-3.5 px-4 min-w-[260px] text-left border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                              <span>ESTUDIANTE ({filteredPlanillaStudents.length})</span>
                              <span className="text-[10px] text-gray-500 font-mono">DNI</span>
                            </div>
                          </th>

                          {/* Columnas de Materias */}
                          {filteredPlanillaMaterias.length === 0 ? (
                            <th className="py-3.5 px-4 text-center text-gray-400">Sin materias vinculadas</th>
                          ) : (
                            filteredPlanillaMaterias.map((m) => {
                              const qType = getMateriaCuatrimestre(m);
                              return (
                                <th
                                  key={m.id}
                                  className={"py-3 px-3 text-center border-l border-gray-200 " + (planillaViewMode === "sabana" ? "min-w-[195px]" : "min-w-[145px] max-w-[200px]") + " align-top bg-[#EEF5FA]"}
                                >
                                  <div className="space-y-1">
                                    <div className="font-extrabold text-[#0D2A3E] text-xs leading-tight line-clamp-2" title={m.nombre}>
                                      {m.nombre}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-normal truncate" title={planillaDocentesMap[m.id] || "Sin Docente"}>
                                      {planillaDocentesMap[m.id] || "Docente sin asignar"}
                                    </div>
                                    <div className="pt-0.5 flex items-center justify-center gap-1">
                                      {qType === "Q1" ? (
                                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                          1° Cuatr.
                                        </span>
                                      ) : qType === "Q2" ? (
                                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                          2° Cuatr.
                                        </span>
                                      ) : (
                                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                          Anual
                                        </span>
                                      )}
                                      {(() => {
                                        const mStats = getMateriaStats(m.id);
                                        return mStats.count > 0 ? (
                                          <span className="inline-flex items-center gap-0.5 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300" title={"Cargadas " + mStats.count + " notas de " + estudiantes.length + " alumnos"}>
                                            ● {mStats.count} notas
                                          </span>
                                        ) : (
                                          <span className="inline-block text-[8.5px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" title="Aún sin calificaciones cargadas por el docente">
                                            ○ Pendiente
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    {planillaViewMode === "sabana" && (
                                      <div className="grid grid-cols-4 gap-0.5 pt-1.5 border-t border-gray-200 text-[9px] font-black text-gray-500">
                                        <span title="Valoración Pedagógica">VAL</span>
                                        <span title="Nota Cursada">CURS</span>
                                        <span title="Intensificación RIE">RIE</span>
                                        <span title="Calificación Final" className="text-[#006384]">FIN</span>
                                      </div>
                                    )}
                                  </div>
                                </th>
                              );
                            })
                          )}

                          {/* Columna Promedio General */}
                          <th className="py-3.5 px-3 text-center border-l-2 border-gray-300 min-w-[90px] bg-[#EEF5FA]">
                            <div>PROMEDIO</div>
                            <div className="text-[10px] text-gray-500 font-normal">General</div>
                          </th>

                          {/* Columna Condición */}
                          <th className="py-3.5 px-3 text-center border-l border-gray-200 min-w-[110px] bg-[#EEF5FA]">
                            <div>CONDICIÓN</div>
                            <div className="text-[10px] text-gray-500 font-normal">Pedagógica</div>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white font-medium">
                        {filteredPlanillaStudents.length === 0 ? (
                          <tr>
                            <td colSpan={filteredPlanillaMaterias.length + 3} className="py-12 text-center text-gray-400">
                              <SearchX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="font-bold text-sm text-gray-600">No se encontraron estudiantes</p>
                              <p className="text-xs text-gray-400 mt-1">Pruebe modificando los términos de búsqueda o el filtro de estado.</p>
                              {(searchPlanilla || planillaEstadoFilter !== "todos") && (
                                <button
                                  onClick={() => { setSearchPlanilla(""); setPlanillaEstadoFilter("todos"); }}
                                  className="mt-3 text-xs font-bold text-[#006384] hover:underline"
                                >
                                  Restablecer filtros
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredPlanillaStudents.map((est, idx) => {
                            const avgNum = getStudentAverage(est.id);
                            const isPassing = avgNum >= 7;

                            return (
                              <tr key={est.id} className="group hover:bg-blue-50/40 transition-colors">
                                {/* Columna Estudiante Fija (Sticky Left) */}
                                <td className="sticky left-0 z-10 bg-white group-hover:bg-[#F2F8FD] py-3 px-4 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] transition-colors">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-bold text-[#0D2A3E] text-xs truncate">
                                        {idx + 1}. {est.apellido}, {est.nombre}
                                      </p>
                                      <p className="text-[10px] font-mono text-gray-500">
                                        DNI: {est.dni || "S/D"}
                                      </p>
                                    </div>

                                    {/* Acciones Rápidas en Fila */}
                                    <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setSelectedSabanaStudent(est);
                                          loadSabanaData(est);
                                          setShowSabanaModal(true);
                                        }}
                                        title="Ver Sábana Académica Individual"
                                        className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedBoletinStudent(est);
                                          loadBoletinData(est);
                                          setShowBoletinModal(true);
                                        }}
                                        title="Ver Boletín Oficial"
                                        className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedLegajoStudent(est);
                                          setShowLegajoModal(true);
                                        }}
                                        title="Ver / Editar Legajo"
                                        className="p-1.5 hover:bg-blue-100 text-[#006384] rounded-lg transition"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* Columnas de Materias (Módulos Individuales) */}
                                {filteredPlanillaMaterias.map((m) => {
                                  const info = getStudentGradeInfo(est.id, m);
                                  const displayedGrade = info.nota_final ?? info.nota;
                                  const badgeClass = getGradeBadgeClass(displayedGrade, info.valoracion);

                                  return (
                                    <td key={m.id} className="py-3 px-2 text-center border-l border-gray-100">
                                      {planillaViewMode === "sabana" ? (
                                        <div className="grid grid-cols-4 gap-0.5 text-center text-[10px] items-center">
                                          <div className={"py-1 px-0.5 font-bold truncate rounded text-[9px] " + (
                                            info.valoracion === "TEA" ? "bg-emerald-100 text-emerald-800 font-extrabold" :
                                            info.valoracion === "TEP" ? "bg-amber-100 text-amber-800 font-extrabold" :
                                            info.valoracion === "TED" ? "bg-rose-100 text-rose-800 font-extrabold" : "bg-gray-50 text-gray-400"
                                          )} title={"Valoración Pedagógica: " + (info.valoracion || 'Sin valoración')}>
                                            {info.valoracion || "-"}
                                          </div>
                                          <div className={"py-1 px-0.5 font-mono font-semibold rounded " + (info.nota != null ? "bg-blue-50 text-blue-950 font-bold" : "text-gray-300")} title={"Cursada: " + (info.nota != null ? info.nota : '-')}>
                                            {info.nota != null ? info.nota : "-"}
                                          </div>
                                          <div className={"py-1 px-0.5 font-mono font-semibold rounded " + (info.nota_rie != null ? "bg-amber-100 text-amber-900 font-bold" : "text-gray-300")} title={"Intensificación RIE: " + (info.nota_rie != null ? info.nota_rie : '-')}>
                                            {info.nota_rie != null ? info.nota_rie : "-"}
                                          </div>
                                          <div className={"py-1 px-0.5 font-mono font-black rounded " + (
                                            displayedGrade >= 7 ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs" :
                                            (displayedGrade != null ? "bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs" :
                                            (info.valoracion === "TED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                            (info.valoracion === "TEA" ? "bg-emerald-50 text-emerald-700" : "text-gray-300")))
                                          )} title={"Calificación Final: " + (displayedGrade != null ? displayedGrade : (info.valoracion || '-'))}>
                                            {displayedGrade != null ? displayedGrade : (info.valoracion || "-")}
                                          </div>
                                        </div>
                                      ) : displayedGrade != null ? (
                                        <div className="inline-flex flex-col items-center">
                                          <span className={"inline-block text-xs font-black px-2.5 py-1 rounded-xl border font-mono shadow-2xs " + badgeClass}>
                                            {displayedGrade}
                                          </span>
                                          {planillaDisplayMode !== "num" && info.valoracion && (
                                            <span className="text-[9px] font-bold text-gray-500 mt-0.5">
                                              {info.valoracion}
                                            </span>
                                          )}
                                          {info.nota_rie != null && (
                                            <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1 rounded mt-0.5 border border-amber-200" title="Nota de Intensificación">
                                              RIE: {info.nota_rie}
                                            </span>
                                          )}
                                        </div>
                                      ) : info.valoracion ? (
                                        <span className={"inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border " + badgeClass}>
                                          {info.valoracion}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 font-mono text-xs">-</span>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Columna Promedio General */}
                                {(() => {
                                  const acadStatus = getStudentAcademicStatus(est.id, filteredPlanillaMaterias);
                                  return (
                                    <>
                                      <td className="py-3 px-3 text-center border-l-2 border-gray-200 font-mono text-xs">
                                        {acadStatus.avg > 0 ? (
                                          <div className="inline-flex flex-col items-center">
                                            <span className={"inline-block px-2.5 py-1 rounded-xl font-black " + (acadStatus.avg >= 7 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                                              {acadStatus.avg.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] text-gray-400 mt-0.5 font-normal">
                                              {acadStatus.gradedCount} de {acadStatus.totalMats} mod.
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 font-normal">-</span>
                                        )}
                                      </td>

                                      {/* Columna Condición Académica */}
                                      <td className="py-3 px-3 text-center border-l border-gray-200 whitespace-nowrap">
                                        {acadStatus.condicionTipo === "promociona" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Promociona
                                          </span>
                                        ) : acadStatus.condicionTipo === "intensifica" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                            <AlertCircle className="w-3 h-3 text-amber-600" /> {acadStatus.condicion}
                                          </span>
                                        ) : acadStatus.condicionTipo === "cursando" ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                            <Sparkles className="w-3 h-3 text-blue-600" /> {acadStatus.condicion}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                            Sin notas
                                          </span>
                                        )}
                                      </td>
                                    </>
                                  );
                                })()}
                              </tr>
                            );
                          })
                        )}
                      </tbody>

                      {/* Pie de Tabla con Estadísticas por Asignatura */}
                      {filteredPlanillaStudents.length > 0 && filteredPlanillaMaterias.length > 0 && (
                        <tfoot className="bg-[#F8FAFC] text-gray-700 font-bold border-t-2 border-gray-300">
                          <tr>
                            <td className="sticky left-0 z-20 bg-[#F8FAFC] py-3 px-4 border-r border-gray-200 text-left font-extrabold text-[#0D2A3E] text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                              PROMEDIO POR ASIGNATURA
                            </td>
                            {filteredPlanillaMaterias.map((m) => {
                              const st = getMateriaStats(m.id);
                              return (
                                <td key={m.id} className="py-3 px-2 text-center border-l border-gray-200">
                                  <div className="font-mono text-xs font-black text-[#006384]">
                                    {st.avg}
                                  </div>
                                  <div className="text-[9px] text-gray-400 font-medium">
                                    {st.rate !== "-" ? `${st.rate} aprob.` : "S/D"}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-3 px-3 text-center border-l-2 border-gray-300 font-mono text-xs font-black text-[#0D2A3E]">
                              {planillaStats.avg}
                            </td>
                            <td className="py-3 px-3 text-center border-l border-gray-200 text-[10px] text-gray-500 font-bold">
                              {planillaStats.passRate} Aprob.
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* MODAL MODIFICAR LEGAJO COMPLETO CON? TODOS LOS CAMPOS */}
      {showLegajoModal && selectedLegajoStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#0D2A3E]">Modificar Legajo de Estudiante</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedLegajoStudent.apellido}, {selectedLegajoStudent.nombre}</p>
              </div>
              <button onClick={() => setShowLegajoModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1">✕</button>
            </div>

            <form onSubmit={handleUpdateLegajoSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* SECCIÓN? DATOS PERSONALES */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#0D2A3E] uppercase tracking-wider border-b pb-1">Datos Personales</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">DNI *</label>
                      <input type="text" value={selectedLegajoStudent.dni || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, dni: e.target.value })} className="field-soft text-xs font-bold" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Género</label>
                      <select value={selectedLegajoStudent.genero || "Masculino"} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, genero: e.target.value })} className="field-soft text-xs">
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
                      <input type="text" value={selectedLegajoStudent.nombre || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, nombre: e.target.value })} className="field-soft text-xs" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Apellido *</label>
                      <input type="text" value={selectedLegajoStudent.apellido || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, apellido: e.target.value })} className="field-soft text-xs font-bold" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <input type="date" value={selectedLegajoStudent.fecha_nacimiento || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, fecha_nacimiento: e.target.value })} className="field-soft text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                      <input type="email" value={selectedLegajoStudent.email || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, email: e.target.value })} placeholder="correo@ejemplo.com" className="field-soft text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nacionalidad</label>
                      <select
                        value={
                          PAISES_NACIONALIDAD.includes(selectedLegajoStudent.nacionalidad)
                            ? selectedLegajoStudent.nacionalidad
                            : (selectedLegajoStudent.nacionalidad ? "Otra" : "Argentina")
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedLegajoStudent({
                            ...selectedLegajoStudent,
                            nacionalidad: val === "Otra" ? "" : val
                          });
                        }}
                        className="field-soft text-xs"
                      >
                        {PAISES_NACIONALIDAD.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="Otra">Otra</option>
                      </select>
                      {(!PAISES_NACIONALIDAD.includes(selectedLegajoStudent.nacionalidad) && selectedLegajoStudent.nacionalidad !== undefined && selectedLegajoStudent.nacionalidad !== "Argentina" && selectedLegajoStudent.nacionalidad !== null) && (
                        <input
                          type="text"
                          value={selectedLegajoStudent.nacionalidad || ""}
                          onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, nacionalidad: e.target.value })}
                          placeholder="Especifique nacionalidad"
                          className="field-soft text-xs mt-2"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Lugar de Nacimiento</label>
                      <input
                        type="text"
                        value={selectedLegajoStudent.lugar_nacimiento ?? selectedLegajoStudent.ciudad_nacimiento ?? ""}
                        onChange={(e) => setSelectedLegajoStudent({
                          ...selectedLegajoStudent,
                          lugar_nacimiento: e.target.value,
                          ciudad_nacimiento: e.target.value
                        })}
                        placeholder="Ej. Esteban Echeverría"
                        className="field-soft text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                      <input type="text" value={selectedLegajoStudent.telefono || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, telefono: e.target.value })} placeholder="Ej. 11 5555-4444" className="field-soft text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Dirección</label>
                      <input type="text" value={selectedLegajoStudent.direccion || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, direccion: e.target.value })} placeholder="Ej. Av. Luciano Valette 120" className="field-soft text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Orientación</label>
                      <select value={selectedLegajoStudent.orientacion || "Ciencias Sociales"} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, orientacion: e.target.value })} className="field-soft text-xs">
                        <option value="Ciencias Sociales">Ciencias Sociales</option>
                        <option value="Ciencias Naturales">Ciencias Naturales</option>
                        <option value="Economía y Administración">Economía y Administración</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN? REGISTRO OFICIAL Y DOCUMENTACIÓN? */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-xs font-bold text-[#0D2A3E] uppercase tracking-wider border-b pb-1">Registro Oficial & Documentación</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Libro Nº</label>
                      <input type="text" value={selectedLegajoStudent.numero_libro || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, numero_libro: e.target.value })} placeholder="Ej: 9" className="field-soft text-xs font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Folio Nº</label>
                      <input type="text" value={selectedLegajoStudent.numero_folio || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, numero_folio: e.target.value })} placeholder="Ej: 13" className="field-soft text-xs font-mono font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={selectedLegajoStudent.fotocopia_dni || false} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, fotocopia_dni: e.target.checked })} className="rounded text-[#006384]" />
                        <span>Fotocopia DNI</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={selectedLegajoStudent.partida_nacimiento || false} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, partida_nacimiento: e.target.checked })} className="rounded text-[#006384]" />
                        <span>Partida de Nacimiento</span>
                      </label>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={selectedLegajoStudent.certificado_estudios || false} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, certificado_estudios: e.target.checked })} className="rounded text-[#006384]" />
                        <span>Certificado Últimos Estudios</span>
                      </label>
                      <div>
                        <input type="text" value={selectedLegajoStudent.tipo_certificado || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, tipo_certificado: e.target.value })} placeholder="Tipo de certificado (ej. En trámite)" className="field-soft text-xs py-1 bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                    <label className="block text-xs font-bold text-gray-800">Materias Adeudadas Previas</label>
                    <textarea
                      value={selectedLegajoStudent.materias_adeudadas || ""}
                      onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, materias_adeudadas: e.target.value })}
                      placeholder="Listar materias y año adeudado"
                      className="field-soft text-xs h-16 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 shrink-0">
                <button type="button" onClick={() => setShowLegajoModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl">Cancelar</button>
                <button type="submit" className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md font-extrabold">Guardar Modificaciones</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSCRIBIR NUEVO ESTUDIANTE */}
      {showInscribirModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#0D2A3E]">Inscribir Nuevo Estudiante</h3>
                <p className="text-xs text-gray-500 font-medium">Registro de alumno en legajo oficial de CENS 454</p>
              </div>
              <button onClick={() => setShowInscribirModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1">✕</button>
            </div>

            <form onSubmit={handleInscribirEstudiante} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#0D2A3E] flex items-center gap-2 border-b pb-2">
                    <User className="w-4 h-4 text-[#006384]" /> Datos Personales
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">DNI *</label>
                      <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej: 38492011" className="field-soft text-xs font-bold" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
                      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del estudiante" className="field-soft text-xs" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Apellido *</label>
                      <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido del estudiante" className="field-soft text-xs font-bold" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Género</label>
                      <select value={genero} onChange={(e) => setGenero(e.target.value)} className="field-soft text-xs">
                        <option value="">Seleccionar...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="field-soft text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="field-soft text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nacionalidad</label>
                      <select
                        value={nacionalidad}
                        onChange={(e) => setNacionalidad(e.target.value)}
                        className="field-soft text-xs"
                      >
                        {PAISES_NACIONALIDAD.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="Otra">Otra</option>
                      </select>
                      {nacionalidad === "Otra" && (
                        <input
                          type="text"
                          value={nacionalidadOtra}
                          onChange={(e) => setNacionalidadOtra(e.target.value)}
                          placeholder="Especifique nacionalidad"
                          className="field-soft text-xs mt-2"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Lugar de Nacimiento</label>
                      <input
                        type="text"
                        value={lugarNacimiento}
                        onChange={(e) => {
                          setLugarNacimiento(e.target.value);
                          setCiudadNacimiento(e.target.value);
                        }}
                        placeholder="Ej. Esteban Echeverría"
                        className="field-soft text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                      <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 11 5555-4444" className="field-soft text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Dirección</label>
                      <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Av. Luciano Valette 120" className="field-soft text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Orientación</label>
                      <select value={orientacion} onChange={(e) => setOrientacion(e.target.value)} className="field-soft text-xs">
                        <option value="">Seleccionar...</option>
                        <option value="Ciencias Sociales">Ciencias Sociales</option>
                        <option value="Ciencias Naturales">Ciencias Naturales</option>
                        <option value="Economía y Administración">Economía y Administración</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Curso Asignado *</label>
                      <select value={cursoAsignadoId} onChange={(e) => setCursoAsignadoId(e.target.value)} className="field-soft text-xs font-bold border-2 border-blue-400" required>
                        <option value="">Seleccione un curso...</option>
                        {cursos.map((c) => (
                          <option key={c.id} value={c.id}>{c.anio}° "{c.division}" - {c.orientacion}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#0D2A3E] flex items-center gap-2 border-b pb-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" /> Documentación Entregada
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={fotocopiaDni} onChange={(e) => setFotocopiaDni(e.target.checked)} className="rounded text-[#006384]" />
                        <span>Fotocopia DNI</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={partidaNacimiento} onChange={(e) => setPartidaNacimiento(e.target.checked)} className="rounded text-[#006384]" />
                        <span>Partida de Nacimiento</span>
                      </label>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={certificadoEstudios} onChange={(e) => setCertificadoEstudios(e.target.checked)} className="rounded text-[#006384]" />
                        <span>Certificado Últimos Estudios</span>
                      </label>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Tipo de Certificado</label>
                        <input type="text" value={tipoCertificado} onChange={(e) => setTipoCertificado(e.target.value)} placeholder="Ej. Constancia Titulo en Trámite" className="field-soft text-xs py-1.5 bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-gray-800">Materias Adeudadas Previas</label>
                      <span className="text-[10px] text-gray-400 font-mono">Visible para todo el staff</span>
                    </div>
                    <textarea
                      value={materiasAdeudadas}
                      onChange={(e) => setMateriasAdeudadas(e.target.value)}
                      placeholder="Listar materias y año en caso de adeudación (Ej: Geografía 2do, Matemática 1ro)."
                      className="field-soft text-xs h-20 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 shrink-0">
                <button type="button" onClick={() => setShowInscribirModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl">Cancelar</button>
                <button type="submit" className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md font-extrabold">Completar Inscripción</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BOLETÍN? DE CALIFICACIONES Y ASISTENCIA */}
      {showBoletinModal && selectedBoletinStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-[#0D2A3E] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5C442] text-[#0D2A3E] flex items-center justify-center font-bold text-lg">
                  {selectedBoletinStudent.nombre ? selectedBoletinStudent.nombre.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white">
                    Boletín Digital: {selectedBoletinStudent.apellido}, {selectedBoletinStudent.nombre}
                  </h3>
                  <p className="text-xs text-[#F5C442] font-semibold">
                    DNI: {selectedBoletinStudent.dni} • CENS Nº 454 Esteban Echeverría
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button onClick={() => setShowBoletinModal(false)} className="text-gray-300 hover:text-white font-bold text-lg p-1">✕</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Cards resumen de presentismo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Días Presente</p>
                  <h4 className="text-xl font-black text-emerald-700 mt-1">{boletinAsistencia.presentes} Días</h4>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-red-500 shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Inasistencias</p>
                  <h4 className="text-xl font-black text-red-600 mt-1">{boletinAsistencia.ausentes} Faltas</h4>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-[#006384] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Porcentaje Asistencia</p>
                  <h4 className="text-xl font-black text-[#006384] mt-1">
                    {boletinAsistencia.total > 0 ? Math.round((boletinAsistencia.presentes / boletinAsistencia.total) * 100) : 100}%
                  </h4>
                </div>
              </div>

              {/* Tabla de notas por materia */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="bg-[#EEF5FA] p-3 px-4 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0D2A3E] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#006384]" /> Calificaciones del Ciclo Lectivo {cicloLectivo}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 text-[#0D2A3E] font-bold border-b">
                      <tr>
                        <th className="py-3 px-4">Asignatura</th>
                        <th className="py-3 px-4 text-center">1º Cuatrimestre</th>
                        <th className="py-3 px-4 text-center">2º Cuatrimestre</th>
                        <th className="py-3 px-4 text-center">Calificación Final</th>
                        <th className="py-3 px-4 text-center">Estado Cursada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {loadingBoletin ? (
                        <tr>
                          <td colSpan="5" className="text-center py-6 text-gray-400 font-bold">
                            Cargando datos del boletín...
                          </td>
                        </tr>
                      ) : boletinCalificaciones.map((c) => {
                        const final = c.nota_final || (c.nota_q1 && c.nota_q2 ? Math.round((c.nota_q1 + c.nota_q2) / 2) : '-');
                        const aprobado = typeof final === 'number' ? final >= 7 : false;

                        return (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{c.materia_nombre}</td>
                            <td className="py-3.5 px-4 text-center font-semibold">{c.nota_q1 !== null ? c.nota_q1 : '-'}</td>
                            <td className="py-3.5 px-4 text-center font-semibold">{c.nota_q2 !== null ? c.nota_q2 : '-'}</td>
                            <td className="py-3.5 px-4 text-center font-extrabold text-sm text-[#006384]">{final}</td>
                            <td className="py-3.5 px-4 text-center">
                              {typeof final === 'number' ? (
                                aprobado ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Aprobada</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Intensificación</span>
                                )
                              ) : (
                                <span className="text-gray-400 font-medium">En Cursada</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowBoletinModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-6 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SÁBANA ACADÉMICA DEL ESTUDIANTE */}
      {showSabanaModal && selectedSabanaStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Header del Modal */}
            <div className="p-5 border-b flex justify-between items-center bg-[#0D2A3E] text-white shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F5C442] text-[#0D2A3E] flex items-center justify-center font-black text-xl shadow-xs">
                  {selectedSabanaStudent.nombre ? selectedSabanaStudent.nombre.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500 text-white">
                      Sábana Académica
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Legajo #{selectedSabanaStudent.id ? selectedSabanaStudent.id.substring(0, 8).toUpperCase() : "REG"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white mt-0.5">
                    {selectedSabanaStudent.apellido}, {selectedSabanaStudent.nombre}
                  </h3>
                  <p className="text-xs text-[#F5C442] font-medium flex items-center gap-2">
                    <span>DNI: {selectedSabanaStudent.dni || "S/D"}</span>
                    <span>•</span>
                    <span>CENS Nº 454 Esteban Echeverría</span>
                    <span>•</span>
                    <span>Ciclo Lectivo {cicloLectivo || 2026}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                  title="Imprimir Sábana Oficial"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir Sábana</span>
                </button>
                <button
                  type="button"
                  onClick={exportarSabanaIndividualCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                  title="Descargar Sábana en CSV / Excel"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>
                <button
                  onClick={() => setShowSabanaModal(false)}
                  className="text-gray-300 hover:text-white font-bold text-xl p-1.5 rounded-lg hover:bg-white/10 transition"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Encabezado Académico / Membrete Institucional */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#006384]">
                    <GraduationCap className="w-4 h-4" />
                    <span>PLAN DE ESTUDIOS DE EDUCACIÓN SECUNDARIA DE ADULTOS</span>
                  </div>
                  <h4 className="text-sm font-black text-[#0D2A3E]">
                    Resolución Ministerial N° 2993/22 • Modalidad Adultos y Formación Profesional
                  </h4>
                  <p className="text-xs text-gray-500">
                    Establecimiento: CENS Nº 454 • Distrito Esteban Echeverría • Región Educativa 5
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#EEF5FA] p-3.5 rounded-xl border border-blue-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Curso y División</span>
                    <span className="font-extrabold text-[#0D2A3E]">
                      {selectedPlanillaCurso ? (selectedPlanillaCurso.anio + "° " + selectedPlanillaCurso.division + "°") : (selectedCurso ? (selectedCurso.anio + "° " + selectedCurso.division + "°") : "1° Año")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Turno</span>
                    <span className="font-extrabold text-[#0D2A3E]">
                      {selectedPlanillaCurso?.turno || selectedCurso?.turno || "Noche"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Condición</span>
                    <span className="font-extrabold text-emerald-700">Regular Activo</span>
                  </div>
                </div>
              </div>

              {/* Indicadores Resumen (KPIs del Estudiante) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-[#006384] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Total Módulos</p>
                  <h4 className="text-2xl font-black text-[#0D2A3E] mt-1">{sabanaStats.total}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Asignaturas de la currícula</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Módulos Acreditados</p>
                  <h4 className="text-2xl font-black text-emerald-700 mt-1">{sabanaStats.aprobadas}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {sabanaStats.total > 0 ? Math.round((sabanaStats.aprobadas / sabanaStats.total) * 100) : 0}% de acreditación
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-amber-500 shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">En Intensificación</p>
                  <h4 className="text-2xl font-black text-amber-700 mt-1">{sabanaStats.intensificacion}</h4>
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Pendientes de cierre / RIE</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-[#F5C442] shadow-xs">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Promedio Definitivo</p>
                  <h4 className="text-2xl font-black text-[#006384] mt-1">{sabanaStats.promedio}</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    Asistencia: {sabanaAsistencia.porcentaje}% ({sabanaAsistencia.presentes} P / {sabanaAsistencia.ausentes} A)
                  </p>
                </div>
              </div>

              {/* Sábana Detallada de Calificaciones */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="bg-[#EEF5FA] p-3.5 px-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#006384]" />
                    <span className="text-xs font-bold text-[#0D2A3E]">
                      Matriz Individual de Calificaciones por Módulo Curricular
                    </span>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-[#006384] px-2.5 py-1 rounded-lg border border-blue-200">
                    {sabanaCalificaciones.length} materias registradas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 text-[#0D2A3E] font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-10">#</th>
                        <th className="py-3 px-4 min-w-[200px]">Materia / Módulo Curricular</th>
                        <th className="py-3 px-3.5 min-w-[150px]">Docente a Cargo</th>
                        <th className="py-3 px-3 text-center min-w-[90px]">Tramo</th>
                        <th className="py-3 px-3 text-center min-w-[90px]">Valoración</th>
                        <th className="py-3 px-3 text-center min-w-[80px]">Cursada</th>
                        <th className="py-3 px-3 text-center min-w-[80px]">RIE / Intens.</th>
                        <th className="py-3 px-3 text-center min-w-[90px]">Nota Final</th>
                        <th className="py-3 px-4 text-center min-w-[130px]">Condición</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {loadingSabana ? (
                        <tr>
                          <td colSpan="9" className="text-center py-10 text-gray-400 font-bold">
                            <div className="w-7 h-7 border-3 border-[#006384] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            Cargando datos completos de la sábana...
                          </td>
                        </tr>
                      ) : sabanaCalificaciones.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-8 text-gray-400">
                            No se encontraron materias registradas para este curso.
                          </td>
                        </tr>
                      ) : (
                        sabanaCalificaciones.map((c, idx) => {
                          const isAprobado = c.estado === "Acreditado";
                          const isIntens = c.estado === "En Intensificación";

                          return (
                            <tr key={c.id || idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-3 px-3.5 text-center font-mono text-gray-400 font-bold">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#0D2A3E]">
                                {c.materia_nombre}
                              </td>
                              <td className="py-3 px-3.5 text-gray-600 font-medium truncate max-w-[160px]" title={c.docente}>
                                {c.docente}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={"px-2 py-0.5 rounded text-[10px] font-bold " + (
                                  c.cuatrimestre.includes("1°") ? "bg-blue-50 text-blue-800 border border-blue-200" :
                                  c.cuatrimestre.includes("2°") ? "bg-amber-50 text-amber-800 border border-amber-200" :
                                  "bg-purple-50 text-purple-800 border border-purple-200"
                                )}>
                                  {c.cuatrimestre}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {c.valoracion ? (
                                  <span className={"px-2 py-0.5 rounded font-bold text-[10px] " + (
                                    c.valoracion === "TEA" ? "bg-emerald-100 text-emerald-800" :
                                    c.valoracion === "TEP" ? "bg-amber-100 text-amber-800" :
                                    "bg-red-100 text-red-800"
                                  )}>
                                    {c.valoracion}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-gray-700">
                                {c.nota != null ? c.nota : "-"}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-amber-800">
                                {c.nota_rie != null ? c.nota_rie : "-"}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-black text-sm">
                                {c.nota_final != null ? (
                                  <span className={"px-2 py-0.5 rounded-lg " + (
                                    c.nota_final >= 7 ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-700 bg-red-50 border border-red-200"
                                  )}>
                                    {c.nota_final}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 font-normal">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isAprobado ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Acreditado
                                  </span>
                                ) : isIntens ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Clock className="w-3 h-3 text-amber-600" /> Intensificación
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                    En Cursada
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recuadro de Firmas Oficiales Reglamentarias */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0D2A3E]">
                  <Award className="w-4 h-4 text-[#006384]" />
                  <span>Constancia y Aval Institucional (CENS Nº 454 Esteban Echeverría)</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Se deja constancia fehaciente de que las calificaciones y valoraciones consignadas en la presente Sábana Académica corresponden fielmente a los registros volcados por el cuerpo docente en las actas de cursada, intensificación y exámenes correspondientes al Ciclo Lectivo {cicloLectivo || 2026}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                  <div className="border-t border-dashed border-gray-400 pt-2 text-center">
                    <p className="text-xs font-bold text-[#0D2A3E]">Firma y Aclaración Preceptor/a</p>
                    <p className="text-[10px] text-gray-400">División correspondiente</p>
                  </div>
                  <div className="border-t border-dashed border-gray-400 pt-2 text-center">
                    <p className="text-xs font-bold text-[#0D2A3E]">Docente Tutor / Coordinador</p>
                    <p className="text-[10px] text-gray-400">Trayectoria Pedagógica</p>
                  </div>
                  <div className="border-t border-dashed border-gray-400 pt-2 text-center">
                    <p className="text-xs font-bold text-[#0D2A3E]">Sello y Firma Dirección / Secretaría</p>
                    <p className="text-[10px] text-gray-400">CENS Nº 454</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t flex items-center justify-between bg-white shrink-0">
              <span className="text-[11px] text-gray-400 font-mono">
                Documento emitido conforme al SGA CENS Nº 454 • Esteban Echeverría
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSabanaModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-6 rounded-xl transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}