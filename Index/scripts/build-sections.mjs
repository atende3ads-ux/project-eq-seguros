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
    || (findNode(node, (tag, css) => /\bpost-grid\b/.test(css)) && 'Lista de posts')
    || null
}

const trim = (name) => (name.length > 48 ? `${name.slice(0, 47)}…` : name)

/**
 * Percorre na ordem do documento e atribui a cada chave a seção vigente.
 * O divisor nasce onde a seção muda — por lista, já que textos, imagens e
 * links são três listas separadas no painel.
 */
function mapSections(nodes, texts, { deep = false, slug } = {}) {
  const result = {}
  const last = {}
  let generic = 0
  let groups = 0

  function walk(node, current, top, link, ancestors, group) {
    const className = node.attrs?.class || ''
    let name = current

    const named = NAMED.find(([test]) => test.test(className))?.[1]
    if (named) name = named
    else if (deep && TRIGGER.test(className)) name = firstText(node, texts) || current
    else if (!deep && top) name = contentName(node, texts) || `Seção ${(generic += 1)}`
    else if (deep && node.tag === 'footer') name = 'Rodapé'
    else if (deep && (node.tag === 'header' || node.tag === 'nav')) name = 'Menu principal'
    // Uma seção nova começa sem grupo aberto.
    if (name !== current) group = undefined

    for (const field of FIELDS) {
      const key = node[field]
      if (!key || result[key]) continue
      result[key] = { secao: trim(name || 'Conteúdo'), inicio: last[field] !== name }
      if (group) result[key].grupo = group
      const managed = managedBy(slug, [node, ...ancestors])
      if (managed) result[key].gerenciado = managed
      last[field] = name
    }
    if (node.linkKey && result[node.linkKey]) {
      result[node.linkKey].papel = linkRole(node)
      // Link que só envolve uma imagem (logo, banner): o painel mostra o destino logo depois dela.
      const image = keysOf(node, 'textKey').length ? undefined : keysOf(node, 'imageKey')[0]
      if (image) result[node.linkKey].imagem = image
    }
    if (node.textKey) result[node.textKey].papel = textRole(ancestors)
    // Liga o texto ao link que o envolve, para o painel editar os dois juntos.
    if (node.textKey && link && result[link]) {
      result[node.textKey].link ??= link
      result[link].textos ??= []
      if (!result[link].textos.includes(node.textKey)) result[link].textos.push(node.textKey)
    }
    // Títulos com trecho colorido são quebrados em partes: numera cada uma.
    if (/^h[1-6]$/.test(node.tag || '')) {
      const parts = keysOf(node, 'textKey')
      if (parts.length > 1) parts.forEach((key, index) => { partOf[key] = { parte: index + 1, partes: parts.length } })
    }

    const children = node.children || []
    const signature = (child) => child.tag ? `${child.tag}.${(child.attrs?.class || '').split(/\s+/)[0]}` : ''
    const counts = new Map()
    for (const child of children) counts.set(signature(child), (counts.get(signature(child)) || 0) + 1)
    for (const child of children) {
      let childGroup = group
      // Blocos repetidos lado a lado (cards, itens de FAQ…) viram um grupo, se tiverem mais de um conteúdo.
      if (!group && child.tag && counts.get(signature(child)) > 1 && editable(child) > 1) {
        childGroup = { id: `g${(groups += 1)}`, tipo: groupType(child) }
      }
      walk(child, name, false, node.linkKey || link, [node, ...ancestors], childGroup)
    }
  }

  const partOf = {}
  for (const node of nodes || []) walk(node, null, true, null, [], undefined)
  for (const [key, part] of Object.entries(partOf)) Object.assign(result[key], part)
  return result
}

const hasClass = (node, name) => (node.attrs?.class || '').split(/\s+/).includes(name)
/**
 * Conteúdo que o painel não edita pela página porque vem dos posts:
 * - 'posts': cards (`.post-grid`) e, no blog, filtros e "carregar mais" ao lado deles;
 * - 'artigo': na página modelo do post, trilha, topo e texto, que são de cada post.
 */
function managedBy(slug, chain) {
  if (chain.some((node) => hasClass(node, 'post-grid'))) return 'posts'
  if (slug === 'blog' && chain.some((node) => hasClass(node, 'wrap') && (node.children || []).some((child) => hasClass(child, 'post-grid')))) return 'posts'
  if (slug === 'post' && chain.some((node) => hasClass(node, 'crumbbar') || hasClass(node, 'phero') || hasClass(node, 'prose'))) return 'artigo'
  return undefined
}

const keysOf = (node, field, out = []) => {
  if (node[field]) out.push(node[field])
  for (const child of node.children || []) keysOf(child, field, out)
  return out
}
/** Quantos campos o bloco teria no painel: textos, imagens e links sem texto próprio. */
function editable(node) {
  const texts = keysOf(node, 'textKey').length
  const images = keysOf(node, 'imageKey').length
  const bare = (function count(n, inLink) {
    let total = n.linkKey && !keysOf(n, 'textKey').length ? 1 : 0
    for (const child of n.children || []) total += count(child, inLink || Boolean(n.linkKey))
    return total
  })(node, false)
  return texts + images + bare
}
const is = (node, tag, css) => node.tag === tag && (!css || new RegExp(`\\b${css}\\b`).test(node.attrs?.class || ''))

function groupType(node) {
  const css = node.attrs?.class || ''
  if (node.tag === 'details' || /\b(faq|fa)\b/.test(css)) return 'Pergunta'
  if (/card/.test(css)) return 'Card'
  if (/\b(step|etapa)\b/.test(css)) return 'Etapa'
  return 'Item'
}

/** Nome do campo para quem edita, lido dos elementos em volta do texto (do mais próximo ao mais distante). */
function textRole(ancestors) {
  const find = (test) => ancestors.find(test)
  if (find((n) => is(n, 'a', 'dd-cat'))) return 'Aba do menu'
  const heading = find((n) => /^h[1-6]$/.test(n.tag || ''))
  if (heading) return heading.tag === 'h1' ? 'Título principal' : 'Título'
  if (find((n) => n.tag === 'summary')) return 'Pergunta'
  if (find((n) => n.tag === 'details' || is(n, 'div', 'fa-body'))) return 'Resposta'
  if (find((n) => is(n, 'a', 'btn') || n.tag === 'button')) return 'Botão'
  if (find((n) => n.tag === 'a')) return 'Texto do link'
  if (find((n) => is(n, 'p', 'lead'))) return 'Subtítulo'
  if (find((n) => is(n, 'span', 'kicker'))) return 'Etiqueta'
  if (find((n) => is(n, 'span', 'tag'))) return 'Tag'
  if (find((n) => n.tag === 'label' || n.tag === 'option' || n.tag === 'select')) return 'Campo do formulário'
  if (find((n) => n.tag === 'li')) return 'Item da lista'
  return 'Texto'
}

function linkRole(node) {
  if (!keysOf(node, 'textKey').length) return node.attrs?.['aria-label'] ? `Link do ícone (${node.attrs['aria-label']})` : 'Link ao clicar na imagem'
  return is(node, 'a', 'btn') ? 'Link do botão' : 'Link'
}

const output = { pages: {}, site: {} }
for (const page of data.pages) {
  const texts = new Map((page.content.copy || []).map((entry) => [entry.key, entry.value]))
  output.pages[page.slug] = mapSections(page.body, texts, { slug: page.slug })
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
