import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { load } from 'cheerio'
import { prototypeSource } from './prototype-source.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = prototypeSource
const output = path.join(root, 'src/generated/prototype.json')
const siteScript = fs.readFileSync(path.join(source, 'assets/site.js'), 'utf8')
const prefix = siteScript.slice(0, siteScript.indexOf('  function wireDropdowns()'))
const makeFrame = (file) => {
  const context = { location: { pathname: `/${file}` }, result: null }
  vm.runInNewContext(`${prefix}\nresult = { header, footer };\n})();`, context)
  return context.result
}
const linkURL = (value) => {
  if (value.startsWith('assets/')) return '/' + value
  if (value.startsWith('index.html')) return value.replace('index.html', '/')
  return value.replace(/^([a-z0-9-]+)\.html/, '/$1')
}
function convert(html, scope) {
  const $ = load(html, { xml: { xmlMode: false, decodeEntities: true } }, false)
  const content = { copy: [], images: [], links: [] }
  let textIndex = 0, imageIndex = 0, linkIndex = 0
  function visit(node, trail = '') {
    if (node.type === 'text') {
      if (!node.data.trim()) return { text: node.data }
      const key = `${scope}-t${++textIndex}`
      content.copy.push({ key, label: `${trail} · ${node.data.trim().slice(0, 90)}`, value: node.data })
      return { text: node.data, textKey: key }
    }
    if (!node.name || ['script', 'style'].includes(node.name)) return null
    const attrs = { ...node.attribs }
    for (const key of Object.keys(attrs)) if (/^on/i.test(key)) delete attrs[key]
    const result = { tag: node.name, attrs }
    if (node.name === 'img' && attrs.src) {
      const key = `${scope}-i${++imageIndex}`
      attrs.src = linkURL(attrs.src || '')
      content.images.push({ key, label: attrs.alt || attrs.src, src: attrs.src, alt: attrs.alt || '' })
      result.imageKey = key
    }
    if (node.name === 'a' && attrs.href) {
      attrs.href = linkURL(attrs.href)
      const key = `${scope}-l${++linkIndex}`
      content.links.push({ key, label: $(node).text().trim().slice(0, 90) || attrs['aria-label'] || attrs.href, href: attrs.href })
      result.linkKey = key
    }
    if (attrs.id === 'site-header' || attrs.id === 'site-footer') return null
    const nextTrail = [trail, attrs.id || `${node.name}${attrs.class ? '.' + attrs.class.split(' ')[0] : ''}`].filter(Boolean).slice(-3).join(' > ')
    result.children = (node.children || []).map((child) => visit(child, nextTrail)).filter(Boolean)
    return result
  }
  return { nodes: $.root().contents().toArray().map((node) => visit(node)).filter(Boolean), content }
}

const files = fs.readdirSync(source).filter((file) => file.endsWith('.html')).sort()
const pages = files.map((file) => {
  const html = fs.readFileSync(path.join(source, file), 'utf8')
  const $ = load(html)
  const body = convert($('body').html(), 'page')
  const frame = makeFrame(file)
  return { slug: file.replace('.html', ''), title: $('title').text(), description: $('meta[name="description"]').attr('content') || '',
    body: body.nodes, header: convert(frame.header, 'header').nodes, content: body.content }
})
const frame = makeFrame('index.html')
const header = convert(frame.header, 'header')
const footer = convert(frame.footer, 'footer')
const casesScript = fs.readFileSync(path.join(source, 'assets/cases.js'), 'utf8')
const caseContext = { window: {} }
vm.runInNewContext(casesScript.slice(0, casesScript.indexOf('  var SETA')) + '\n})();', caseContext)
const cases = caseContext.window.EQ_CASES.map((record) => ({ ...record, imagem: linkURL(record.imagem), produtos: record.produtos.map((nome) => ({ nome })) }))
const site = { footer: footer.nodes, content: { copy: [...header.content.copy, ...footer.content.copy], images: [...header.content.images, ...footer.content.images], links: [...header.content.links, ...footer.content.links] } }
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify({ pages, site, cases, segments: caseContext.window.EQ_SEGMENTOS }, null, 2) + '\n')
fs.cpSync(path.join(source, 'assets'), path.join(root, 'public/assets'), { recursive: true, force: false, errorOnExist: false })
console.log(`Importadas ${pages.length} páginas, ${cases.length} cases. CSS e imagens originais preservados.`)
