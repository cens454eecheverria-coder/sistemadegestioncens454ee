# Gestión de Alumnos - Transferencia y Desinscripción Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al usuario desinscribir alumnos del curso actual (de forma masiva o individual) y transferir alumnos entre cursos (moverlos) de manera segura sin eliminarlos de la aplicación.

**Architecture:** Modificaciones en el frontend de Notas (`notas.html` y `notas.js`) utilizando consultas de Supabase sobre la tabla `alumnos_cursos` para gestionar la inscripción (inserción y eliminación de registros de vinculación) y poblando dinámicamente un selector en el modal de edición de alumnos para ejecutar la transferencia.

**Tech Stack:** Vanilla JS, Supabase Client (`@supabase/supabase-js`), HTML5, CSS.

---

### Task 1: Modificaciones de Interfaz de Usuario en `notas.html`

**Files:**
- Modify: `src/pages/notas.html:207-209, 458-486`

- [ ] **Step 1: Renombrar el botón de acción masiva para quitar alumnos**

  Cambiar el botón con id `btn-eliminar-seleccionados` de "Eliminar Seleccionados" a "Quitar del Curso", con un tono más claro/advertencia en lugar de destructivo si se desea, pero manteniendo su ID para compatibilidad.
  
  Buscar en `src/pages/notas.html`:
  ```html
  <button id="btn-eliminar-seleccionados" class="btn btn-danger">
      <i class="fas fa-user-minus"></i> Eliminar Seleccionados
  </button>
  ```
  Y cambiarlo por:
  ```html
  <button id="btn-eliminar-seleccionados" class="btn btn-warning">
      <i class="fas fa-user-minus"></i> Quitar del Curso
  </button>
  ```

- [ ] **Step 2: Añadir el selector de cursos y botones correspondientes al drawer de edición de alumno**

  Agregar el desplegable para elegir el curso de destino, el botón para moverlo y el botón para quitarlo del curso dentro del drawer con ID `modal-editar-alumno`.
  
  Buscar en `src/pages/notas.html`:
  ```html
              <div class="form-group-modal">
                  <label>Apellido</label>
                  <input type="text" id="edit-alumno-apellido" placeholder="Apellido">
              </div>
  
              <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem;">
                  <button id="btn-eliminar-alumno" class="btn btn-danger" style="width: 100%;">
                      <i class="fas fa-trash"></i> Eliminar Alumno permanentemente
                  </button>
              </div>
  ```
  Y cambiarlo por:
  ```html
              <div class="form-group-modal">
                  <label>Apellido</label>
                  <input type="text" id="edit-alumno-apellido" placeholder="Apellido">
              </div>

              <!-- Sección para mover de curso o desinscribir -->
              <div class="form-group-modal" id="grupo-mover-curso" style="margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
                  <label><i class="fas fa-exchange-alt"></i> Mover a otro curso</label>
                  <select id="edit-alumno-mover-curso" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem; border-radius: 4px; border: 1px solid #ccc;">
                      <option value="">Seleccione curso destino...</option>
                  </select>
                  <button type="button" id="btn-mover-alumno-curso" class="btn btn-warning" style="width: 100%; margin-top: 0.5rem;">
                      <i class="fas fa-exchange-alt"></i> Mover a este Curso
                  </button>
              </div>

              <div style="margin-top: 1rem;">
                  <button type="button" id="btn-quitar-alumno-curso" class="btn btn-secondary" style="width: 100%;">
                      <i class="fas fa-user-minus"></i> Quitar del curso actual
                  </button>
              </div>
  
              <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem;">
                  <button id="btn-eliminar-alumno" class="btn btn-danger" style="width: 100%;">
                      <i class="fas fa-trash"></i> Eliminar de la aplicación (todos los cursos)
                  </button>
              </div>
  ```

- [ ] **Step 3: Commitear cambios en la interfaz**

  ```bash
  git add src/pages/notas.html
  git commit -m "ui: update student edit drawer and action buttons for course transfer and disenrollment"
  ```

---

### Task 2: Inicialización de Variables DOM y Controladores en `notas.js`

**Files:**
- Modify: `src/js/notas.js`

