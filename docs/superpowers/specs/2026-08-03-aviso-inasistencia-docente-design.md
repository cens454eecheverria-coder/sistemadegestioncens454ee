# Especificación de Diseño: Formulario de Aviso de Inasistencia Docente CENS 454

## 1. Visión General
Se implementa un formulario de acceso público para que los docentes del CENS N° 454 puedan registrar sus avisos de inasistencia. La información del docente se autocompleta automáticamente al ingresar su DNI o CUIL. El registro impacta en tiempo real en la base de datos de Supabase y notifica dinámicamente tanto al equipo directivo (Dashboard) como a los preceptores (Panel de Preceptores y Alertas).

## 2. Requerimientos Funcionales
- **Acceso Público**: Ruta /aviso-inasistencia accesible sin autenticación previa.
- **Autocompletado de Datos**:
  - El docente ingresa su DNI o CUIL.
  - El sistema consulta la tabla docentes y trae Nombre, Apellido, Email, Teléfono y Materias/Cursos asignados via docente_materia.
- **Tipos de Inasistencia**:
  - Licencia Médica
  - Causas Particulares: Muestra obligatoriamente una leyenda de advertencia destacada: * Debe enviarse una nota al correo oficial de puño y letra solicitándola.*
  - Capacitación / Comisión de Servicio
  - Fuerza Mayor / Otro
- **Campos del Aviso**:
  - Cantidad de días (numérico, mínimo 1).
  - Fecha de inicio (Date picker).
  - Observaciones / Motivo (texto opcional).
- **Visualización en el Sistema (Aviso a Directivos y Preceptores)**:
  - **Dashboard Directivo (pp/dashboard/page.jsx)**: Tarjeta interactiva con avisos recientes y contador de docentes ausentes.
  - **Panel de Preceptores (pp/preceptores/page.jsx)**: Pestaña/Sección de Inasistencias Docentes para previsión de ausencias y cobertura de clases.
  - **Módulo de Alertas (pp/alertas/page.jsx)**: Visualización de alertas activas de ausencias docentes.
  - **Enlaces de Acceso**: Acceso directo desde la pantalla de login (pp/login/page.jsx), navbar/sidebar y el portal docente (pp/docentes/page.jsx).

## 3. Esquema de Base de Datos (sql/schema.sql)
`sql
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
DROP POLICY IF EXISTS inasistencias_docentes_all_policy ON inasistencias_docentes;
CREATE POLICY inasistencias_docentes_all_policy ON inasistencias_docentes FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);
`

## 4. Estrategia de Verificación
- Probar el flujo completo de búsqueda por DNI/CUIL en la ruta pública /aviso-inasistencia.
- Verificar el despliegue del aviso de advertencia para *Causas Particulares*.
- Verificar la correcta inserción en Supabase.
- Verificar que el aviso aparezca reflejado en el Dashboard de Directivos, Panel de Preceptores y Alertas.
