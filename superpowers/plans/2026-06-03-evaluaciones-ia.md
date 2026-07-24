# Generación de Evaluaciones con IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporate a new tab/section into the planning tool ("Planificaciones") to create/build evaluations using AI (Gemini), allowing customization of question types, reference material uploads, dates, database persistence, and teacher agenda synchronization.

**Architecture:** We will add a new tab to the existing `planificaciones.html` page, with a dedicated form. We will parse reference text files or PDFs in the browser (using PDF.js via CDN). The prompt will be sent to Gemini to get structured JSON representing the evaluation. Saving the evaluation will perform inserts into Supabase (`evaluaciones` and `eventos` tables).

**Tech Stack:** HTML5, CSS3, JavaScript (ES6), Supabase JS Client, PDF.js (CDN), Toastify.js, jsPDF.

---

### Task 1: UI Changes in planificaciones.html

**Files:**
- Modify: `src/pages/planificaciones.html`

- [ ] **Step 1: Add PDF.js script tag to the head**
Include the script tag and worker configuration for PDF.js inside the `<head>` tag of `src/pages/planificaciones.html` (after loading other libraries around line 35).

Target content in `src/pages/planificaciones.html`:
```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
```

Replacement content:
```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    </script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
```

- [ ] **Step 2: Add the "Evaluación con IA" tab button**
Add a new button to the `.tabs` div element in `src/pages/planificaciones.html` (around line 345).

Target content:
```html
        <div class="tabs">
            <button class="tab-button active" onclick="openTab(event, 'plan-anual')">
                <i class="fas fa-calendar-alt"></i> Plan Anual/Cuatrimestral
            </button>
            <button class="tab-button" onclick="openTab(event, 'secuencia-didactica')">
                <i class="fas fa-list-ol"></i> Secuencia Didáctica
            </button>
            <button class="tab-button" onclick="openTab(event, 'proyecto-pedagogico')">
                <i class="fas fa-project-diagram"></i> Proyecto Pedagógico
            </button>
            <button class="tab-button" onclick="openTab(event, 'disenos-curriculares')">
                <i class="fas fa-book"></i> Diseños Curriculares
            </button>
        </div>
```

Replacement content:
```html
        <div class="tabs">
            <button class="tab-button active" onclick="openTab(event, 'plan-anual')">
                <i class="fas fa-calendar-alt"></i> Plan Anual/Cuatrimestral
            </button>
            <button class="tab-button" onclick="openTab(event, 'secuencia-didactica')">
                <i class="fas fa-list-ol"></i> Secuencia Didáctica
            </button>
            <button class="tab-button" onclick="openTab(event, 'proyecto-pedagogico')">
                <i class="fas fa-project-diagram"></i> Proyecto Pedagógico
            </button>
            <button class="tab-button" onclick="openTab(event, 'evaluacion-ia')">
                <i class="fas fa-file-signature"></i> Evaluación con IA
            </button>
            <button class="tab-button" onclick="openTab(event, 'disenos-curriculares')">
                <i class="fas fa-book"></i> Diseños Curriculares
            </button>
        </div>
```

- [ ] **Step 3: Add the "Evaluación con IA" tab content panel**
Add the new tab panel code right after `proyecto-pedagogico` tab content (around line 588) inside `src/pages/planificaciones.html`.

Target content:
```html
        </div>

        <!-- Resultado común para todos los formularios -->
        <div id="resultado-container" class="generated-plan-container" style="display: none;">
```