- [ ] **Step 1: Añadir referencias a los nuevos elementos del DOM**

  Al principio de `src/js/notas.js` (dentro del scope de variables de DOM, alrededor de la línea 20), añadir referencias para:
  `editAlumnoMoverCurso`, `btnMoverAlumnoCurso`, `btnQuitarAlumnoCurso` y `grupoMoverCurso`.

  Buscar en `src/js/notas.js`:
  ```javascript
      const cancelEditAlumnoBtn = document.getElementById('btn-cancelar-edicion-alumno');
      const spinner = document.getElementById('loading-spinner');
  ```
  Y modificar a:
  ```javascript
      const cancelEditAlumnoBtn = document.getElementById('btn-cancelar-edicion-alumno');
      const spinner = document.getElementById('loading-spinner');

      // Nuevos elementos para transferencia/desinscripción
      const editAlumnoMoverCurso = document.getElementById('edit-alumno-mover-curso');
      const btnMoverAlumnoCurso = document.getElementById('btn-mover-alumno-curso');
      const btnQuitarAlumnoCurso = document.getElementById('btn-quitar-alumno-curso');
      const grupoMoverCurso = document.getElementById('grupo-mover-curso');
  ```

- [ ] **Step 2: Enlazar los event listeners correspondientes**

  Buscar en `src/js/notas.js` (cerca del listener `btnEliminarAlumno` en la línea 2118):
  ```javascript
      if (btnEliminarAlumno) {
          btnEliminarAlumno.addEventListener('click', eliminarAlumno);
      }
  ```
  Y añadir:
  ```javascript
      if (btnMoverAlumnoCurso) {
          btnMoverAlumnoCurso.addEventListener('click', ejecutarMoverAlumnoCurso);
      }

      if (btnQuitarAlumnoCurso) {
          btnQuitarAlumnoCurso.addEventListener('click', ejecutarQuitarAlumnoCursoIndividual);
      }
  ```

- [ ] **Step 3: Commitear cambios de inicialización**

  ```bash
  git add src/js/notas.js
  git commit -m "feat: initialize new DOM elements and events in notas.js"
  ```

---

### Task 3: Carga del Selector de Cursos y Visualización Dinámica en Drawer

**Files:**
- Modify: `src/js/notas.js`

- [ ] **Step 1: Implementar el rellenado del select en `mostrarModalEditarAlumno`**

  Modificar `mostrarModalEditarAlumno` para rellenar el `<select>` con todos los cursos cargados en la sesión, excluyendo el `cursoActual.id` (si está definido). Si no se está visualizando un curso, ocultar los controles de mover/quitar de curso ya que no aplican.

  Buscar en `src/js/notas.js`:
  ```javascript
      function mostrarModalEditarAlumno(alumnoId) {
          const alumno = alumnos.find(a => a.id === alumnoId);
          if (!alumno) return;
  
          editAlumnoId.value = alumno.id;
          editAlumnoNombre.value = alumno.nombre;
          editAlumnoApellido.value = alumno.apellido;
  
          openDrawer('modal-editar-alumno');
      }
  ```
  Y modificar a:
  ```javascript
      function mostrarModalEditarAlumno(alumnoId) {
          const alumno = alumnos.find(a => a.id === alumnoId);
          if (!alumno) return;
  
          editAlumnoId.value = alumno.id;
          editAlumnoNombre.value = alumno.nombre;
          editAlumnoApellido.value = alumno.apellido;

          // Cargar cursos en el selector excluyendo el curso actual
          if (editAlumnoMoverCurso) {
              editAlumnoMoverCurso.innerHTML = '<option value="">Seleccione curso destino...</option>';
              
              // Cursos contiene todos los cursos del usuario
              const cursosFiltrados = cursos.filter(c => !cursoActual || c.id !== cursoActual.id);
              
              cursosFiltrados.forEach(c => {
                  const opt = document.createElement('option');
                  opt.value = c.id;
                  opt.textContent = `${c.nombre_materia} (${c.anio})`;
                  editAlumnoMoverCurso.appendChild(opt);
              });
          }

          // Mostrar u ocultar controles según si estamos en la vista de un curso específico
          if (cursoActual) {
              if (grupoMoverCurso) grupoMoverCurso.style.display = 'block';
              if (btnQuitarAlumnoCurso) btnQuitarAlumnoCurso.style.display = 'block';
          } else {
              if (grupoMoverCurso) grupoMoverCurso.style.display = 'none';
              if (btnQuitarAlumnoCurso) btnQuitarAlumnoCurso.style.display = 'none';
          }
  
          openDrawer('modal-editar-alumno');
      }
  ```

- [ ] **Step 2: Commitear cambios en la visualización del modal**

  ```bash
  git add src/js/notas.js
  git commit -m "feat: populate course select dynamically in student edit drawer"
  ```

---

### Task 4: Re-implementar Acción Masiva de "Quitar del Curso"

**Files:**
- Modify: `src/js/notas.js:900-944`

