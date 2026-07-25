"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cicloLectivo, setCicloLectivo] = useState("2026");
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("cens454_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

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
        throw new Error("El CUIL o DNI ingresado (" + cuilVal + ") no se encuentra registrado en el cuerpo docente de la institución.");
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
        throw new Error("El DNI ingresado (" + dniVal + ") no corresponde a ningún estudiante inscripto en el CENS 454.");
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

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("cens454_user");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    router.push("/login");
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