Replacement content:
```html
        </div>

        <!-- Tab: Evaluación con IA -->
        <div id="evaluacion-ia" class="tab-content" style="display: none;">
            <div class="card">
                <h2><i class="fas fa-file-signature"></i> Armar Evaluación con IA</h2>
                <p>Genera consignas de evaluación personalizadas y regístralas en tu agenda y base de datos.</p>

                <form id="form-evaluacion-ia">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="eval-curso">Curso / Materia</label>
                            <select id="eval-curso" required>
                                <option value="">Cargando tus cursos...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="eval-tipo-registro">Tipo de Registro (BD)</label>
                            <select id="eval-tipo-registro" required>
                                <option value="escrita" selected>Escrita</option>
                                <option value="trabajos practicos">Trabajo Práctico</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="eval-tipo-pregunta">Tipo de Preguntas</label>
                            <select id="eval-tipo-pregunta" required>
                                <option value="desarrollo">Desarrollo</option>
                                <option value="multiplechoice">Múltiple Opción (Multiple Choice)</option>
                                <option value="verdadero_falso">Verdadero / Falso</option>
                                <option value="mixta" selected>Mixta</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="eval-cantidad">Cantidad de Consignas</label>
                            <input type="number" id="eval-cantidad" min="1" max="20" value="5" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="eval-fecha">Fecha de la Evaluación</label>
                            <input type="date" id="eval-fecha" required>
                        </div>
                        <div class="form-group">
                            <label for="eval-archivo">Material de Referencia (Opcional, .txt, .md, .pdf)</label>
                            <input type="file" id="eval-archivo" accept=".txt,.md,.pdf">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="eval-instrucciones">Temas o Instrucciones Adicionales</label>
                        <textarea id="eval-instrucciones" rows="3" placeholder="Ej: Unidad 1, enfoque en resolución de problemas..." required></textarea>
                    </div>

                    <div class="form-group" style="flex-direction: row; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem;">
                        <input type="checkbox" id="eval-soluciones" style="width: auto;">
                        <label for="eval-soluciones" style="font-weight: normal; margin-bottom: 0;">Incluir hoja de soluciones / respuestas sugeridas</label>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-generar">
                            <i class="fas fa-wand-magic-sparkles"></i> Generar Evaluación
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Resultado común para todos los formularios -->
        <div id="resultado-container" class="generated-plan-container" style="display: none;">
```

- [ ] **Step 4: Add the "Registrar y Agendar" button to the results container**
Add the registration button to the results container in `src/pages/planificaciones.html` (around line 592).

Target content:
```html
                <div style="display: flex; gap: 0.5rem;">
                    <button id="btn-exportar-pdf" class="btn btn-secondary">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    <button id="btn-save-drive" class="btn btn-secondary"
                        style="background-color: #34A853; color: white; border: none;">
                        <i class="fab fa-google-drive"></i> Guardar en Drive
                    </button>
                </div>
```

Replacement content:
```html
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button id="btn-guardar-evaluacion" class="btn btn-primary" style="display: none; background-color: var(--primary-color); border: none;">
                        <i class="fas fa-save"></i> Registrar y Agendar
                    </button>
                    <button id="btn-exportar-pdf" class="btn btn-secondary">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    <button id="btn-save-drive" class="btn btn-secondary"
                        style="background-color: #34A853; color: white; border: none;">
                        <i class="fab fa-google-drive"></i> Guardar en Drive
                    </button>
                </div>
```

- [ ] **Step 5: Verify the HTML changes by running git diff**
Run: `git diff src/pages/planificaciones.html`
Expected: Diff matches the targeted insertions.

---

### Task 2: Modifying ai_service.js to Support Evaluations

**Files:**
- Modify: `src/js/ai_service.js`

- [ ] **Step 1: Extend generatePlan prompt context and structure to handle evaluations**
Add context extraction and JSON output instructions for `data.tipoPlan === 'evaluacion'` inside `AIService.generatePlan` in `src/js/ai_service.js`.

Target content (around lines 116-124):
```javascript
            } else if (data.tipoPlan === 'proyecto') {
                promptContext += `
                - Fundamentos: ${data.fundamentos}
                - Objetivos: ${data.objetivos}
                - Recursos: ${data.recursos}
                - Actividades: ${data.actividades}
                - Evaluación: ${data.evaluacion}
                `;
            }
```

