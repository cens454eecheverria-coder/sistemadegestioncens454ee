import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export function generateAnexo4Docx({ curso, mes, anio, alumnos, asistenciasResumen }) {
  // Genera un documento con la estructura oficial del Anexo 4 DGCyE
  const content = `
====================================================================
ANEXO 4: PLANILLA OFICIAL DE CALIFICACIONES Y ASISTENCIA
CENS N?° 454 - ESTEBAN? ECHEVERRÍA (REGIÓN? 5)
====================================================================

CURSO / ORIENTACIÓN: ${curso.orientacion || 'Ciencias Sociales'} (${curso.anio}° ${curso.division} - Turno ${curso.turno})
PERÍODO: ${mes} / ${anio}

--------------------------------------------------------------------
N°  | APELIDO Y NOMBRE             | DNI        | PRES | AUS | JUST | M.FALTA | TOTAL FALTAS
--------------------------------------------------------------------
${alumnos.map((a, idx) => {
  const stat = asistenciasResumen[a.id] || { presentes: 0, ausentes: 0, justificados: 0, mediasFaltas: 0, totalComputable: 0 };
  return `${(idx + 1).toString().padEnd(3)} | ${(`${a.apellido}, ${a.nombre}`).padEnd(28)} | ${a.dni.padEnd(10)} | ${stat.presentes.toString().padEnd(4)} | ${stat.ausentes.toString().padEnd(3)} | ${stat.justificados.toString().padEnd(4)} | ${stat.mediasFaltas.toString().padEnd(7)} | ${stat.totalComputable.toFixed(1)}`;
}).join('\n')}
--------------------------------------------------------------------

Firma Preceptor/a: _______________________    Firma Directivo/a: _______________________
Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Anexo4_CENS454_${curso.anio}${curso.division}_${mes}_${anio}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateAnexo5Docx({ resumenTurnos }) {
  const content = `
====================================================================
ANEXO 5: REGISTRO DE RESUMEN? TRIMESTRAL / CUATRIMESTRAL
CENS N?° 454 - ESTEBAN? ECHEVERRÍA
====================================================================

Distrito: Esteban Echeverría | Región: 5
Fecha: ${new Date().toLocaleDateString('es-AR')}

RESUMEN? POR TURNO:
--------------------------------------------------------------------
Turno Mañana:  ${resumenTurnos.Manana || 0} estudiantes activos
Turno Tarde:   ${resumenTurnos.Tarde || 0} estudiantes activos
Turno Noche:   ${resumenTurnos.Noche || 0} estudiantes activos
--------------------------------------------------------------------
TOTAL MATRÍCULA CENS 454: ${(resumenTurnos.Manana || 0) + (resumenTurnos.Tarde || 0) + (resumenTurnos.Noche || 0)} Alumnos.

Sello y Firma Secretaría CENS 454: _______________________
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Anexo5_ResumenOficial_CENS454_${new Date().getFullYear()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
