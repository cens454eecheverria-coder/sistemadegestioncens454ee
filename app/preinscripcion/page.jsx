"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { School, Send, CheckCircle2, User, Phone, Mail, MapPin, GraduationCap } from 'lucide-react';

export default function PreinscripcionPublicaPage() {
  const [dni, setDni] = useState('');
  const [cuil, setCuil] = useState('');
  const [apellido, setApellido] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [orientacion, setOrientacion] = useState('Ciencias Sociales');
  const [turno, setTurno] = useState('Noche');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const record = {
        dni: dni.trim().replaceAll('.', ''),
        cuil: cuil.trim(),
        apellido: apellido.trim(),
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        orientacion_interes: orientacion,
        turno_preferido: turno,
        observaciones: observaciones.trim(),
        estado: 'pendiente',
      };

      const { error } = await supabase.from('preinscripciones').insert(record);
      if (error) throw error;

      setSuccess(true);
      Swal.fire({
        icon: 'success',
        title: '¡Preinscripción Recibida!',
        text: 'Tu solicitud de ingreso al CENS 454 ha sido registrada correctamente. El equipo de preceptoría se contactará contigo.',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Preinscripción',
        text: err.message || 'No se pudo enviar el formulario. Intenta nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="card shadow-2xl overflow-hidden border border-gray-200">
        {/* Header Formulario */}
        <div className="bg-gradient-to-r from-[#0D2A3E] via-[#006384] to-[#0B7EA5] p-8 text-white text-center space-y-3">
          <img
            src="/logo.png"
            alt="Logo CENS 454"
            className="w-20 h-20 mx-auto object-contain bg-white/10 p-2 rounded-2xl border border-[#F5C442]/60 shadow-lg"
          />
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading">
            Preinscripción Ingreso CENS N° 454
          </h1>
          <p className="text-xs text-[#F5C442] font-semibold tracking-wide uppercase">
            Educación Secundaria de Adultos - Esteban Echeverría (Región 5)
          </p>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-[#0D2A3E]">
              ¡Solicitud Enviada con Éxito!
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Muchas gracias por preinscribirte en el CENS 454 de Esteban Echeverría. Tu solicitud ha sido ingresada y se encuentra en proceso de revisión por preceptoría.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setDni('');
                setApellido('');
                setNombre('');
              }}
              className="btn-primary font-bold text-xs py-2.5 px-6"
            >
              Completar otra Preinscripción
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 leading-relaxed">
              📌 <strong>Requisitos de Ingreso:</strong> Tener 18 años cumplidos o más y contar con primaria completa o secundario incompleto.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DNI del Aspirante *</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 38492011"
                  className="field-soft font-semibold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CUIL (Opcional)</label>
                <input
                  type="text"
                  value={cuil}
                  onChange={(e) => setCuil(e.target.value)}
                  placeholder="Ej: 20-38492011-4"
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="field-soft text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="field-soft text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono WhatsApp de Contacto *</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 11-4920-1122"
                  className="field-soft text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuemail@gmail.com"
                  className="field-soft text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Orientación de Interés *</label>
                <select
                  value={orientacion}
                  onChange={(e) => setOrientacion(e.target.value)}
                  className="field-soft font-semibold text-xs"
                >
                  <option value="Ciencias Sociales">Ciencias Sociales</option>
                  <option value="Perito Mercantil / Administración">Perito Mercantil / Administración</option>
                  <option value="Ciencias Naturales y Salud">Ciencias Naturales y Salud</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Turno Preferido *</label>
                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="field-soft font-semibold text-xs"
                >
                  <option value="Noche">Turno Noche</option>
                  <option value="Tarde">Turno Tarde</option>
                  <option value="Mañana">Turno Mañana</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Observaciones / Nivel de Estudio Alcanzado:
              </label>
              <textarea
                rows="2"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Indicar si tenés certificado de primaria o materias aprobadas de secundario..."
                className="field-soft text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-gold font-bold text-sm py-3 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enviando Formulario...' : 'Enviar Solicitud de Preinscripción'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
