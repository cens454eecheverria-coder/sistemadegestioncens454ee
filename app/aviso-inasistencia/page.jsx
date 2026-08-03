"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import Link from "next/link";
import { Search, UserCheck, Calendar, Clock, AlertTriangle, FileText, CheckCircle2, ArrowLeft, Shield, AlertCircle } from "lucide-react";

export default function AvisoInasistenciaPage() {
  const [identificador, setIdentificador] = useState("");
  const [docente, setDocente] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [tipoInasistencia, setTipoInasistencia] = useState("Licencia Médica");
  const [cantidadDias, setCantidadDias] = useState(1);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [materiasDocente, setMateriasDocente] = useState([]);

  // Auto-search teacher when DNI/CUIL reaches valid length
  useEffect(() => {
    const clean = identificador.trim().replace(/\D/g, "");
    if (clean.length >= 7) {
      const timer = setTimeout(() => {
        buscarDocente(clean);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setDocente(null);
      setSearchError("");
      setMateriasDocente([]);
    }
  }, [identificador]);

  const buscarDocente = async (queryClean) => {
    setSearching(true);
    setSearchError("");
    try {
      // Query docentes by DNI or CUIL
      const rawInput = identificador.trim();
      const { data, error } = await supabase
        .from("docentes")
        .select("*")
        .or("dni.eq." + queryClean + ",cuil.ilike.%" + rawInput + "%")
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const doc = data[0];
        setDocente(doc);
        setSearchError("");

        // Fetch assigned subjects for this teacher
        const { data: dmData } = await supabase
          .from("docente_materia")
          .select("*, materias(nombre, curso_id, cursos(anio, division, orientacion))")
          .eq("docente_id", doc.id);

        if (dmData) {
          const list = dmData.map((dm) => {
            const mat = dm.materias;
            const c = mat?.cursos;
            const cursoStr = c ? c.anio + "° " + c.division + " (" + (c.orientacion || "General") + ")" : "";
            return (mat?.nombre || "Materia") + (cursoStr ? " - " + cursoStr : "");
          });
          setMateriasDocente(list);
        }
      } else {
        setDocente(null);
        setSearchError("No se encontró ningún docente activo con el DNI/CUIL ingresado.");
      }
    } catch (err) {
      console.error("Error buscando docente:", err);
      setSearchError("Error al consultar la base de datos de docentes.");
    } finally {
      setSearching(false);
    }
  };

  const calcularFechaFin = (inicioStr, dias) => {
    if (!inicioStr) return "";
    const startDate = new Date(inicioStr + "T00:00:00");
    const numDias = parseInt(dias, 10) || 1;
    startDate.setDate(startDate.getDate() + (numDias - 1));
    return startDate.toISOString().split("T")[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!docente) {
      Swal.fire({
        icon: "warning",
        title: "Docente no identificado",
        text: "Por favor ingrese un DNI o CUIL válido de docente registrado en el CENS N° 454.",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }

    if (!fechaInicio) {
      Swal.fire("Atención", "Por favor seleccione la fecha de inicio de la inasistencia.", "warning");
      return;
    }

    const fechaFin = calcularFechaFin(fechaInicio, cantidadDias);

    setSubmitting(true);

    try {
      const payload = {
        docente_id: docente.id,
        tipo: tipoInasistencia,
        cantidad_dias: parseInt(cantidadDias, 10) || 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        observaciones: observaciones.trim() || null,
        estado: "Pendiente"
      };

      const { error } = await supabase.from("inasistencias_docentes").insert(payload);

      if (error) {
        if (error.code === "42P01" || (error.message && error.message.includes("inasistencias_docentes"))) {
          Swal.fire({
            icon: "warning",
            title: "Tabla de Inasistencias no creada",
            html: "La tabla <code>inasistencias_docentes</code> aún no fue creada en la base de datos de Supabase.<br><br>Por favor ejecute el script SQL <code>sql/create_inasistencias_docentes.sql</code> en el SQL Editor de su panel de Supabase.",
            confirmButtonColor: "#2563eb"
          });
          setSubmitting(false);
          return;
        }
        throw error;
      }

      let mensajeExtra = "";
      if (tipoInasistencia === "Causas Particulares") {
        mensajeExtra = "<br><br><strong style='color:#f59e0b;'>RECORDATORIO OBLIGATORIO:</strong> Debe enviar una nota de su puño y letra firmada al correo oficial de la institución solicitando la inasistencia.";
      }

      await Swal.fire({
        icon: "success",
        title: "¡Aviso Registrado Exitosamente!",
        html:
          "<div style='text-align:left; font-size:14px; background:#1e293b; color:#f8fafc; padding:15px; border-radius:10px; margin-top:10px;'>" +
          "<p><strong>Docente:</strong> " + docente.apellido + ", " + docente.nombre + "</p>" +
          "<p><strong>DNI:</strong> " + (docente.dni || "N/D") + "</p>" +
          "<p><strong>Tipo de Inasistencia:</strong> " + tipoInasistencia + "</p>" +
          "<p><strong>Cantidad de Días:</strong> " + cantidadDias + " día(s)</p>" +
          "<p><strong>Desde:</strong> " + fechaInicio + " <strong>Hasta:</strong> " + fechaFin + "</p>" +
          (observaciones ? "<p><strong>Observaciones:</strong> " + observaciones + "</p>" : "") +
          "</div>" +
          "<p style='margin-top:10px; color:#94a3b8;'>El equipo directivo y la preceptoría de la escuela han sido notificados adecuadamente.</p>" +
          mensajeExtra,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#2563eb"
      });

      // Reset form
      setObservaciones("");
      setCantidadDias(1);
      setFechaInicio(new Date().toISOString().split("T")[0]);
      setTipoInasistencia("Licencia Médica");
    } catch (err) {
      console.error("Error guardando inasistencia:", err.message || err.details || JSON.stringify(err));
      Swal.fire({
        icon: "error",
        title: "Error al registrar aviso",
        text: err.message || "Ocurrió un inconveniente al guardar el aviso en la base de datos."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header oficial CENS 454 */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg">
              454
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-lg leading-tight">CENS N° 454</h1>
              <p className="text-xs text-slate-400">Esteban Echeverría — Región 5</p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Acceso Institucional
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Form Title Header */}
          <div className="mb-8 border-b border-slate-800 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" /> Formulario Institucional Público
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Aviso de Inasistencia Docente
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Complete sus datos para informar oportunamente su ausencia a la dirección y preceptoría del CENS N° 454.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paso 1: Verificación de Docente por DNI / CUIL */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-200">
                1. Ingrese su DNI o CUIL <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="Ej: 20-38492011-4 o 38492011"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base font-mono transition"
                  required
                />
                <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-xs text-slate-400">
                El sistema autocompletará automáticamente sus datos institucionales al detectar su DNI/CUIL.
              </p>

              {searching && (
                <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                  <Clock className="w-4 h-4 animate-spin" /> Verificando datos del docente en el padrón del CENS...
                </div>
              )}

              {searchError && (
                <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {searchError}
                </div>
              )}

              {/* Docente verificado Card */}
              {docente && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 text-sm space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                      <UserCheck className="w-5 h-5" /> Docente Verificado
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                      Padrón CENS 454
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 text-xs block">Nombre y Apellido</span>
                      <strong className="text-slate-100">{docente.apellido}, {docente.nombre}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">DNI / CUIL</span>
                      <span>DNI {docente.dni || "N/D"} {docente.cuil ? " (CUIL: " + docente.cuil + ")" : ""}</span>
                    </div>
                    {docente.email && (
                      <div>
                        <span className="text-slate-500 text-xs block">Email Oficial</span>
                        <span>{docente.email}</span>
                      </div>
                    )}
                    {materiasDocente.length > 0 && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 text-xs block">Materias / Cursos a Cargo</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {materiasDocente.map((m, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2: Detalles de la inasistencia */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-slate-200">2. Detalles del Aviso de Inasistencia</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Inasistencia */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Tipo / Causa de Inasistencia <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={tipoInasistencia}
                    onChange={(e) => setTipoInasistencia(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base"
                    required
                  >
                    <option value="Licencia Médica">Licencia Médica</option>
                    <option value="Causas Particulares">Causas Particulares</option>
                    <option value="Capacitación / Comisión de Servicio">Capacitación / Comisión de Servicio</option>
                    <option value="Fuerza Mayor / Asunto Urgente">Fuerza Mayor / Asunto Urgente</option>
                  </select>
                </div>

                {/* Leyenda obligatoria para Causas Particulares */}
                {tipoInasistencia === "Causas Particulares" && (
                  <div className="sm:col-span-2 bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 text-amber-200 flex items-start gap-3 animate-fadeIn">
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-300 text-sm">REQUISITO OBLIGATORIO — CAUSAS PARTICULARES</h4>
                      <p className="text-sm text-amber-100/90 mt-1 leading-relaxed">
                        Debe enviarse una nota al correo oficial de la escuela de <strong>puño y letra</strong> solicitándola.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cantidad de Días */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Cantidad de Días <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={cantidadDias}
                    onChange={(e) => setCantidadDias(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base"
                    required
                  />
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Fecha de Inicio <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base"
                    required
                  />
                </div>

                {/* Fecha Fin Calculada */}
                <div className="sm:col-span-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Período proyectado de inasistencia:</span>
                  <strong className="text-slate-200 text-sm">
                    Desde {fechaInicio || "—"} hasta {calcularFechaFin(fechaInicio, cantidadDias) || "—"}
                  </strong>
                </div>

                {/* Observaciones */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Observaciones / Comentarios Adicionales (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Detalle cualquier aclaración respecto a las horas o cursos afectados..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !docente}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2 text-base ${
                  !docente || submitting
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/20"
                }`}
              >
                {submitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" /> Registrando Aviso...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Enviar Aviso de Inasistencia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer institutional */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        CENS N° 454 Esteban Echeverría — Sistema de Gestión Escolar Institucional
      </footer>
    </div>
  );
}
