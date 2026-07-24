# Diseño: Cálculo y Gestión de Notas Finales e Intensificaciones

Este documento especifica el diseño para la automatización del cálculo de las notas finales de cuatrimestre y de la materia en **ProfeApp**, incorporando además el procesamiento de los periodos de intensificación/recuperación.

---

## 1. Requerimientos y Reglas de Negocio

### Cálculo de Cuatrimestres (C1 y C2)
*   **Origen de datos:** Notas parciales registradas en la tabla `notas` asociadas a evaluaciones con `tipo_nota = 'cuatrimestre'` y `periodo` igual a `cuatrimestre1` o `cuatrimestre2`.
*   **Fórmula:** Promedio aritmético simple de las notas numéricas del alumno en el periodo correspondiente.
*   **Redondeo:** Hacia arriba a partir de `.50` (ej: `6.50` redondea a `7`, `6.49` redondea a `6`). Implementado con `Math.round(promedio)`.

### Procesamiento de Intensificaciones (Recuperatorios)
*   Las notas de intensificación se extraen de evaluaciones con `tipo_nota = 'intensificacion_recuperacion'` y periodos como `intensificacion_julio`, `intensificacion_agosto`, `intensificacion_diciembre`, `intensificacion_febrero`.
*   **Mitad de Año (Julio / Agosto):** Se aplican para recuperar el **1° Cuatrimestre**. Si `C1 < 7` (nota de aprobación), la calificación de intensificación reemplaza la nota original de `C1` en el cálculo (siempre que la mejore).
*   **Fin de Año (Diciembre / Febrero):** Si se registra una nota en estos periodos, **esta calificación reemplaza directamente la Nota Final de la materia**, omitiendo el promedio cuatrimestral. Si existen calificaciones en ambos periodos, la más reciente (Febrero) tiene prioridad.

### Cálculo de la Nota Final de la Materia
*   **Caso regular (Sin intensificación de fin de año):** Promedio de `C1` y `C2` (con los reemplazos de Julio/Agosto aplicados de ser necesario), redondeado al entero más cercano con `Math.round()`.
*   **Caso intensificado (Fin de año):** Reemplazada directamente por la nota de `intensificacion_diciembre` o `intensificacion_febrero` si existen.

---

## 2. Cambios en la Interfaz de Usuario (UI)

Se agregará una tercera pestaña llamada **"Notas Finales"** dentro de la sección "Evaluaciones y Calificaciones" del dashboard de un curso (`src/pages/notas.html`):

*   **Pestañas (`notas.html`):**
    *   Pestaña "Evaluaciones"
    *   Pestaña "Rúbricas"
    *   Nueva pestaña: "Notas Finales" (con el ID de sección `#notas-finales-seccion`).
*   **Estructura de la Tabla (`#tabla-finales-body`):**
    *   **Alumno:** Nombre y apellido.
    *   **1° Cuat. (C1):** Input numérico editable pre-rellenado con el promedio calculado de `cuatrimestre1`.
    *   **2° Cuat. (C2):** Input numérico editable pre-rellenado con el promedio calculado de `cuatrimestre2`.
    *   **Recuperatorios Jul/Ago:** Visualización de las notas de intensificación del primer tramo.
    *   **Recuperatorios Dic/Feb:** Visualización de las notas de intensificación del segundo tramo.
    *   **Nota Final:** Input numérico editable pre-rellenado con la nota final calculada de la materia.
    *   **Estado:** Etiqueta visual indicando el estado del alumno:
        *   `Aprobado` (Nota Final >= 7) en verde.
        *   `A Intensificación` (Nota Final < 7) en rojo/naranja.
*   **Acciones:**
    *   Botón **"Guardar Calificaciones"**: Realiza el volcado de la grilla en la base de datos.

---

## 3. Integración y Persistencia (Supabase)

Las notas finales calculadas o ajustadas manualmente se guardarán en la tabla `notas_finales`:

*   **Esquema de la tabla `notas_finales`:**
    *   `id_curso` (FK)
    *   `id_alumno` (FK)
    *   `periodo` (puede ser `'cuatrimestre1'`, `'cuatrimestre2'` o `'anual'`)
    *   `calificacion_final` (texto con la nota)
    *   `user_id` (FK a auth.users, garantizando aislamiento por RLS)
*   **Operación de Base de Datos:**
    Se realiza un `upsert` masivo asociando las claves compuestas únicas `(id_curso, id_alumno, periodo)` para evitar registros duplicados.

```javascript
const { error } = await supabase
    .from('notas_finales')
    .upsert(payload, { onConflict: 'id_curso,id_alumno,periodo' });
```
