// dam-fake-api · un servidor de mentira que se comporta como una API de verdad.
// Una sola función para Vercel (ver vercel.json) y para probar en local (server.js).
//
//   GET /api                                  → equipos y colecciones disponibles
//   GET /api/<equipo>/<coleccion>             → { results, total, page, limit }
//        ?q=texto   busca en los campos de texto
//        ?limit=N   elementos por página (por defecto 20, máximo 100)
//        ?page=N    página (empieza en 1)
//   GET /api/<equipo>/<coleccion>/<id>        → el elemento, o 404 en JSON
//   ?fallo=1 en cualquier ruta                → error 500 a propósito (para enseñar el estado de error)
//
// Solo lectura: POST, PUT y DELETE devuelven 405. Tarda entre 300 y 900 ms en responder.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

function cargarEquipos() {
  const equipos = {}
  for (const fichero of readdirSync(DATA_DIR)) {
    if (!fichero.endsWith('.json') || fichero.startsWith('_')) continue
    equipos[fichero.replace('.json', '')] = JSON.parse(readFileSync(join(DATA_DIR, fichero), 'utf8'))
  }
  return equipos
}
const EQUIPOS = cargarEquipos()

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function normalizar(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ¿Algún campo de texto (también dentro de objetos) contiene la búsqueda?
function coincide(elemento, q) {
  const buscado = normalizar(q)
  const textos = []
  const recoger = (valor) => {
    if (typeof valor === 'string') textos.push(valor)
    else if (Array.isArray(valor)) valor.forEach(recoger)
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(recoger)
  }
  recoger(elemento)
  return textos.some((t) => normalizar(t).includes(buscado))
}

function enviar(res, status, cuerpo) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(cuerpo))
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    return res.end()
  }

  const url = new URL(req.url, 'http://localhost')
  const partes = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)

  await esperar(300 + Math.floor(Math.random() * 600))

  if (req.method !== 'GET') {
    return enviar(res, 405, { error: 'Esta API es de solo lectura: usa GET.' })
  }
  if (url.searchParams.get('fallo') === '1') {
    return enviar(res, 500, { error: 'Error simulado del servidor (?fallo=1).' })
  }

  // GET /api → índice
  if (partes.length === 0) {
    const indice = Object.fromEntries(Object.entries(EQUIPOS).map(([equipo, datos]) => [equipo, Object.keys(datos)]))
    return enviar(res, 200, { equipos: indice })
  }

  const [equipo, coleccion, id, ...resto] = partes
  const datosEquipo = EQUIPOS[equipo]
  if (!datosEquipo) return enviar(res, 404, { error: `No existe el equipo «${equipo}».` })
  if (!coleccion) return enviar(res, 200, { colecciones: Object.keys(datosEquipo) })
  const lista = datosEquipo[coleccion]
  if (!Array.isArray(lista)) return enviar(res, 404, { error: `No existe la colección «${coleccion}» en «${equipo}».` })
  if (resto.length > 0) return enviar(res, 404, { error: 'Ruta no encontrada.' })

  // GET /api/<equipo>/<coleccion>/<id>
  if (id !== undefined) {
    const elemento = lista.find((e) => String(e.id) === id)
    if (!elemento) return enviar(res, 404, { error: `No existe ningún elemento con id ${id}.` })
    return enviar(res, 200, elemento)
  }

  // GET /api/<equipo>/<coleccion>
  const q = url.searchParams.get('q')
  const filtrados = q ? lista.filter((e) => coincide(e, q)) : lista
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 1), 100)
  const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1)
  const results = filtrados.slice((page - 1) * limit, page * limit)
  return enviar(res, 200, { results, total: filtrados.length, page, limit })
}
