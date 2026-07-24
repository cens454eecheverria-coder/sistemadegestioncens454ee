# Cálculo y Gestión de Notas Finales e Intensificaciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic calculation and management of cuatrimestre and subject final grades, incorporating Q1 and year-end intensificaciones, with manual override support and a dedicated "Notas Finales" tab on the course dashboard.

**Architecture:** Add a new tab "Notas Finales" to `notas.html` and implement calculated grading grids in `notas.js` that fetch evaluations, grades, and existing final grades, apply the Argentine grading rules, pre-fill editable inputs, and perform a bulk upsert back to Supabase.

**Tech Stack:** Vanilla HTML5, CSS3 classic, Vanilla JS (ES6), Supabase client-side API.

---

### Task 1: UI updates in `notas.html`

**Files:**
- Modify: `src/pages/notas.html`

- [ ] **Step 1: Add the "Notas Finales" tab button**
  Locate the tab buttons around line 279 and add the new button for "Notas Finales".
  
  ```html
  <<<<
                      <!-- Tabs for switching between Evaluaciones and Rúbricas -->
                      <div class="eval-tabs">
                          <button class="eval-tab active" data-tab="evaluaciones">
                              <i class="fas fa-file-alt"></i> Evaluaciones
                          </button>
                          <button class="eval-tab" data-tab="rubricas">
                              <i class="fas fa-tasks"></i> Rúbricas
                          </button>
                      </div>
  ====
                      <!-- Tabs for switching between Evaluaciones and Rúbricas -->
                      <div class="eval-tabs">
                          <button class="eval-tab active" data-tab="evaluaciones">
                              <i class="fas fa-file-alt"></i> Evaluaciones
                          </button>
                          <button class="eval-tab" data-tab="rubricas">
                              <i class="fas fa-tasks"></i> Rúbricas
                          </button>
                          <button class="eval-tab" data-tab="notas_finales">
                              <i class="fas fa-graduation-cap"></i> Notas Finales
                          </button>
                      </div>
  >>>>
  ```

- [ ] **Step 2: Add the tab content container**
  Locate the end of the Rúbricas tab content section (around line 406) and insert the new tab content section for "Notas Finales".

  ```html
  <<<<
                      <!-- Tab Content: Rúbricas -->
                      <section id="rubricas-notas" class="eval-tab-content">
                          ...
                      </section>
                  </div>
              </div>
          </div>
  ====
                      <!-- Tab Content: Rúbricas -->
                      <section id="rubricas-notas" class="eval-tab-content">
                          ...
                      </section>

                      <!-- Tab Content: Notas Finales -->
                      <section id="finales-notas" class="eval-tab-content">
                          <div class="card modern-card">
                              <div class="card-header-modern" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                  <h3><i class="fas fa-calculator"></i> Cierre de Notas y Calificaciones Finales</h3>
                                  <button id="btn-guardar-notas-finales" class="btn btn-success">
                                      <i class="fas fa-save"></i> Guardar Calificaciones
                                  </button>
                              </div>
                              <div class="table-responsive" style="overflow-x: auto; padding: 20px;">
                                  <table class="tabla-notas-finales" style="width: 100%; border-collapse: collapse;">
                                      <thead>
                                          <tr style="border-bottom: 2px solid #ddd; text-align: left;">
                                              <th style="padding: 12px; color: var(--primary-dark-color); font-weight: 700;">Alumno</th>
                                              <th style="padding: 12px; text-align: center; color: var(--primary-dark-color); font-weight: 700;">1° Cuat (C1)</th>
                                              <th style="padding: 12px; text-align: center; color: var(--primary-dark-color); font-weight: 700;">2° Cuat (C2)</th>
                                              <th style="padding: 12px; text-align: center; color: var(--primary-dark-color); font-weight: 700;">Recuperatorio Jul/Ago</th>
                                              <th style="padding: 12px; text-align: center; color: var(--primary-dark-color); font-weight: 700;">Recuperatorio Dic/Feb</th>
                                              <th style="padding: 12px; text-align: center; color: var(--primary-dark-color); font-weight: 700;">Nota Final</th>
                                              <th style="padding: 12px; text-align: center; color: var(--primary-dark-color); font-weight: 700;">Estado</th>
                                          </tr>
                                      </thead>
                                      <tbody id="tabla-finales-body">
                                          <!-- Se cargará dinámicamente -->
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </section>
                  </div>
              </div>
          </div>
  >>>>
  ```

