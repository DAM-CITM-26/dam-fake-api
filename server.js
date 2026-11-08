// Para probar la API en tu ordenador sin Vercel:  node server.js  →  http://localhost:3000/api
import { createServer } from 'node:http'
import handler from './api/index.js'

const PUERTO = process.env.PORT || 3000
createServer((req, res) => handler(req, res)).listen(PUERTO, () => {
  console.log(`dam-fake-api en http://localhost:${PUERTO}/api`)
})
