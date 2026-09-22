import fs from 'node:fs'
import path from 'node:path'

/**
 * Descreve, para cada entrada de conteúdo, a que seção da página ela pertence.
 * O painel usa isso para separar a lista de textos por seção em vez de mostrar
 * dezenas de linhas seguidas sem contexto.
 *
 * Os nomes saem do próprio layout: a etiqueta (`span.kicker`) que o site já
 * exibe acima de cada seção, ou o título quando não há etiqueta. Assim o que o
 * editor lê no painel é o mesmo que ele vê na página.
 */

const root = path.resolve(import.meta.dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))

/** Contêineres sem etiqueta própria, mas com nome óbvio para quem edita. */
const NAMED = [
  [/\bcrumbbar\b/, 'Trilha de navegação'],
  [/\bp?hero\b/, 'Hero'],
  [/\b(numbers-wrap|stat-wrap)\b/, 'Números'],
  [/\bchips\b/, 'Filtros e listagem'],
  [/\bchancela\b/, 'Barra superior'],
  [/\bnav-cta\b/, 'Botão do topo'],
  [/\bft-brands\b/, 'Marcas do rodapé'],
  [/\bft-top\b/, 'Colunas de links'],
  [/\bft-mid\b/, 'Contatos e ouvidoria'],
  [/\bft-legal\b/, 'Aviso legal'],
  [/\bft-bar\b/, 'Rodapé inferior'],
]

/** Menus suspensos herdam o nome do próprio gatilho: "Seguros", "Crédito"… */
const TRIGGER = /\bhas-dd\b/

const FIELDS = ['textKey', 'imageKey', 'linkKey']

function firstText(node, texts, depth = 0) {
  if (!node.tag) {
    const value = texts.get(node.textKey) ?? node.text ?? ''
    return value.trim() || null
  }
  if (depth > 4) return null
  for (const child of node.children || []) {
    const found = firstText(child, texts, depth + 1)
    if (found) return found
  }
  return null
}

const findNode = (node, test) => {
  if (test(node.tag, node.attrs?.class || '')) return node
  for (const child of node.children || []) {
    const found = findNode(child, test)
    if (found) return found
  }
}

const textOf = (node, texts, out = []) => {
  if (!node.tag) {
    const value = texts.get(node.textKey) ?? node.text ?? ''
    if (value.trim()) out.push(value.trim())
  }
  for (const child of node.children || []) textOf(child, texts, out)
  return out
}

/** Nome para uma seção de conteúdo: etiqueta do site, senão o título. */
function contentName(node, texts) {
  const kicker = findNode(node, (tag, css) => /\b(kicker|feat-tag)\b/.test(css))
  const heading = findNode(node, (tag) => tag === 'h1' || tag === 'h2')
  return (kicker && textOf(kicker, texts).join(' ').trim())
    || (heading && textOf(heading, texts).join(' ').trim())
    || null
}

const trim = (name) => (name.length > 48 ? `${name.slice(0, 47)}…` : name)

/**
 * Percorre na ordem do documento e atribui a cada chave a seção vigente.
 * O divisor nasce onde a seção muda — por lista, já que textos, imagens e
 * links são três listas separadas no painel.
 */
function mapSections(nodes, texts, { deep = false } = {}) {
  const result = {}
  const last = {}
  let generic = 0

  function walk(node, current, top) {
    const className = node.attrs?.class || ''
    let name = current

    const named = NAMED.find(([test]) => test.test(className))?.[1]
    if (named) name = named
    else if (deep && TRIGGER.test(className)) name = firstText(node, texts) || current
    else if (!deep && top) name = contentName(node, texts) || `Seção ${(generic += 1)}`
    else if (deep && node.tag === 'footer') name = 'Rodapé'
    else if (deep && (node.tag === 'header' || node.tag === 'nav')) name = 'Menu principal'

    for (const field of FIELDS) {
      const key = node[field]
      if (!key || result[key]) continue
      result[key] = { secao: trim(name || 'Conteúdo'), inicio: last[field] !== name }
      last[field] = name
    }
    for (const child of node.children || []) walk(child, name, false)
  }

  for (const node of nodes || []) walk(node, null, true)
  return result
}

const output = { pages: {}, site: {} }
for (const page of data.pages) {
  const texts = new Map((page.content.copy || []).map((entry) => [entry.key, entry.value]))
  output.pages[page.slug] = mapSections(page.body, texts)
}
{
  const texts = new Map((data.site.content.copy || []).map((entry) => [entry.key, entry.value]))
  output.site = {
    ...mapSections(data.pages[0].header, texts, { deep: true }),
    ...mapSections(data.site.footer, texts, { deep: true }),
  }
}

fs.writeFileSync(path.join(root, 'src/generated/sections.json'), `${JSON.stringify(output, null, 2)}\n`)

const totalPages = Object.values(output.pages).reduce((sum, page) => sum + Object.keys(page).length, 0)
const names = new Set(Object.values(output.pages).flatMap((page) => Object.values(page).map((v) => v.secao)))
const siteNames = new Set(Object.values(output.site).map((v) => v.secao))
console.log(`Mapeadas ${totalPages} entradas em ${Object.keys(output.pages).length} páginas e ${Object.keys(output.site).length} no cabeçalho/rodapé.`)
console.log(`Seções nas páginas: ${names.size} nomes, ${[...names].filter((n) => /^Seção \d+$/.test(n)).length} genéricos.`)
console.log(`Seções no cabeçalho/rodapé: ${[...siteNames].join(' · ')}`)