- [ ] **Step 3: Commit UI changes**
  Run:
  ```bash
  git add src/pages/notas.html
  git commit -m "ui: add final grades tab structure to notas.html"
  ```

---

### Task 2: Styling the new final grades section

**Files:**
- Modify: `src/css/notas.css`

- [ ] **Step 1: Add CSS rules for the final grades table and inputs**
  Append styling code to the end of `src/css/notas.css` to styles the table, editable inputs, and status badges.
  
  ```css
  /* Estilos para Notas Finales */
  .tabla-notas-finales th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #dee2e6;
  }

  .tabla-notas-finales td {
      padding: 12px;
      vertical-align: middle;
      border-bottom: 1px solid #dee2e6;
  }

  .tabla-notas-finales tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.02);
  }

  .final-nota-input {
      width: 65px;
      padding: 8px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      text-align: center;
      font-weight: 600;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      background-color: #fff;
  }

  .final-nota-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
      outline: none;
  }

  .badge-final {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
  }

  .badge-final-aprobado {
      background-color: rgba(0, 176, 155, 0.15);
      color: #00b09b;
  }

  .badge-final-recupera {
      background-color: rgba(255, 95, 109, 0.15);
      color: #ff5f6d;
  }

  .badge-final-info {
      background-color: rgba(102, 126, 234, 0.15);
      color: #667eea;
      font-size: 0.8rem;
      padding: 4px 8px;
      margin: 2px;
  }
  ```

- [ ] **Step 2: Commit CSS changes**
  Run:
  ```bash
  git add src/css/notas.css
  git commit -m "style: add styles for final grades table and inputs in notas.css"
  ```

---

### Task 3: Grading & Calculation Logic in `notas.js`

**Files:**
- Modify: `src/js/notas.js`

- [ ] **Step 1: Update tab switching event listeners**
  Locate the tab event listeners in `src/js/notas.js` (around line 1475) and handle the new `'notas_finales'` tab target.

  ```javascript
  <<<<
              // Add active to corresponding content
              if (targetTab === 'evaluaciones') {
                  document.getElementById('evaluaciones-notas').classList.add('active');
              } else if (targetTab === 'rubricas') {
                  document.getElementById('rubricas-notas').classList.add('active');
              }
  ====
              // Add active to corresponding content
              if (targetTab === 'evaluaciones') {
                  document.getElementById('evaluaciones-notas').classList.add('active');
              } else if (targetTab === 'rubricas') {
                  document.getElementById('rubricas-notas').classList.add('active');
              } else if (targetTab === 'notas_finales') {
                  document.getElementById('finales-notas').classList.add('active');
                  cargarYCalcularNotasFinales();
              }
  >>>>
  ```

- [ ] **Step 2: Implement data loading function `cargarYCalcularNotasFinales`**
  Add the data-fetching and orchestration logic at the end of the file.

  ```javascript
  async function cargarYCalcularNotasFinales() {
      if (!selectedCurso) return;
      showSpinner();
      try {
          // 1. Cargar alumnos inscritos en el curso
          const { data: alumnosData, error: alumnosError } = await supabase
              .from('alumnos_cursos')
              .select('id_alumno, alumnos (id, nombre, apellido)')
              .eq('id_curso', selectedCurso.id);
          if (alumnosError) throw alumnosError;
          const alumnosInscritos = alumnosData.map(item => item.alumnos);

          // Ordenar alfabéticamente por apellido y nombre
          alumnosInscritos.sort((a, b) => {
              const apellidoA = (a.apellido || '').toLowerCase();
              const apellidoB = (b.apellido || '').toLowerCase();
              if (apellidoA < apellidoB) return -1;
              if (apellidoA > apellidoB) return 1;
              return (a.nombre || '').localeCompare(b.nombre || '');
          });

          // 2. Cargar evaluaciones del curso
          const { data: evaluacionesData, error: evalError } = await supabase
              .from('evaluaciones')
              .select('*')
              .eq('id_curso', selectedCurso.id);
          if (evalError) throw evalError;

          // 3. Cargar notas de esas evaluaciones
          let notas = [];
          if (evaluacionesData.length > 0) {
              const evalIds = evaluacionesData.map(e => e.id);
              const { data: notasData, error: notasError } = await supabase
                  .from('notas')
                  .select('*')
                  .in('id_evaluacion', evalIds);
              if (notasError) throw notasError;
              notas = notasData;
          }

          // 4. Cargar notas finales ya guardadas
          const { data: notasFinalesData, error: finalesError } = await supabase
              .from('notas_finales')
              .select('*')
              .eq('id_curso', selectedCurso.id);
          if (finalesError) throw finalesError;

          renderNotasFinalesTable(alumnosInscritos, evaluacionesData, notas, notasFinalesData);
      } catch (error) {
          console.error("Error cargando notas finales:", error);
          Toastify({ text: "Error al calcular notas finales.", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
      } finally {
          hideSpinner();
      }
  }
  ```

