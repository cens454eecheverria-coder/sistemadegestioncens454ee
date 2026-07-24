-- ====================================================================
-- ESQUEMA Y POLÍTICAS RLS SISTEMA DE GESTIÓN CENS N° 454
-- Esteban Echeverría - Provincia de Buenos Aires (Región 5)
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

-- 2. POLÍTICAS RLS PERMISIVAS PARA CRUD TOTAL (PUBLIC & AUTHENTICATED)

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
