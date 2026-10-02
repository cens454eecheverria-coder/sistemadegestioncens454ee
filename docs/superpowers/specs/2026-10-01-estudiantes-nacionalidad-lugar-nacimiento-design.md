# Especificación de Diseño: Incorporación de Lugar de Nacimiento y Nacionalidad de Estudiantes y Estadísticas en Dashboard

## 1. Resumen y Objetivos
Incorporar en la gestión de estudiantes del CENS N° 454 los campos **Nacionalidad** y **Lugar de Nacimiento** a lo largo de todo el ciclo de vida del estudiante (base de datos en Supabase, preinscripciones web, legajos en preceptoría y secretaría, vista de estudiante) y reflejar métricas y gráficos demográficos en el Dashboard institucional.

## 2. Modelo de Datos y Migración en Supabase
### 2.1 Tablas Involucradas
- `estudiantes`:
  - `nacionalidad` (TEXT, default 'Argentina')
  - `lugar_nacimiento` (TEXT)
  - `ciudad_nacimiento` (TEXT, mantenido para retrocompatibilidad y backfilled a `lugar_nacimiento`)
- `preinscripciones`:
  - `nacionalidad` (TEXT, default 'Argentina')
  - `lugar_nacimiento` (TEXT)

### 2.2 Sentencias SQL
```sql
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS nacionalidad TEXT DEFAULT 'Argentina';
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS lugar_nacimiento TEXT;
UPDATE estudiantes SET lugar_nacimiento = ciudad_nacimiento WHERE lugar_nacimiento IS NULL AND ciudad_nacimiento IS NOT NULL;
UPDATE estudiantes SET nacionalidad = 'Argentina' WHERE nacionalidad IS NULL;

ALTER TABLE preinscripciones ADD COLUMN IF NOT EXISTS nacionalidad TEXT DEFAULT 'Argentina';
ALTER TABLE preinscripciones ADD COLUMN IF NOT EXISTS lugar_nacimiento TEXT;

NOTIFY pgrst, 'reload schema';
```

## 3. Interfaces y Formularios

### 3.1 Módulo de Preceptoría (`app/preceptores/page.jsx`)
- **Modal de Inscripción de Estudiantes**:
  - Selector de Nacionalidad con opciones rápidas (Argentina por defecto, Bolivia, Paraguay, Perú, Venezuela, Uruguay, Colombia, Chile, Brasil, Otra...) y campo para especificar si selecciona "Otra".
  - Campo de texto libre para Lugar de Nacimiento.
- **Modal de Modificación de Legajo**:
  - Edición de Nacionalidad y Lugar de Nacimiento, persistiendo en `estudiantes`.
- **Ficha del Calificador**:
  - Muestra la Nacionalidad y el Lugar de Nacimiento en los datos personales del estudiante seleccionado.

### 3.2 Módulo de Secretaría (`app/secretaria/page.jsx`)
- **Modal Modificar Legajo**:
  - Incorporar inputs para `nacionalidad` y `lugar_nacimiento`.
  - Asegurar que el payload enviado a Supabase en `handleGuardarModificacionEstudiante` incluya ambos campos.
- **Visualización y Emisión**:
  - Información disponible para constancias y legajos.

### 3.3 Preinscripciones Web
- `app/preinscripcion/page.jsx`:
  - Agregar campos de Nacionalidad (con selector) y Lugar de Nacimiento en el formulario público.
- `app/admin/preinscripciones/page.jsx`:
  - Mostrar Nacionalidad y Lugar de Nacimiento en la tabla/detalle de solicitudes.
  - Al aprobar y matricular (`handleProcesarSolicitud`), transferir ambos campos a la tabla `estudiantes`.

### 3.4 Portal del Estudiante (`app/estudiantes/page.jsx`)
- Mostrar Nacionalidad y Lugar de Nacimiento en la tarjeta de presentación del estudiante.

## 4. Estadísticas del Dashboard (`app/dashboard/page.jsx`)
- Agregación en memoria de la matrícula activa (`activos`):
  - Conteo por país de nacionalidad.
  - Top 5 de lugares de nacimiento más frecuentes.
- Componentes gráficos con `recharts`:
  - Gráfico Circular / Donut (`PieChart`): "Distribución por Nacionalidad (Global)".
  - Gráfico de Barras (`BarChart`): "Top Lugares de Nacimiento".
- Tarjeta de indicadores resumen demográficos.

## 5. Pruebas y Criterios de Aceptación
1. Migración SQL ejecutada sin errores en Supabase.
2. Inscribir un estudiante con nacionalidad "Bolivia" y lugar de nacimiento "Santa Cruz de la Sierra" guarda correctamente ambos valores.
3. Modificar un legajo en Secretaría y Preceptoría actualiza los campos sin perder información previa.
4. Preinscribir un alumno desde la web guarda su nacionalidad y lugar de nacimiento, y al aprobarlo se transfieren a `estudiantes`.
5. El Dashboard muestra los gráficos con los datos agregados reales.
