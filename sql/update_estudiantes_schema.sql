-- ====================================================================
-- SCRIPT DE ACTUALIZACIÓN DE ESQUEMA PARA LA TABLA 'estudiantes'
-- Copia y ejecutá este script en el SQL Editor de tu Dashboard Supabase
-- URL SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Incorporar todas las columnas faltantes a la tabla 'estudiantes'
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS genero TEXT DEFAULT 'Masculino';
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS ciudad_nacimiento TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS orientacion TEXT DEFAULT 'Ciencias Sociales';
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS fotocopia_dni BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS partida_nacimiento BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS certificado_estudios BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tipo_certificado TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS materias_adeudadas TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS numero_libro TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS numero_folio TEXT;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS curso_id UUID;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS en_condicion_titulo BOOLEAN DEFAULT false;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS estado_titulo TEXT DEFAULT 'En Trámite';

-- 2. Recargar cache de esquemas PostgREST
NOTIFY pgrst, 'reload schema';