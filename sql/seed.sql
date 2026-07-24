-- ====================================================================
-- DATOS INICIALES Y SEMILLERO (SEED) - CENS 454 ESTEBAN ECHEVERRÍA
-- ====================================================================

-- 1. Ciclo Lectivo Activo 2026
INSERT INTO public.ciclos_lectivos (anio, activo, fecha_inicio, fecha_fin)
VALUES (2026, true, '2026-03-02', '2026-12-18')
ON CONFLICT (anio) DO UPDATE SET activo = true;

-- 2. Cursos CENS 454 (Orientaciones: Sociales, Perito Mercantil, Ciencias Naturales)
WITH ciclo AS (SELECT id FROM public.ciclos_lectivos WHERE anio = 2026 LIMIT 1)
INSERT INTO public.cursos (anio, division, orientacion, turno, ciclo_lectivo_id)
SELECT 1, 'A', 'Ciencias Sociales', 'Noche', ciclo.id FROM ciclo
ON CONFLICT DO NOTHING;

WITH ciclo AS (SELECT id FROM public.ciclos_lectivos WHERE anio = 2026 LIMIT 1)
INSERT INTO public.cursos (anio, division, orientacion, turno, ciclo_lectivo_id)
SELECT 2, 'A', 'Perito Mercantil / Administración', 'Tarde', ciclo.id FROM ciclo
ON CONFLICT DO NOTHING;

WITH ciclo AS (SELECT id FROM public.ciclos_lectivos WHERE anio = 2026 LIMIT 1)
INSERT INTO public.cursos (anio, division, orientacion, turno, ciclo_lectivo_id)
SELECT 3, 'A', 'Ciencias Naturales y Salud', 'Mañana', ciclo.id FROM ciclo
ON CONFLICT DO NOTHING;

-- 3. Estudiantes de Ejemplo para Esteban Echeverría
INSERT INTO public.estudiantes (dni, cuil, apellido, nombre, fecha_nacimiento, email, telefono, direccion, estado)
VALUES
('38492011', '20-38492011-4', 'García', 'Carlos Eduardo', '1994-05-12', 'carlos.garcia@gmail.com', '11-4920-1122', 'Av. Fair 1420, Monte Grande', 'activo'),
('40123984', '27-40123984-3', 'Rodríguez', 'María Belén', '1997-09-24', 'maria.rodriguez@hotmail.com', '11-5839-4455', 'Santiesteban 450, El Guillón', 'activo'),
('35881920', '20-35881920-9', 'López', 'Juan Ignacio', '1991-01-30', 'juan.lopez@yahoo.com', '11-3829-1029', 'Lucio Meléndez 890, Canning', 'activo'),
('42901823', '27-42901823-1', 'Fernández', 'Sofía Lucía', '2000-11-05', 'sofia.fernandez@gmail.com', '11-6677-8899', 'Alem 120, Monte Grande', 'activo')
ON CONFLICT (dni) DO NOTHING;

-- 4. Docentes de Ejemplo
INSERT INTO public.docentes (dni, cuil, apellido, nombre, email, telefono, titulo)
VALUES
('28192834', '20-28192834-5', 'Martínez', 'Roberto Miguel', 'profesor.martinez@cens454.edu.ar', '11-4455-6677', 'Profesor de Historia y Geografía'),
('31920394', '27-31920394-8', 'Gómez', 'Ana Paula', 'profesora.gomez@cens454.edu.ar', '11-2233-4455', 'Licenciada en Matemática')
ON CONFLICT (dni) DO NOTHING;

-- 5. Materias
WITH curso1 AS (SELECT id FROM public.cursos WHERE anio = 1 LIMIT 1)
INSERT INTO public.materias (nombre, curso_id, horas_semanales)
SELECT 'Lengua y Literatura', curso1.id, 4 FROM curso1
ON CONFLICT DO NOTHING;

WITH curso1 AS (SELECT id FROM public.cursos WHERE anio = 1 LIMIT 1)
INSERT INTO public.materias (nombre, curso_id, horas_semanales)
SELECT 'Historia Argentina y Latinoamericana', curso1.id, 3 FROM curso1
ON CONFLICT DO NOTHING;

-- 6. Preinscripción Abierta Ejemplo
INSERT INTO public.preinscripciones (dni, cuil, apellido, nombre, email, telefono, orientacion_interes, turno_preferido, estado, observaciones)
VALUES
('45102938', '20-45102938-2', 'Pérez', 'Gonzalo Valentín', 'gonzalo.perez@gmail.com', '11-9988-7766', 'Ciencias Sociales', 'Noche', 'pendiente', 'Pendiente de entrega de analítico previo.')
ON CONFLICT DO NOTHING;