- [ ] **Step 1: Modificar el manejador de click de `btnEliminarSeleccionados`**

  Modificar el comportamiento del botón con ID `btn-eliminar-seleccionados` para que elimine filas de `alumnos_cursos` correspondientes al curso activo, en vez de borrar a los alumnos de la tabla `alumnos`.

  Buscar en `src/js/notas.js` (alrededor de la línea 900):
  ```javascript
      // Eliminar alumnos seleccionados
      const btnEliminarSeleccionados = document.getElementById('btn-eliminar-seleccionados');
      if (btnEliminarSeleccionados) {
          btnEliminarSeleccionados.addEventListener('click', async () => {
              if (!cursoActual) {
                  Toastify({ text: "Error: No hay curso seleccionado", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                  return;
              }
  
              const selectedIds = Array.from(IDsAlumnosSeleccionadosGestion);
  
              if (selectedIds.length === 0) {
                  Toastify({ text: "Selecciona alumnos inscritos para quitarlos del curso", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                  return;
              }
  
              mostrarConfirmacion(
                  `¿Estás seguro de que quieres ELIMINAR a ${selectedIds.length} alumno(s) de la aplicación?\n\nEsta acción los borrará permanentemente de TODOS los cursos.`,
                  async () => {
                      showSpinner();
                      try {
                          const { error: deleteError } = await supabase
                              .from('alumnos')
                              .delete()
                              .in('id', selectedIds);
  
                          if (deleteError) throw deleteError;
  
                          // Update local alumnos array
                          const idsSet = new Set(selectedIds);
                          alumnos = alumnos.filter(a => !idsSet.has(a.id));
                          IDsAlumnosSeleccionadosGestion.clear();
  
                          Toastify({
                              text: `${selectedIds.length} alumno(s) eliminados correctamente`,
                              duration: 3000,
                              style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }
                          }).showToast();
  
                          // Refresh the list
                          await populateAlumnosDisponiblesConInscritos(cursoActual.id);
                      } catch (error) {
                          console.error('Error:', error);
                          Toastify({ text: "Error al eliminar alumnos", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                      } finally {
                          hideSpinner();
                      }
                  }
              );
          });
      }
  ```
  Y modificar a:
  ```javascript
      // Quitar alumnos seleccionados del curso
      const btnEliminarSeleccionados = document.getElementById('btn-eliminar-seleccionados');
      if (btnEliminarSeleccionados) {
          btnEliminarSeleccionados.addEventListener('click', async () => {
              if (!cursoActual) {
                  Toastify({ text: "Error: No hay curso seleccionado", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                  return;
              }
  
              const selectedIds = Array.from(IDsAlumnosSeleccionadosGestion);
  
              if (selectedIds.length === 0) {
                  Toastify({ text: "Selecciona alumnos inscritos para quitarlos del curso", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                  return;
              }
  
              mostrarConfirmacion(
                  `¿Estás seguro de que quieres quitar a ${selectedIds.length} alumno(s) del curso actual?\n\nSu historial de asistencia y notas seguirá guardado, pero ya no aparecerán en este curso.`,
                  async () => {
                      showSpinner();
                      try {
                          const { error: deleteError } = await supabase
                              .from('alumnos_cursos')
                              .delete()
                              .eq('id_curso', cursoActual.id)
                              .in('id_alumno', selectedIds);
  
                          if (deleteError) throw deleteError;
  
                          IDsAlumnosSeleccionadosGestion.clear();
  
                          Toastify({
                              text: `${selectedIds.length} alumno(s) desinscrito(s) del curso`,
                              duration: 3000,
                              style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }
                          }).showToast();
  
                          // Refresh the list
                          await populateAlumnosDisponiblesConInscritos(cursoActual.id);
                      } catch (error) {
                          console.error('Error:', error);
                          Toastify({ text: "Error al quitar alumnos", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                      } finally {
                          hideSpinner();
                      }
                  }
              );
          });
      }
  ```

- [ ] **Step 2: Commitear cambios del botón masivo**

  ```bash
  git add src/js/notas.js
  git commit -m "feat: re-implement bulk disenrollment instead of global delete"
  ```

---

### Task 5: Implementar las Operaciones de Transferencia y Quitado Individual

**Files:**
- Modify: `src/js/notas.js`

