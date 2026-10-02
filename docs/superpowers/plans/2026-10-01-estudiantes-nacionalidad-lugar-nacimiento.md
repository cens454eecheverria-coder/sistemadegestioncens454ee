# Plan de Implementación: Lugar de Nacimiento y Nacionalidad de Estudiantes + Estadísticas en Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar Nacionalidad y Lugar de Nacimiento en los registros de estudiantes (Supabase, Preceptoría, Secretaría, Preinscripciones web, Portal de Alumnos) y generar estadísticas y gráficos demográficos en el Dashboard institucional.

**Architecture:** Modificación de esquemas en Supabase mediante API de migración SQL, estandarización de opciones de nacionalidad en helper reutilizable, integración de campos en todos los formularios y actualización de los cálculos y componentes de gráficos en el Dashboard usando `recharts`.

**Tech Stack:** Next.js 14+ (App Router), Supabase JS Client & Management API, Tailwind CSS, Recharts, Lucide Icons, SweetAlert2.

---

### Task 1: Migración de Esquema en Supabase

**Files:**
- Create: `sql/migration_nacionalidad_lugar_nacimiento.sql`

- [ ] **Step 1: Crear archivo de migración SQL**
Escribir el script SQL con las columnas `nacionalidad` y `lugar_nacimiento`, el backfill de datos existentes y la recarga de esquemas PostgREST.

- [ ] **Step 2: Ejecutar migración contra Supabase usando el token de gestión**
Llamar a la API de Supabase `POST /v1/projects/agipgjjcbvjattdzjjbr/database/query` con el token `<SUPABASE_ACCESS_TOKEN>`.

- [ ] **Step 3: Verificar que las columnas existan y los datos hayan sido migrados**
Consultar `information_schema.columns` y realizar un `SELECT id, apellido, nombre, nacionalidad, lugar_nacimiento FROM estudiantes LIMIT 5`.

- [ ] **Step 4: Commit**
```bash
git add sql/migration_nacionalidad_lugar_nacimiento.sql
git commit -m "feat(db): add nacionalidad and lugar_nacimiento columns with backfill"
```

---

### Task 2: Constante y Helpers de Nacionalidad

**Files:**
- Create: `lib/nacionalidades.js`

- [ ] **Step 1: Crear archivo `lib/nacionalidades.js`**
Definir la lista canónica de países frecuentes en la región escolar (Argentina, Bolivia, Paraguay, Perú, Venezuela, Uruguay, Colombia, Chile, Brasil) y función de normalización.

- [ ] **Step 2: Commit**
```bash
git add lib/nacionalidades.js
git commit -m "feat(lib): add nacionalidades list and helper constants"
```

---

### Task 3: Integración en Preceptoría (`app/preceptores/page.jsx`)

**Files:**
- Modify: `app/preceptores/page.jsx`

- [ ] **Step 1: Agregar campos y estado en Modal de Inscripción**
Agregar `nacionalidad` (con selector rápido y soporte para "Otra") y `lugar_nacimiento` en el formulario y en el objeto `studentData`.

- [ ] **Step 2: Actualizar Modal de Legajo de Estudiante**
Permitir editar `nacionalidad` y `lugar_nacimiento` en el legajo y guardar en Supabase en `handleUpdateLegajoSubmit`.

- [ ] **Step 3: Mostrar Nacionalidad y Lugar de Nacimiento en la Ficha del Calificador**
En la tarjeta de "Datos Personales" de `selectedCalificadorStudent`, mostrar `Nacionalidad` y `Lugar de Nac.`.

- [ ] **Step 4: Commit**
```bash
git add app/preceptores/page.jsx
git commit -m "feat(preceptores): incorporate nacionalidad and lugar_nacimiento in registration, legajo and student card"
```

---

### Task 4: Integración en Secretaría (`app/secretaria/page.jsx`)

**Files:**
- Modify: `app/secretaria/page.jsx`

