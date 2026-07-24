# Diseño: Mejora en la Gestión, Desinscripción y Transferencia de Alumnos

Este documento especifica el diseño para mejorar la administración de estudiantes dentro de **ProfeApp**, permitiendo quitar alumnos de un curso específico (desinscribir) y transferirlos entre materias, sin que esto implique eliminarlos por completo de la aplicación (salvo cuando explícitamente se requiera).

---

## 1. Requerimientos y Reglas de Negocio

### Desinscripción (Quitar del Curso actual)
*   **Comportamiento Actual:** El botón "Eliminar Seleccionados" borra al alumno de la tabla principal `alumnos`, lo que elimina en cascada todas sus notas, asistencias e inscripciones en todos los cursos de la aplicación.
*   **Nuevo Comportamiento:** 
    *   La selección por checklist en la gestión de un curso solo modificará la pertenencia de los alumnos a ese curso en específico.
    *   Al presionar "Quitar del Curso", se eliminarán las filas de la tabla intermedia `alumnos_cursos` correspondientes a los alumnos seleccionados y al curso que se está gestionando.
    *   Los registros de los alumnos en la tabla `alumnos` permanecerán intactos, conservando sus datos y notas en otros cursos de la aplicación.
    *   Se mantendrá una opción de borrado permanente global, pero únicamente de forma individual dentro de la edición de cada alumno y con una advertencia severa.

### Transferencia (Mover de Curso)
*   **Comportamiento Nuevo:** Permite al docente mover un alumno inscrito en el curso A directamente al curso B.
*   **Lógica de Negocio:**
    *   Se implementará desde el modal (drawer) de edición individual de cada alumno.
    *   Se presentará un selector de cursos que excluirá el curso que se está visualizando actualmente.
    *   Al confirmar la transferencia, el sistema realizará dos operaciones:
        1.  Eliminar la relación de `alumnos_cursos` para el curso origen.
        2.  Insertar una nueva fila en `alumnos_cursos` con el curso destino seleccionado.
    *   Las notas y asistencias acumuladas en el curso de origen se mantendrán registradas en la base de datos (evitando pérdida accidental por si se vuelve a inscribir), pero el alumno dejará de aparecer en las listas de asistencia y planillas de calificaciones del curso de origen, apareciendo en su lugar en el curso destino.

---

## 2. Cambios en la Interfaz de Usuario (UI)

### Lista de Gestión de Alumnos (`notas.html`)
*   **Botón de Acción:**
    *   Modificar el botón con ID `btn-eliminar-seleccionados`.
    *   **Etiqueta:** Cambiar de "Eliminar Seleccionados" a **"Quitar del Curso"**.
    *   **Icono:** Mantener `fa-user-minus` o ajustar su color a un tono secundario/advertencia en lugar de rojo destructivo (danger), para denotar que no es un borrado completo.

### Modal de Edición de Alumno (`modal-editar-alumno`)
*   Se añadirán elementos dentro del body del drawer (`notas.html`):
    1.  **Selector de Cursos para Transferencia:**
        ```html
        <div class="form-group-modal" id="grupo-mover-curso" style="margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
            <label><i class="fas fa-exchange-alt"></i> Mover a otro curso</label>
            <select id="edit-alumno-mover-curso">
                <option value="">Seleccione curso destino...</option>
            </select>
            <button type="button" id="btn-mover-alumno-curso" class="btn btn-warning" style="width: 100%; margin-top: 0.5rem;">
                <i class="fas fa-exchange-alt"></i> Mover a este Curso
            </button>
        </div>
        ```
    2.  **Botón de Desinscripción Individual:**
        ```html
        <div style="margin-top: 1rem;">
            <button id="btn-quitar-alumno-curso" class="btn btn-secondary" style="width: 100%;">
                <i class="fas fa-user-minus"></i> Quitar del curso actual
            </button>
        </div>
        ```
    3.  **Botón de Eliminación Permanente:**
        *   Modificar el botón existente (`btn-eliminar-alumno`).
        *   **Etiqueta:** Cambiar de "Eliminar Alumno" a **"Eliminar permanentemente de la aplicación"**.

---

## 3. Integración y Persistencia (Supabase)

### Operación: Quitar Alumnos Seleccionados del Curso
Se realiza un borrado de la tabla de unión `alumnos_cursos` filtrando por el curso actual y la lista de IDs seleccionados.

```javascript
const { error } = await supabase
    .from('alumnos_cursos')
    .delete()
    .eq('id_curso', cursoActual.id)
    .in('id_alumno', selectedIds);
```

### Operación: Mover Alumno a otro Curso
Se desinscribe del curso actual e inscribe en el curso destino.

```javascript
// 1. Quitar del curso actual
const { error: deleteError } = await supabase
    .from('alumnos_cursos')
    .delete()
    .eq('id_alumno', alumnoId)
    .eq('id_curso', cursoActual.id);

if (deleteError) throw deleteError;

// 2. Agregar al nuevo curso
const { error: insertError } = await supabase
    .from('alumnos_cursos')
    .insert({
        id_alumno: alumnoId,
        id_curso: targetCursoId
    });

if (insertError) throw insertError;
```

### Operación: Eliminar Alumno permanentemente
Se mantiene el borrado directo de la tabla `alumnos`, que debido a la restricción `ON DELETE CASCADE` de PostgreSQL, eliminará todas las relaciones en las tablas hijas (`alumnos_cursos`, `notas`, `asistencia`, etc.) para este usuario.
