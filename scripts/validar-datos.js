// Comprueba los datos antes de aceptar un Pull Request:  npm run check
import { readFileSync, readdirSync } from 'node:fs'

let errores = 0
const fallo = (msg) => { console.error('✗ ' + msg); errores++ }

for (const fichero of readdirSync('data')) {
  if (!fichero.endsWith('.json') || fichero.startsWith('_')) continue
  if (!/^[a-z0-9-]+\.json$/.test(fichero)) fallo(`${fichero}: el nombre debe ir en minúsculas, sin espacios`)
  let datos
  try {
    datos = JSON.parse(readFileSync(`data/${fichero}`, 'utf8'))
  } catch (e) {
    fallo(`${fichero}: no es un JSON válido (${e.message})`)
    continue
  }
  for (const [coleccion, lista] of Object.entries(datos)) {
    if (!/^[a-z][a-z0-9_]*$/.test(coleccion)) fallo(`${fichero} › ${coleccion}: el nombre de la colección va en minúsculas y en inglés`)
    if (!Array.isArray(lista)) { fallo(`${fichero} › ${coleccion}: tiene que ser una lista [ … ]`); continue }
    const ids = new Set()
    lista.forEach((el, i) => {
      if (el === null || typeof el !== 'object' || Array.isArray(el)) return fallo(`${fichero} › ${coleccion}[${i}]: cada elemento es un objeto { … }`)
      if (el.id === undefined) fallo(`${fichero} › ${coleccion}[${i}]: falta el campo id`)
      else if (ids.has(String(el.id))) fallo(`${fichero} › ${coleccion}: el id ${el.id} está repetido`)
      ids.add(String(el.id))
    })
    console.log(`✓ ${fichero} › ${coleccion}: ${lista.length} elementos`)
  }
}
if (errores) { console.error(`\n${errores} error(es)`); process.exit(1) }
console.log('\nTodo correcto')