- [ ] **Step 3: Implement calculation and table rendering `renderNotasFinalesTable`**
  Add the calculation and rendering function to generate the grading table.

  ```javascript
  function renderNotasFinalesTable(alumnosInscritos, evaluaciones, notas, notasFinales) {
      const tbody = document.getElementById('tabla-finales-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (alumnosInscritos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay alumnos inscritos en este curso.</td></tr>';
          return;
      }

      // Map final grades by student and period for quick lookup
      const finalesMap = new Map();
      notasFinales.forEach(nf => {
          finalesMap.set(`${nf.id_alumno}-${nf.periodo}`, nf.calificacion_final);
      });

      alumnosInscritos.forEach(alumno => {
          // --- CALCULATE C1 AVERAGE ---
          const evalC1Ids = evaluaciones
              .filter(e => e.tipo_nota === 'cuatrimestre' && e.periodo === 'cuatrimestre1')
              .map(e => e.id);
          const notasC1 = notas.filter(n => n.id_alumno === alumno.id && evalC1Ids.includes(n.id_evaluacion));
          const gradesC1 = notasC1.map(n => parseFloat(n.calificacion)).filter(val => !isNaN(val));
          const avgC1 = gradesC1.length > 0 ? gradesC1.reduce((sum, val) => sum + val, 0) / gradesC1.length : null;
          const calculatedC1 = avgC1 !== null ? Math.round(avgC1) : '';

          // --- CALCULATE C2 AVERAGE ---
          const evalC2Ids = evaluaciones
              .filter(e => e.tipo_nota === 'cuatrimestre' && e.periodo === 'cuatrimestre2')
              .map(e => e.id);
          const notasC2 = notas.filter(n => n.id_alumno === alumno.id && evalC2Ids.includes(n.id_evaluacion));
          const gradesC2 = notasC2.map(n => parseFloat(n.calificacion)).filter(val => !isNaN(val));
          const avgC2 = gradesC2.length > 0 ? gradesC2.reduce((sum, val) => sum + val, 0) / gradesC2.length : null;
          const calculatedC2 = avgC2 !== null ? Math.round(avgC2) : '';

          // --- GATHER MITAD DE AÑO INTENSIFICACIONES (Jul/Ago) ---
          const evalJulAgoIds = evaluaciones
              .filter(e => e.tipo_nota === 'intensificacion_recuperacion' && ['intensificacion_julio', 'intensificacion_agosto'].includes(e.periodo))
              .map(e => e.id);
          const notasJulAgo = notas.filter(n => n.id_alumno === alumno.id && evalJulAgoIds.includes(n.id_evaluacion));
          const gradesJulAgo = notasJulAgo.map(n => parseFloat(n.calificacion)).filter(val => !isNaN(val));

          // --- GATHER FIN DE AÑO INTENSIFICACIONES (Dic/Feb) ---
          const evalDicFeb = evaluaciones
              .filter(e => e.tipo_nota === 'intensificacion_recuperacion' && ['intensificacion_diciembre', 'intensificacion_febrero'].includes(e.periodo));
          
          // Sort Dic/Feb to find latest (Feb takes priority over Dec)
          evalDicFeb.sort((a, b) => {
              if (a.periodo === 'intensificacion_febrero' && b.periodo === 'intensificacion_diciembre') return 1;
              if (a.periodo === 'intensificacion_diciembre' && b.periodo === 'intensificacion_febrero') return -1;
              return 0;
          });

          const evalDicFebIds = evalDicFeb.map(e => e.id);
          const notasDicFeb = notas.filter(n => n.id_alumno === alumno.id && evalDicFebIds.includes(n.id_evaluacion));
          
          // Find latest written Dic/Feb grade if any exists
          let latestDicFebGrade = null;
          if (notasDicFeb.length > 0) {
              // Map by eval ID to match ordering
              for (let i = evalDicFeb.length - 1; i >= 0; i--) {
                  const match = notasDicFeb.find(n => n.id_evaluacion === evalDicFeb[i].id);
                  if (match && !isNaN(parseFloat(match.calificacion))) {
                      latestDicFebGrade = parseFloat(match.calificacion);
                      break;
                  }
              }
          }

          // --- APPLY REPLACEMENT LOGIC FOR AUTOMATIC FINAL GRADE ---
          let finalC1 = calculatedC1;
          let finalC2 = calculatedC2;

          // 1. Recover Q1 using Jul/Ago intensificacion (takes highest if multiple)
          if (calculatedC1 !== '' && calculatedC1 < 7 && gradesJulAgo.length > 0) {
              const maxJulAgo = Math.max(...gradesJulAgo);
              if (maxJulAgo > calculatedC1) {
                  finalC1 = maxJulAgo;
              }
          }

          // Calculate basic calculated final average
          let calculatedFinal = '';
          if (finalC1 !== '' && finalC2 !== '') {
              calculatedFinal = Math.round((finalC1 + finalC2) / 2);
          } else if (finalC1 !== '') {
              calculatedFinal = finalC1;
          } else if (finalC2 !== '') {
              calculatedFinal = finalC2;
          }

          // 2. Year-end intensificacion directly replaces the final grade (even if lower)
          if (latestDicFebGrade !== null) {
              calculatedFinal = latestDicFebGrade;
          }

          // --- PRE-LOAD SAVED VALUES OVER CALCULATION (IF SAVED PREVIOUSLY) ---
          const displayC1 = finalesMap.get(`${alumno.id}-cuatrimestre1`) || calculatedC1;
          const displayC2 = finalesMap.get(`${alumno.id}-cuatrimestre2`) || calculatedC2;
          const displayFinal = finalesMap.get(`${alumno.id}-anual`) || calculatedFinal;

          // Badges for intensificaciones info
          const julAgoBadgeHtml = gradesJulAgo.map(g => `<span class="badge-final badge-final-info">${g}</span>`).join(' ') || '-';
          const dicFebBadgeHtml = notasDicFeb.map(n => `<span class="badge-final badge-final-info">${n.calificacion}</span>`).join(' ') || '-';

          // Determine initial status
          const finalVal = parseFloat(displayFinal);
          const initialStatusHtml = (!isNaN(finalVal) && finalVal >= 7) 
              ? '<span class="badge-final badge-final-aprobado">Aprobado</span>' 
              : '<span class="badge-final badge-final-recupera">A Intensificación</span>';

          const tr = document.createElement('tr');
          tr.dataset.idAlumno = alumno.id;
          tr.innerHTML = `
              <td style="padding: 12px; font-weight: 500;"><i class="fas fa-user" style="color: #667eea; margin-right: 8px;"></i> ${alumno.nombre} ${alumno.apellido}</td>
              <td style="padding: 12px; text-align: center;">
                  <input type="text" class="final-nota-input c1-input" value="${displayC1}">
              </td>
              <td style="padding: 12px; text-align: center;">
                  <input type="text" class="final-nota-input c2-input" value="${displayC2}">
              </td>
              <td style="padding: 12px; text-align: center;">${julAgoBadgeHtml}</td>
              <td style="padding: 12px; text-align: center;">${dicFebBadgeHtml}</td>
              <td style="padding: 12px; text-align: center;">
                  <input type="text" class="final-nota-input final-input" value="${displayFinal}" style="border-color: #667eea; background-color: #f0f4ff;">
              </td>
              <td style="padding: 12px; text-align: center;" class="status-cell">${initialStatusHtml}</td>
          `;

          // Add event listener to final input to update status dynamically on keyup
          const finalInput = tr.querySelector('.final-input');
          const statusCell = tr.querySelector('.status-cell');
          finalInput.addEventListener('input', () => {
              const val = parseFloat(finalInput.value.trim());
              if (!isNaN(val) && val >= 7) {
                  statusCell.innerHTML = '<span class="badge-final badge-final-aprobado">Aprobado</span>';
              } else {
                  statusCell.innerHTML = '<span class="badge-final badge-final-recupera">A Intensificación</span>';
              }
          });

          tbody.appendChild(tr);
      });
  }
  ```

