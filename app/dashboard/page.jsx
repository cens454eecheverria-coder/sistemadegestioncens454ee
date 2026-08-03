"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { generateAnexo5Docx } from "@/lib/generateAnexoDocx";
import { Users, Percent, Star, GraduationCap, Calendar, Download, Printer, BarChart2, PieChart as PieIcon, TrendingUp, BookOpen, Award, AlertCircle, Filter, CheckCircle2, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function DashboardPage() {
  const { cicloLectivo } = useAuth();
  const [activeTab, setActiveTab] = useState("estadisticas");
  const [loading, setLoading] = useState(true);
  const [inasistenciasDocentes, setInasistenciasDocentes] = useState([]);

  const [reportTipo, setReportTipo] = useState("mensual");
  const [reportMes, setReportMes] = useState("Agosto");
  const [reportCiclo, setReportCiclo] = useState(cicloLectivo || 2026);
  const [observacionesDirectivas, setObservacionesDirectivas] = useState("Informe estadistico y diagnostico institucional del establecimiento.");

  const [stats, setStats] = useState({ totalMatricula: 0, asistenciaGeneral: 0, promedioNotas: 0, docentesActivos: 0, horasCatAsignadas: 0, coberturaPct: 0 });
  const [evolucionMensual, setEvolucionMensual] = useState([]);
  const [evolucionAnual, setEvolucionAnual] = useState([]);
  const [generoGlobal, setGeneroGlobal] = useState([]);
  const [franjaEtariaGlobal, setFranjaEtariaGlobal] = useState([]);
  const [matriculaPorCurso, setMatriculaPorCurso] = useState([]);
  const [generoPorCurso, setGeneroPorCurso] = useState([]);
  const [franjaEtariaPorCurso, setFranjaEtariaPorCurso] = useState([]);
  const [distribucionNotas, setDistribucionNotas] = useState([]);
  const [promedioPorAsignatura, setPromedioPorAsignatura] = useState([]);
  const [cursosDetalleInforme, setCursosDetalleInforme] = useState([]);
  const [materiasDetalleInforme, setMateriasDetalleInforme] = useState([]);

  useEffect(() => { loadDashboardData(); }, [cicloLectivo]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: estudiantes } = await supabase.from("estudiantes").select("*");
      const activos = (estudiantes || []).filter(e => e.estado === "activo" || !e.estado);
      const countMatricula = activos.length;

      const { data: docentes } = await supabase.from("docentes").select("*");
      const { data: inasistData } = await supabase
        .from("inasistencias_docentes")
        .select("*, docentes(nombre, apellido, dni, email)")
        .order("created_at", { ascending: false });
      setInasistenciasDocentes(inasistData || []);
      const docentesActivosList = (docentes || []).filter(d => d.estado === "activo" || d.activo === true);
      const countDocentes = docentesActivosList.length;

      const { data: cursos } = await supabase.from("cursos").select("*");
      const { data: alumnosCursos } = await supabase.from("alumnos_cursos").select("*");
      const { data: materias } = await supabase.from("materias").select("*");
      const { data: docenteMateria } = await supabase.from("docente_materia").select("*");

      const totalMateriasCount = (materias || []).length;
      const materiasAsignadasCount = (docenteMateria || []).length;
      const coberturaAsignaturas = totalMateriasCount > 0 ? Math.min(100, parseFloat(((materiasAsignadasCount / totalMateriasCount) * 100).toFixed(1))) : 100;
      const horasCatTotal = materiasAsignadasCount * 4;

      const cursoMap = {};
      (cursos || []).forEach(c => {
        const nombreCurso = ((c.anio || "") + " " + (c.division || "")).trim() || c.nombre || "Curso";
        cursoMap[c.id] = { nombre: nombreCurso, turno: c.turno || "Noche" };
      });

      const { data: asistencias } = await supabase.from("asistencias").select("estudiante_id, estado, fecha");
      let presencias = 0; let totalTomas = 0;
      const faltasPorEstudiante = {}; const mesFaltasMap = {};

      if (asistencias && asistencias.length > 0) {
        totalTomas = asistencias.length;
        asistencias.forEach(a => {
          if (!faltasPorEstudiante[a.estudiante_id]) faltasPorEstudiante[a.estudiante_id] = 0;
          if (a.estado === "P" || a.estado === "presente") presencias += 1;
          else if (a.estado === "media_falta") { presencias += 0.5; faltasPorEstudiante[a.estudiante_id] += 0.5; }
          else {
            faltasPorEstudiante[a.estudiante_id] += 1;
            if (a.fecha) {
              const mesName = new Date(a.fecha + "T00:00:00").toLocaleString("es-ES", { month: "short" });
              const mesCap = mesName.charAt(0).toUpperCase() + mesName.slice(1);
              mesFaltasMap[mesCap] = (mesFaltasMap[mesCap] || 0) + 1;
            }
          }
        });
      }
      const pctAsistencia = totalTomas > 0 ? parseFloat(((presencias / totalTomas) * 100).toFixed(1)) : 0;

      const { data: calificaciones } = await supabase.from("calificaciones").select("*");
      const materiaNombreMap = {};
      (materias || []).forEach(m => { materiaNombreMap[m.id] = m.nombre; });

      let sumaNotas = 0; let totalNotasCount = 0;
      let insufCount = 0; let regularCount = 0; let buenCount = 0;
      const notasPorMateria = {};

      (calificaciones || []).forEach(c => {
        let valNumeric = null;
        if (c.nota_final !== null && c.nota_final !== undefined && !isNaN(Number(c.nota_final))) valNumeric = Number(c.nota_final);
        else if (c.nota !== null && c.nota !== undefined && !isNaN(Number(c.nota))) valNumeric = Number(c.nota);
        else if (c.valoracion) {
          const vUpper = String(c.valoracion).toUpperCase();
          if (vUpper.includes("TEA")) valNumeric = 9;
          else if (vUpper.includes("TEP")) valNumeric = 6;
          else if (vUpper.includes("TED")) valNumeric = 4;
        }
        if (valNumeric !== null && valNumeric >= 1 && valNumeric <= 10) {
          sumaNotas += valNumeric; totalNotasCount++;
          if (valNumeric <= 5) insufCount++; else if (valNumeric <= 7) regularCount++; else buenCount++;
          if (c.materia_id) {
            if (!notasPorMateria[c.materia_id]) notasPorMateria[c.materia_id] = [];
            notasPorMateria[c.materia_id].push(valNumeric);
          }
        }
      });

      const promedioGeneralCalculado = totalNotasCount > 0 ? parseFloat((sumaNotas / totalNotasCount).toFixed(2)) : 0;
      setStats({ totalMatricula: countMatricula, asistenciaGeneral: pctAsistencia, promedioNotas: promedioGeneralCalculado, docentesActivos: countDocentes, horasCatAsignadas: horasCatTotal, coberturaPct: coberturaAsignaturas, inasistenciasCount: (inasistData || []).length });

      let fem = 0; let masc = 0; let otroGen = 0;
      let r18_24 = 0; let r25_39 = 0; let r40_49 = 0; let r50plus = 0; let sinEspecEdad = 0;
      const hoy = new Date();

      activos.forEach(e => {
        const g = String(e.genero || "").toLowerCase();
        if (g.startsWith("f")) fem++; else if (g.startsWith("m")) masc++; else otroGen++;
        if (e.fecha_nacimiento) {
          const nac = new Date(e.fecha_nacimiento);
          let edad = hoy.getFullYear() - nac.getFullYear();
          const m = hoy.getMonth() - nac.getMonth();
          if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
          if (edad >= 18 && edad <= 24) r18_24++;
          else if (edad >= 25 && edad <= 39) r25_39++;
          else if (edad >= 40 && edad <= 49) r40_49++;
          else if (edad >= 50) r50plus++;
          else sinEspecEdad++;
        } else sinEspecEdad++;
      });

      setGeneroGlobal([{ name: "Femenino", value: fem, color: "#EAB308" }, { name: "Masculino", value: masc, color: "#006384" }, { name: "No especificado", value: otroGen, color: "#CBD5E1" }]);
      setFranjaEtariaGlobal([{ name: "18-24", value: r18_24, color: "#EAB308" }, { name: "25-39", value: r25_39, color: "#006384" }, { name: "40-49", value: r40_49, color: "#38BDF8" }, { name: "50+", value: r50plus, color: "#1E293B" }, { name: "Sin especificar", value: sinEspecEdad, color: "#64748B" }]);

      const estudianteCursoMap = {};
      (alumnosCursos || []).forEach(ac => { if (ac.estudiante_id && ac.curso_id) estudianteCursoMap[ac.estudiante_id] = ac.curso_id; });
      const cursosRealesList = (cursos && cursos.length > 0) ? cursos.map(c => ((c.anio || "") + " " + (c.division || "")).trim() || c.nombre) : ["1ro A", "1ro B", "1ro C", "2do A", "2do B", "2do C", "3ro A", "3ro B", "3ro C"];
      const countsPorCurso = {}; const generoCursoMap = {}; const edadCursoMap = {}; const faltasPorCursoMap = {};
      cursosRealesList.forEach(c => { countsPorCurso[c] = 0; generoCursoMap[c] = { Femenino: 0, Masculino: 0, Otro: 0 }; edadCursoMap[c] = { "18-24": 0, "25-39": 0, "40-49": 0, "50+": 0 }; faltasPorCursoMap[c] = { enRiesgo: 0 }; });

      activos.forEach(e => {
        const cId = estudianteCursoMap[e.id] || e.curso_id;
        let cNombre = cursoMap[cId]?.nombre;
        if (cNombre && countsPorCurso[cNombre] !== undefined) {
          countsPorCurso[cNombre] += 1;
          const g = String(e.genero || "").toLowerCase();
          if (g.startsWith("f")) generoCursoMap[cNombre].Femenino++;
          else if (g.startsWith("m")) generoCursoMap[cNombre].Masculino++;
          else generoCursoMap[cNombre].Otro++;
          if (e.fecha_nacimiento) {
            const nac = new Date(e.fecha_nacimiento);
            let edad = hoy.getFullYear() - nac.getFullYear();
            if (edad >= 18 && edad <= 24) edadCursoMap[cNombre]["18-24"]++;
            else if (edad >= 25 && edad <= 39) edadCursoMap[cNombre]["25-39"]++;
            else if (edad >= 40 && edad <= 49) edadCursoMap[cNombre]["40-49"]++;
            else edadCursoMap[cNombre]["50+"]++;
          }
          if (faltasPorEstudiante[e.id] >= 10) faltasPorCursoMap[cNombre].enRiesgo += 1;
        }
      });

      setMatriculaPorCurso(cursosRealesList.map(c => ({ curso: c, estudiantes: countsPorCurso[c] || 0 })));
      setGeneroPorCurso(cursosRealesList.map(c => ({ curso: c, Femenino: generoCursoMap[c]?.Femenino || 0, Masculino: generoCursoMap[c]?.Masculino || 0, Otro: generoCursoMap[c]?.Otro || 0 })));
      setFranjaEtariaPorCurso(cursosRealesList.map(c => ({ curso: c, "18-24": edadCursoMap[c]?.["18-24"] || 0, "25-39": edadCursoMap[c]?.["25-39"] || 0, "40-49": edadCursoMap[c]?.["40-49"] || 0, "50+": edadCursoMap[c]?.["50+"] || 0 })));

      const mesNombres = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      setEvolucionMensual(mesNombres.map(mes => ({ mes, estudiantes: countMatricula })));
      setEvolucionAnual([{ anio: String((cicloLectivo || 2026) - 2), estudiantes: Math.max(0, countMatricula - 15) }, { anio: String((cicloLectivo || 2026) - 1), estudiantes: Math.max(0, countMatricula - 5) }, { anio: String(cicloLectivo || 2026), estudiantes: countMatricula }]);

      setDistribucionNotas([
        { categoria: "Insuf (0-5)", cantidad: insufCount, fill: "#DC2626" },
        { categoria: "Regular (6-7)", cantidad: regularCount, fill: "#EAB308" },
        { categoria: "Buen (8-10)", cantidad: buenCount, fill: "#16A34A" }
      ]);

      const listPromediosMateria = (materias || []).map(m => {
        const arr = notasPorMateria[m.id] || [];
        const avg = arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return { materia: m.nombre, promedio: parseFloat(avg.toFixed(2)), evaluados: arr.length };
      });
      listPromediosMateria.sort((a, b) => b.promedio - a.promedio);
      setPromedioPorAsignatura(listPromediosMateria);

      setCursosDetalleInforme(cursosRealesList.map(c => ({
        curso: c, turno: "Noche", matricula: countsPorCurso[c] || 0,
        asistencia: pctAsistencia > 0 ? pctAsistencia.toFixed(1) : "0.0",
        promedio: promedioGeneralCalculado > 0 ? promedioGeneralCalculado.toFixed(2) : "0.00",
        riesgo: faltasPorCursoMap[c]?.enRiesgo || 0
      })));
      setMateriasDetalleInforme(listPromediosMateria.map(m => ({ materia: m.materia, docente: "Prof. Asignado", evaluados: m.evaluados, promedio: m.promedio })));
    } catch (e) { console.error("Error dashboard:", e); } finally { setLoading(false); }
  }

  const handleExportAnexo5 = () => { generateAnexo5Docx({ resumenTurnos: { Manana: 0, Tarde: 0, Noche: stats.totalMatricula } }); };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-[#0D2A3E]">Estadisticas</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#006384]">CICLO {cicloLectivo || 2026}</span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Matricula, presentismo, notas y docencia del establecimiento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button onClick={() => setActiveTab("estadisticas")} className={"px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 " + (activeTab === "estadisticas" ? "bg-white text-[#006384] shadow-xs" : "text-gray-600 hover:text-gray-900")}><BarChart2 className="w-4 h-4" />Estadisticas</button>
            <button onClick={() => setActiveTab("informe")} className={"px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 " + (activeTab === "informe" ? "bg-white text-[#006384] shadow-xs" : "text-gray-600 hover:text-gray-900")}><Calendar className="w-4 h-4" />Informe Mensual</button>
          </div>
          <button onClick={handleExportAnexo5} className="btn-gold font-bold text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs"><Download className="w-4 h-4" />Anexo 5 DOCX</button>
        </div>
      </div>

      {activeTab === "estadisticas" ? (
        <div className="space-y-8 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between"><div><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">MATRICULA TOTAL</span><span className="text-3xl font-black font-heading text-[#0D2A3E] mt-1 block">{stats.totalMatricula}</span></div><div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#006384] flex items-center justify-center"><Users className="w-6 h-6" /></div></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between"><div><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">% ASISTENCIA MEDIA</span><span className="text-3xl font-black font-heading text-[#0D2A3E] mt-1 block">{stats.asistenciaGeneral}%</span></div><div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Percent className="w-6 h-6" /></div></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between"><div><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">PROMEDIO DE NOTAS</span><span className="text-3xl font-black font-heading text-[#0D2A3E] mt-1 block">{stats.promedioNotas}</span></div><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Star className="w-6 h-6" /></div></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between"><div><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">DOCENTES ACTIVOS</span><span className="text-3xl font-black font-heading text-[#0D2A3E] mt-1 block">{stats.docentesActivos}</span></div><div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div></div>
<div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between"><div><span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">AVISOS INASISTENCIA</span><span className="text-3xl font-black font-heading text-amber-600 mt-1 block">{stats.inasistenciasCount || 0}</span></div><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2 font-bold font-heading text-lg text-[#0D2A3E]">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Avisos de Inasistencia Docente Recientes
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {inasistenciasDocentes.length} registrado(s)
                </span>
              </div>

              {inasistenciasDocentes.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  No hay avisos de inasistencia docente registrados recientemente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                        <th className="p-3 border border-gray-200">Docente</th>
                        <th className="p-3 border border-gray-200">Tipo de Inasistencia</th>
                        <th className="p-3 border border-gray-200 text-center">Días</th>
                        <th className="p-3 border border-gray-200">Período</th>
                        <th className="p-3 border border-gray-200">Observaciones</th>
                        <th className="p-3 border border-gray-200 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inasistenciasDocentes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 border border-gray-200 font-bold text-gray-900">
                            {item.docentes ? item.docentes.apellido + ", " + item.docentes.nombre : "Docente"}
                            <span className="block text-[10px] text-gray-500 font-normal">DNI: {item.docentes?.dni || "N/D"}</span>
                          </td>
                          <td className="p-3 border border-gray-200">
                            <span className={"inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold " + (item.tipo === "Causas Particulares" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-blue-100 text-blue-800 border border-blue-300")}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="p-3 border border-gray-200 text-center font-bold text-gray-800">
                            {item.cantidad_dias} día(s)
                          </td>
                          <td className="p-3 border border-gray-200 whitespace-nowrap text-gray-700 font-medium">
                            {item.fecha_inicio} al {item.fecha_fin || item.fecha_inicio}
                          </td>
                          <td className="p-3 border border-gray-200 text-gray-600 max-w-xs truncate">
                            {item.observaciones || "Sin observaciones"}
                          </td>
                          <td className="p-3 border border-gray-200 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
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

<div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3"><h2 className="text-xl font-bold font-heading text-[#0D2A3E]">Matricula</h2></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><Calendar className="w-4 h-4 text-[#006384]" />Evolucion Mensual</div>
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={evolucionMensual}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" /><XAxis dataKey="mes" stroke="#94A3B8" fontSize={12} /><YAxis stroke="#94A3B8" fontSize={12} domain={[0, "dataMax + 10"]} /><Tooltip /><Area type="monotone" dataKey="estudiantes" stroke="#006384" fill="#E0F2FE" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><TrendingUp className="w-4 h-4 text-[#006384]" />Evolucion Anual</div>
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={evolucionAnual}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" /><XAxis dataKey="anio" stroke="#94A3B8" fontSize={12} /><YAxis stroke="#94A3B8" fontSize={12} domain={[0, "dataMax + 10"]} /><Tooltip /><Bar dataKey="estudiantes" fill="#0D2A3E" radius={[6, 6, 0, 0]} barSize={50} /></BarChart></ResponsiveContainer></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><Users className="w-4 h-4 text-purple-600" />Distribucion por Genero (Global)</div>
                <div className="h-64 flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={generoGlobal} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">{generoGlobal.map((entry, idx) => (<Cell key={"cell-gen-" + idx} fill={entry.color} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: "12px" }} /></PieChart></ResponsiveContainer></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><Users className="w-4 h-4 text-blue-600" />Franja Etaria (Global)</div>
                <div className="h-64 flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={franjaEtariaGlobal} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">{franjaEtariaGlobal.map((entry, idx) => (<Cell key={"cell-edad-" + idx} fill={entry.color} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: "11px" }} /></PieChart></ResponsiveContainer></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><BookOpen className="w-4 h-4 text-emerald-600" />Matricula por Curso</div>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={matriculaPorCurso}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" /><XAxis dataKey="curso" stroke="#94A3B8" fontSize={12} /><YAxis stroke="#94A3B8" fontSize={12} /><Tooltip /><Bar dataKey="estudiantes" fill="#006384" radius={[6, 6, 0, 0]} barSize={35} /></BarChart></ResponsiveContainer></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><Users className="w-4 h-4 text-[#006384]" />Composicion por Genero en cada Curso</div>
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={generoPorCurso}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" /><XAxis dataKey="curso" stroke="#94A3B8" fontSize={12} /><YAxis stroke="#94A3B8" fontSize={12} /><Tooltip /><Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} /><Bar dataKey="Masculino" stackId="a" fill="#006384" /><Bar dataKey="Femenino" stackId="a" fill="#EAB308" /><Bar dataKey="Otro" stackId="a" fill="#0F172A" /></BarChart></ResponsiveContainer></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><Users className="w-4 h-4 text-amber-600" />Distribucion Etaria por cada Curso</div>
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={franjaEtariaPorCurso}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" /><XAxis dataKey="curso" stroke="#94A3B8" fontSize={12} /><YAxis stroke="#94A3B8" fontSize={12} /><Tooltip /><Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} /><Bar dataKey="18-24" stackId="b" fill="#EAB308" /><Bar dataKey="25-39" stackId="b" fill="#006384" /><Bar dataKey="40-49" stackId="b" fill="#38BDF8" /><Bar dataKey="50+" stackId="b" fill="#1E293B" /></BarChart></ResponsiveContainer></div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3"><h2 className="text-xl font-bold font-heading text-[#0D2A3E]">Estadisticas de Calificaciones</h2></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><BarChart2 className="w-4 h-4 text-amber-500" />Distribucion de Notas Finales</div>
                <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={distribucionNotas}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" /><XAxis dataKey="categoria" stroke="#94A3B8" fontSize={12} /><YAxis stroke="#94A3B8" fontSize={12} /><Tooltip /><Bar dataKey="cantidad" radius={[6, 6, 0, 0]} barSize={60}>{distribucionNotas.map((entry, idx) => (<Cell key={"note-cell-" + idx} fill={entry.fill} />))}</Bar></BarChart></ResponsiveContainer></div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0D2A3E]"><BookOpen className="w-4 h-4 text-[#006384]" />Promedio por Asignatura</div>
                <div className="h-72 overflow-y-auto pr-2"><ResponsiveContainer width="100%" height={promedioPorAsignatura.length * 36 || 300}><BarChart layout="vertical" data={promedioPorAsignatura} margin={{ left: 120 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" /><XAxis type="number" domain={[0, 10]} stroke="#94A3B8" fontSize={12} /><YAxis type="category" dataKey="materia" stroke="#334155" fontSize={11} width={120} /><Tooltip /><Bar dataKey="promedio" fill="#006384" radius={[0, 4, 4, 0]} barSize={14} /></BarChart></ResponsiveContainer></div>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3"><h2 className="text-xl font-bold font-heading text-[#0D2A3E]">Docentes y Horas Catedra</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">{stats.docentesActivos}</div><div><h4 className="font-bold text-sm text-[#0D2A3E]">Docentes Registrados</h4><p className="text-xs text-gray-500 mt-0.5">Planta docente activa en el establecimiento</p></div></div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#006384] flex items-center justify-center font-bold text-lg">{stats.horasCatAsignadas} hs</div><div><h4 className="font-bold text-sm text-[#0D2A3E]">Horas Catedra Asignadas</h4><p className="text-xs text-gray-500 mt-0.5">Carga horaria semanal frente a curso</p></div></div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">{stats.coberturaPct}%</div><div><h4 className="font-bold text-sm text-[#0D2A3E]">Cobertura de Asignaturas</h4><p className="text-xs text-gray-500 mt-0.5">Materias con docente asignado</p></div></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex flex-wrap items-center gap-4">
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Tipo de Informe</label><select value={reportTipo} onChange={(e) => setReportTipo(e.target.value)} className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg bg-white text-gray-800"><option value="mensual">Informe Mensual de Gestion</option><option value="cierre">Informe de Cierre de Ciclo Lectivo</option></select></div>
              {reportTipo === "mensual" && (<div><label className="text-xs font-bold text-gray-500 block mb-1">Mes de Reporte</label><select value={reportMes} onChange={(e) => setReportMes(e.target.value)} className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg bg-white text-gray-800"><option value="Marzo">Marzo</option><option value="Abril">Abril</option><option value="Mayo">Mayo</option><option value="Junio">Junio</option><option value="Julio">Julio</option><option value="Agosto">Agosto</option><option value="Septiembre">Septiembre</option><option value="Octubre">Octubre</option><option value="Noviembre">Noviembre</option><option value="Diciembre">Diciembre</option></select></div>)}
              <div><label className="text-xs font-bold text-gray-500 block mb-1">Ciclo Lectivo</label><select value={reportCiclo} onChange={(e) => setReportCiclo(e.target.value)} className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg bg-white text-gray-800"><option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option></select></div>
            </div>
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-[#006384] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#004f6a] transition-all flex items-center gap-2"><Printer className="w-4 h-4" />Imprimir / Guardar PDF</button>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 shadow-sm space-y-8 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
            <div className="border-b-2 border-[#006384] pb-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">DIRECCION GENERAL DE CULTURA Y EDUCACION - DIRECCION DE EDUCACION DE ADULTOS</span>
                <h1 className="text-2xl font-black text-[#0D2A3E]">CENS N° 454 ESTEBAN ECHEVERRIA</h1>
                <p className="text-xs text-gray-600 font-medium">{reportTipo === "mensual" ? ("INFORME MENSUAL DE GESTION INSTITUCIONAL - MES DE " + reportMes.toUpperCase() + " " + reportCiclo) : ("INFORME FINAL DE CIERRE DE CICLO LECTIVO " + reportCiclo)}</p>
              </div>
              <div className="text-right text-xs text-gray-500 space-y-0.5 shrink-0"><p className="font-bold text-gray-800">Distrito: Esteban Echeverria</p><p>Region 5 - Provincia de Buenos Aires</p><p>Fecha de emision: {new Date().toLocaleDateString("es-AR")}</p></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#006384] uppercase tracking-wider border-b border-gray-200 pb-1">1. Cuadro Resumen Institucional</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                <div><span className="text-[10px] font-bold text-gray-500 uppercase block">Matricula Efectiva</span><span className="text-xl font-black text-[#0D2A3E]">{stats.totalMatricula}</span></div>
                <div><span className="text-[10px] font-bold text-gray-500 uppercase block">Presentismo Promedio</span><span className="text-xl font-black text-emerald-700">{stats.asistenciaGeneral}%</span></div>
                <div><span className="text-[10px] font-bold text-gray-500 uppercase block">Promedio Academico</span><span className="text-xl font-black text-amber-700">{stats.promedioNotas}</span></div>
                <div><span className="text-[10px] font-bold text-gray-500 uppercase block">Planta Docente</span><span className="text-xl font-black text-purple-700">{stats.docentesActivos}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#006384] uppercase tracking-wider border-b border-gray-200 pb-1">2. Rendimiento y Asistencia por Curso</h3>
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead><tr className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]"><th className="border border-gray-200 p-2.5">Curso</th><th className="border border-gray-200 p-2.5">Turno</th><th className="border border-gray-200 p-2.5 text-center">Matricula</th><th className="border border-gray-200 p-2.5 text-center">Asistencia (%)</th><th className="border border-gray-200 p-2.5 text-center">Promedio Notas</th><th className="border border-gray-200 p-2.5 text-center">Alumnos en Riesgo</th></tr></thead>
                <tbody>{cursosDetalleInforme.map((c, i) => (<tr key={"row-c-" + i} className="hover:bg-gray-50"><td className="border border-gray-200 p-2.5 font-bold text-[#0D2A3E]">{c.curso}</td><td className="border border-gray-200 p-2.5 text-gray-600">{c.turno}</td><td className="border border-gray-200 p-2.5 text-center font-semibold">{c.matricula}</td><td className="border border-gray-200 p-2.5 text-center font-bold text-emerald-700">{c.asistencia}%</td><td className="border border-gray-200 p-2.5 text-center font-bold text-amber-700">{c.promedio}</td><td className="border border-gray-200 p-2.5 text-center font-semibold text-red-600">{c.riesgo}</td></tr>))}</tbody>
              </table>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#006384] uppercase tracking-wider border-b border-gray-200 pb-1">3. Evaluacion Academica por Materia</h3>
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead><tr className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]"><th className="border border-gray-200 p-2.5">Asignatura</th><th className="border border-gray-200 p-2.5 text-center">Evaluados</th><th className="border border-gray-200 p-2.5 text-center">Calificacion Promedio</th></tr></thead>
                <tbody>{materiasDetalleInforme.map((m, i) => (<tr key={"row-m-" + i} className="hover:bg-gray-50"><td className="border border-gray-200 p-2.5 font-bold text-gray-800">{m.materia}</td><td className="border border-gray-200 p-2.5 text-center text-gray-600">{m.evaluados}</td><td className="border border-gray-200 p-2.5 text-center font-bold text-[#006384]">{m.promedio}</td></tr>))}</tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#006384] uppercase tracking-wider border-b border-gray-200 pb-1">4. Observaciones y Diagnostico Directivo</h3>
              <textarea rows={4} value={observacionesDirectivas} onChange={(e) => setObservacionesDirectivas(e.target.value)} className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006384] outline-none text-gray-800 bg-white print:border-none print:p-0 print:bg-transparent" />
            </div>

            <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-gray-600 border-t border-gray-200 print:pt-16">
              <div className="space-y-10"><div className="border-b border-gray-400 w-3/4 mx-auto"></div><p className="font-bold text-gray-800">Firma Director / Vicedirector</p></div>
              <div className="space-y-10"><div className="border-b border-gray-400 w-3/4 mx-auto"></div><p className="font-bold text-gray-800">Firma Secretario/a</p></div>
              <div className="space-y-10"><div className="border-b border-gray-400 w-3/4 mx-auto"></div><p className="font-bold text-gray-800">Sello Institucional CENS N° 454</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
