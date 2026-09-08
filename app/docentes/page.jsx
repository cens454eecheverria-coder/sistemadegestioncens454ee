"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { User, BookOpen, Calendar, FileText, Printer, LogOut, Plus, Save, Clock, AlertCircle, ShieldCheck, Filter } from "lucide-react";

export default function TeacherPortalPage() {
  const { user, role, cicloLectivo, logout } = useAuth();
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState("ficha");

  const [docenteData, setDocenteData] = useState({ id: "", nombre: "", apellido: "", cuil: "", dni: "", genero: "Femenino", email: "", telefono: "", fechaNac: "", titulo: "" });
  const [materiasAsignadas, setMateriasAsignadas] = useState([]);
  const [selectedMateriaId, setSelectedMateriaId] = useState("");
  const [cargosExternos, setCargosExternos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [calificacionesMap, setCalificacionesMap] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [misInasistencias, setMisInasistencias] = useState([]);
  const [misHorarios, setMisHorarios] = useState([]);
  const [saving, setSaving] = useState(false);
  const [printingModal, setPrintingModal] = useState(false);
  const [printType, setPrintType] = useState("NOTAS");

  const [adminCursos, setAdminCursos] = useState([]);
  const [selectedAdminCursoId, setSelectedAdminCursoId] = useState("");
  const [adminDocentes, setAdminDocentes] = useState([]);
  const [adminMaterias, setAdminMaterias] = useState([]);

  useEffect(() => { loadDocenteDataAndMaterias(); }, [user, cicloLectivo, role]);
  useEffect(() => { if (selectedMateriaId) { loadAlumnosYCalificaciones(selectedMateriaId); } }, [selectedMateriaId]);

  async function loadDocenteDataAndMaterias() {
    setLoadingProfile(true);
    try {
      const { data: cData } = await supabase.from("cursos").select("*").order("anio");
      setAdminCursos(cData || []);
      const { data: dDataList } = await supabase.from("docentes").select("*").order("apellido");
      setAdminDocentes(dDataList || []);
      const { data: allMat } = await supabase.from("materias").select("*");
      setAdminMaterias(allMat || []);

      

  if (isAdmin) {
        if (allMat && allMat.length > 0) {
          const { data: cDataMap } = await supabase.from("cursos").select("*");
          const cMap = {};
          if (cDataMap) cDataMap.forEach((c) => { cMap[c.id] = c.anio + "ro " + c.division; });
          const list = allMat.map((m) => ({ id: m.id, nombre: m.nombre, cursoNombre: cMap[m.curso_id] || "Curso", ciclo: "Ciclo 2026", curso_id: m.curso_id }));
          setMateriasAsignadas(list);
          if (list.length > 0) setSelectedMateriaId(list[0].id);
        }
        setLoadingProfile(false);
        return;
      }

      let realDocente = null;
      if (user?.cuil) {
        const { data: dData } = await supabase.from("docentes").select("*").eq("cuil", user.cuil).single();
        realDocente = dData;
      }
      if (!realDocente && user?.email) {
        const { data: dData } = await supabase.from("docentes").select("*").eq("email", user.email).single();
        realDocente = dData;
      }
      if (!realDocente && dDataList && dDataList.length > 0) {
        realDocente = dDataList[0];
      }

      const profile = {
        id: realDocente?.id || user?.id || "",
        nombre: realDocente?.nombre || user?.nombre || "Docente",
        apellido: realDocente?.apellido || "",
        cuil: realDocente?.cuil || user?.cuil || "CUIL no registrado",
        dni: realDocente?.dni || user?.dni || "DNI no registrado",
        genero: realDocente?.genero || "Femenino",
        email: realDocente?.email || user?.email || "",
        telefono: realDocente?.telefono || "",
        fechaNac: realDocente?.fecha_nacimiento || "",
        titulo: realDocente?.titulo || "Profesor/a",
      };
      setDocenteData(profile);

      if (profile.id) {
        const { data: dmData } = await supabase.from("docente_materia").select("materia_id").eq("docente_id", profile.id);
        if (dmData && dmData.length > 0) {
          const matIds = dmData.map((dm) => dm.materia_id);
          const { data: mData } = await supabase.from("materias").select("*").in("id", matIds);
          const { data: cDataMap } = await supabase.from("cursos").select("*");
          const cMap = {};
          if (cDataMap) cDataMap.forEach((c) => { cMap[c.id] = c.anio + "ro " + c.division; });
          if (mData) {
            const list = mData.map((m) => ({ id: m.id, nombre: m.nombre, cursoNombre: cMap[m.curso_id] || "Curso", ciclo: "Ciclo 2026", curso_id: m.curso_id }));
            setMateriasAsignadas(list);
            if (list.length > 0) setSelectedMateriaId(list[0].id);
          }

          // Cargar los horarios asignados para todas las materias del docente
          const { data: hData } = await supabase
            .from("horarios")
            .select("*, cursos(anio, division, turno, orientacion), materias(id, nombre)")
            .in("materia_id", matIds)
            .order("dia_semana")
            .order("modulo");
          setMisHorarios(hData || []);
        } else {
          setMateriasAsignadas([]);
          setSelectedMateriaId("");
          setMisHorarios([]);
        }
        const { data: ddjjData } = await supabase.from("ddjj_docentes").select("*").eq("docente_id", profile.id);
        if (ddjjData) { setCargosExternos(ddjjData); }
        const { data: inasData } = await supabase.from("inasistencias_docentes").select("*").eq("docente_id", profile.id).order("fecha_inicio", { ascending: false });
        if (inasData) { setMisInasistencias(inasData); }
      }
    } catch (e) { console.error(e); } finally { setLoadingProfile(false); }
  }

  async function loadAlumnosYCalificaciones(materiaId) {
    if (!materiaId) {
      setAlumnos([]);
      setCalificacionesMap({});
      return;
    }
    try {
      const { data: mData } = await supabase.from("materias").select("curso_id").eq("id", materiaId).single();
      let realAlumnos = [];
      if (mData?.curso_id) {
        // Consultar estudiantes pertenecientes únicamente a este curso
        const { data: estByCurso } = await supabase
          .from("estudiantes")
          .select("*")
          .eq("curso_id", mData.curso_id)
          .neq("estado", "inactivo")
          .neq("estado", "Pase")
          .order("apellido");

        if (estByCurso && estByCurso.length > 0) {
          realAlumnos = estByCurso;
        } else {
          const { data: acData } = await supabase
            .from("alumnos_cursos")
            .select("estudiante_id, estudiantes(*)")
            .eq("curso_id", mData.curso_id);
          if (acData && acData.length > 0) {
            realAlumnos = acData.map((item) => item.estudiantes).filter(Boolean);
          }
        }
      }
      setAlumnos(realAlumnos);

      const { data: califData } = await supabase.from("calificaciones").select("*").eq("materia_id", materiaId);
      const initialMap = {};
      if (califData && califData.length > 0) {
        califData.forEach((c) => {
          initialMap[c.estudiante_id] = {
            id: c.id,
            valoracion: c.evaluacion_nombre || "TEA",
            nota: c.nota != null ? String(c.nota) : "",
            intensificacion: c.nota_rie != null ? String(c.nota_rie) : "",
            notaFinal: c.nota_final != null ? String(c.nota_final) : "",
            fecha: c.created_at ? c.created_at.split("T")[0] : new Date().toISOString().split("T")[0]
          };
        });
      }

      realAlumnos.forEach((a) => {
        if (!initialMap[a.id]) {
          initialMap[a.id] = {
            valoracion: "TEA",
            nota: "",
            intensificacion: "",
            notaFinal: "",
            fecha: new Date().toISOString().split("T")[0]
          };
        }
      });
      setCalificacionesMap(initialMap);
    } catch (e) {
      console.error(e);
    }
  }

  const handleUpdateNotaField = (estId, field, val) => {
    setCalificacionesMap((prev) => ({
      ...prev,
      [estId]: { ...(prev[estId] || {}), [field]: val }
    }));
  };

  const handleGuardarCalificaciones = async () => {
    if (!selectedMateriaId) {
      Swal.fire("Atención", "Seleccione una materia antes de guardar.", "warning");
      return;
    }
    if (alumnos.length === 0) {
      Swal.fire("Atención", "No hay estudiantes en este curso para calificar.", "warning");
      return;
    }
    setSaving(true);
    try {
      const records = alumnos.map((a) => {
        const item = calificacionesMap[a.id] || {};
        const notaNum = item.nota !== "" && item.nota != null && !isNaN(Number(item.nota)) ? Number(item.nota) : null;
        const finalNum = item.notaFinal !== "" && item.notaFinal != null && !isNaN(Number(item.notaFinal)) ? Number(item.notaFinal) : null;
        const rieNum = item.intensificacion !== "" && item.intensificacion != null && !isNaN(Number(item.intensificacion)) ? Number(item.intensificacion) : null;
        return {
          estudiante_id: a.id,
          materia_id: selectedMateriaId,
          evaluacion_nombre: item.valoracion || "TEA",
          nota: notaNum,
          nota_rie: rieNum,
          nota_final: finalNum
        };
      });

      const estIds = alumnos.map((a) => a.id);
      await supabase
        .from("calificaciones")
        .delete()
        .eq("materia_id", selectedMateriaId)
        .in("estudiante_id", estIds);

      const { error: insErr } = await supabase.from("calificaciones").insert(records);
      if (insErr) throw insErr;

      Swal.fire({
        icon: "success",
        title: "Calificaciones Guardadas",
        text: `Se registraron las notas de ${records.length} estudiante(s) en Supabase.`,
        timer: 1800,
        showConfirmButton: false
      });
      await loadAlumnosYCalificaciones(selectedMateriaId);
    } catch (err) {
      Swal.fire("Error al guardar", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarFichaDocente = async (e) => {
    e.preventDefault();
    try {
      if (docenteData.id) {
        await supabase.from("docentes").upsert({ id: docenteData.id, nombre: docenteData.nombre, apellido: docenteData.apellido, email: docenteData.email, telefono: docenteData.telefono, genero: docenteData.genero, titulo: docenteData.titulo });
      }
      Swal.fire({ icon: "success", title: "Datos Actualizados", timer: 1500, showConfirmButton: false });
    } catch (err) { Swal.fire("Error", err.message, "error"); }
  };

  const handleAgregarCargoModal = () => {
    const htmlForm = '<input id="sw-escuela" class="swal2-input" placeholder="Escuela / Establecimiento" /><input id="sw-distrito" class="swal2-input" placeholder="Distrito" /><input id="sw-cargo" class="swal2-input" placeholder="Cargo / Materia" /><input id="sw-horario" class="swal2-input" placeholder="Días y Horarios" />';
    Swal.fire({
      title: "Agregar Cargo en Otra Institución",
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: "Agregar a la DDJJ",
      preConfirm: () => {
        const escuela = document.getElementById("sw-escuela").value;
        const distrito = document.getElementById("sw-distrito").value;
        const cargo = document.getElementById("sw-cargo").value;
        const horario = document.getElementById("sw-horario").value;
        if (!escuela || !cargo) Swal.showValidationMessage("Complete la escuela y el cargo.");
        return { escuela, distrito, cargo, horario };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        if (docenteData.id) {
          await supabase.from("ddjj_docentes").insert({ docente_id: docenteData.id, establecimiento_externo: res.value.escuela, cargo_externo: res.value.cargo, horario_externo: res.value.horario, dias_externos: res.value.distrito });
        }
        setCargosExternos((prev) => [...prev, { id: Date.now(), ...res.value }]);
        Swal.fire("Cargo Agregado", "Se incorporó a tu Declaración Jurada.", "success");
      }
    });
  };

  const renderPrintingModal = () => {
    if (!printingModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 relative border border-gray-200 my-auto">
          {/* Header del modal (no se imprime) */}
          <div className="flex justify-between items-center border-b pb-4 no-print">
            <h3 className="text-lg font-bold text-[#0D2A3E] flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#006384]" />
              {printType === "NOTAS"
                ? "Vista Previa de Planilla Oficial - Calificaciones"
                : "Vista Previa - Declaración Jurada de Cargos (DDJJ)"}
            </h3>
            <button
              onClick={() => setPrintingModal(false)}
              className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg hover:bg-gray-100 transition text-lg"
            >
              ✕
            </button>
          </div>

          {/* CONTENEDOR DE IMPRESIÓN OFICIAL */}
          <div id="printable-modal" className="border p-6 sm:p-8 rounded-xl bg-white space-y-6 text-gray-900 font-sans">
            {printType === "HORARIOS" ? (
              <div className="space-y-6">
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900 tracking-tight">CENS Nº 454 - ESTEBAN ECHEVERRÍA</h2>
                    <p className="text-[11px] text-gray-700 font-semibold">Dirección General de Cultura y Educación - Región 5</p>
                    <p className="text-[10px] text-gray-500">Horario Oficial del Docente frente a curso</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border border-gray-900 px-3 py-1 text-xs font-black uppercase tracking-wider bg-gray-50">
                      HORARIO SEMANAL OFICIAL
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1 font-medium">Ciclo Lectivo: {cicloLectivo || 2026}</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-300 p-3.5 rounded-lg flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Docente:</span>
                    <strong className="text-sm text-gray-900">{docenteData.apellido ? (docenteData.apellido + ", " + docenteData.nombre) : docenteData.nombre}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">DNI / CUIL:</span>
                    <span className="font-bold text-gray-800">{docenteData.dni} / {docenteData.cuil}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Carga Semanal:</span>
                    <span className="font-bold text-[#006384]">{misHorarios.length} Módulos</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Turno:</span>
                    <span className="font-bold text-gray-800">Noche (18:30 a 22:30)</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-gray-900 border-collapse">
                  <thead className="bg-gray-100 text-gray-900 font-bold border-b-2 border-gray-900">
                    <tr>
                      <th className="py-2 px-3 border-r border-gray-900 w-28">Día</th>
                      <th className="py-2 px-3 border-r border-gray-900 text-center w-28">Módulo / Horario</th>
                      <th className="py-2 px-3 border-r border-gray-900">Asignatura</th>
                      <th className="py-2 px-3 border-r border-gray-900">Curso / División</th>
                      <th className="py-2 px-3 text-center">Aula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {misHorarios.length === 0 ? (
                      <tr><td colSpan="5" className="py-6 text-center text-gray-500 italic">No registra módulos horarios asignados en CENS 454.</td></tr>
                    ) : (
                      misHorarios.map((h, idx) => {
                        const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
                        const start = 18 * 60 + 30 + (h.modulo - 1) * 40;
                        const end = start + 40;
                        const fmt = (m) => {
                          const hr = Math.floor(m / 60) % 24;
                          const mn = m % 60;
                          return (hr < 10 ? "0" + hr : hr) + ":" + (mn < 10 ? "0" + mn : mn);
                        };
                        const franja = fmt(start) + " - " + fmt(end);
                        return (
                          <tr key={idx} className="border-b border-gray-900">
                            <td className="py-2 px-3 font-bold border-r border-gray-900">{dias[h.dia_semana]}</td>
                            <td className="py-2 px-3 text-center border-r border-gray-900 font-mono text-[11px]">{h.modulo}º ({franja})</td>
                            <td className="py-2 px-3 font-bold border-r border-gray-900">{h.materias?.nombre || "Asignatura"}</td>
                            <td className="py-2 px-3 border-r border-gray-900">{h.cursos ? (h.cursos.anio + "º " + h.cursos.division) : "-"}</td>
                            <td className="py-2 px-3 text-center">{h.aula || "Sede"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-bold text-gray-900">
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p>FIRMA DEL PROFESOR/A</p>
                    <p className="text-[10px] text-gray-600 font-normal mt-0.5">Prof. {docenteData.apellido ? (docenteData.apellido + ", " + docenteData.nombre) : docenteData.nombre}</p>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p>FIRMA DE DIRECCIÓN / SECRETARÍA</p>
                    <p className="text-[10px] text-gray-600 font-normal mt-0.5">CENS Nº 454 - Esteban Echeverría</p>
                  </div>
                </div>
              </div>
            ) : printType === "NOTAS" ? (
              <div className="space-y-6">
                {/* Cabecera Oficial */}
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                      CENS Nº 454 - ESTEBAN ECHEVERRÍA
                    </h2>
                    <p className="text-[11px] text-gray-700 font-semibold">
                      Dirección General de Cultura y Educación - Región 5
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Dirección de Educación de Adultos - Provincia de Buenos Aires
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border border-gray-900 px-3 py-1 text-xs font-black uppercase tracking-wider bg-gray-50">
                      PLANILLA OFICIAL DE CALIFICACIONES
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1 font-medium">
                      Fecha: {new Date().toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>

                {/* Metadatos del Curso y Materia */}
                <div className="bg-gray-50 border border-gray-300 p-3.5 rounded-lg flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Asignatura:</span>
                    <strong className="text-sm text-gray-900">{materiaActual?.nombre || "Sin Asignatura"}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Curso y División:</span>
                    <span className="font-bold text-gray-800">{materiaActual?.cursoNombre || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Ciclo Lectivo:</span>
                    <span className="font-bold text-gray-800">{cicloLectivo || 2026}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase text-[10px] block">Profesor a Cargo:</span>
                    <span className="font-bold text-gray-800">
                      {docenteData.apellido ? (docenteData.apellido + ", " + docenteData.nombre) : (docenteData.nombre || "Docente")}
                    </span>
                  </div>
                </div>

                {/* Tabla Oficial de Alumnos */}
                <table className="w-full text-left text-xs border border-gray-900 border-collapse">
                  <thead className="bg-gray-100 text-gray-900 font-bold border-b-2 border-gray-900">
                    <tr>
                      <th className="py-2 px-2 border-r border-gray-900 text-center w-8">#</th>
                      <th className="py-2 px-3 border-r border-gray-900">ESTUDIANTE</th>
                      <th className="py-2 px-2 border-r border-gray-900 text-center">DNI</th>
                      <th className="py-2 px-2 text-center border-r border-gray-900">VALORACIÓN (1º CUATR.)</th>
                      <th className="py-2 px-2 text-center border-r border-gray-900">NOTA</th>
                      <th className="py-2 px-2 text-center border-r border-gray-900">INTENSIFICACIÓN</th>
                      <th className="py-2 px-2 text-center border-r border-gray-900">NOTA FINAL</th>
                      <th className="py-2 px-2 text-center">FECHA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {alumnos.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-6 text-center text-gray-500 italic">
                          No hay estudiantes inscriptos en este curso.
                        </td>
                      </tr>
                    ) : (
                      alumnos.map((a, idx) => {
                        const noteData = calificacionesMap[a.id] || {
                          valoracion: "TEA",
                          nota: "-",
                          intensificacion: "-",
                          notaFinal: "-",
                          fecha: new Date().toISOString().split("T")[0]
                        };
                        return (
                          <tr key={a.id} className="border-b border-gray-900">
                            <td className="py-1.5 px-2 text-center border-r border-gray-900 font-medium text-[11px]">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-bold border-r border-gray-900">{a.apellido}, {a.nombre}</td>
                            <td className="py-1.5 px-2 text-center border-r border-gray-900 text-[11px]">{a.dni || "-"}</td>
                            <td className="py-1.5 px-2 text-center font-bold border-r border-gray-900">{noteData.valoracion || "-"}</td>
                            <td className="py-1.5 px-2 text-center font-semibold border-r border-gray-900">{noteData.nota || "-"}</td>
                            <td className="py-1.5 px-2 text-center border-r border-gray-900">{noteData.intensificacion || "-"}</td>
                            <td className="py-1.5 px-2 text-center font-bold border-r border-gray-900">{noteData.notaFinal || "-"}</td>
                            <td className="py-1.5 px-2 text-center text-[10px]">{noteData.fecha || "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Bloque de Firmas Institucionales */}
                <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-bold text-gray-900">
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p>FIRMA Y ACLARACIÓN DEL PROFESOR/A</p>
                    <p className="text-[10px] text-gray-600 font-normal mt-0.5">
                      Prof. {docenteData.apellido ? (docenteData.apellido + ", " + docenteData.nombre) : docenteData.nombre}
                    </p>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p>FIRMA DE DIRECCIÓN / SECRETARÍA</p>
                    <p className="text-[10px] text-gray-600 font-normal mt-0.5">CENS Nº 454 - Esteban Echeverría</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cabecera Oficial DDJJ */}
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                      CENS Nº 454 - ESTEBAN ECHEVERRÍA
                    </h2>
                    <p className="text-[11px] text-gray-700 font-semibold">
                      Dirección General de Cultura y Educación - Región 5
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Régimen de Incompatibilidad Docente - Provincia de Buenos Aires
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border border-gray-900 px-3 py-1 text-xs font-black uppercase tracking-wider bg-gray-50">
                      DECLARACIÓN JURADA DE CARGOS (DDJJ)
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1 font-medium">Ciclo Lectivo: {cicloLectivo || 2026}</p>
                  </div>
                </div>

                {/* Datos del Docente */}
                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 text-xs space-y-2">
                  <h4 className="font-bold text-gray-800 uppercase text-[11px] border-b pb-1">1. Datos Personales del Docente</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div><span className="text-[10px] text-gray-500 block">Apellido y Nombre:</span><strong>{docenteData.apellido ? (docenteData.apellido + ", " + docenteData.nombre) : docenteData.nombre}</strong></div>
                    <div><span className="text-[10px] text-gray-500 block">DNI:</span><strong>{docenteData.dni || "-"}</strong></div>
                    <div><span className="text-[10px] text-gray-500 block">CUIL:</span><strong>{docenteData.cuil || "-"}</strong></div>
                    <div><span className="text-[10px] text-gray-500 block">Título:</span><strong>{docenteData.titulo || "Docente"}</strong></div>
                  </div>
                </div>

                {/* Desempeño en CENS 454 */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-gray-900">2. Cargos y Asignaturas en CENS Nº 454</h4>
                  <table className="w-full text-left text-xs border border-gray-900 border-collapse">
                    <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-900">
                      <tr>
                        <th className="p-2 border-r border-gray-900">Asignatura</th>
                        <th className="p-2 border-r border-gray-900">Curso / División</th>
                        <th className="p-2 border-r border-gray-900 text-center">Horas</th>
                        <th className="p-2 text-center">Situación de Revista</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {materiasAsignadas.length === 0 ? (
                        <tr><td colSpan="4" className="p-3 text-center text-gray-500 italic">No registra asignaturas vinculadas en CENS 454.</td></tr>
                      ) : (
                        materiasAsignadas.map((m) => (
                          <tr key={m.id} className="border-b border-gray-900">
                            <td className="p-2 border-r border-gray-900 font-bold">{m.nombre}</td>
                            <td className="p-2 border-r border-gray-900">{m.cursoNombre}</td>
                            <td className="p-2 border-r border-gray-900 text-center font-medium">4 Hs. Cát.</td>
                            <td className="p-2 text-center font-semibold uppercase text-[11px]">CENS Nº 454</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cargos Externos */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-gray-900">3. Cargos y Desempeño en Otros Establecimientos</h4>
                  <table className="w-full text-left text-xs border border-gray-900 border-collapse">
                    <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-900">
                      <tr>
                        <th className="p-2 border-r border-gray-900">Establecimiento</th>
                        <th className="p-2 border-r border-gray-900">Distrito</th>
                        <th className="p-2 border-r border-gray-900">Cargo / Hs</th>
                        <th className="p-2 text-center">Días y Horarios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {cargosExternos.length === 0 ? (
                        <tr><td colSpan="4" className="p-3 text-center text-gray-500 italic">No declara cargos externos fuera de CENS 454.</td></tr>
                      ) : (
                        cargosExternos.map((cg, idx) => (
                          <tr key={idx} className="border-b border-gray-900">
                            <td className="p-2 border-r border-gray-900 font-bold">{cg.establecimiento_externo || cg.escuela}</td>
                            <td className="p-2 border-r border-gray-900">{cg.dias_externos || cg.distrito || "-"}</td>
                            <td className="p-2 border-r border-gray-900">{cg.cargo_externo || cg.cargo}</td>
                            <td className="p-2 text-center font-mono text-[11px]">{cg.horario_externo || cg.horario}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Declaración Jurada Disclaimer */}
                <p className="text-[11px] text-gray-700 leading-relaxed italic border-t pt-3">
                  Declaro bajo juramento que los datos consignados en la presente son copia fiel y exacta de mi situación de revista docente activa, asumiendo la responsabilidad que establece la legislación provincial vigente.
                </p>

                {/* Firmas */}
                <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs font-bold text-gray-900">
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p>FIRMA DEL DOCENTE DECLARANTE</p>
                    <p className="text-[10px] text-gray-600 font-normal mt-0.5">DNI {docenteData.dni || "-"}</p>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-2">
                    <p>INTERVENCIÓN DIRECTIVA / SECRETARÍA</p>
                    <p className="text-[10px] text-gray-600 font-normal mt-0.5">CENS Nº 454 - Esteban Echeverría</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción (no se imprimen) */}
          <div className="flex justify-end gap-3 border-t pt-4 no-print">
            <button
              onClick={() => setPrintingModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl transition"
            >
              Cerrar
            </button>
            <button
              onClick={() => window.print()}
              className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> Imprimir Documento / Guardar PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  const materiaActual = materiasAsignadas.find((m) => m.id === selectedMateriaId) || materiasAsignadas[0];
  const filteredAdminMaterias = materiasAsignadas.filter((m) => !selectedAdminCursoId || m.curso_id === selectedAdminCursoId);
  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[#0D2A3E] flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-[#006384]" /> Calificador Institucional de Materias y Notas</h1>
            <p className="text-xs text-gray-500 mt-1">Supervisión general de calificaciones cuatrimestrales y planillas CENS 454 (Vista Dirección)</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setPrintType("NOTAS"); setPrintingModal(true); }} className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2"><Printer className="w-4 h-4" /> Imprimir Planilla Oficial</button>
            <button onClick={logout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2"><LogOut className="w-4 h-4" /> Salir del Sistema</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5"><Filter className="w-4 h-4 text-[#006384]" /> 1. Filtrar por Curso</label>
            <select value={selectedAdminCursoId} onChange={(e) => { setSelectedAdminCursoId(e.target.value); const mats = materiasAsignadas.filter((m) => !e.target.value || m.curso_id === e.target.value); if (mats.length > 0) setSelectedMateriaId(mats[0].id); }} className="field-soft text-xs font-bold border-2 border-blue-500">
              <option value="">-- Todos los Cursos --</option>
              {adminCursos.map((c) => (<option key={c.id} value={c.id}>{c.anio}° "{c.division}" - {c.orientacion} ({c.turno})</option>))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#006384]" /> 2. Seleccionar Asignatura a Calificar / Supervisar</label>
            <select value={selectedMateriaId} onChange={(e) => setSelectedMateriaId(e.target.value)} className="field-soft text-xs font-bold border-2 border-blue-600 bg-blue-50/30">
              <option value="">-- Seleccionar Asignatura --</option>
              {filteredAdminMaterias.map((m) => (<option key={m.id} value={m.id}>{m.nombre} - {m.cursoNombre} ({m.ciclo})</option>))}
            </select>
          </div>
        </div>

        {materiaActual ? (
          <div className="card p-0 bg-white shadow-xs overflow-hidden rounded-2xl border border-gray-200">
            <div className="bg-[#0D2A3E] text-white p-4 px-6 flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wide">Materia Seleccionada: <span className="text-[#F5C442] font-extrabold">{materiaActual.nombre}</span> ({materiaActual.cursoNombre})</h4>
              <span className="bg-blue-900/60 text-blue-200 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-700/50">Modo Dirección / Calificador Abierto</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                    <tr><th className="py-3 px-4">ESTUDIANTE</th><th className="py-3 px-4 text-center">VALORACIÓN? (1° CUATR.)</th><th className="py-3 px-4 text-center">NOTA</th><th className="py-3 px-4 text-center">INTENSIFICACIÓN</th><th className="py-3 px-4 text-center">NOTA FINAL</th><th className="py-3 px-4 text-center">FECHA</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {alumnos.length === 0 ? (
                      <tr><td colSpan="6" className="py-6 text-center text-gray-400">No hay estudiantes inscriptos en este curso/materia.</td></tr>
                    ) : (
                      alumnos.map((a) => {
                        const noteData = calificacionesMap[a.id] || { valoracion: "TEA", nota: "", intensificacion: "", notaFinal: "", fecha: new Date().toISOString().split("T")[0] };
                        return (
                          <tr key={a.id} className="hover:bg-gray-50/80">
                            <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{a.apellido}, {a.nombre}</td>
                            <td className="py-3.5 px-4 text-center"><select value={noteData.valoracion || "TEA"} onChange={(e) => handleUpdateNotaField(a.id, "valoracion", e.target.value)} className="field-soft text-xs py-1 px-3 w-28 text-center font-bold"><option value="TEA">TEA</option><option value="TEP">TEP</option><option value="TED">TED</option></select></td>
                            <td className="py-3.5 px-4 text-center"><input type="text" value={noteData.nota || ""} onChange={(e) => handleUpdateNotaField(a.id, "nota", e.target.value)} placeholder="-" className="field-soft text-xs py-1 px-2 w-16 text-center" /></td>
                            <td className="py-3.5 px-4 text-center"><input type="text" value={noteData.intensificacion || ""} onChange={(e) => handleUpdateNotaField(a.id, "intensificacion", e.target.value)} placeholder="-" className="field-soft text-xs py-1 px-2 w-24 text-center" /></td>
                            <td className="py-3.5 px-4 text-center"><input type="text" value={noteData.notaFinal || ""} onChange={(e) => handleUpdateNotaField(a.id, "notaFinal", e.target.value)} placeholder="-" className="field-soft text-xs py-1 px-2 w-16 text-center font-bold" /></td>
                            <td className="py-3.5 px-4 text-center"><input type="date" value={noteData.fecha || ""} onChange={(e) => handleUpdateNotaField(a.id, "fecha", e.target.value)} className="field-soft text-xs py-1 px-2 w-32 text-center" /></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100"><button onClick={handleGuardarCalificaciones} disabled={saving} className="btn-primary font-bold text-xs py-3 px-8 rounded-xl bg-[#006384]">{saving ? "Guardando..." : "Guardar Calificaciones"}</button></div>
            </div>
          </div>
        ) : (
          <div className="card p-8 bg-white text-center space-y-3"><AlertCircle className="w-8 h-8 text-amber-500 mx-auto" /><h4 className="font-bold text-sm text-[#0D2A3E]">Seleccione un curso y asignatura</h4><p className="text-xs text-gray-500">No hay materias seleccionadas actualmente para calificar.</p></div>
        )}

        {renderPrintingModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#006384] flex items-center justify-center font-bold text-xl border border-blue-100"><User className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-[#0D2A3E]">{docenteData.apellido ? docenteData.apellido + ", " + docenteData.nombre : docenteData.nombre}</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">CUIL: {docenteData.cuil} • DNI: {docenteData.dni}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setPrintType("DDJJ"); setPrintingModal(true); }} className="bg-[#006384] hover:bg-[#004f6b] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2"><Printer className="w-4 h-4" /> Imprimir DDJJ</button>
          <button onClick={logout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2"><LogOut className="w-4 h-4" /> Salir del Portal</button>
        </div>
      </div>

      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 flex flex-wrap gap-2 text-xs font-bold shadow-xs">
        <button onClick={() => setActiveTab("ficha")} className={activeTab === "ficha" ? "py-2.5 px-5 rounded-xl bg-blue-50/80 text-[#006384] border border-blue-200" : "py-2.5 px-5 rounded-xl text-gray-600 hover:bg-gray-50"}>Mi Ficha y Cursos</button>
        <button onClick={() => setActiveTab("ddjj")} className={activeTab === "ddjj" ? "py-2.5 px-5 rounded-xl bg-blue-50/80 text-[#006384] border border-blue-200" : "py-2.5 px-5 rounded-xl text-gray-600 hover:bg-gray-50"}>Declaración Jurada de Cargos</button>
        <button onClick={() => setActiveTab("notas")} className={activeTab === "notas" ? "py-2.5 px-5 rounded-xl bg-blue-50/80 text-[#006384] border border-blue-200" : "py-2.5 px-5 rounded-xl text-gray-600 hover:bg-gray-50"}>Calificaciones</button>
        <button onClick={() => setActiveTab("horarios")} className={activeTab === "horarios" ? "py-2.5 px-5 rounded-xl bg-blue-50/80 text-[#006384] border border-blue-200" : "py-2.5 px-5 rounded-xl text-gray-600 hover:bg-gray-50"}>Mis Horarios</button>
      </div>

      {activeTab === "ficha" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleGuardarFichaDocente} className="lg:col-span-2 card p-6 bg-white space-y-5">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b border-gray-200 pb-3"><User className="w-5 h-5 text-[#006384]" /> Actualizar Datos de Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">NOMBRE</label><input type="text" value={docenteData.nombre} onChange={(e) => setDocenteData({ ...docenteData, nombre: e.target.value })} className="field-soft text-xs font-medium" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">APELLIDO</label><input type="text" value={docenteData.apellido} onChange={(e) => setDocenteData({ ...docenteData, apellido: e.target.value })} className="field-soft text-xs font-medium" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">DNI</label><input type="text" value={docenteData.dni} onChange={(e) => setDocenteData({ ...docenteData, dni: e.target.value })} className="field-soft text-xs font-medium" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">GÉNERO</label><select value={docenteData.genero} onChange={(e) => setDocenteData({ ...docenteData, genero: e.target.value })} className="field-soft text-xs font-medium"><option value="Femenino">Femenino</option><option value="Masculino">Masculino</option><option value="Otro">Otro</option></select></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">EMAIL *</label><input type="email" value={docenteData.email} onChange={(e) => setDocenteData({ ...docenteData, email: e.target.value })} className="field-soft text-xs font-medium" required /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">TELÉFONO *</label><input type="text" value={docenteData.telefono} onChange={(e) => setDocenteData({ ...docenteData, telefono: e.target.value })} className="field-soft text-xs font-medium" required /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">FECHA DE NACIMIENTO</label><input type="date" value={docenteData.fechaNac} onChange={(e) => setDocenteData({ ...docenteData, fechaNac: e.target.value })} className="field-soft text-xs font-medium" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">TÍTULO</label><input type="text" value={docenteData.titulo} onChange={(e) => setDocenteData({ ...docenteData, titulo: e.target.value })} placeholder="Ej: Profesor de Geografía" className="field-soft text-xs font-medium" /></div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-end"><button type="submit" className="btn-primary font-bold text-xs py-2.5 px-6 bg-[#006384]">Guardar Cambios</button></div>
          </form>
          
        {/* Historial de Inasistencias del Docente (Legajo) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#006384]" />
              Historial de Inasistencias en Legajo
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-[#006384] font-bold border border-blue-200">
              {misInasistencias.length} registro(s)
            </span>
          </div>

          {misInasistencias.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No registra inasistencias cargadas en la institución.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <th className="p-3 border border-gray-200">Causa / Tipo</th>
                    <th className="p-3 border border-gray-200 text-center">Días</th>
                    <th className="p-3 border border-gray-200">Desde / Hasta</th>
                    <th className="p-3 border border-gray-200">Observaciones</th>
                    <th className="p-3 border border-gray-200 text-center">Estado Legajo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {misInasistencias.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 border border-gray-200 font-bold">
                        <span className={"inline-block px-2.5 py-0.5 rounded text-[11px] " + (item.tipo === "Causas Particulares" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-blue-100 text-blue-800 border border-blue-300")}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="p-3 border border-gray-200 text-center font-bold">{item.cantidad_dias} día(s)</td>
                      <td className="p-3 border border-gray-200 font-medium text-gray-700 whitespace-nowrap">
                        {item.fecha_inicio} al {item.fecha_fin || item.fecha_inicio}
                      </td>
                      <td className="p-3 border border-gray-200 text-gray-600 max-w-xs truncate">
                        {item.observaciones || "Sin observaciones"}
                      </td>
                      <td className="p-3 border border-gray-200 text-center">
                        <span className={"text-[10px] font-bold px-2.5 py-0.5 rounded-full " + (item.archivado ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-800")}>
                          {item.archivado ? "Procesado en Legajo" : "Activo en Preceptoría"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-6 bg-white space-y-4">
            <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b border-gray-200 pb-3"><BookOpen className="w-5 h-5 text-[#006384]" /> Materias Asignadas en CENS 454</h3>
            {materiasAsignadas.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-600" /> Sin asignaciones activas</p>
                <p className="text-[11px] leading-relaxed">No tienes asignaturas vinculadas actualmente en CENS 454.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materiasAsignadas.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-gray-100 bg-[#F8FAFC] flex items-center justify-between">
                    <div><h4 className="text-xs font-bold text-[#0D2A3E]">{m.nombre}</h4><p className="text-[11px] text-gray-500 font-medium">Curso: {m.cursoNombre}</p></div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-[#006384]">CENS 454</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ddjj" && (
        <div className="card p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div><h3 className="text-lg font-bold font-heading text-[#0D2A3E] flex items-center gap-2"><FileText className="w-5 h-5 text-[#006384]" /> Declaración de Cargos en Otras Instituciones</h3><p className="text-xs text-gray-500">Registra todos tus cargos docentes fuera de CENS 454</p></div>
            <button onClick={handleAgregarCargoModal} className="btn-primary font-bold text-xs py-2.5 px-4 flex items-center gap-2 bg-[#006384]"><Plus className="w-4 h-4" /> + Agregar Cargo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-gray-700 font-bold border-b border-gray-200">
                <tr><th className="py-3 px-4">Escuela / Establecimiento</th><th className="py-3 px-4">Distrito</th><th className="py-3 px-4">Cargo / Hs</th><th className="py-3 px-4">Revista</th><th className="py-3 px-4">Días y Horarios</th><th className="py-3 px-4 text-center">Acción</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {cargosExternos.length === 0 ? (
                  <tr><td colSpan="6" className="py-6 text-center text-gray-400">No registras cargos externos declarados.</td></tr>
                ) : (
                  cargosExternos.map((cg) => (
                    <tr key={cg.id} className="hover:bg-gray-50/80">
                      <td className="py-4 px-4 font-bold text-[#0D2A3E]">{cg.establecimiento_externo || cg.escuela}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{cg.dias_externos || cg.distrito}</td>
                      <td className="py-4 px-4 font-semibold text-gray-800 max-w-xs">{cg.cargo_externo || cg.cargo}</td>
                      <td className="py-4 px-4 text-[#006384] font-bold">Carga Declarada</td>
                      <td className="py-4 px-4 text-gray-500 font-mono text-[11px]">{cg.horario_externo || cg.horario}</td>
                      <td className="py-4 px-4 text-center text-gray-400">-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "notas" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5"><User className="w-4 h-4 text-purple-600" /> Seleccione el Profesor</label><input type="text" value={docenteData.apellido ? docenteData.apellido + ", " + docenteData.nombre : docenteData.nombre} disabled className="field-soft text-xs font-bold bg-gray-50 text-gray-700 cursor-not-allowed" /></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-purple-600" /> Seleccione Asignatura</label><select value={selectedMateriaId} onChange={(e) => setSelectedMateriaId(e.target.value)} className="field-soft text-xs font-bold border-2 border-blue-500 focus:ring-2 focus:ring-blue-200"><option value="">Seleccionar Asignatura...</option>{materiasAsignadas.map((m) => (<option key={m.id} value={m.id}>{m.nombre} - {m.cursoNombre} ({m.ciclo})</option>))}</select></div>
          </div>
          {materiaActual ? (
            <div className="card p-0 bg-white shadow-xs overflow-hidden rounded-2xl border border-gray-200">
              <div className="bg-[#1E293B] text-white p-4 px-6 flex items-center justify-between">
                <h4 className="text-xs font-bold tracking-wide">Profesor a Cargo: <span className="text-blue-400 font-extrabold">{docenteData.apellido ? docenteData.apellido + ", " + docenteData.nombre : docenteData.nombre}</span></h4>
                <button onClick={() => { setPrintType("NOTAS"); setPrintingModal(true); }} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2"><Printer className="w-4 h-4" /> Planilla PDF</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                      <tr><th className="py-3 px-4">ESTUDIANTE</th><th className="py-3 px-4 text-center">VALORACION</th><th className="py-3 px-4 text-center">NOTA</th><th className="py-3 px-4 text-center">INTENSIFICACION</th><th className="py-3 px-4 text-center">NOTA FINAL</th><th className="py-3 px-4 text-center">FECHA</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {alumnos.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-400">
                            No hay estudiantes asignados en este curso ({materiaActual?.cursoNombre || "seleccionado"}).
                          </td>
                        </tr>
                      ) : (
                        alumnos.map((a) => {
                          const noteData = calificacionesMap[a.id] || { valoracion: "TEA", nota: "", intensificacion: "", notaFinal: "", fecha: new Date().toISOString().split("T")[0] };
                          return (
                            <tr key={a.id} className="hover:bg-gray-50/80">
                              <td className="py-3.5 px-4 font-bold text-[#0D2A3E]">{a.apellido}, {a.nombre}</td>
                              <td className="py-3.5 px-4 text-center"><select value={noteData.valoracion || "TEA"} onChange={(e) => handleUpdateNotaField(a.id, "valoracion", e.target.value)} className="field-soft text-xs py-1 px-3 w-28 text-center font-bold"><option value="TEA">TEA</option><option value="TEP">TEP</option><option value="TED">TED</option></select></td>
                              <td className="py-3.5 px-4 text-center"><input type="text" value={noteData.nota || ""} onChange={(e) => handleUpdateNotaField(a.id, "nota", e.target.value)} placeholder="-" className="field-soft text-xs py-1 px-2 w-16 text-center" /></td>
                              <td className="py-3.5 px-4 text-center"><input type="text" value={noteData.intensificacion || ""} onChange={(e) => handleUpdateNotaField(a.id, "intensificacion", e.target.value)} placeholder="-" className="field-soft text-xs py-1 px-2 w-24 text-center" /></td>
                              <td className="py-3.5 px-4 text-center"><input type="text" value={noteData.notaFinal || ""} onChange={(e) => handleUpdateNotaField(a.id, "notaFinal", e.target.value)} placeholder="-" className="field-soft text-xs py-1 px-2 w-16 text-center font-bold" /></td>
                              <td className="py-3.5 px-4 text-center"><input type="date" value={noteData.fecha || ""} onChange={(e) => handleUpdateNotaField(a.id, "fecha", e.target.value)} className="field-soft text-xs py-1 px-2 w-32 text-center" /></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100"><button onClick={handleGuardarCalificaciones} disabled={saving} className="btn-primary font-bold text-xs py-3 px-8 rounded-xl bg-[#006384]">{saving ? "Guardando..." : "Guardar Calificaciones"}</button></div>
              </div>
            </div>
          ) : (
            <div className="card p-8 bg-white text-center space-y-3"><AlertCircle className="w-8 h-8 text-amber-500 mx-auto" /><h4 className="font-bold text-sm text-[#0D2A3E]">Sin asignaturas para calificar</h4><p className="text-xs text-gray-500">No posees materias vinculadas.</p></div>
          )}
        </div>
      )}

      {activeTab === "horarios" && (() => {
        const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
        const modulosList = [1, 2, 3, 4, 5, 6];
        const getFranjaHoraria = (mIdx) => {
          const start = 18 * 60 + 30 + mIdx * 40;
          const end = start + 40;
          const fmt = (mins) => {
            const h = Math.floor(mins / 60) % 24;
            const m = mins % 60;
            return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
          };
          return fmt(start) + " - " + fmt(end);
        };

        const gridMap = {};
        misHorarios.forEach((h) => {
          gridMap[h.dia_semana + "_" + h.modulo] = h;
        });

        const diasActivos = Array.from(new Set(misHorarios.map((h) => h.dia_semana))).sort();

        return (
          <div className="space-y-6">
            {/* Header de Resumen Horario */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#006384]" />
                  Cronograma y Horarios Escolares Asignados
                </h3>
                <p className="text-xs text-gray-500">
                  Distribución semanal de materias y módulos frente a curso en CENS Nº 454
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPrintType("HORARIOS");
                    setPrintingModal(true);
                  }}
                  className="bg-[#006384] hover:bg-[#004f6b] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" /> Imprimir Mi Horario
                </button>
              </div>
            </div>

            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Carga Horaria</span>
                  <span className="text-xl font-extrabold text-[#0D2A3E]">{misHorarios.length} Módulos</span>
                  <span className="text-[10px] text-gray-400 block">{(misHorarios.length * 40)} min. semanales</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#006384] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Días de Clases</span>
                  <span className="text-base font-bold text-[#0D2A3E]">
                    {diasActivos.length > 0 ? diasActivos.map((d) => diasSemana[d]).join(", ") : "Sin asignar"}
                  </span>
                  <span className="text-[10px] text-gray-400 block">{diasActivos.length} día(s) por semana</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Turno y Sede</span>
                  <span className="text-base font-bold text-[#0D2A3E]">Turno Noche</span>
                  <span className="text-[10px] text-gray-400 block">18:30 a 22:30 • CENS Nº 454</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* GRILLA SEMANAL VISUAL DEL DOCENTE */}
            <div className="card p-0 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="bg-[#0D2A3E] text-white p-4 px-6 flex items-center justify-between">
                <h4 className="text-xs font-bold tracking-wide">
                  Grilla Semanal Unificada: <span className="text-[#F5C442]">{docenteData.apellido ? (docenteData.apellido + ", " + docenteData.nombre) : docenteData.nombre}</span>
                </h4>
                <span className="text-[11px] font-bold bg-blue-900/60 text-blue-200 px-3 py-1 rounded-full border border-blue-700">
                  Ciclo {cicloLectivo || 2026}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#EEF5FA] text-[#0D2A3E] font-bold border-b">
                    <tr>
                      <th className="py-3 px-3 w-36 border-r border-gray-200">Módulo / Horario</th>
                      {diasSemana.map((dia) => (
                        <th key={dia} className="py-3 px-3 text-center border-r border-gray-200 min-w-[170px]">
                          {dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {modulosList.map((mod, modIdx) => (
                      <tr key={mod} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-bold text-gray-700 bg-gray-50 border-r border-gray-200">
                          <div>{mod}º Módulo</div>
                          <div className="text-[10px] text-gray-400 font-normal">{getFranjaHoraria(modIdx)}</div>
                        </td>

                        {diasSemana.map((dia, diaIdx) => {
                          const item = gridMap[diaIdx + "_" + mod];
                          return (
                            <td
                              key={diaIdx}
                              className={
                                "p-2 border-r border-gray-200 text-center align-middle " +
                                (item ? "bg-blue-50/60 font-semibold" : "text-gray-300")
                              }
                            >
                              {item ? (
                                <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-xs space-y-1 text-left">
                                  <div className="font-bold text-[#0D2A3E] text-xs leading-tight">
                                    {item.materias?.nombre || "Asignatura"}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pt-0.5">
                                    <span className="text-[10px] font-bold text-[#006384] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {item.cursos ? (item.cursos.anio + "º " + item.cursos.division) : "Curso"}
                                    </span>
                                    {item.aula && (
                                      <span className="text-[9px] text-gray-500 font-mono">
                                        {item.aula}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-300 font-normal">--</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETALLE CRONOLÓGICO POR DÍA */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold font-heading text-[#0D2A3E] border-b pb-3">
                Detalle Cronológico de Cursos y Materias
              </h4>

              {misHorarios.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No se registran horarios asignados en la grilla oficial para tus asignaturas.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {misHorarios.map((h, idx) => {
                    const diaNombre = diasSemana[h.dia_semana] || "Día";
                    const franja = getFranjaHoraria(h.modulo - 1);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#F8FAFC] rounded-xl border border-gray-200 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="text-[11px] font-extrabold text-[#0D2A3E] block">
                            {diaNombre} • {h.modulo}º Módulo ({franja})
                          </span>
                          <span className="text-xs text-gray-700 font-bold block mt-0.5">
                            {h.materias?.nombre || "Asignatura"}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            Curso: {h.cursos ? (h.cursos.anio + "º " + h.cursos.division + " - " + (h.cursos.orientacion || "") + " (" + h.cursos.turno + ")") : "-"}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-[#006384] shrink-0">
                          {h.aula || "Sede CENS"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {/* RENDER MODAL DE IMPRESIÓN OFICIAL PARA EL DOCENTE */}
      {renderPrintingModal()}

      {/* ESTILOS GLOBALES DE IMPRESIÓN (SOLO SE IMPRIME EL DOCUMENTO) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-modal,
          #printable-modal * {
            visibility: visible !important;
          }
          #printable-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}