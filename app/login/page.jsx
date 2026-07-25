"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { ShieldAlert, UserCheck, GraduationCap, BookOpen, Lock, Mail, CreditCard, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginStaff, loginProfesor, loginEstudiante } = useAuth();

  const [activeTab, setActiveTab] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cuil, setCuil] = useState("");
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
    setCuil("");
    setDni("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === "admin") {
        if (!email.trim() || !password) {
          Swal.fire("Atenci?n", "Ingrese su correo institucional y contrase?a de Directivo.", "warning");
          setLoading(false);
          return;
        }
        await loginStaff(email.trim(), password);
        Swal.fire({ icon: "success", title: "Bienvenido Equipo Directivo", text: "Accediendo al Panel de Control CENS 454...", timer: 1500, showConfirmButton: false });
        router.push("/dashboard");
      } else if (activeTab === "preceptor") {
        if (!email.trim() || !password) {
          Swal.fire("Atenci?n", "Ingrese su correo institucional y contrase?a de Preceptor?a.", "warning");
          setLoading(false);
          return;
        }
        await loginStaff(email.trim(), password);
        Swal.fire({ icon: "success", title: "Bienvenida Preceptor?a", text: "Accediendo al Panel de Presentismo...", timer: 1500, showConfirmButton: false });
        router.push("/preceptores");
      } else if (activeTab === "profesor") {
        if (!cuil.trim()) {
          Swal.fire("Atenci?n", "Ingrese su n?mero de CUIL o DNI docente.", "warning");
          setLoading(false);
          return;
        }
        const loggedUser = await loginProfesor(cuil.trim());
        Swal.fire({ icon: "success", title: "Portal Docente", text: `Bienvenido/a ${loggedUser.nombre}`, timer: 1500, showConfirmButton: false });
        router.push("/docentes");
      } else if (activeTab === "estudiante") {
        if (!dni.trim()) {
          Swal.fire("Atenci?n", "Ingrese su n?mero de DNI de estudiante.", "warning");
          setLoading(false);
          return;
        }
        await loginEstudiante(dni.trim());
        Swal.fire({ icon: "success", title: "Consulta de Bolet?n", text: "Accediendo a sus calificaciones...", timer: 1500, showConfirmButton: false });
        router.push("/estudiantes");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error de Ingreso", text: err.message || "No se pudo iniciar sesi?n. Verifique las credenciales." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="card shadow-xl overflow-hidden border border-gray-200 rounded-2xl bg-white">
        <div className="bg-gradient-to-r from-[#0D2A3E] to-[#006384] p-6 text-white text-center space-y-2">
          <img src="/logo.png" alt="Logo CENS 454" className="w-16 h-16 mx-auto object-contain bg-white/10 p-1.5 rounded-xl border border-[#F5C442]/50 shadow-md" />
          <h2 className="text-xl font-bold font-heading">Acceso al Sistema CENS 454</h2>
          <p className="text-xs text-gray-200 font-medium">Esteban Echeverr?a (Regi?n 5)</p>
        </div>

        {/* Pesta?as de Selecci?n de Rol */}
        <div className="grid grid-cols-4 border-b border-gray-200 text-xs font-bold text-center bg-gray-50">
          <button
            type="button"
            onClick={() => handleTabSelect("admin")}
            className={"py-3.5 px-1 border-b-2 transition-all flex flex-col items-center gap-1 " + (activeTab === "admin" ? "border-[#006384] text-[#006384] bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Directivo</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect("preceptor")}
            className={"py-3.5 px-1 border-b-2 transition-all flex flex-col items-center gap-1 " + (activeTab === "preceptor" ? "border-[#006384] text-[#006384] bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Preceptor</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect("profesor")}
            className={"py-3.5 px-1 border-b-2 transition-all flex flex-col items-center gap-1 " + (activeTab === "profesor" ? "border-[#006384] text-[#006384] bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span>Profesor</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect("estudiante")}
            className={"py-3.5 px-1 border-b-2 transition-all flex flex-col items-center gap-1 " + (activeTab === "estudiante" ? "border-[#006384] text-[#006384] bg-white shadow-xs" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Estudiante</span>
          </button>
        </div>

        {/* Formulario Din?mico */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === "admin" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Ingreso para <strong>Equipo Directivo</strong> autenticado formalmente.</span>
            </div>
          )}

          {activeTab === "preceptor" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ingreso para <strong>Cuerpo de Preceptores</strong>.</span>
            </div>
          )}

          {activeTab === "profesor" && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Portal para <strong>Docentes / Profesores</strong> del CENS.</span>
            </div>
          )}

          {activeTab === "estudiante" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Consulta p?blica de <strong>Bolet?n y Calificaciones</strong> por DNI.</span>
            </div>
          )}

          {/* Campos para Directivo y Preceptor */}
          {(activeTab === "admin" || activeTab === "preceptor") && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electr?nico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@cens454.edu.ar"
                    className="field-soft pl-9 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contrase?a</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="????????"
                    className="field-soft pl-9 text-xs font-semibold"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Campo para Profesor */}
          {activeTab === "profesor" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">N?mero de CUIL / DNI Docente *</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={cuil}
                  onChange={(e) => setCuil(e.target.value)}
                  placeholder="Ej: 20-12345678-9 o DNI"
                  className="field-soft pl-9 text-xs font-bold"
                  required
                />
              </div>
            </div>
          )}

          {/* Campo para Estudiante */}
          {activeTab === "estudiante" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">N?mero de DNI Estudiante *</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 38492011"
                  className="field-soft pl-9 text-xs font-bold"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-xs py-3 font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all bg-[#006384] text-white rounded-xl"
          >
            {loading ? "Verificando..." : "Ingresar al Sistema"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
