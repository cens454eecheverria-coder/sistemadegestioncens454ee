# Sistema de Diseño y Guía Estética: "Horizonte Académico" CENS 454

> **Identidad Visual:** CENS N° 454 - Esteban Echeverría  
> **Concepto de Diseño:** *"Horizonte Académico"* - Moderno, Elegante, Accesible y Profesional  
> **Framework:** Tailwind CSS v4 + Custom Design Tokens CSS  

---

## 1. Filosofía y Principios de Diseño

El sistema visual del **CENS 454** abandona el aspecto administrativo tradicional tosco e informal para adoptar una experiencia de usuario (*UX*) de nivel empresarial, caracterizada por:

1. **Claridad Visual e Impacto Inmediato:** Los datos clave (asistencia, promedios, alertas) se leen en segundos gracias a tarjetas con sombras suaves y contraste jerárquico.
2. **Micro-interacciones Fluidas:** Botones con elevación progresiva al posar el cursor (*hover lift*), retroalimentación táctil (*active scale*) y efectos pulsantes de advertencia (*pulse glow*).
3. **Elegancia Institucional:** Una paleta rica inspirada en tonos azul petróleo, azul profundo y acentos en dorado noble, transmitiendo seriedad académica y cercanía con la comunidad de educación de adultos.

---

## 2. Paleta de Colores y Tokens

### 2.1 Colores Principales (Brand Colors)

```
[ Primary Azul CENS ]      #006384 (rgb: 0, 99, 132)
[ Primary Container ]      #0B7EA5 (rgb: 11, 126, 165)
[ Primary Light Fixed ]    #C1E8FF (rgb: 193, 232, 255)
[ Secondary Oscuro ]       #0D2A3E (rgb: 13, 42, 62)   -> Fondo de Sidebar y Headers
[ Tertiary Dorado Noble ]  #F5C442 (rgb: 245, 196, 66)  -> Acentos de Distinción / Botones Especiales
```

### 2.2 Superficies y Fondos (Surfaces)

```
[ Surface Canvas ]        #F4FAFF (Fondo principal fluido)
[ Surface Card ]          #FFFFFF (Blanco puro para tarjetas e insumos)
[ Surface Low Container ] #EEF5FA (Separadores y encabezados de tarjeta)
[ Text On Surface ]       #151D20 (Texto principal de alta legibilidad)
[ Text Variant ]          #3F484E (Subtítulos y etiquetas secundarias)
```

---

## 3. Tipografía Oficial

El sistema utiliza la combinación de fuentes tipográficas de Google Fonts:

* **Títulos y Encabezados (`h1` a `h6`):** `Manrope` (pesos 700 y 800) - Fuente geométrica, moderna y de gran carácter institucional.
* **Cuerpo de Texto e Insumos (`body`, `p`, `span`, `inputs`):** `Work Sans` (pesos 400, 500 y 600) - Diseñada específicamente para pantallas digitales y máxima legibilidad en textos extensos.

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Work+Sans:wght@400;500;600&display=swap');
```

---

## 4. Biblioteca de Componentes UI Reutilizables

### 4.1 Tarjetas Contenedoras (`.card`)
Las tarjetas principales emplean bordes sutiles y elevaciones flotantes:

```css
.card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(13, 42, 62, 0.06);
  overflow: hidden;
  border: 1px solid #e2e9ee;
}

.card-header {
  padding: 1rem 1.25rem;
  background: #eef5fa;
  border-bottom: 1px solid #e2e9ee;
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  color: #151d20;
}
```

### 4.2 Botón Principal de Acción (`.btn-primary`)
Degradado dinámico con sombra coloreada al posar el cursor:

```css
.btn-primary {
  background: linear-gradient(135deg, #006384 0%, #0b7ea5 100%);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 99, 132, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 99, 132, 0.3);
}
```

### 4.3 Botón de Acento Dorado (`.btn-gold`)
Utilizado para acciones destacadas (ej: "Guardar Acta Final", "Generar Anexo DOCX"):

```css
.btn-gold {
  background: linear-gradient(135deg, #F5C442 0%, #e8a800 100%);
  color: #251a00;
  border-radius: 9999px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(245, 196, 66, 0.25);
}
```

### 4.4 Insumos de Formulario Soft (`.field-soft`)
Campos de entrada suaves que destacan al foco sin alterar el flujo visual:

```css
.field-soft {
  background: #eef5fa;
  border: 1px solid #bec8cf;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  outline: none;
}

.field-soft:focus {
  background: #ffffff;
  border-color: #006384;
  box-shadow: 0 0 0 3px rgba(0, 99, 132, 0.15);
}
```

---

## 5. Diseño Responsivo y Navegación

* **Sidebar Lateral Noche (`#0D2A3E`):**
  * Colapsable en dispositivos móviles (hamburguesa).
  * Fijada en pantallas grandes con efecto translucido *backdrop-blur*.
  * Enlaces activos señalizados con indicador vertical en amarillo dorado (`#F5C442`).
* **Grilla Adaptativa:**
  * Móviles (320px - 640px): 1 columna.
  * Tablets (641px - 1024px): 2 columnas.
  * Escritorio (>1024px): 3 o 4 columnas para tarjetas métricas y 12 columnas para tablas principales.