Replacement content:
```javascript
            } else if (data.tipoPlan === 'proyecto') {
                promptContext += `
                - Fundamentos: ${data.fundamentos}
                - Objetivos: ${data.objetivos}
                - Recursos: ${data.recursos}
                - Actividades: ${data.actividades}
                - Evaluación: ${data.evaluacion}
                `;
            } else if (data.tipoPlan === 'evaluacion') {
                promptContext += `
                - Tipo de Preguntas: ${data.tipoPregunta}
                - Cantidad de Consignas: ${data.cantidad}
                - Incluir Soluciones: ${data.soluciones ? 'Sí' : 'No'}
                - Instrucciones/Temas adicionales: ${data.instrucciones}
                - Texto del Material de Referencia Adjunto: ${data.archivoTexto || 'Ninguno proporcionado'}
                `;
            }
```

Target content (around lines 166-176):
```javascript
            } else {
                // Fallback for any other type
                jsonStructure = `
                {
                    "titulo": "Planificación de [Materia]",
                    "objetivos": ["...", "..."],
                    "desarrollo": "...",
                    "recursos": ["...", "..."],
                    "evaluacion": "..."
                }`;
            }
```

Replacement content:
```javascript
            } else if (data.tipoPlan === 'evaluacion') {
                jsonStructure = `
                {
                    "titulo": "Evaluación de [Tema] - [Materia]",
                    "tipo_evaluacion": "${data.tipoPregunta}",
                    "consignas": [
                        {
                            "numero": 1,
                            "pregunta": "[Pregunta/Consigna]",
                            "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
                            "respuesta_correcta": "[Explicación de la solución o respuesta esperada]"
                        }
                    ],
                    "criterios_evaluacion": ["Criterio 1", "Criterio 2"]
                }`;
            } else {
                // Fallback for any other type
                jsonStructure = `
                {
                    "titulo": "Planificación de [Materia]",
                    "objetivos": ["...", "..."],
                    "desarrollo": "...",
                    "recursos": ["...", "..."],
                    "evaluacion": "..."
                }`;
            }
```

- [ ] **Step 2: Verify code syntax by running a quick lint or checking file status**
Run: `git diff src/js/ai_service.js`

---

### Task 3: Modifying planificaciones.js for Form Handling, File Parsing, and Database Sync

**Files:**
- Modify: `src/js/planificaciones.js`

- [ ] **Step 1: Load Courses dynamically and handle Form Actions**
Add dropdown loader for `#eval-curso` on load, implement PDF and text file reader parser, and map the submit event for `#form-evaluacion-ia` inside `src/js/planificaciones.js`.

Target content (around lines 44-50):
```javascript
    // --- AI Generator Logic ---
    const forms = {
        'form-plan-anual': 'anual',
        'form-secuencia': 'secuencia',
        'form-proyecto': 'proyecto'
    };
```

Replacement content:
```javascript
    // --- AI Generator Logic ---
    const forms = {
        'form-plan-anual': 'anual',
        'form-secuencia': 'secuencia',
        'form-proyecto': 'proyecto',
        'form-evaluacion-ia': 'evaluacion'
    };

    // --- Dynamic Load Courses for Evaluation ---
    async function loadCursosDropdown() {
        const evalCursoSelect = document.getElementById('eval-curso');
        if (!evalCursoSelect) return;

        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            const { data: cursos, error } = await window.supabaseClient
                .from('cursos')
                .select('id, nombre_materia, anio')
                .eq('user_id', session.user.id)
                .order('nombre_materia', { ascending: true });

            if (error) throw error;

            evalCursoSelect.innerHTML = '<option value="">Selecciona un curso</option>';
            if (cursos && cursos.length > 0) {
                cursos.forEach(curso => {
                    const opt = document.createElement('option');
                    opt.value = curso.id;
                    opt.textContent = `${curso.nombre_materia} - ${curso.anio || ''}`;
                    opt.dataset.nombre = curso.nombre_materia;
                    evalCursoSelect.appendChild(opt);
                });
            } else {
                evalCursoSelect.innerHTML = '<option value="">No tienes cursos creados</option>';
            }
        } catch (err) {
            console.error("Error cargando cursos:", err);
            evalCursoSelect.innerHTML = '<option value="">Error al cargar cursos</option>';
        }
    }

    loadCursosDropdown();
```

