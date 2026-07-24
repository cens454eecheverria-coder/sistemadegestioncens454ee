-- ====================================================================
-- SCRIPT DE MIGRACIÓN & TABLAS COMPLETAS SISTEMA CENS N° 454
-- Copia y pega todo este contenido en el SQL Editor de Supabase
-- ====================================================================

-- 1. TABLA SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  grades_locked BOOLEAN DEFAULT false,
  active_ciclo INT DEFAULT 2026,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
INSERT INTO system_settings (id, grades_locked, active_ciclo)
VALUES (1, false, 2026)
ON CONFLICT (id) DO NOTHING;

-- 2. TABLA HORARIOS ESCOLARES
CREATE TABLE IF NOT EXISTS horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE,
  docente_id UUID REFERENCES docentes(id) ON DELETE SET NULL,
  dia_semana INT NOT NULL,
  modulo INT NOT NULL,
  aula VARCHAR(50) DEFAULT 'Aula 4',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA SALIDAS EDUCATIVAS (ANEXO IV Y V)
CREATE TABLE IF NOT EXISTS salidas_educativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_nombre TEXT NOT NULL,
  lugar TEXT,
  fecha_salida DATE,
  fecha_regreso DATE,
  itinerario TEXT,
  docente_titular_id UUID REFERENCES docentes(id) ON DELETE SET NULL,
  acompanantes TEXT,
  alumnos_participantes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA BAJAS Y PASES
CREATE TABLE IF NOT EXISTS bajas_pases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  escuela_destino TEXT,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  fecha_solicitud DATE DEFAULT CURRENT_DATE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DECLARACIONES JURADAS DOCENTES (DDJJ)
CREATE TABLE IF NOT EXISTS ddjj_docentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID REFERENCES docentes(id) ON DELETE CASCADE,
  anio INT DEFAULT 2026,
  establecimiento_externo TEXT,
  cargo_externo TEXT,
  horario_externo TEXT,
  dias_externos TEXT,
  fecha_presentacion DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA HORAS NO FRENTE A ALUMNO
CREATE TABLE IF NOT EXISTS horas_n_frente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID REFERENCES docentes(id) ON DELETE CASCADE,
  proyecto TEXT NOT NULL,
  horas INT DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABLA TÍTULOS Y EGRESADOS
CREATE TABLE IF NOT EXISTS titulos_egresados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  folio VARCHAR(50),
  acta VARCHAR(50),
  libro_matriz VARCHAR(50),
  fecha_egreso DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- HABILITACIÓN DE POLÍTICAS RLS PERMISIVAS (CRUD TOTAL)
-- ====================================================================

-- MATERIAS
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materias_all_policy" ON materias;
DROP POLICY IF EXISTS "materias_select_policy" ON materias;
DROP POLICY IF EXISTS "materias_insert_policy" ON materias;
CREATE POLICY "materias_all_policy" ON materias FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- DOCENTES
ALTER TABLE docentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "docentes_all_policy" ON docentes;
DROP POLICY IF EXISTS "docentes_select_policy" ON docentes;
DROP POLICY IF EXISTS "docentes_insert_policy" ON docentes;
CREATE POLICY "docentes_all_policy" ON docentes FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- DOCENTE_MATERIA
ALTER TABLE docente_materia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "docente_materia_all_policy" ON docente_materia;
CREATE POLICY "docente_materia_all_policy" ON docente_materia FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- CURSOS
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cursos_all_policy" ON cursos;
CREATE POLICY "cursos_all_policy" ON cursos FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- HORARIOS
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "horarios_all_policy" ON horarios;
CREATE POLICY "horarios_all_policy" ON horarios FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- ESTUDIANTES
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estudiantes_all_policy" ON estudiantes;
CREATE POLICY "estudiantes_all_policy" ON estudiantes FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- SYSTEM_SETTINGS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_settings_all_policy" ON system_settings;
CREATE POLICY "system_settings_all_policy" ON system_settings FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- SALIDAS_EDUCATIVAS
ALTER TABLE salidas_educativas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salidas_educativas_all_policy" ON salidas_educativas;
CREATE POLICY "salidas_educativas_all_policy" ON salidas_educativas FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- BAJAS_PASES
ALTER TABLE bajas_pases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bajas_pases_all_policy" ON bajas_pases;
CREATE POLICY "bajas_pases_all_policy" ON bajas_pases FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- DDJJ_DOCENTES
ALTER TABLE ddjj_docentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ddjj_docentes_all_policy" ON ddjj_docentes;
CREATE POLICY "ddjj_docentes_all_policy" ON ddjj_docentes FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- HORAS_N_FRENTE
ALTER TABLE horas_n_frente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "horas_n_frente_all_policy" ON horas_n_frente;
CREATE POLICY "horas_n_frente_all_policy" ON horas_n_frente FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- TITULOS_EGRESADOS
ALTER TABLE titulos_egresados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "titulos_egresados_all_policy" ON titulos_egresados;
CREATE POLICY "titulos_egresados_all_policy" ON titulos_egresados FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- AGREGAR COLUMNAS DE LEGAJO A ESTUDIANTES SI NO EXISTEN
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS numero_libro TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS numero_folio TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS fotocopia_dni BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS partida_nacimiento BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS certificado_estudios BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tipo_certificado TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS materias_adeudadas TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS ciudad_nacimiento TEXT;
