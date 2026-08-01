# Design Document: Dashboard Directivo & Informes Imprimibles CENS N° 454

## Goal
Implement missing visual metrics and printable reports tab in the Executive/Institutional Dashboard (`app/dashboard/page.jsx`), strictly reflecting the metrics shown in the provided screenshots (matrícula mensual, evolución anual, distribución de género global y por curso, franja etaria global y por curso, matrícula por curso, notas finales por rango, promedio por asignatura) and providing printable monthly/annual cycle closing institutional reports.

## System Components
1. **Header & Navigation**:
   - Title: "Estadísticas" with `CICLO 2026` badge.
   - Subtitle: "Matrícula, presentismo, notas y docencia del establecimiento."
   - Tab switcher: `[ 📊 Estadísticas ]` vs `[ 📅 Informe Mensual ]`.

2. **KPI Top Summary Cards (4 Cards)**:
   - MATRÍCULA TOTAL: count of active students.
   - % ASISTENCIA MEDIA: overall attendance percentage.
   - PROMEDIO DE NOTAS: average final/evaluation grade.
   - DOCENTES ACTIVOS: count of active teachers.

3. **Matrícula Section Charts**:
   - Monthly Evolution (Area chart)
   - Annual Evolution (Bar chart)
   - Gender Distribution Global (Donut chart)
   - Age Group Distribution Global (Donut chart)
   - Enrollment per Course (Bar chart)
   - Gender Composition per Course (Stacked Bar chart)
   - Age Group Distribution per Course (Stacked Bar chart)

4. **Calificaciones & Docencia Charts**:
   - Final Grade Ranges: Insuf (0-5), Regular (6-7), Buen (8-10) (Bar chart)
   - Average Grade per Subject (Horizontal Bar chart sorted descending)
   - Teacher & Subject Hours breakdown

5. **Printable Monthly & Cycle Closing Reports Tab (`Informe Mensual`)**:
   - Period selector (Month / Cycle)
   - Official institutional document header (CENS N° 454)
   - Enrollment & movement summary table
   - Attendance & academic performance table per course
   - Subject performance summary table
   - Editable Directivo Notes & Signature blocks
   - Printable CSS `@media print` support & PDF export trigger.

