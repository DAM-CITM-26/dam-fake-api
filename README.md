# dam-fake-api · los datos de vuestro proyecto, como una API de verdad

Algunos proyectos no tienen una API pública que encaje con su app: no existe una API de talleres de manualidades, ni de partidos de CS2 sin clave… Para ellos está este servidor. Guarda vuestros datos de ejemplo y los sirve **igual que una API real**:

- **Tarda en responder** (entre 0,3 y 0,9 segundos), así que vuestra app tiene que mostrar «cargando».
- **Devuelve los datos con su propio formato** (`{ results, total }`, con claves en inglés), así que tenéis que adaptarlos a vuestras pantallas.
- **Puede fallar**: añadiendo `?fallo=1` a cualquier dirección devuelve un error, para que enseñéis vuestro estado de error.
- **Es de solo lectura**, como las APIs públicas: lo que el usuario guarda o crea va a vuestro Context y a `localStorage`.

**Dirección:** `https://dam-fake-api.vercel.app/api`

## Cómo se usa

| Petición | Qué devuelve |
|---|---|
| `GET /api` | Los equipos y sus colecciones |
| `GET /api/<equipo>/<coleccion>` | `{ "results": [...], "total": 18, "page": 1, "limit": 20 }` |
| `GET /api/<equipo>/<coleccion>?q=volcan` | Solo los elementos que contienen «volcan» en algún texto (no distingue mayúsculas ni acentos) |
| `GET /api/<equipo>/<coleccion>?limit=5&page=2` | La página 2, de 5 en 5 |
| `GET /api/<equipo>/<coleccion>/<id>` | El elemento con ese id, o un **404** con `{ "error": "…" }` si no existe |
| Cualquiera + `?fallo=1` | Un **500** con `{ "error": "…" }`, para probar vuestro estado de error |

Ejemplo con los datos de la Ludoteca de clase:

```
GET /api/ludoteca/games?q=faro
→ { "results": [ { "id": 1, "title": "Faros de niebla", "players": { "min": 2, "max": 4 }, … } ], "total": 2, "page": 1, "limit": 20 }
```

## Desde vuestra app

Todo lo que habla con la API va en un único fichero, `src/data/api.js`. Las pantallas solo llaman a sus funciones.

```js
// src/data/api.js
const BASE = 'https://dam-fake-api.vercel.app/api/3t'

export async function fetchTalleres(texto = '') {
  const respuesta = await fetch(`${BASE}/workshops?q=${encodeURIComponent(texto)}`)
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`)
  const datos = await respuesta.json()
  return datos.results // la lista está dentro de "results"
}

export async function fetchTallerPorId(id) {
  const respuesta = await fetch(`${BASE}/workshops/${id}`)
  if (respuesta.status === 404) return null // no existe: la pantalla muestra «no encontrado»
  if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`)
  return respuesta.json()
}
```

Y en la pantalla, el `useEffect` con los tres estados (cargando, error y datos), igual que en clase.

## Cómo proponer vuestros datos (Pull Request)

Vuestros datos entran en este repositorio con un **Pull Request**, que revisa el profesor. Es la misma forma de trabajar que en vuestro proyecto, pero en un repositorio que no es vuestro.

1. **Haced un fork** de este repositorio (botón *Fork* en GitHub) y clonad vuestro fork.
2. **Editad `data/<vuestro-equipo>.json`.** Ya existe, con las colecciones vacías que os propone el profesor. Podéis cambiar o añadir colecciones.
3. **Rellenad entre 20 y 30 elementos** por colección principal. Tomad como modelo `data/_plantilla.json` y `data/ludoteca.json`.
4. **Comprobad los datos:** `npm run check` (necesitáis Node). Tiene que terminar en «Todo correcto».
5. **Probadlo en local:** `npm run dev` y abrid `http://localhost:3000/api/<vuestro-equipo>/<coleccion>`.
6. **Abrid el Pull Request** hacia este repositorio, con un commit descrito como en vuestro proyecto (Qué / Por qué / Cómo).

En cuanto el profesor lo acepte, vuestros datos estarán en la dirección pública en un par de minutos. Si necesitáis cambiarlos más adelante, otro Pull Request.

### Normas de los datos

- **Ficticios siempre:** nada de datos reales de personas ni de empresas reales. La API es pública.
- **Claves en inglés y en minúsculas** (`title`, `price_eur`, `starts_at`), como en una API real. Vuestra app las adapta a sus pantallas.
- **Cada elemento con un `id` único** dentro de su colección.
- **Fechas en formato ISO** (`"2026-12-01T18:00:00"`), precios con su unidad en el nombre (`price_eur`) y booleanos como `true` o `false`.
- **Imágenes por URL**: por ejemplo `https://picsum.photos/seed/<algo>/600/400`, o imágenes vuestras subidas a vuestro repositorio.
- **Relaciones por id**: si un partido tiene dos equipos, guardad sus ids (`"team_ids": [3, 7]`) y buscadlos en la otra colección.