- [ ] **Step 2: Implement File Reader (including PDF parsing) and Form Submission for Evaluacion**
In `src/js/planificaciones.js`, inside the `form.addEventListener('submit')` logic, we need to add values extraction for the new `evaluacion` form, parse the file, and handle display/saving.

Target content (around lines 105-108):
```javascript
                    evaluacion: document.getElementById('proyecto-evaluacion').value
                };
            }
```

Replacement content:
```javascript
                    evaluacion: document.getElementById('proyecto-evaluacion').value
                };
            } else if (type === 'evaluacion') {
                const cursoSelect = document.getElementById('eval-curso');
                const selectedOpt = cursoSelect.options[cursoSelect.selectedIndex];
                const fileInput = document.getElementById('eval-archivo');

                // Read attached file if present
                let archivoTexto = '';
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    if (file.name.endsWith('.pdf')) {
                        archivoTexto = await parsePdfFile(file);
                    } else {
                        archivoTexto = await readTextFile(file);
                    }
                }

                data = {
                    ...data,
                    cursoId: cursoSelect.value,
                    materia: selectedOpt ? selectedOpt.dataset.nombre : '',
                    tipoRegistro: document.getElementById('eval-tipo-registro').value,
                    tipoPregunta: document.getElementById('eval-tipo-pregunta').value,
                    cantidad: document.getElementById('eval-cantidad').value,
                    fecha: document.getElementById('eval-fecha').value,
                    instrucciones: document.getElementById('eval-instrucciones').value,
                    soluciones: document.getElementById('eval-soluciones').checked,
                    archivoTexto: archivoTexto
                };
            }
```

We also need to define the helper functions `readTextFile` and `parsePdfFile` at the top or within the scope of the script:
Let's add these parsing helper functions.

Target content (around lines 116-119):
```javascript
            try {
                // Call AI Service
                const planJson = await AIService.generatePlan(data);
```

Replacement content:
```javascript
            try {
                // Call AI Service
                const planJson = await AIService.generatePlan(data);

                // Control Save button visibility
                const btnGuardarEval = document.getElementById('btn-guardar-evaluacion');
                if (btnGuardarEval) {
                    if (type === 'evaluacion') {
                        btnGuardarEval.style.display = 'inline-block';
                        btnGuardarEval.disabled = false;
                        btnGuardarEval.innerHTML = '<i class="fas fa-save"></i> Registrar y Agendar';
                    } else {
                        btnGuardarEval.style.display = 'none';
                    }
                }
```

Let's define the parsing functions:
Add this block before `document.addEventListener('DOMContentLoaded', ...)` or at the top of `src/js/planificaciones.js`:
```javascript
// --- File Helper Functions ---
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("Error leyendo archivo de texto"));
        reader.readAsText(file);
    });
}

async function parsePdfFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    } catch (e) {
        console.error("Error parsing PDF:", e);
        throw new Error("No se pudo extraer el texto del archivo PDF.");
    }
}
```

- [ ] **Step 3: Implement Database Save and Agenda Sync Event insertion**
In `src/js/planificaciones.js`, attach click handler to `#btn-guardar-evaluacion` to perform DB operations (insert into `evaluaciones` and `eventos` tables).

Target content (around lines 330-334):
```javascript
    // --- Curricula Logic ---
    const listaCurricula = document.getElementById('lista-curricula');
```

