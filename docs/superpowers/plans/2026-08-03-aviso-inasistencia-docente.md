# Formulario de Aviso de Inasistencia Docente - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un formulario de acceso público (`/aviso-inasistencia`) para que los docentes del CENS 454 registren sus avisos de inasistencia autocompletando sus datos con DNI o CUIL, y haciendo impactar el aviso en tiempo real en el Dashboard de Directivos, el Panel de Preceptores y el Módulo de Alertas.

**Architecture:** Se agrega la tabla `inasistencias_docentes` en Supabase con políticas RLS permisivas. Se crea la página pública Next.js App Router `app/aviso-inasistencia/page.jsx` con verificación instantánea de docente por DNI/CUIL, selector de causa con alerta obligatoria para *Causas Particulares*, e integración en los dashboards institucionales (`app/dashboard/page.jsx`, `app/preceptores/page.jsx`, `app/alertas/page.jsx`).

**Tech Stack:** Next.js (App Router), Supabase JS Client, Tailwind CSS, SweetAlert2, Lucide React Icons.

---

### Task 1: Database Schema Migration for `inasistencias_docentes`

**Files:**
- Modify: `sql/schema.sql`

- [ ] **Step 1: Add table definition and RLS policies to `sql/schema.sql`**
Add `inasistencias_docentes` table definition with RLS policy:
```sql
-- TABLA INASISTENCIAS DOCENTES
CREATE TABLE IF NOT EXISTS inasistencias_docentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID REFERENCES docentes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  cantidad_dias INT NOT NULL DEFAULT 1,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE inasistencias_docentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inasistencias_docentes_all_policy" ON inasistencias_docentes;
CREATE POLICY "inasistencias_docentes_all_policy" ON inasistencias_docentes FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Commit**
```bash
git add sql/schema.sql
git commit -m "feat: add inasistencias_docentes table and RLS policies"
```

---

### Task 2: Create Public Absence Notice Page (`app/aviso-inasistencia/page.jsx`)

**Files:**
- Create: `app/aviso-inasistencia/page.jsx`

- [ ] **Step 1: Implement Next.js public page with DNI/CUIL lookup and absence form**
Build the full responsive UI with CENS 454 header, DNI/CUIL auto-lookup, autocompleted teacher info card, failure/success states, type selector, and mandatory legend for Causas Particulares.

- [ ] **Step 2: Commit**
```bash
git add app/aviso-inasistencia/page.jsx
git commit -m "feat: build public teacher absence notice page with DNI/CUIL autocomplete"
```

---

### Task 3: Integrate Absence Notices into Directivos Dashboard (`app/dashboard/page.jsx`)

**Files:**
- Modify: `app/dashboard/page.jsx`

- [ ] **Step 1: Fetch and render active `inasistencias_docentes` in Directivo Dashboard**
Add real-time query for `inasistencias_docentes` with teacher joins (`docentes(nombre, apellido, email)`), metric counter card for active teacher absences, and interactive recent notices table.

- [ ] **Step 2: Commit**
```bash
git add app/dashboard/page.jsx
git commit -m "feat: show teacher absence notices and metric counter in directivo dashboard"
```

---

### Task 4: Integrate Absence Notices into Preceptor Panel (`app/preceptores/page.jsx`)

**Files:**
- Modify: `app/preceptores/page.jsx`

- [ ] **Step 1: Add "Inasistencias Docentes" sub-tab / section in Preceptor Panel**
Display upcoming and active teacher absences with teacher details, date range, type, and assigned courses to facilitate preceptors in covering classes.

- [ ] **Step 2: Commit**
```bash
git add app/preceptores/page.jsx
git commit -m "feat: add teacher absence notices tab for class coverage planning"
```

---

### Task 5: Update Module Navigation, Alerts (`app/alertas/page.jsx`), Login (`app/login/page.jsx`), Sidebar (`components/Sidebar.jsx`), & Docentes Portal (`app/docentes/page.jsx`)

**Files:**
- Modify: `app/alertas/page.jsx`
- Modify: `app/login/page.jsx`
- Modify: `components/Sidebar.jsx`
- Modify: `app/docentes/page.jsx`

- [ ] **Step 1: Add teacher absence alerts to `app/alertas/page.jsx`**
Generate dynamic alerts whenever there are active or pending teacher absence notices.

- [ ] **Step 2: Add direct public links in Login, Sidebar, and Portal Docente**
Provide quick access buttons to `/aviso-inasistencia` from login page footer/header and teacher portal.

- [ ] **Step 3: Run build verification `npm run build`**
Verify zero TypeScript / syntax errors.

- [ ] **Step 4: Commit**
```bash
git add app/alertas/page.jsx app/login/page.jsx components/Sidebar.jsx app/docentes/page.jsx
git commit -m "feat: connect teacher absence alerts and add public navigation shortcuts"
```
