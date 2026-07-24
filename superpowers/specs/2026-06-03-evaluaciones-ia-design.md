# Especificación de Diseño: Generador de Evaluaciones con IA

Este documento describe la especificación técnica para la incorporación de la funcionalidad de generación de evaluaciones mediante Inteligencia Artificial (Gemini) en **ProfeApp**.

---

## 1. Requerimientos del Sistema

La herramienta debe permitir a los docentes:
1. **Configurar la Evaluación**:
   - Seleccionar un **Curso** de los existentes en su base de datos.
   - Definir el **Tipo de Pregunta** (Desarrollo, Múltiple Opción, Verdadero/Falso, Mixta).
   - Definir la **Cantidad de Consignas** (1 a 20).
   - Definir la **Fecha de la Evaluación** manualmente (requerido).
   - Seleccionar el **Tipo de Registro en la Base de Datos** (Escrita o Trabajo Práctico).
   - Subir un **Archivo de Referencia** (texto plano, Markdown, o PDF) que sirva como contexto para las preguntas.
   - Escribir **Instrucciones / Temas adicionales** en un campo de texto libre.
   - Elegir si se incluye la **Hoja de Respuestas/Soluciones** (clave del docente).

2. **Generar la Evaluación**:
   - Consumir la API de Google Gemini (preferiblemente `gemini-2.5-flash`, `gemini-1.5-flash` o el modelo compatible más reciente disponible en la lista de modelos de la API Key del usuario).
   - Mostrar el resultado formateado en un editor en pantalla.

3. **Registrar y Sincronizar**:
   - Exportar a PDF y Google Drive.
   - Guardar en la base de datos de Supabase en la tabla `evaluaciones` (con tipo `'escrita'` o `'trabajos practicos'`).
   - Crear un evento en la tabla `eventos` (Agenda docente) sincronizado automáticamente para la fecha seleccionada.

---

## 2. Cambios en la Base de Datos

No se requieren nuevas tablas, pero utilizaremos las tablas existentes:

### Tabla `evaluaciones`
- Se insertará un registro con:
  - `user_id`: `auth.uid()` (del docente autenticado).
  - `id_curso`: ID del curso seleccionado.
  - `nombre`: Título generado de la evaluación.
  - `tipo`: `'escrita'` o `'trabajos practicos'` (según selección del docente).
  - `fecha`: Fecha seleccionada de la evaluación.

### Tabla `eventos` (Agenda)
- Se insertará un registro con:
  - `user_id`: `auth.uid()`.
  - `titulo`: `📝 Evaluación: [Título]` o `📝 TP: [Título]`.
  - `descripcion`: Resumen de las consignas generadas de la evaluación.
  - `fecha_hora_inicio`: `[Fecha Seleccionada]T08:00:00.000Z` (hora escolar por defecto).
  - `fecha_limite`: `[Fecha Seleccionada]T09:30:00.000Z` (duración estimada de 1.5 horas).
  - `tipo`: `'recordatorio'`.

---

## 3. Arquitectura del Frontend y Flujo de Interfaz

### Nueva Pestaña (Tab) en `src/pages/planificaciones.html`
- Botón en el contenedor de tabs:
  ```html
  <button class="tab-button" onclick="openTab(event, 'evaluacion-ia')">
      <i class="fas fa-file-signature"></i> Evaluación con IA
  </button>
  ```
- Sección de contenido:
  ```html
  <div id="evaluacion-ia" class="tab-content">
      <!-- Formulario con campos: Curso, Tipo Preguntas, Tipo Registro, Cantidad, Fecha, Archivo de referencia, Instrucciones Libres, Checkbox Soluciones -->
  </div>
  ```

### Lógica de Lectura de Archivos
- Se usará `FileReader` en JavaScript para leer archivos subidos.
- Para archivos de texto (`.txt`, `.md`, `.json`, etc.), se leerán como texto directamente.
- Para archivos PDF, se integrará de forma opcional y robusta una extracción de texto básica o se procesarán mediante la lectura en el cliente. Si es necesario, se importará la biblioteca `PDF.js` desde CDN en `planificaciones.html` para parsear el texto de cada página del PDF en el navegador.

### Envío a Gemini
Se extenderá `AIService.generatePlan` (o se creará un método `generateEvaluation` específico) en `src/js/ai_service.js`:
- El prompt incluirá las especificaciones (Materia, Curso, Tipo de preguntas, Cantidad, Contexto de archivo, Instrucciones) y solicitará un JSON específico con la estructura de la evaluación.

---

## 4. Plan de Verificación

### Pruebas de Interfaz
- Verificar que la nueva pestaña cargue correctamente.
- Comprobar que los cursos del docente se carguen dinámicamente en el dropdown.

### Pruebas de Generación con IA
- Generar una evaluación de tipo Múltiple Opción y verificar el formato de salida JSON.
- Generar una evaluación de tipo Desarrollo con archivo de referencia adjunto.

### Pruebas de Persistencia
- Guardar la evaluación y comprobar que se inserta correctamente en `evaluaciones` con el tipo seleccionado.
- Verificar que aparezca el correspondiente recordatorio en la grilla del calendario en `agenda.html`.
