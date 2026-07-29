"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

const AuthContext = createContext();

// Tiempo de inactividad por defecto: 15 minutos (900,000 milisegundos)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cicloLectivo, setCicloLectivo] = useState("2026");
  const router = useRouter();
  const inactivityTimerRef = useRef(null);

  const logout = useCallback(async (reason = null) => {
    setUser(null);
    localStorage.removeItem("cens454_user");
    localStorage.removeItem("cens454_last_activity");

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut notice:", e);
    }

    if (reason === "inactivity") {
      Swal.fire({
        icon: "warning",
        title: "Sesión Finalizada",
        text: "Tu sesión ha caducado autom?ticamente por inactividad (15 minutos) para resguardar la seguridad y conexi?n institucional.",
        confirmButtonColor: "#006384",
        confirmButtonText: "Entendido",
      });
    }

    router.push("/login");
  }, [router]);

  // Restablecer el temporizador de inactividad al detectar interacción del usuario
  const resetInactivityTimer = useCallback(() => {
    if (!user) return;

    const now = Date.now();
    localStorage.setItem("cens454_last_activity", now.toString());

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      logout("inactivity");
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, logout]);

  // 1. Cargar usuario inicial y validar si la ?ltima actividad venci?
  useEffect(() => {
    const savedUser = localStorage.getItem("cens454_user");
    const savedLastActivity = localStorage.getItem("cens454_last_activity");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const lastActivityTime = savedLastActivity ? parseInt(savedLastActivity, 10) : 0;
        const now = Date.now();

        if (lastActivityTime && now - lastActivityTime > INACTIVITY_TIMEOUT_MS) {
          // La sesión venci? mientras la solapa estuvo cerrada o inactiva
          logout("inactivity");
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Error al restaurar sesión:", e);
      }
    }
    setLoading(false);
  }, [logout]);

  // 2. Escuchar eventos globales del navegador para renovar inactividad
  useEffect(() => {
    if (!user) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Iniciar temporizador
    resetInactivityTimer();

    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const login = async (roleType, credentials) => {
    setLoading(true);
    let userData = null;

    if (roleType === "admin" || roleType === "preceptor" || roleType === "staff") {
      const email = credentials.email || credentials;
      const password = credentials.password;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        throw error;
      }
      const isDirectivo = email.includes("admin");
      userData = {
        id: data.user.id,
        email: data.user.email,
        nombre: isDirectivo ? "Director/Secretaría CENS 454" : "Preceptoría CENS 454",
        role: isDirectivo ? "admin" : "preceptor",
      };
    } else if (roleType === "profesor" || roleType === "docente") {
      const cuilVal = typeof credentials === "object" ? credentials.cuil : credentials;
      if (!cuilVal || !cuilVal.trim()) {
        setLoading(false);
        throw new Error("Debe ingresar un número de CUIL o DNI.");
      }
      const cleanCuil = cuilVal.replace(/[^0-9]/g, "");
      let realDocente = null;
      const { data: dList } = await supabase.from("docentes").select("*");
      if (dList && dList.length > 0) {
        realDocente = dList.find((d) =>
          (d.cuil && d.cuil.replace(/[^0-9]/g, "") === cleanCuil) ||
          (d.dni && d.dni.replace(/[^0-9]/g, "") === cleanCuil)
        );
      }

      if (!realDocente) {
        setLoading(false);
        throw new Error("El CUIL o DNI ingresado (" + cuilVal + ") no se encuentra registrado en el cuerpo docente de la instituci?n.");
      }

      userData = {
        id: realDocente.id,
        nombre: "Prof. " + realDocente.apellido + ", " + realDocente.nombre,
        role: "profesor",
        cuil: realDocente.cuil || cuilVal,
        dni: realDocente.dni || cleanCuil,
        email: realDocente.email || "",
      };
    } else if (roleType === "estudiante") {
      const dniVal = typeof credentials === "object" ? credentials.dni : credentials;
      if (!dniVal || !dniVal.trim()) {
        setLoading(false);
        throw new Error("Debe ingresar un número de DNI de estudiante.");
      }
      const cleanDni = dniVal.replace(/[^0-9]/g, "");

      const { data: eList } = await supabase.from("estudiantes").select("*");
      let realEstudiante = null;
      if (eList && eList.length > 0) {
        realEstudiante = eList.find((e) => e.dni && e.dni.replace(/[^0-9]/g, "") === cleanDni);
      }

      if (!realEstudiante) {
        setLoading(false);
        throw new Error("El DNI ingresado (" + dniVal + ") no corresponde a ning?n estudiante inscripto en el CENS 454.");
      }

      userData = {
        id: realEstudiante.id,
        nombre: realEstudiante.apellido + ", " + realEstudiante.nombre,
        role: "estudiante",
        dni: realEstudiante.dni,
        curso_id: realEstudiante.curso_id || null,
        email: realEstudiante.email || "",
      };
    }

    if (userData) {
      setUser(userData);
      localStorage.setItem("cens454_user", JSON.stringify(userData));
      localStorage.setItem("cens454_last_activity", Date.now().toString());

      if (userData.role === "admin") router.push("/dashboard");
      else if (userData.role === "preceptor") router.push("/preceptores");
      else if (userData.role === "profesor") router.push("/docentes");
      else router.push("/estudiantes");
    }
    setLoading(false);
    return userData;
  };

  const loginStaff = async (email, password) => {
    return login("staff", { email, password });
  };

  const loginProfesor = async (cuil) => {
    return login("profesor", { cuil });
  };

  const loginDocente = async (cuil) => {
    return login("profesor", { cuil });
  };

  const loginEstudiante = async (dni) => {
    return login("estudiante", { dni });
  };

  const changeCicloLectivo = (nuevoCiclo) => {
    setCicloLectivo(nuevoCiclo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        cicloLectivo,
        login,
        loginStaff,
        loginProfesor,
        loginDocente,
        loginEstudiante,
        logout,
        changeCicloLectivo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
