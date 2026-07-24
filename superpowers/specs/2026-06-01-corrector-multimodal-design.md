# Especificación de Diseño: Corrector Multimodal con Fallback de Modelos

Diseño para soportar la carga de múltiples fotos/archivos y la recuperación ante saturación de modelos de la API de Gemini.

## 1. Carga Multimodal de Tareas

El formulario debe permitir enviar múltiples imágenes y archivos PDF de una sola tarea para su evaluación grupal.

### Payload de Gemini
Cada archivo seleccionado se convertirá a Base64 y se incluirá en la propiedad `parts` de la solicitud `generateContent`:

```json
{
  "contents": [
    {
      "parts": [
        { "text": "Actúa como un docente experto..." },
        { "inlineData": { "mimeType": "image/png", "data": "BASE64_DATA_1..." } },
        { "inlineData": { "mimeType": "application/pdf", "data": "BASE64_DATA_2..." } }
      ]
    }
  ]
}
```

## 2. Cadena de Reintento y Fallback de Modelos

Para mitigar el error *"This model is currently experiencing high demand"*, el flujo realizará reintentos en cascada usando modelos alternativos de forma transparente para el usuario.

### Prioridad de Modelos
1. `gemini-3.5-flash`
2. `gemini-2.5-flash`
3. `gemini-2.0-flash`
4. `gemini-1.5-flash`
5. `gemini-2.5-pro`
6. `gemini-1.5-pro`
7. Cualquier otro modelo disponible que soporte `generateContent`

### Detección de Errores de Saturación
Se detectarán errores transitorios cuando:
- El código de estado HTTP sea `429` (Too Many Requests) o `503` (Service Unavailable).
- El cuerpo de la respuesta contenga frases como `"high demand"`, `"overloaded"`, `"resource exhausted"`, `"quota exceeded"`, o `"temporary"`.

Al detectar estos errores, se mostrará una notificación visual al usuario usando `Toastify` y se probará inmediatamente el siguiente modelo disponible.
