-- ====================================================================
-- CREACIÓN DE TABLAS BASE - CENS 454 ESTEBAN ECHEVERRÍA
-- ====================================================================

-- 1. Tablas de Ciclos Lectivos
CREATE TABLE IF NOT EXISTS public.ciclos_lectivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anio INTEGER NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT false,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Cursos (Orientaciones CENS 454)
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_materia VARCHAR(150),
    anio INTEGER NOT NULL CHECK (anio IN (1, 2, 3)),
    division VARCHAR(10) NOT NULL,
    orientacion VARCHAR(100) NOT NULL, -- Ej: 'Sociales', 'Perito Mercantil', 'Ciencias Naturales'
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('Mañana', 'Tarde', 'Noche', 'Manana')),
    ciclo_lectivo_id UUID REFERENCES public.ciclos_lectivos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(anio, division, turno, ciclo_lectivo_id)
);

-- 3. Tabla de Estudiantes
CREATE TABLE IF NOT EXISTS public.estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(20) NOT NULL UNIQUE,
    cuil VARCHAR(25) UNIQUE,
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    email VARCHAR(150),
    telefono VARCHAR(50),
    direccion TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'baja', 'egresado', 'suspendido')),
    fecha_baja DATE,
    motivo_baja TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Matrícula / Inscripciones por Curso y Ciclo
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    ciclo_lectivo_id UUID REFERENCES public.ciclos_lectivos(id) ON DELETE CASCADE,
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(estudiante_id, curso_id, ciclo_lectivo_id)
);

-- Relación simplificada de inscripción alumno-curso
CREATE TABLE IF NOT EXISTS public.alumnos_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_alumno UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    id_curso UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(id_alumno, id_curso)
);

-- 5. Tabla de Asistencias Diarias
CREATE TABLE IF NOT EXISTS public.asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('presente', 'ausente', 'justificado', 'media_falta')),
    observacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(estudiante_id, curso_id, fecha)
);

-- 6. Tabla de Docentes
CREATE TABLE IF NOT EXISTS public.docentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(20) NOT NULL UNIQUE,
    cuil VARCHAR(25) UNIQUE,
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(50),
    titulo VARCHAR(150),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla de Materias / Espacios Curriculares
CREATE TABLE IF NOT EXISTS public.materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    horas_semanales INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Vinculación Docente - Materia
CREATE TABLE IF NOT EXISTS public.docente_materia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    docente_id UUID REFERENCES public.docentes(id) ON DELETE CASCADE,
    materia_id UUID REFERENCES public.materias(id) ON DELETE CASCADE,
    cargo VARCHAR(50) DEFAULT 'titular' CHECK (cargo IN ('titular', 'suplente', 'provisorio')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(docente_id, materia_id)
);

-- 9. Tabla de Calificaciones
CREATE TABLE IF NOT EXISTS public.calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    materia_id UUID REFERENCES public.materias(id) ON DELETE CASCADE,
    cuatrimestre VARCHAR(10) CHECK (cuatrimestre IN ('Q1', 'Q2', 'RIE', 'DicFeb', 'JulAgo')),
    evaluacion_nombre VARCHAR(100),
    nota NUMERIC(4,2),
    nota_q1 NUMERIC(4,2),
    nota_q2 NUMERIC(4,2),
    nota_final NUMERIC(4,2),
    nota_rie NUMERIC(4,2),
    cerrado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Notas Finales Calculadas / Sobrescritas
CREATE TABLE IF NOT EXISTS public.notas_finales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_curso UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    id_alumno UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    periodo VARCHAR(50) NOT NULL CHECK (periodo IN ('cuatrimestre1', 'cuatrimestre2', 'anual')),
    calificacion_final VARCHAR(20) NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(id_curso, id_alumno, periodo)
);

-- 10. Libro de Temas DICYT
CREATE TABLE IF NOT EXISTS public.libro_dicyt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    materia_id UUID REFERENCES public.materias(id) ON DELETE CASCADE,
    docente_id UUID REFERENCES public.docentes(id),
    fecha DATE NOT NULL,
    modulo INTEGER CHECK (modulo IN (1, 2, 3)),
    contenido_desarrollado TEXT NOT NULL,
    actividades TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Preinscripciones Públicas
CREATE TABLE IF NOT EXISTS public.preinscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(20) NOT NULL,
    cuil VARCHAR(25),
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(50) NOT NULL,
    orientacion_interes VARCHAR(100),
    turno_preferido VARCHAR(20),
    estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'documentacion_incompleta', 'rechazada')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Bitácora de Observaciones y Alertas de Riesgo
CREATE TABLE IF NOT EXISTS public.bitacora_observaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    tipo VARCHAR(50) DEFAULT 'entrevista',
    detalle TEXT NOT NULL,
    responsable VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- POLÍTICAS DE SEGURIDAD RLS
-- ====================================================================

ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preinscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_observaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir insercion publica de preinscripciones" 
ON public.preinscripciones 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir lectura general autenticada preinscripciones" 
ON public.preinscripciones 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir modificacion de preinscripciones" 
ON public.preinscripciones 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir todo acceso estudiantes" ON public.estudiantes FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso asistencias" ON public.asistencias FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso calificaciones" ON public.calificaciones FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso docentes" ON public.docentes FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso cursos" ON public.cursos FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso bitacora" ON public.bitacora_observaciones FOR ALL USING (true);

CREATE OR REPLACE FUNCTION public.rpc_eliminar_estudiante_definitivo(p_estudiante_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.bitacora_observaciones WHERE estudiante_id = p_estudiante_id;
    DELETE FROM public.asistencias WHERE estudiante_id = p_estudiante_id;
    DELETE FROM public.calificaciones WHERE estudiante_id = p_estudiante_id;
    DELETE FROM public.notas_finales WHERE id_alumno = p_estudiante_id;
    DELETE FROM public.alumnos_cursos WHERE id_alumno = p_estudiante_id;
    DELETE FROM public.matriculas WHERE estudiante_id = p_estudiante_id;
    DELETE FROM public.estudiantes WHERE id = p_estudiante_id;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;
