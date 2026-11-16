# Semana 15 — Evaluación individual (UX/UI · Plugins · Conectividad · Testing)

App de una sola página hecha con **Vite + Capacitor 7** (JavaScript, sin framework) con dos pantallas:

| Pantalla | Problema | Archivo principal |
|---|---|---|
| 📍 Ubicación | 1 — Hardware (plugin de geolocalización + permisos) | `src/hardware.js` |
| 🌐 Usuarios | 2 — Conectividad (`fetch` con 3 estados y reintento) | `src/conectividad.js` |
| — | 3 — Testing (2 pruebas unitarias) | `tests/formato.test.js` |

## Cómo ejecutar

```bash
npm install
npm run dev        # abre http://localhost:5173
npm test           # corre las 2 pruebas con Vitest
```

En Android (opcional):

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Permisos nativos que hay que declarar:

- **Android** (`android/app/src/main/AndroidManifest.xml`):
  ```xml
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  ```
- **iOS** (`ios/App/App/Info.plist`):
  ```xml
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>Usamos tu ubicación para mostrarte tus coordenadas.</string>
  ```

---

## Problema 1 — Hardware (2.0)

Plugin usado: **`@capacitor/geolocation`**.

Flujo en `src/hardware.js`:

1. `checkPermissions()`: si ya está `granted`, se obtiene la ubicación de una vez.
2. Si está en `prompt` / `prompt-with-rationale`, se llama a `requestPermissions()` y aparece el diálogo del sistema.
3. Si el usuario **lo niega**, la app **no se bloquea**: muestra una tarjeta naranja que explica qué pasó, con un botón **"Intentar de nuevo"**. Si la negación es permanente (`denied`), le indica cómo activarlo en Ajustes. El resto de la app (pestaña Usuarios) sigue funcionando.
4. Si se concede, `getCurrentPosition()` devuelve las coordenadas y se muestran formateadas (`2.9273° N, 75.2819° O`), con la precisión en metros y un enlace al mapa.
5. Otros errores (GPS apagado, timeout) muestran un mensaje distinto, también con reintento.

> En el navegador, `requestPermissions()` no existe en el plugin. El navegador muestra su propio diálogo al llamar `getCurrentPosition()`, y el código reconoce el error `PERMISSION_DENIED` (código 1).

**Cómo probar la negación:** en Chrome, haz clic en el candado de la barra de direcciones → *Ubicación* → *Bloquear*, y pulsa "Obtener mi ubicación". En Android: Ajustes → Apps → Semana 15 → Permisos → Ubicación → *No permitir*.

### English requirement — Why request permissions and handle denial?

> Apps must request permission before using sensitive hardware like the GPS or camera because this data is private, and users have the right to decide who can access it; mobile operating systems also block the feature entirely until the user grants access. Handling denial gracefully means the app keeps working and clearly explains what happened instead of crashing or showing a blank screen. This builds trust and gives users a way to change their mind later, for example by retrying or enabling the permission in Settings.

---

## Problema 2 — Conectividad (2.0)

API: `https://jsonplaceholder.typicode.com/users`

Los **tres estados** (en `src/main.js` → `cargarUsuarios()`):

| Estado | Qué ve el usuario |
|---|---|
| **Cargando** | Spinner + "Cargando usuarios…", botón deshabilitado para evitar dobles clics |
| **Datos** | Lista de usuarios (nombre, correo, ciudad) |
| **Error** | Tarjeta roja con el motivo y botón **🔄 Reintentar** |

Errores que se manejan en `obtenerUsuarios()`:

- **Sin red / servidor inalcanzable** → `fetch` lanza `TypeError` → "No se pudo conectar con el servidor".
- **Respuesta HTTP 4xx/5xx** → `fetch` *no* lanza error con estos códigos, por eso se revisa `respuesta.ok`.
- **Timeout** (8 s) con `AbortController`.
- **Dispositivo offline** (`navigator.onLine === false`), más un aviso en la parte inferior cuando se pierde o recupera la red.

**Cómo simular el fallo de red (dos formas):**

1. Activa el interruptor **"Simular fallo de red"** y pulsa *Cargar usuarios*. La app pide a un dominio `.invalid`, que nunca resuelve (RFC 2606), así que falla igual que sin internet. Aparece el error y, al desactivar el interruptor y pulsar **Reintentar**, los datos cargan.
2. En DevTools → pestaña *Network* → *Offline*. Aparece el aviso "Sin conexión"; al volver a *No throttling*, se puede reintentar.

---

## Problema 3 — Testing (1.0)

Función probada: `formatearCoordenadas(lat, lng)` en `src/utils/formato.js`, la misma que usa la pantalla de ubicación.

```bash
npm test
```

| # | Prueba | Qué verifica |
|---|---|---|
| 1 | *convierte coordenadas en texto con hemisferios y 4 decimales* | Que los signos se traduzcan a la letra correcta (positivo → N/E, negativo → S/O) y que redondee a 4 decimales. Se usan Neiva (norte/oeste) y Sídney (sur/este) para cubrir los cuatro hemisferios. |
| 2 | *lanza RangeError si la latitud o la longitud están fuera de rango* | Que con datos imposibles (latitud 91, longitud -181 o `NaN`) la función lance `RangeError` en vez de devolver un texto falso que el usuario creería real. |

Resultado esperado:

```
✓ tests/formato.test.js (2)
  ✓ formatearCoordenadas > convierte coordenadas en texto con hemisferios y 4 decimales
  ✓ formatearCoordenadas > lanza RangeError si la latitud o la longitud están fuera de rango
Test Files  1 passed (1)
     Tests  2 passed (2)
```

---

## Detalles de UX/UI aplicados

- Botones de al menos 48 px de alto (tamaño táctil recomendado).
- Colores por estado (verde = éxito, naranja = permiso negado, rojo = error) junto con iconos y texto, para no depender solo del color.
- `aria-live` y `role="alert"` para que los lectores de pantalla anuncien los cambios.
- Los datos de la API se insertan con `textContent`, no con `innerHTML` (evita XSS).
- Respeta `safe-area-inset` en teléfonos con muesca.