- [ ] **Step 4: Implement save function `guardarNotasFinales`**
  Add the save grades function and set up the click handler.

  ```javascript
  async function guardarNotasFinales() {
      if (!currentUser || !selectedCurso) {
          Toastify({ text: "Debes iniciar sesión para realizar esta acción.", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
          return;
      }

      const rows = document.querySelectorAll('#tabla-finales-body tr');
      const payload = [];

      rows.forEach(row => {
          const id_alumno = row.dataset.idAlumno;
          if (!id_alumno) return;

          const c1Val = row.querySelector('.c1-input').value.trim();
          const c2Val = row.querySelector('.c2-input').value.trim();
          const finalVal = row.querySelector('.final-input').value.trim();

          if (c1Val) {
              payload.push({
                  id_curso: selectedCurso.id,
                  id_alumno,
                  periodo: 'cuatrimestre1',
                  calificacion_final: c1Val,
                  user_id: currentUser.id
              });
          }
          if (c2Val) {
              payload.push({
                  id_curso: selectedCurso.id,
                  id_alumno,
                  periodo: 'cuatrimestre2',
                  calificacion_final: c2Val,
                  user_id: currentUser.id
              });
          }
          if (finalVal) {
              payload.push({
                  id_curso: selectedCurso.id,
                  id_alumno,
                  periodo: 'anual',
                  calificacion_final: finalVal,
                  user_id: currentUser.id
              });
          }
      });

      if (payload.length === 0) {
          Toastify({ text: "No hay notas para guardar.", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
          return;
      }

      showSpinner();
      try {
          const { error } = await supabase
              .from('notas_finales')
              .upsert(payload, { onConflict: 'id_curso,id_alumno,periodo' });

          if (error) throw error;

          Toastify({ text: "Calificaciones finales guardadas con éxito", duration: 3000, style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
          await cargarYCalcularNotasFinales();
      } catch (error) {
          console.error("Error guardando calificaciones finales:", error);
          Toastify({ text: "Error al guardar calificaciones finales.", duration: 3000, style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
      } finally {
          hideSpinner();
      }
  }

  // Set up click handler for Save Button in init or setupEventListeners
  ```

