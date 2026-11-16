// PROBLEMA 2 — Conectividad: consumir una API con fetch
export const API_URL = 'https://jsonplaceholder.typicode.com/users';

// Dominio .invalid: está reservado (RFC 2606) y NUNCA resuelve,
// así que fetch falla igual que cuando no hay internet.
const URL_FALLIDA = 'https://api-que-no-existe.invalid/users';

/**
 * Descarga la lista de usuarios.
 * Lanza un Error con un mensaje entendible para el usuario si algo falla.
 *
 * @param {{ simularFallo?: boolean, timeoutMs?: number }} [opciones]
 * @returns {Promise<Array<{id:number, name:string, email:string, address:{city:string}}>>}
 */
export async function obtenerUsuarios({ simularFallo = false, timeoutMs = 8000 } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Estás sin conexión a internet. Conéctate e inténtalo de nuevo.');
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(simularFallo ? URL_FALLIDA : API_URL, {
      signal: controlador.signal,
    });

    // fetch NO lanza error con 404/500: hay que revisarlo a mano
    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con un error (${respuesta.status}).`);
    }

    return await respuesta.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder.');
    }
    if (err instanceof TypeError) {
      // "Failed to fetch": DNS, sin red, CORS, servidor caído...
      throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
    }
    throw err;
  } finally {
    clearTimeout(temporizador);
  }
}
