# Corrector Multimodal y Fallback de Modelos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al docente subir múltiples imágenes o PDFs de una tarea para su corrección con la IA de Gemini, e implementar reintentos en cascada (fallback) con diferentes modelos ante saturación o alta demanda de la API.

**Architecture:** Modificar `src/js/corrector.js` para leer en paralelo todos los archivos seleccionados usando `Promise.all` y convertirlos a base64, agregándolos al payload de la API de Gemini. Además, estructurar la llamada en un bucle secuencial sobre los modelos disponibles (priorizando `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, etc.) e interceptar errores HTTP 429/503 o errores de saturación para reintentar con el siguiente modelo de la cadena mostrando notificaciones visuales (Toastify).

**Tech Stack:** Vanilla JS (Browser), Supabase Client, Gemini API via REST, Toastify.

---

### Task 1: Modificar la Lectura de Archivos e Integración de Gemini en `src/js/corrector.js`

**Files:**
- Modify: `src/js/corrector.js`

- [ ] **Step 1: Modificar `handleFormSubmit` para soportar `selectedFiles` (múltiples archivos)**
  Reemplazar la validación `!selectedFile` por `selectedFiles.length === 0`.
  Reemplazar la conversión individual de base64 por una conversión en paralelo de todos los elementos en `selectedFiles` utilizando `Promise.all`.
  Construir un arreglo `fileParts` de objetos `{ inlineData: { mimeType, data } }` para cada archivo procesado.

- [ ] **Step 2: Implementar la cadena de fallback de modelos en el envío**
  Definir un arreglo de nombres de modelos preferidos: `['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-pro']`.
  Obtener los modelos disponibles del endpoint de Gemini y ordenarlos basándose en nuestra prioridad.
  Realizar un bucle secuencial sobre los modelos ordenados. Si falla un modelo con un error de alta demanda/transitorio, enviar una alerta `Toastify` de reintento y continuar con el siguiente modelo disponible. Si no hay reintentos restantes o el error es fatal, lanzar la excepción.

- [ ] **Step 3: Verificar la sintaxis de `src/js/corrector.js`**
  Ejecutar: `node --check src/js/corrector.js`
  Esperar: Sintaxis correcta sin errores.

- [ ] **Step 4: Confirmar los cambios y realizar commit**
  Ejecutar comandos de git para guardar los avances.
  ```bash
  git add src/js/corrector.js
  git commit -m "feat: implement multimodal file uploads and model fallback chain in corrector"
  ```
