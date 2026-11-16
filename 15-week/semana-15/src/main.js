import { obtenerUbicacion } from './hardware.js';
import { obtenerUsuarios } from './conectividad.js';
import { formatearCoordenadas } from './utils/formato.js';

/** Pequeño helper para crear elementos sin usar innerHTML con datos externos. */
function el(tag, props = {}, ...hijos) {
  const nodo = Object.assign(document.createElement(tag), props);
  nodo.append(...hijos.filter((h) => h != null));
  return nodo;
}

/* ---------------------------- Navegación por pestañas ---------------------------- */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    document.querySelectorAll('.pantalla').forEach((p) => {
      p.classList.toggle('oculto', p.id !== tab.dataset.target);
    });
  });
});

/* =============================== PROBLEMA 1 · HARDWARE =============================== */
const btnUbicacion = document.getElementById('btn-ubicacion');
const geoEstado = document.getElementById('geo-estado');

async function mostrarUbicacion() {
  btnUbicacion.disabled = true;
  geoEstado.className = 'tarjeta';
  geoEstado.replaceChildren(el('div', { className: 'spinner' }), el('p', { textContent: 'Buscando tu ubicación…' }));

  const r = await obtenerUbicacion();
  btnUbicacion.disabled = false;

  if (r.ok) {
    const mapa = `https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=17/${r.lat}/${r.lng}`;
    geoEstado.className = 'tarjeta exito';
    geoEstado.replaceChildren(
      el('h3', { textContent: '✅ Ubicación obtenida' }),
      el('p', { className: 'coords', textContent: formatearCoordenadas(r.lat, r.lng) }),
      el('p', { className: 'ayuda', textContent: `Precisión aproximada: ±${Math.round(r.precision)} m` }),
      el('a', { href: mapa, target: '_blank', rel: 'noopener', className: 'btn secundario', textContent: 'Ver en el mapa' }),
    );
    return;
  }

  // Caso negado o error: explicamos qué pasó y ofrecemos salida, sin bloquear la app
  geoEstado.className = r.motivo === 'denegado' ? 'tarjeta aviso' : 'tarjeta error';
  const reintentar = el('button', { className: 'btn secundario', textContent: 'Intentar de nuevo' });
  reintentar.addEventListener('click', mostrarUbicacion);

  geoEstado.replaceChildren(
    el('h3', { textContent: r.motivo === 'denegado' ? '🔒 Permiso de ubicación negado' : '⚠️ Ubicación no disponible' }),
    el('p', { textContent: r.mensaje }),
    r.permanente ? null : reintentar,
  );
}

btnUbicacion.addEventListener('click', mostrarUbicacion);

/* ============================= PROBLEMA 2 · CONECTIVIDAD ============================= */
const btnCargar = document.getElementById('btn-cargar');
const chkFallo = document.getElementById('chk-fallo');
const apiEstado = document.getElementById('api-estado');

function renderCargando() {
  btnCargar.disabled = true;
  apiEstado.replaceChildren(
    el('div', { className: 'tarjeta' }, el('div', { className: 'spinner' }), el('p', { textContent: 'Cargando usuarios…' })),
  );
}

function renderDatos(usuarios) {
  btnCargar.disabled = false;
  const lista = el(
    'ul',
    { className: 'lista' },
    ...usuarios.map((u) =>
      el(
        'li',
        {},
        el('strong', { textContent: u.name }),
        el('span', { textContent: u.email }),
        el('small', { textContent: `📍 ${u.address?.city ?? '—'}` }),
      ),
    ),
  );
  apiEstado.replaceChildren(el('p', { className: 'ayuda', textContent: `${usuarios.length} usuarios cargados` }), lista);
}

function renderError(mensaje) {
  btnCargar.disabled = false;
  const reintentar = el('button', { className: 'btn primario', textContent: '🔄 Reintentar' });
  reintentar.addEventListener('click', cargarUsuarios);
  apiEstado.replaceChildren(
    el(
      'div',
      { className: 'tarjeta error', role: 'alert' },
      el('h3', { textContent: 'No pudimos cargar los datos' }),
      el('p', { textContent: mensaje }),
      reintentar,
    ),
  );
}

async function cargarUsuarios() {
  renderCargando(); // estado 1: cargando
  try {
    const usuarios = await obtenerUsuarios({ simularFallo: chkFallo.checked });
    renderDatos(usuarios); // estado 2: datos
  } catch (err) {
    renderError(err.message); // estado 3: error (+ reintentar)
  }
}

btnCargar.addEventListener('click', cargarUsuarios);

// Aviso cuando el dispositivo pierde/recupera la red
function bannerRed(texto, tipo) {
  document.querySelector('.banner')?.remove();
  const b = el('div', { className: `banner ${tipo}`, textContent: texto, role: 'status' });
  document.body.append(b);
  if (tipo === 'ok') setTimeout(() => b.remove(), 3000);
}
window.addEventListener('offline', () => bannerRed('Sin conexión a internet', 'error'));
window.addEventListener('online', () => bannerRed('Conexión restablecida', 'ok'));
