"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { generateAnexo5Docx } from '@/lib/generateAnexoDocx';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileClock,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function DashboardPage() {
  const { cicloLectivo } = useAuth();

  const [stats, setStats] = useState({
    totalMatricula: 0,
    asistenciaGeneral: 100,
    alertasCriticas: 0,
    preinscripcionesPendientes: 0,
  });

  const [turnosData, setTurnosData] = useState([
    { name: 'Mañana', estudiantes: 0 },
    { name: 'Tarde', estudiantes: 0 },
    { name: 'Noche', estudiantes: 0 },
  ]);

  const [inasistenciasData, setInasistenciasData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [cicloLectivo]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Matrícula activa real
      const { count: countMatricula } = await supabase
        .from('estudiantes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo');

      // 2. Preinscripciones pendientes reales
      const { count: countPre } = await supabase
        .from('preinscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      // 3. Asistencias reales y alertas críticas (>= 10 faltas)
      const { data: asistencias } = await supabase
        .from('asistencias')
        .select('estudiante_id, estado, fecha');

      const faltasPorEstudiante = {};
      let totalTomas = 0;
      let presentes = 0;

      const mesFaltasMap = {};

      if (asistencias && asistencias.length > 0) {
        totalTomas = asistencias.length;
        asistencias.forEach((a) => {
          if (!faltasPorEstudiante[a.estudiante_id]) {
            faltasPorEstudiante[a.estudiante_id] = 0;
          }
          if (a.estado === 'A' || a.estado === 'ausente') {
            faltasPorEstudiante[a.estudiante_id] += 1;
            if (a.fecha) {
              const mesNombre = new Date(a.fecha + 'T00:00:00').toLocaleString('es-ES', { month: 'long' });
              const mesCapitalizado = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
              mesFaltasMap[mesCapitalizado] = (mesFaltasMap[mesCapitalizado] || 0) + 1;
            }
          } else if (a.estado === 'media_falta') {
            faltasPorEstudiante[a.estudiante_id] += 0.5;
          } else {
            presentes += 1;
          }
        });
      }

      const criticosCount = Object.values(faltasPorEstudiante).filter((val) => val >= 10).length;
      const pctAsistencia = totalTomas > 0 ? parseFloat(((presentes / totalTomas) * 100).toFixed(1)) : 100;

      // 4. Matrícula por Turno desde la base de datos
      const { data: cursosList } = await supabase.from('cursos').select('id, turno');
      const { data: alumnosCursos } = await supabase.from('alumnos_cursos').select('curso_id');

      const cursoTurnoMap = {};
      if (cursosList) {
        cursosList.forEach(c => { cursoTurnoMap[c.id] = c.turno || 'Noche'; });
      }

      let countManana = 0;
      let countTarde = 0;
      let countNoche = 0;

      if (alumnosCursos && alumnosCursos.length > 0) {
        alumnosCursos.forEach(ac => {
          const t = cursoTurnoMap[ac.curso_id] || 'Noche';
          if (t.toLowerCase().includes('mañana') || t.toLowerCase().includes('manana')) countManana++;
          else if (t.toLowerCase().includes('tarde')) countTarde++;
          else countNoche++;
        });
      } else if (countMatricula) {
        countNoche = countMatricula;
      }

      setTurnosData([
        { name: 'Mañana', estudiantes: countManana },
        { name: 'Tarde', estudiantes: countTarde },
        { name: 'Noche', estudiantes: countNoche },
      ]);

      const monthlyList = Object.keys(mesFaltasMap).map(mes => ({
        mes,
        faltas: mesFaltasMap[mes]
      }));
      setInasistenciasData(monthlyList);

      setStats({
        totalMatricula: countMatricula || 0,
        asistenciaGeneral: pctAsistencia,
        alertasCriticas: criticosCount,
        preinscripcionesPendientes: countPre || 0,
      });
    } catch (e) {
      console.error("Error al cargar dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleExportAnexo5 = () => {
    const manana = turnosData.find(t => t.name === 'Mañana')?.estudiantes || 0;
    const tarde = turnosData.find(t => t.name === 'Tarde')?.estudiantes || 0;
    const noche = turnosData.find(t => t.name === 'Noche')?.estudiantes || 0;

    generateAnexo5Docx({
      resumenTurnos: {
        Manana: manana,
        Tarde: tarde,
        Noche: noche,
      },
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0D2A3E]">
            Dashboard Directivo & Analítica Institucional
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Resumen estadístico y control general en tiempo real del CENS N?º 454.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#006384] text-xs font-bold px-3 py-2 rounded-xl border border-blue-100">
            <Calendar className="w-4 h-4" /> Ciclo Lectivo: {cicloLectivo}
          </div>
          <button
            onClick={handleExportAnexo5}
            className="btn-gold font-bold text-xs py-2.5 px-4 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Anexo 5 DOCX (Resumen)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center justify-between border-l-4 border-l-[#006384] bg-white shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Matrícula Activa</p>
            <h3 className="text-3xl font-extrabold font-heading text-[#0D2A3E] mt-1">{stats.totalMatricula}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Estudiantes inscriptos</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EEF5FA] text-[#006384] flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between border-l-4 border-l-emerald-500 bg-white shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Asistencia General</p>
            <h3 className="text-3xl font-extrabold font-heading text-emerald-700 mt-1">{stats.asistenciaGeneral}%</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">Presencia promedio</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between border-l-4 border-l-red-500 bg-white shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alertas Críticas</p>
            <h3 className="text-3xl font-extrabold font-heading text-red-600 mt-1">{stats.alertasCriticas}</h3>
            <p className="text-xs text-red-600 font-medium mt-1">Alumnos con ≥10 faltas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-6 flex items-center justify-between border-l-4 border-l-[#F5C442] bg-white shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preinscripciones</p>
            <h3 className="text-3xl font-extrabold font-heading text-[#0D2A3E] mt-1">{stats.preinscripcionesPendientes}</h3>
            <p className="text-xs text-amber-700 font-medium mt-1">Pendientes de revisión</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <FileClock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gráficos Estadísticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 1: Distribución por Turno */}
        <div className="card p-6 space-y-4 bg-white shadow-xs rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#006384]" />
              Matrícula por Turno (Mañana, Tarde, Noche)
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnosData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="estudiantes" fill="#006384" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Evolución de Inasistencias */}
        <div className="card p-6 space-y-4 bg-white shadow-xs rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-bold font-heading text-[#0D2A3E] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#006384]" />
              Evolución de Inasistencias Mensuales
            </h3>
          </div>
          <div className="h-72">
            {inasistenciasData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <p className="text-xs font-bold">Sin inasistencias registradas para este periodo.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inasistenciasData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="faltas" stroke="#F5C442" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}