- [ ] **Step 5: Bind the click event to Save Button**
  Locate where events are bound in `setupEventListeners` (around line 155) or directly add a listener at the end of DOMContentLoaded initialization.

  ```javascript
  // Set up save button for final grades
  const btnGuardarFinales = document.getElementById('btn-guardar-notas-finales');
  if (btnGuardarFinales) {
      btnGuardarFinales.addEventListener('click', guardarNotasFinales);
  }
  ```

- [ ] **Step 6: Commit JS changes**
  Run:
  ```bash
  git add src/js/notas.js
  git commit -m "feat: implement calculated grades loading, rendering, and bulk saving in notas.js"
  ```

---

### Task 4: Cache Update in Service Worker

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Update SW cache version**
  Locate `CACHE_NAME` at the top of `sw.js` and increment the version number to invalidate old cache and pick up UI/JS changes.

  ```javascript
  <<<<
  const CACHE_NAME = 'profeapp-cache-v1.0.1';
  ====
  const CACHE_NAME = 'profeapp-cache-v1.0.2';
  >>>>
  ```

- [ ] **Step 2: Commit SW changes**
  Run:
  ```bash
  git add sw.js
  git commit -m "chore: update service worker cache name to v1.0.2"
  ```

---

## Verification Plan

### Manual Verification
1. Open the application locally (run server and access http://localhost:8080).
2. Authenticate and go to "Notas y Asistencia".
3. Open a course, go to "Evaluaciones y Calificaciones" -> Click the new "Notas Finales" tab.
4. Verify all enrolled students are listed.
5. Create partial assessments for Q1 and Q2, and verify that their rounded averages appear as C1 and C2.
6. Create Q1 intensificación evaluations (Jul/Ago) and verify that if Q1 average was < 7, the C1 average is replaced by the intensificación grade, and the final grade updates to the average of the replaced C1 and C2.
7. Create year-end intensificación evaluations (Dic/Feb) and verify that the grade replaces the calculated final grade directly.
8. Edit C1, C2, or Final Grade inputs manually, check that the status badge updates dynamically, click "Guardar Calificaciones", refresh the page, and verify the edits persist.
