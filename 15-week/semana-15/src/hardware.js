// PROBLEMA 1 — Hardware: geolocalización con Capacitor + manejo de permisos
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Revisa el permiso de ubicación y, si hace falta, se lo pide al usuario.
 *
 * Estados posibles de Capacitor:
 *   'granted'                -> ya concedido
 *   'prompt'                 -> nunca se ha preguntado
 *   'prompt-with-rationale'  -> (Android) ya lo negó una vez; se puede volver a preguntar
 *   'denied'                 -> negado (en iOS, o en Android con "No volver a preguntar")
 *
 * @returns {Promise<'granted'|'denied'|'web'>}
 */
export async function asegurarPermisoUbicacion() {
  // En navegador, requestPermissions() no está implementado:
  // el propio navegador muestra el diálogo al llamar getCurrentPosition().
  if (!Capacitor.isNativePlatform()) {
    try {
      const { location } = await Geolocation.checkPermissions();
      if (location === 'denied') return 'denied';
    } catch {
      /* algunos navegadores no soportan la Permissions API */
    }
    return 'web';
  }

  let estado = await Geolocation.checkPermissions();
  if (estado.location === 'granted' || estado.coarseLocation === 'granted') return 'granted';
  if (estado.location === 'denied') return 'denied'; // ya no se puede volver a preguntar

  // 'prompt' o 'prompt-with-rationale' -> mostramos el diálogo del sistema
  estado = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
  const concedido = estado.location === 'granted' || estado.coarseLocation === 'granted';
  return concedido ? 'granted' : 'denied';
}

/** Detecta si un error de la API de ubicación significa "permiso negado". */
function esErrorDePermiso(err) {
  // Web: GeolocationPositionError.PERMISSION_DENIED === 1
  return err?.code === 1 || /denied|denegad|permission/i.test(err?.message ?? '');
}

/**
 * Obtiene la posición actual. Nunca lanza: devuelve un objeto con el resultado
 * para que la pantalla decida qué mostrar.
 *
 * @returns {Promise<
 *   | { ok: true, lat: number, lng: number, precision: number }
 *   | { ok: false, motivo: 'denegado'|'no-disponible', mensaje: string, permanente?: boolean }
 * >}
 */
export async function obtenerUbicacion() {
  try {
    const permiso = await asegurarPermisoUbicacion();

    if (permiso === 'denied') {
      return {
        ok: false,
        motivo: 'denegado',
        permanente: true,
        mensaje:
          'El permiso de ubicación está desactivado. Actívalo en Ajustes > Aplicaciones > Semana 15 > Permisos (o en la configuración del sitio en el navegador).',
      };
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return {
      ok: true,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      precision: pos.coords.accuracy,
    };
  } catch (err) {
    if (esErrorDePermiso(err)) {
      return {
        ok: false,
        motivo: 'denegado',
        permanente: false,
        mensaje: 'No diste permiso para usar tu ubicación. Puedes seguir usando la app sin ella o intentarlo de nuevo.',
      };
    }
    return {
      ok: false,
      motivo: 'no-disponible',
      mensaje: 'No pudimos obtener tu ubicación. Revisa que el GPS esté encendido e inténtalo de nuevo.',
    };
  }
}
