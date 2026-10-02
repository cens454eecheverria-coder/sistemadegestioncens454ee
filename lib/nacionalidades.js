export const PAISES_NACIONALIDAD = [
  'Argentina',
  'Bolivia',
  'Paraguay',
  'Perú',
  'Venezuela',
  'Uruguay',
  'Colombia',
  'Chile',
  'Brasil'
];

/**
 * Normaliza una nacionalidad retornando el texto capitalizado y sin espacios sobrantes.
 * Si el valor es vacío, null o undefined, retorna 'Argentina' por defecto.
 * Si coincide con uno de los países predefinidos (ignorando mayúsculas/minúsculas y acentos),
 * devuelve la forma canónica predefinida.
 *
 * @param {string|null|undefined} val
 * @returns {string}
 */
export function normalizeNacionalidad(val) {
  if (!val || typeof val !== 'string') {
    return 'Argentina';
  }
  const trimmed = val.trim();
  if (!trimmed) {
    return 'Argentina';
  }

  // Buscar coincidencia en lista canónica (con o sin tildes, case-insensitive)
  const canonical = PAISES_NACIONALIDAD.find(
    (p) => p.localeCompare(trimmed, 'es', { sensitivity: 'base' }) === 0
  );
  if (canonical) {
    return canonical;
  }

  // Capitalizar cada palabra para valores personalizados
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determina si un valor de nacionalidad se encuentra en la lista predefinida.
 *
 * @param {string|null|undefined} val
 * @returns {boolean}
 */
export function esNacionalidadPredefinida(val) {
  if (!val || typeof val !== 'string') {
    return false;
  }
  const trimmed = val.trim();
  return PAISES_NACIONALIDAD.some(
    (p) => p.localeCompare(trimmed, 'es', { sensitivity: 'base' }) === 0
  );
}
