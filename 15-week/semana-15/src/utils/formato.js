/**
 * Convierte latitud y longitud decimales en un texto legible para el usuario.
 *
 *   formatearCoordenadas(2.9273, -75.2819)  ->  "2.9273° N, 75.2819° O"
 *
 * - Usa N/S para la latitud y E/O (Este/Oeste) para la longitud, en vez de signos.
 * - Redondea a `decimales` cifras (4 decimales ≈ 11 m de precisión).
 * - Lanza RangeError si los valores no son coordenadas válidas.
 *
 * @param {number} lat  Latitud entre -90 y 90
 * @param {number} lng  Longitud entre -180 y 180
 * @param {number} [decimales=4]
 * @returns {string}
 */
export function formatearCoordenadas(lat, lng, decimales = 4) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new RangeError(`Latitud inválida: ${lat}`);
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new RangeError(`Longitud inválida: ${lng}`);
  }

  const latTexto = `${Math.abs(lat).toFixed(decimales)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngTexto = `${Math.abs(lng).toFixed(decimales)}° ${lng >= 0 ? 'E' : 'O'}`;

  return `${latTexto}, ${lngTexto}`;
}