Replacement content:
```javascript
    // --- Save Evaluation to Supabase and Agenda ---
    const btnGuardarEval = document.getElementById('btn-guardar-evaluacion');
    if (btnGuardarEval) {
        btnGuardarEval.addEventListener('click', async () => {
            const plan = window.currentPlanJson;
            const data = window.currentPlanData;

            if (!plan || data.tipoPlan !== 'evaluacion') {
                Toastify({ text: "Solo se pueden registrar evaluaciones generadas.", duration: 3000, style: { background: "#ff5f6d" } }).showToast();
                return;
            }

            btnGuardarEval.disabled = true;
            btnGuardarEval.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                if (!session) {
                    throw new Error('No hay sesión activa. Por favor, inicia sesión.');
                }
                const userId = session.user.id;

                // 1. Insert into evaluaciones
                const evalInsert = {
                    user_id: userId,
                    id_curso: data.cursoId,
                    nombre: plan.titulo || `Evaluación de ${data.materia}`,
                    tipo: data.tipoRegistro, // 'escrita' or 'trabajos practicos'
                    fecha: data.fecha
                };

                const { data: evalResult, error: evalError } = await window.supabaseClient
                    .from('evaluaciones')
                    .insert([evalInsert])
                    .select();

                if (evalError) throw evalError;

                // 2. Format consignas for agenda event description
                let consignasDesc = '';
                if (plan.consignas && Array.isArray(plan.consignas)) {
                    consignasDesc = plan.consignas.map(c => {
                        let text = `${c.numero || ''}. ${c.pregunta || ''}`;
                        if (c.opciones && Array.isArray(c.opciones)) {
                            text += `\n   Opciones: ${c.opciones.join(' / ')}`;
                        }
                        if (c.respuesta_correcta) {
                            text += `\n   Solución: ${c.respuesta_correcta}`;
                        }
                        return text;
                    }).join('\n\n');
                } else {
                    consignasDesc = 'Consignas en el sistema.';
                }

                // 3. Insert into eventos (Agenda)
                const tituloPrefijo = data.tipoRegistro === 'trabajos practicos' ? '📝 TP' : '📝 Evaluación';
                const eventInsert = {
                    user_id: userId,
                    titulo: `${tituloPrefijo}: ${plan.titulo || data.materia}`,
                    descripcion: `Materia: ${data.materia}\n\nPreguntas:\n${consignasDesc}`,
                    fecha_hora_inicio: new Date(`${data.fecha}T08:00:00`).toISOString(),
                    fecha_limite: new Date(`${data.fecha}T09:30:00`).toISOString(),
                    tipo: 'recordatorio'
                };

                const { error: eventError } = await window.supabaseClient
                    .from('eventos')
                    .insert([eventInsert]);

                if (eventError) throw eventError;

                Toastify({
                    text: "Evaluación registrada y agendada con éxito",
                    duration: 3000,
                    style: { background: "linear-gradient(to right, #00b09b, #96c93d)" }
                }).showToast();

                btnGuardarEval.innerHTML = '<i class="fas fa-check"></i> Registrada y Agendada';
                btnGuardarEval.style.backgroundColor = '#34A853';

            } catch (error) {
                console.error("Error registering evaluation:", error);
                Toastify({ text: "Error: " + error.message, duration: 3000, style: { background: "#ff5f6d" } }).showToast();
                btnGuardarEval.disabled = false;
                btnGuardarEval.innerHTML = '<i class="fas fa-save"></i> Registrar y Agendar';
            }
        });
    }

    // --- Curricula Logic ---
    const listaCurricula = document.getElementById('lista-curricula');
```

- [ ] **Step 4: Verify planificaciones.js changes by running git diff**
Run: `git diff src/js/planificaciones.js`

---

### Task 4: Service Worker and Cache Updating

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Increment cache version to trigger clients reload**
Change the `CACHE_NAME` version string inside `sw.js` (around line 2).

Target content:
```javascript
const CACHE_NAME = 'profeapp-v2.1.2';
```

Replacement content:
```javascript
const CACHE_NAME = 'profeapp-v2.2.0';
```

- [ ] **Step 2: Commit all modified and created files**
Commit the code changes with descriptive git message.

```bash
git add src/pages/planificaciones.html src/js/ai_service.js src/js/planificaciones.js sw.js
git commit -m "feat: add AI evaluation generator with database save and calendar event scheduling"
```
