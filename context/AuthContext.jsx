"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [cicloLectivo, setCicloLectivo] = useState(2026);
  const [cicloLectivoId, setCicloLectivoId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión inicial desde localStorage o Supabase Auth
    const savedUser = localStorage.getItem('cens454_user');
    const savedRole = localStorage.getItem('cens454_role');
    const savedCiclo = localStorage.getItem('cens454_ciclo');

    if (savedUser && savedRole) {
      try {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      } catch (e) {
        console.error(e);
      }
    }
    if (savedCiclo) {
      setCicloLectivo(parseInt(savedCiclo));
    }

    // Listener para cambios de estado en Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const email = session.user.email;
        let detectedRole = 'admin';
        let nombreDisplay = 'Equipo Directivo CENS 454';

        if (email === 'preceptor@cens454ee.com') {
          detectedRole = 'preceptor';
          nombreDisplay = 'Preceptoría CENS 454';
        } else if (email === 'administrador@cens454ee.com') {
          detectedRole = 'admin';
          nombreDisplay = 'Director/Secretaría CENS 454';
        }

        const userData = {
          id: session.user.id,
          email: session.user.email,
          nombre: nombreDisplay,
          role: detectedRole,
        };

        setUser(userData);
        setRole(detectedRole);
        localStorage.setItem('cens454_user', JSON.stringify(userData));
        localStorage.setItem('cens454_role', detectedRole);
      }
    });

    fetchCicloLectivo();
    setLoading(false);

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function fetchCicloLectivo() {
    try {
      const { data } = await supabase
        .from('ciclos_lectivos')
        .select('*')
        .eq('activo', true)
        .single();
      if (data) {
        setCicloLectivo(data.anio);
        setCicloLectivoId(data.id);
      }
    } catch (e) {
      console.warn('Usando ciclo lectivo 2026 por defecto');
    }
  }

  // 1. Admin / Preceptor Login (Supabase Auth)
  const loginStaff = async (emailInput, passwordInput, intendedRole) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    // Autenticación formal en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordInput,
    });

    if (!authError && authData?.user) {
      let finalRole = intendedRole;
      let nombreDisplay = intendedRole === 'admin' ? 'Director/Secretaría CENS 454' : 'Preceptoría CENS 454';

      if (cleanEmail === 'administrador@cens454ee.com') {
        finalRole = 'admin';
        nombreDisplay = 'Administrador Directivo CENS 454';
      } else if (cleanEmail === 'preceptor@cens454ee.com') {
        finalRole = 'preceptor';
        nombreDisplay = 'Preceptor CENS 454';
      }

      const userData = {
        id: authData.user.id,
        email: authData.user.email,
        nombre: nombreDisplay,
        role: finalRole,
      };

      setUser(userData);
      setRole(finalRole);
      localStorage.setItem('cens454_user', JSON.stringify(userData));
      localStorage.setItem('cens454_role', finalRole);
      return { success: true, user: userData };
    }

    throw new Error(authError?.message || 'Credenciales de Supabase Auth incorrectas para ' + cleanEmail);
  };

  // 2. Profesor Login via CUIL (sin contraseña)
  const loginProfesor = async (cuilOrDni) => {
    const cleanInput = cuilOrDni.trim().replaceAll('-', '');

    const { data } = await supabase
      .from('docentes')
      .select('*')
      .or(`dni.eq.${cleanInput},cuil.ilike.%${cleanInput}%`)
      .limit(1);

    if (data && data.length > 0) {
      const doc = data[0];
      const userData = {
        id: doc.id,
        dni: doc.dni,
        cuil: doc.cuil,
        nombre: `${doc.nombre} ${doc.apellido}`,
        email: doc.email,
        role: 'profesor',
      };
      setUser(userData);
      setRole('profesor');
      localStorage.setItem('cens454_user', JSON.stringify(userData));
      localStorage.setItem('cens454_role', 'profesor');
      return { success: true, user: userData };
    }

    const userData = {
      id: 'docente-demo-' + cleanInput,
      dni: cleanInput,
      cuil: cuilOrDni,
      nombre: `Prof. Docente (${cleanInput})`,
      role: 'profesor',
    };
    setUser(userData);
    setRole('profesor');
    localStorage.setItem('cens454_user', JSON.stringify(userData));
    localStorage.setItem('cens454_role', 'profesor');
    return { success: true, user: userData };
  };

  // 3. Estudiante Login via DNI (sin contraseña)
  const loginEstudiante = async (dni) => {
    const cleanDni = dni.trim().replaceAll('.', '');

    const { data } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('dni', cleanDni)
      .limit(1);

    if (data && data.length > 0) {
      const est = data[0];
      const userData = {
        id: est.id,
        dni: est.dni,
        cuil: est.cuil,
        nombre: `${est.nombre} ${est.apellido}`,
        email: est.email,
        role: 'estudiante',
      };
      setUser(userData);
      setRole('estudiante');
      localStorage.setItem('cens454_user', JSON.stringify(userData));
      localStorage.setItem('cens454_role', 'estudiante');
      return { success: true, user: userData };
    }

    const userData = {
      id: 'estudiante-dni-' + cleanDni,
      dni: cleanDni,
      nombre: `Estudiante (DNI ${cleanDni})`,
      role: 'estudiante',
    };
    setUser(userData);
    setRole('estudiante');
    localStorage.setItem('cens454_user', JSON.stringify(userData));
    localStorage.setItem('cens454_role', 'estudiante');
    return { success: true, user: userData };
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('cens454_user');
    localStorage.removeItem('cens454_role');
    await supabase.auth.signOut();
  };

  const changeCicloLectivo = (nuevoAnio) => {
    setCicloLectivo(nuevoAnio);
    localStorage.setItem('cens454_ciclo', nuevoAnio);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        cicloLectivo,
        cicloLectivoId,
        loading,
        loginStaff,
        loginProfesor,
        loginEstudiante,
        logout,
        changeCicloLectivo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
