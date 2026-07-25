import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function generateAnexo4SalidaDocx(data) {
  try {
    const response = await fetch('/templates/ANEXO 4 - -IF-2024-35029395-GDEBA-CGCYEDGCYE.docx');
    const buffer = await response.arrayBuffer();

    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const total = (parseInt(data.cantAlumnos) || 0) + (parseInt(data.cantDocentes) || 1) + (parseInt(data.cantNoDocentes) || 0);

    doc.render({
      distrito: data.distrito || 'Esteban Echeverr?a',
      institucion: data.institucion || 'CENS',
      numero: data.numero || '454',
      domicilio: data.domicilio || 'Av. Pedro Dreyer 1234',
      telefono: data.telefono || '11-4290-0000',
      proyecto: data.proyecto || 'Salida Educativa Institucional',
      lugar: data.lugar || 'Destino Educativo',
      fechaSalida: data.fechaSalida || new Date().toLocaleDateString('es-AR'),
      horaSalida: data.horaSalida || '08:00 hs',
      lugarSalida: data.lugarSalida || 'Sede CENS N?? 454',
      fechaRegreso: data.fechaRegreso || new Date().toLocaleDateString('es-AR'),
      horaRegreso: data.horaRegreso || '18:00 hs',
      lugarRegreso: data.lugarRegreso || 'Sede CENS N?? 454',
      obsFechas: data.obsFechas || 'Sujeto a condiciones clim?ticas favorables',
      itinerario: data.itinerario || 'Recorrido pedag?gico seg?n plan de estudios.',
      actividades: data.actividades || 'Actividades de campo y producci?n de informe.',
      objetivos: data.objetivos || 'Fomentar el conocimiento directo y la integraci?n.',
      cronograma: data.cronograma || 'Jornada escolar de salida educativa.',
      tit1Nombre: data.tit1Nombre || 'Docente Responsable',
      tit1Cargo: data.tit1Cargo || 'Profesor/a Titular',
      cantAlumnos: (data.cantAlumnos || 0).toString(),
      cantDocentes: (data.cantDocentes || 1).toString(),
      cantNoDocentes: (data.cantNoDocentes || 0).toString(),
      totalPersonas: total.toString(),
      lugarFecha: 'Esteban Echeverr?a, ' + new Date().toLocaleDateString('es-AR'),
      autoridad: 'Direcci?n CENS N?? 454'
    });

    const outBuf = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(outBuf);
    const safeName = (data.proyecto || 'Salida').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = 'ANEXO_4_Salida_' + safeName + '.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error al generar Anexo 4 DOCX:', err);
    throw err;
  }
}

export async function generateAnexo5SalidaDocx(data) {
  try {
    const response = await fetch('/templates/ANEXO 5 - IF-2024-35029666-GDEBA-CGCYEDGCYE (3).docx');
    const buffer = await response.arrayBuffer();

    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const alumnosList = (data.alumnos || []).map((a, idx) => ({
      n: idx + 1,
      nombre: (a.apellido || '') + ', ' + (a.nombre || ''),
      dni: a.dni || '-',
      esEstudiante: a.rol === 'docente' || a.rol === 'nodocente' ? '' : 'X',
      esDocente: a.rol === 'docente' ? 'X' : '',
      esNoDocente: a.rol === 'nodocente' ? 'X' : '',
      asistencia: a.asistencia || 'P'
    }));

    doc.render({
      institucion: 'CENS N?? 454',
      distrito: 'Esteban Echeverr?a',
      lugar: data.lugar || 'Destino Educativo',
      fecha: data.fechaSalida || new Date().toLocaleDateString('es-AR'),
      lugarFecha: 'Esteban Echeverr?a, ' + new Date().toLocaleDateString('es-AR'),
      alumnos: alumnosList
    });

    const outBuf = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(outBuf);
    const safeName = (data.proyecto || 'Salida').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = 'ANEXO_5_Asistencia_' + safeName + '.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error al generar Anexo 5 DOCX:', err);
    throw err;
  }
}
