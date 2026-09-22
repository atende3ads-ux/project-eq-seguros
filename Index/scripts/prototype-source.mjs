import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

/**
 * O protótipo original mora ao lado de Index/. O caminho era fixo em
 * `../project-eq-seguros-main/prototipo`, o nome que a pasta tinha quando o
 * repositório foi baixado como ZIP — num clone comum nada disso existe e os
 * scripts quebravam. Procura os locais conhecidos e aceita PROTOTYPE_DIR.
 */
const candidates = [
  process.env.PROTOTYPE_DIR,
  path.resolve(root, '../prototipo'),
  path.resolve(root, '../project-eq-seguros-main/prototipo'),
].filter(Boolean)

export const prototypeSource = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')))

if (!prototypeSource) {
  throw new Error(
    `Não encontrei a pasta do protótipo. Procurei em:\n${candidates.map((dir) => `  - ${dir}`).join('\n')}\n` +
    'Defina PROTOTYPE_DIR apontando para a pasta que contém index.html.',
  )
}