- [ ] **Step 1: Escribir las funciones `ejecutarMoverAlumnoCurso` y `ejecutarQuitarAlumnoCursoIndividual`**

  Añadir al final de la lógica del modal de alumnos (justo antes de la función `cargarYCalcularNotasFinales` alrededor de la línea 2122) las funciones controladoras.

  Insertar en `src/js/notas.js`:
  ```javascript
      async function ejecutarMoverAlumnoCurso() {
          const alumnoId = editAlumnoId.value;
          const targetCursoId = editAlumnoMoverCurso.value;
  
          if (!alumnoId) return;
          if (!cursoActual) {
              Toastify({ text: "Error: No hay curso actual de origen", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
              return;
          }
          if (!targetCursoId) {
              Toastify({ text: "Selecciona un curso de destino", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
              return;
          }
  
          const alumno = alumnos.find(a => a.id === alumnoId);
          const targetCurso = cursos.find(c => c.id === targetCursoId);
          const nombreCurso = targetCurso ? targetCurso.nombre_materia : "el nuevo curso";
  
          if (!confirm(`¿Estás seguro de mover a ${alumno.nombre} ${alumno.apellido} a ${nombreCurso}?`)) {
              return;
          }
  
          showSpinner();
          try {
              // 1. Eliminar relación del curso actual
              const { error: deleteError } = await supabase
                  .from('alumnos_cursos')
                  .delete()
                  .eq('id_alumno', alumnoId)
                  .eq('id_curso', cursoActual.id);
  
              if (deleteError) throw deleteError;
  
              // 2. Insertar relación en el nuevo curso
              const { error: insertError } = await supabase
                  .from('alumnos_cursos')
                  .insert({
                      id_alumno: alumnoId,
                      id_curso: targetCursoId
                  });
  
              if (insertError) throw insertError;
  
              ocultarModalEditarAlumno();
  
              Toastify({
                  text: `Alumno movido exitosamente a ${nombreCurso}`,
                  duration: 3000,
                  style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }
              }).showToast();
  
              // Recargar los alumnos del curso actual para reflejar que ya no está
              await populateAlumnosDisponiblesConInscritos(cursoActual.id);
          } catch (error) {
              console.error('Error al mover alumno:', error);
              Toastify({ text: "Error al mover el alumno de curso", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
          } finally {
              hideSpinner();
          }
      }
  
      async function ejecutarQuitarAlumnoCursoIndividual() {
          const alumnoId = editAlumnoId.value;
          if (!alumnoId || !cursoActual) return;
  
          const alumno = alumnos.find(a => a.id === alumnoId);
  
          if (!confirm(`¿Estás seguro de quitar a ${alumno.nombre} ${alumno.apellido} de este curso?`)) {
              return;
          }
  
          showSpinner();
          try {
              const { error } = await supabase
                  .from('alumnos_cursos')
                  .delete()
                  .eq('id_alumno', alumnoId)
                  .eq('id_curso', cursoActual.id);
  
              if (error) throw error;
  
              ocultarModalEditarAlumno();
  
              Toastify({
                  text: "Alumno quitado del curso",
                  duration: 3000,
                  style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }
              }).showToast();
  
              // Recargar la lista
              await populateAlumnosDisponiblesConInscritos(cursoActual.id);
          } catch (error) {
              console.error('Error al desinscribir alumno:', error);
              Toastify({ text: "Error al quitar alumno del curso", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
          } finally {
              hideSpinner();
          }
      }
  ```

- [ ] **Step 2: Commitear cambios de lógica individual**

  ```bash
  git add src/js/notas.js
  git commit -m "feat: implement individual transfer and course removal controllers"
  ```

---

### Task 6: Verificación Manual del Funcionamiento

- [ ] **Step 1: Verificar la visualización e inscripción del curso**
  1. Abrir ProfeApp y loguearse.
  2. Ir a "Notas y Asistencia".
  3. Crear un alumno nuevo inline en el curso actual, verificar que se agrega al curso y aparece marcado.
  
- [ ] **Step 2: Verificar la desinscripción masiva (Botón "Quitar del Curso")**
  1. Seleccionar a varios alumnos utilizando los checkboxes en la gestión de un curso.
  2. Presionar el botón "Quitar del Curso" (antes "Eliminar Seleccionados").
  3. Confirmar la acción.
  4. Verificar que se desinscriben del curso actual (los checkboxes correspondientes quedan vacíos), pero siguen existiendo en la base de datos (puedes verlos de nuevo en la lista para volver a marcar).

- [ ] **Step 3: Verificar la transferencia de curso (Mover)**
  1. Hacer clic en el lápiz/editar de un alumno que esté inscrito en el Curso A.
  2. Se debe desplegar el modal "Editar Alumno".
  3. Seleccionar el Curso B del desplegable "Mover a otro curso" y presionar "Mover a este Curso".
  4. Verificar que el modal se cierra, el alumno ya no aparece en el listado del Curso A.
  5. Ir al Curso B y verificar que el alumno aparece correctamente inscrito en él.

- [ ] **Step 4: Verificar la desinscripción individual**
  1. Abrir la edición de un alumno en el Curso A.
  2. Presionar "Quitar del curso actual".
  3. Confirmar y verificar que el alumno ya no está inscrito en el Curso A pero sí sigue disponible en el sistema.