- [ ] **Step 1: Agregar estados y carga de `editNacionalidad` y `editLugarNacimiento`**
En `handleOpenEditModal(est)`, inicializar `editNacionalidad` y `editLugarNacimiento`.

- [ ] **Step 2: Incluir campos en el payload de actualización**
En `handleGuardarModificacionEstudiante`, agregar `nacionalidad: editNacionalidad` y `lugar_nacimiento: editLugarNacimiento` (y `ciudad_nacimiento: editLugarNacimiento`).

- [ ] **Step 3: Agregar controles visuales en el Modal de Modificación de Legajo**
Incorporar selector de Nacionalidad y campo de texto para Lugar de Nacimiento dentro de la sección "Datos Personales".

- [ ] **Step 4: Commit**
```bash
git add app/secretaria/page.jsx
git commit -m "feat(secretaria): add nacionalidad and lugar_nacimiento in legajo editing modal"
```

---

### Task 5: Preinscripciones Web y Aprobación (`app/preinscripcion/page.jsx` y `app/admin/preinscripciones/page.jsx`)

**Files:**
- Modify: `app/preinscripcion/page.jsx`
- Modify: `app/admin/preinscripciones/page.jsx`

- [ ] **Step 1: Actualizar formulario público en `app/preinscripcion/page.jsx`**
Añadir inputs para Nacionalidad (selector) y Lugar de Nacimiento (texto), enviándolos en el insert de `preinscripciones`.

- [ ] **Step 2: Actualizar vista de solicitudes y matriculación en `app/admin/preinscripciones/page.jsx`**
Mostrar Nacionalidad y Lugar de Nacimiento en los datos de la solicitud y transferirlos a `estudiantes` en `handleProcesarSolicitud`.

- [ ] **Step 3: Commit**
```bash
git add app/preinscripcion/page.jsx app/admin/preinscripciones/page.jsx
git commit -m "feat(preinscripcion): add nacionalidad and lugar_nacimiento to public form and admin matriculation"
```

---

### Task 6: Portal del Estudiante (`app/estudiantes/page.jsx`)

**Files:**
- Modify: `app/estudiantes/page.jsx`

- [ ] **Step 1: Mostrar Nacionalidad y Lugar de Nacimiento en el perfil del alumno**
En la cabecera / ficha informativa de `estudianteInfo`, incorporar insignias o datos de `Nacionalidad` y `Lugar de Nacimiento`.

- [ ] **Step 2: Commit**
```bash
git add app/estudiantes/page.jsx
git commit -m "feat(estudiantes): display nacionalidad and lugar_nacimiento in student portal"
```

---

### Task 7: Estadísticas y Gráficos en Dashboard (`app/dashboard/page.jsx`)

**Files:**
- Modify: `app/dashboard/page.jsx`

- [ ] **Step 1: Calcular métricas demográficas de Nacionalidad y Lugares de Nacimiento**
En `loadDashboardData`, procesar la lista de `activos` agrupando por `nacionalidad` y por `lugar_nacimiento`. Crear arrays formateados para `nacionalidadGlobal` y `lugarNacimientoTop`.

- [ ] **Step 2: Agregar componentes visuales con `recharts`**
En la pestaña de Estadísticas, renderizar:
- Gráfico Donut/Pie: "Distribución por Nacionalidad (Global)" con leyenda, porcentaje y tooltip.
- Gráfico de Barras: "Top Lugares de Nacimiento" con las localidades más frecuentes.

- [ ] **Step 3: Commit**
```bash
git add app/dashboard/page.jsx
git commit -m "feat(dashboard): add nationality and birthplace distribution charts and stats"
```

---

### Task 8: Verificación y Build del Sistema

**Files:**
- Verification only

- [ ] **Step 1: Ejecutar `npm run build`**
Comprobar compilación exitosa de Next.js sin errores de sintaxis ni de tipos.

- [ ] **Step 2: Verificar respuesta y consistencia final**
Confirmar funcionamiento completo de los endpoints, vistas y datos.
