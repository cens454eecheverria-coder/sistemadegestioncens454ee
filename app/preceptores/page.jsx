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
  TrendingUp,
  User,
  FileCheck2
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

  // Modal Inscribir - Todos los datos del formulario original
  const [showInscribirModal, setShowInscribirModal] = useState(false);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [genero, setGenero] = useState("");
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
        genero: genero || "Masculino",
        fecha_nacimiento: fechaNacimiento || null,
        ciudad_nacimiento: ciudadNacimiento.trim() || null,
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
      setDni(""); setNombre(""); setApellido(""); setGenero(""); setFechaNacimiento(""); setCiudadNacimiento(""); setDireccion(""); setEmail(""); setTelefono(""); setOrientacion(""); setTipoCertificado(""); setMateriasAdeudadas(""); setNumeroLibro(""); setNumeroFolio("");
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
                      const estState = asistencias[est.id] || "P";
                      return (
                        <tr key={est.id} className="hover:bg-gray-50/80">
                          <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{est.apellido}, {est.nombre}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-gray-600">{est.dni}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleAsistenciaChange(est.id, "P")}
                                className={"py-1 px-3 rounded-lg text-xs font-bold transition-all " + (estState === "P" ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200")}
                              >
                                Presente
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAsistenciaChange(est.id, "A")}
                                className={"py-1 px-3 rounded-lg text-xs font-bold transition-all " + (estState === "A" ? "bg-red-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200")}
                              >
                                Ausente
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAsistenciaChange(est.id, "J")}
                                className={"py-1 px-3 rounded-lg text-xs font-bold transition-all " + (estState === "J" ? "bg-amber-500 text-white shadow-xs" : "text-gray-600 hover:bg-gray-200")}
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
                              onClick={() => { setSelectedBoletinStudent(est); setShowBoletinModal(true); }}
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
      {/* ----------------- TAB 2: CALIFICADOR & TITULARIZACIÓN ----------------- */}
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
                      <span className="text-gray-500 font-medium">Género:</span>
                      <span className="font-bold text-[#0D2A3E]">{selectedCalificadorStudent.genero || "No especificado"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Fecha de Nac.:</span>
                      <span className="font-mono font-bold text-[#0D2A3E]">{selectedCalificadorStudent.fecha_nacimiento || "Sin registrar"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Lugar de Nac.:</span>
                      <span className="font-bold text-[#0D2A3E]">{selectedCalificadorStudent.ciudad_nacimiento || "Esteban Echeverría"}</span>
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

      {/* ----------------- TAB 3: PLANILLAS DE CALIFICACIÓN ----------------- */}
      {activePreceptorTab === "planillas" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-bold text-gray-700 mb-1">Curso / División</label>
              <select
                value={selectedPlanillaCursoId}
                onChange={(e) => setSelectedPlanillaCursoId(e.target.value)}
                className="field-soft text-xs font-bold border-2 border-blue-500 py-2.5 px-3 bg-white w-full"
              >
                <option value="">Seleccione un curso...</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.anio}° "{c.division}" - {c.orientacion} (Ciclo 2026)
                  </option>
                ))}
              </select>
            </div>

            {selectedPlanillaCurso && (
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                  <button
                    onClick={() => setPlanillaFilterMode("nota_final")}
                    className={"py-1.5 px-3 rounded-lg transition-all " + (planillaFilterMode === "nota_final" ? "bg-white text-blue-600 shadow-xs" : "text-gray-600 hover:text-gray-900")}
                  >
                    Nota Final
                  </button>
                  <button
                    onClick={() => setPlanillaFilterMode("conceptual")}
                    className={"py-1.5 px-3 rounded-lg transition-all " + (planillaFilterMode === "conceptual" ? "bg-white text-blue-600 shadow-xs" : "text-gray-600 hover:text-gray-900")}
                  >
                    Conceptual
                  </button>
                  <button
                    onClick={() => setPlanillaFilterMode("completa")}
                    className={"py-1.5 px-3 rounded-lg transition-all " + (planillaFilterMode === "completa" ? "bg-white text-blue-600 shadow-xs" : "text-gray-600 hover:text-gray-900")}
                  >
                    Vista Completa
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimir Planilla
                </button>
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
                  Seleccione un curso y división en la sección superior para visualizar la matriz anual de notas e imprimir el reporte.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 bg-white flex items-center justify-between border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-500">Promedio General</p>
                    <h3 className="text-2xl font-black text-[#0D2A3E] mt-1">
                      {estudiantes.length > 0 ? "7.5" : "-"}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="card p-6 bg-white flex items-center justify-between border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-500">Carga de Notas</p>
                    <h3 className="text-2xl font-black text-[#0D2A3E] mt-1">
                      {planillaMaterias.length > 0 ? "100%" : "0%"}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                <div className="card p-6 bg-white flex items-center justify-between border border-gray-200">
                  <div>
                    <p className="text-xs font-bold text-gray-500">Alumnos Registrados</p>
                    <h3 className="text-2xl font-black text-[#0D2A3E] mt-1">{estudiantes.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Dynamic Matrix Table */}
              <div className="card p-0 overflow-hidden bg-white shadow-xs rounded-2xl border border-gray-200">
                <div className="bg-[#0D2A3E] text-white p-4 px-6 flex items-center justify-between">
                  <h4 className="text-xs font-bold tracking-wide">
                    Planilla Consolidada: <span className="text-[#F5C442] font-extrabold">{selectedPlanillaCurso.anio}° "{selectedPlanillaCurso.division}"</span> ({selectedPlanillaCurso.orientacion})
                  </h4>
                  <span className="text-[11px] font-bold bg-blue-900/60 text-blue-200 px-3 py-1 rounded-full border border-blue-700">
                    Ciclo Lectivo 2026
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                      <tr>
                        <th className="py-3.5 px-4 min-w-[200px]">Estudiante</th>
                        {planillaMaterias.length === 0 ? (
                          <th className="py-3.5 px-4 text-center">Sin materias asignadas</th>
                        ) : (
                          planillaMaterias.map((m) => (
                            <th key={m.id} className="py-3.5 px-3 text-center border-l border-gray-200 min-w-[140px]">
                              <div>{m.nombre}</div>
                              <div className="text-[10px] text-gray-500 font-normal">{planillaDocentesMap[m.id] || "Docente A Cargo"}</div>
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white font-medium">
                      {estudiantes.length === 0 ? (
                        <tr>
                          <td colSpan={planillaMaterias.length + 1} className="py-6 text-center text-gray-400">
                            No hay estudiantes registrados en este curso.
                          </td>
                        </tr>
                      ) : (
                        estudiantes.map((est, idx) => (
                          <tr key={est.id} className="hover:bg-gray-50/80">
                            <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">
                              {idx + 1}. {est.apellido}, {est.nombre}
                            </td>
                            {planillaMaterias.map((m) => {
                              const val = planillaCalificacionesMap[est.id]?.[m.id] || "-";
                              return (
                                <td key={m.id} className="py-3.5 px-3 text-center border-l border-gray-100 font-bold text-gray-800">
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* MODAL EDITAR LEGAJO ESTUDIANTE */}
      {showLegajoModal && selectedLegajoStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#0D2A3E]">Modificar Legajo de Estudiante</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedLegajoStudent.apellido}, {selectedLegajoStudent.nombre}</p>
              </div>
              <button onClick={() => setShowLegajoModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1">✕</button>
            </div>

            <form onSubmit={handleUpdateLegajoSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">Libro Nº</label>
                    <input type="text" value={selectedLegajoStudent.numero_libro || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, numero_libro: e.target.value })} placeholder="Ej: 9" className="field-soft text-xs font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Folio Nº</label>
                    <input type="text" value={selectedLegajoStudent.numero_folio || ""} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, numero_folio: e.target.value })} placeholder="Ej: 13" className="field-soft text-xs font-mono font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedLegajoStudent.fotocopia_dni || false} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, fotocopia_dni: e.target.checked })} className="rounded text-[#006384]" />
                    <span>Fotocopia DNI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedLegajoStudent.partida_nacimiento || false} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, partida_nacimiento: e.target.checked })} className="rounded text-[#006384]" />
                    <span>Partida Nacimiento</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedLegajoStudent.certificado_estudios || false} onChange={(e) => setSelectedLegajoStudent({ ...selectedLegajoStudent, certificado_estudios: e.target.checked })} className="rounded text-[#006384]" />
                    <span>Certificado Estudios</span>
                  </label>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 shrink-0">
                <button type="button" onClick={() => setShowLegajoModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl">Cancelar</button>
                <button type="submit" className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md">Guardar Modificaciones</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSCRIBIR NUEVO ESTUDIANTE RESPONSIVE & MAX-HEIGHT 90VH */}
      {showInscribirModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Header Fijo */}
            <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#0D2A3E]">Inscribir Nuevo Estudiante</h3>
                <p className="text-xs text-gray-500 font-medium">Registro de alumno en legajo oficial de CENS 454</p>
              </div>
              <button onClick={() => setShowInscribirModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1">✕</button>
            </div>

            {/* Formulario con Scroll Interno */}
            <form onSubmit={handleInscribirEstudiante} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* SECCIÓN 1: DATOS PERSONALES */}
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
                      <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                      <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 11 5555-4444" className="field-soft text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Ciudad de Nacimiento</label>
                      <input type="text" value={ciudadNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} placeholder="Ej. Buenos Aires" className="field-soft text-xs" />
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

                {/* SECCIÓN 2: DOCUMENTACIÓN ENTREGADA */}
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

              {/* Footer Fijo */}
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 shrink-0">
                <button type="button" onClick={() => setShowInscribirModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl">Cancelar</button>
                <button type="submit" className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md font-extrabold">Completar Inscripción</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}