"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cicloLectivo, setCicloLectivo] = useState('2026');
  const router = useRouter();

  useEffect(() => {
    // Check initial user from localStorage or Supabase session
    const savedUser = localStorage.getItem('cens454_user');
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

    if (roleType === 'admin' || roleType === 'preceptor') {
      const { email, password } = credentials;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        throw error;
      }
      const isDirectivo = email.includes('admin');
      userData = {
        id: data.user.id,
        email: data.user.email,
        nombre: isDirectivo ? 'Director/Secretaría CENS 454' : 'Preceptoría CENS 454',
        role: isDirectivo ? 'admin' : 'preceptor',
      };
    } else if (roleType === 'profesor') {
      userData = {
        id: 'docente_temp_id',
        nombre: `Prof. ${credentials.cuil || 'Docente'}`,
        role: 'profesor',
        cuil: credentials.cuil,
      };
    } else if (roleType === 'estudiante') {
      userData = {
        id: 'estudiante_temp_id',
        nombre: `Estudiante (DNI ${credentials.dni})`,
        role: 'estudiante',
        dni: credentials.dni,
      };
    }

    if (userData) {
      setUser(userData);
      localStorage.setItem('cens454_user', JSON.stringify(userData));
      if (userData.role === 'admin') router.push('/dashboard');
      else if (userData.role === 'preceptor') router.push('/preceptores');
      else if (userData.role === 'profesor') router.push('/docentes');
      else router.push('/estudiantes');
    }
    setLoading(false);
    return userData;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('cens454_user');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    // REDIRECCIÓN AUTOMÁTICA A LOGIN
    router.push('/login');
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
