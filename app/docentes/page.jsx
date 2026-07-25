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
        } else { setMateriasAsignadas([]); setSelectedMateriaId(""); }
        const { data: ddjjData } = await supabase.from("ddjj_docentes").select("*").eq("docente_id", profile.id);
        if (ddjjData) { setCargosExternos(ddjjData); }
      }
    } catch (e) { console.error(e); } finally { setLoadingProfile(false); }
  }

  async function loadAlumnosYCalificaciones(materiaId) {
    try {
      const { data: mData } = await supabase.from("materias").select("curso_id").eq("id", materiaId).single();
      let realAlumnos = [];
      if (mData?.curso_id) {
        const { data: acData } = await supabase.from("alumnos_cursos").select("estudiante_id, estudiantes(*)").eq("curso_id", mData.curso_id);
        if (acData && acData.length > 0) {
          realAlumnos = acData.map((item) => item.estudiantes).filter(Boolean);
        }
      }
      if (realAlumnos.length === 0) {
        const { data: allEst } = await supabase.from("estudiantes").select("*").eq("estado", "activo").order("apellido");
        realAlumnos = allEst || [];
      }
      setAlumnos(realAlumnos);

      const { data: califData } = await supabase.from("calificaciones").select("*").eq("materia_id", materiaId);
      const initialMap = {};
      if (califData && califData.length > 0) {
        califData.forEach((c) => {
          initialMap[c.estudiante_id] = {
            valoracion: c.valoracion || "TEA",
            nota: c.nota || "",
            intensificacion: c.intensificacion || "",
            notaFinal: c.nota_final || "",
            fecha: c.fecha || new Date().toISOString().split("T")[0]
          };
        });
      } else {
        realAlumnos.forEach((a) => {
          initialMap[a.id] = { valoracion: "TEA", nota: "", intensificacion: "", notaFinal: "", fecha: new Date().toISOString().split("T")[0] };
        });
      }
      setCalificacionesMap(initialMap);
    } catch (e) { console.error(e); }
  }

  const handleUpdateNotaField = (estId, field, val) => {
    setCalificacionesMap((prev) => ({
      ...prev,
      [estId]: { ...(prev[estId] || {}), [field]: val }
    }));
  };

  const handleGuardarCalificaciones = async () => {
    if (!selectedMateriaId) return;
    setSaving(true);
    try {
      const records = Object.keys(calificacionesMap).map((estId) => ({
        estudiante_id: estId,
        materia_id: selectedMateriaId,
        valoracion: calificacionesMap[estId].valoracion,
        nota: calificacionesMap[estId].nota || null,
        intensificacion: calificacionesMap[estId].intensificacion || null,
        nota_final: calificacionesMap[estId].notaFinal || null,
        fecha: calificacionesMap[estId].fecha || new Date().toISOString().split("T")[0]
      }));

      if (records.length > 0) {
        await supabase.from("calificaciones").upsert(records, { onConflict: "estudiante_id,materia_id" });
      }

      Swal.fire({ icon: "success", title: "Calificaciones Guardadas", text: "Se registraron las notas en Supabase.", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
                    <tr><th className="py-3 px-4">ESTUDIANTE</th><th className="py-3 px-4 text-center">VALORACIÓN (1° CUATR.)</th><th className="py-3 px-4 text-center">NOTA</th><th className="py-3 px-4 text-center">INTENSIFICACIÓN</th><th className="py-3 px-4 text-center">NOTA FINAL</th><th className="py-3 px-4 text-center">FECHA</th></tr>
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

        {printingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 space-y-6 relative border border-gray-200">
              <div className="flex justify-between items-center border-b pb-4"><h3 className="text-lg font-bold text-[#0D2A3E]">Vista Previa de Impresión Oficial - Calificaciones</h3><button onClick={() => setPrintingModal(false)} className="text-gray-400 font-bold">✕</button></div>
              <div className="border p-8 rounded-xl bg-white space-y-6">
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                  <div><h2 className="text-lg font-extrabold text-gray-900">CENS Nº 454 - ESTEBAN ECHEVERRÍA</h2><p className="text-[11px] text-gray-600 font-medium">Dirección General de Cultura y Educación - Provincia de Buenos Aires</p></div>
                  <div className="text-right"><h3 className="text-xs font-bold text-gray-800 uppercase">PLANILLA DE CALIFICACIONES</h3><p className="text-[10px] text-gray-500 mt-1">Fecha: {new Date().toLocaleDateString("es-AR")}</p></div>
                </div>
                <div className="flex justify-between items-end border-b pb-3">
                  <div><h3 className="text-xl font-black text-[#0D2A3E]">CENS 454 Calificaciones</h3><p className="text-[10px] font-bold text-blue-800 uppercase mt-0.5">MODO: CICLO ACTIVO (2026)</p></div>
                  <div className="text-right"><h4 className="text-sm font-bold text-gray-900">{materiaActual?.nombre || "Sin Asignatura"}</h4><p className="text-xs text-gray-600 font-medium">Curso: {materiaActual?.cursoNombre || "-"} (Ciclo 2026)</p></div>
                </div>
                <table className="w-full text-left text-xs border border-gray-900 border-collapse">
                  <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-900">
                    <tr><th className="py-2 px-3 border-r border-gray-900">ESTUDIANTE</th><th className="py-2 px-3 text-center border-r border-gray-900">VALORACIÓN</th><th className="py-2 px-3 text-center border-r border-gray-900">NOTA</th><th className="py-2 px-3 text-center border-r border-gray-900">INTENSIFICACIÓN</th><th className="py-2 px-3 text-center border-r border-gray-900">NOTA FINAL</th><th className="py-2 px-3 text-center">FECHA</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {alumnos.map((a) => {
                      const noteData = calificacionesMap[a.id] || { valoracion: "TEA", nota: "-", fecha: new Date().toISOString().split("T")[0] };
                      return (
                        <tr key={a.id} className="border-b border-gray-900">
                          <td className="py-2 px-3 font-bold border-r border-gray-900">{a.apellido}, {a.nombre}</td>
                          <td className="py-2 px-3 text-center font-bold border-r border-gray-900">{noteData.valoracion}</td>
                          <td className="py-2 px-3 text-center border-r border-gray-900">{noteData.nota || "-"}</td>
                          <td className="py-2 px-3 text-center border-r border-gray-900">{noteData.intensificacion || "-"}</td>
                          <td className="py-2 px-3 text-center border-r border-gray-900">{noteData.notaFinal || "-"}</td>
                          <td className="py-2 px-3 text-center">{noteData.fecha}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-bold text-gray-800">
                  <div className="border-t border-gray-900 pt-2"><p>FIRMA DEL PROFESOR</p></div>
                  <div className="border-t border-gray-900 pt-2"><p>FIRMA DE DIRECCIÓN INSTITUCIONAL</p><p className="text-[10px] text-gray-500 font-normal mt-0.5">CENS 454 ESTEBAN ECHEVERRÍA</p></div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button onClick={() => setPrintingModal(false)} className="bg-gray-100 text-gray-700 font-bold text-xs py-2.5 px-5 rounded-xl">Cerrar</button>
                <button onClick={() => window.print()} className="bg-[#006384] text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2"><Printer className="w-4 h-4" /> Imprimir Documento</button>
              </div>
            </div>
          </div>
        )}
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
                      {alumnos.map((a) => {
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
                      })}
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

      {activeTab === "horarios" && (
        <div className="card p-6 bg-white space-y-4">
          <h3 className="text-base font-bold font-heading text-[#0D2A3E] flex items-center gap-2 border-b border-gray-200 pb-3"><Clock className="w-5 h-5 text-[#006384]" /> Mis Horarios Asignados CENS 454</h3>
          {materiasAsignadas.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No posees horarios cargados en CENS 454.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materiasAsignadas.map((m) => (
                <div key={m.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200"><h4 className="font-bold text-xs text-[#0D2A3E]">{m.nombre} ({m.cursoNombre})</h4><p className="text-xs text-gray-500 mt-1">📅 Horario oficial de CENS 454</p></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}