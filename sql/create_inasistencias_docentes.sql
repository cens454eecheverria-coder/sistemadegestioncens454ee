-- ====================================================================
-- SCRIPT DE MIGRACIÓN: CREACIÓN TABLA 'inasistencias_docentes'
-- Copia y ejecutá este script en el SQL Editor de tu Dashboard Supabase:
-- https://supabase.com/dashboard/project/agipgjjcbvjattdzjjbr/sql
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.inasistencias_docentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID REFERENCES public.docentes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  cantidad_dias INT NOT NULL DEFAULT 1,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS y Políticas Permisivas
ALTER TABLE public.inasistencias_docentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inasistencias_docentes_all_policy" ON public.inasistencias_docentes;
CREATE POLICY "inasistencias_docentes_all_policy" ON public.inasistencias_docentes FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- Notificar a PostgREST para actualizar el caché de tablas en tiempo real
NOTIFY pgrst, 'reload schema';

-- Agregar columna archivado si no existe
ALTER TABLE public.inasistencias_docentes ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT false;
