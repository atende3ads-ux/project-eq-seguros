import path from 'node:path'
import { existsSync } from 'node:fs'
import type { Payload } from 'payload'
import prototype from '../generated/prototype.json'
import type { TemplateNode } from '../lib/types'
import type { Post } from '../payload-types'
import { toSlug } from './blog'

type Lexical = Post['content']
const base = { direction: null, format: '', indent: 0, version: 1 }
const text = (value: string) => ({ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: value })

/**
 * Importa uma única vez os artigos que o protótipo mostrava como cards fixos.
 * Só o primeiro tinha texto completo (a antiga página /post): ele entra
 * publicado. Os demais entram como rascunho, com título, categoria e imagem,
 * para a equipe escrever. Nada existente é sobrescrito.
 */
export async function seedBlog(payload: Payload) {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true })
  if (site.blogBootstrapComplete) return
  const page = (slug: string) => prototype.pages.find((item) => item.slug === slug)!
  const blog = page('blog')
  const model = page('post')
  // Cada página tem as próprias chaves (page-t1…): um mapa de textos por página.
  const valuesOf = (source: typeof blog) => new Map(source.content.copy.map((item) => [item.key, item.value]))
  const textIn = (values: Map<string, string>) => {
    const textOf = (node: TemplateNode): string => node.textKey ? values.get(node.textKey) ?? node.text ?? '' : node.text ?? (node.children || []).map(textOf).join('')
    return textOf
  }
  const blogText = textIn(valuesOf(blog))
  const modelText = textIn(valuesOf(model))
  const find = (nodes: TemplateNode[], test: (node: TemplateNode) => boolean): TemplateNode[] =>
    nodes.flatMap((node) => test(node) ? [node] : find(node.children || [], test))
  const hasClass = (name: string) => (node: TemplateNode) => (node.attrs?.class || '').split(' ').includes(name)

  // Texto do artigo completo, convertido para o editor do Payload.
  const prose = find(model.body as TemplateNode[], hasClass('prose'))[0]
  const blocks = (prose?.children || []).filter((node) => ['p', 'h2', 'h3', 'ul'].includes(node.tag || ''))
  const content = { root: { ...base, type: 'root', children: blocks.map((node) => {
    if (node.tag === 'ul') return { ...base, type: 'list', listType: 'bullet', tag: 'ul', start: 1,
      children: (node.children || []).filter((child) => child.tag === 'li').map((child, i) => ({ ...base, type: 'listitem', value: i + 1, children: [text(modelText(child).trim())] })) }
    if (node.tag === 'h2' || node.tag === 'h3') return { ...base, type: 'heading', tag: node.tag, children: [text(modelText(node).trim())] }
    return { ...base, type: 'paragraph', textFormat: 0, textStyle: '', children: [text(modelText(node).trim())] }
  }) } } as unknown as Lexical
  const firstParagraph = blocks.find((node) => node.tag === 'p')

  const categories = new Map<string, number>()
  for (const name of ['Seguros', 'Crédito', 'Educação financeira', 'Tecnologia']) {
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: toSlug(name) } }, limit: 1, overrideAccess: true })
    categories.set(name, (found.docs[0] || await payload.create({ collection: 'categories', data: { name, slug: toSlug(name) }, overrideAccess: true })).id)
  }

  // As capas vão para a biblioteca de imagens, como qualquer imagem enviada pelo painel.
  const covers = new Map<string, number>()
  const cover = async (src: string, alt: string) => {
    if (covers.has(src)) return covers.get(src)
    const file = path.resolve('public', src.replace(/^\//, ''))
    if (!existsSync(file)) return undefined
    const media = await payload.create({ collection: 'media', data: { alt }, filePath: file, overrideAccess: true })
    covers.set(src, media.id)
    return media.id
  }

  const cards = find(blog.body as TemplateNode[], hasClass('post'))
  for (const [index, card] of cards.entries()) {
    const title = blogText(find([card], (node) => node.tag === 'h4')[0]).trim()
    const slug = toSlug(title)
    const exists = await payload.count({ collection: 'posts', where: { slug: { equals: slug } }, overrideAccess: true })
    if (exists.totalDocs) continue
    const category = categories.get(blogText(find([card], hasClass('tag'))[0]).trim()) ?? categories.get('Seguros')!
    const image = find([card], (node) => node.tag === 'img')[0]
    const featuredImage = image?.attrs?.src ? await cover(image.attrs.src, title) : undefined
    const complete = index === 0
    await payload.create({
      collection: 'posts', overrideAccess: true, draft: !complete,
      data: {
        title, slug, category, featuredImage, authorName: 'Equipe EQ',
        publishedAt: new Date(Date.now() - index * 60_000).toISOString(),
        excerpt: complete && firstParagraph ? modelText(firstParagraph).trim() : undefined,
        content: complete ? content : { root: { ...base, type: 'root', children: [{ ...base, type: 'paragraph', textFormat: 0, textStyle: '', children: [] }] } } as unknown as Lexical,
        _status: complete ? 'published' : 'draft',
      },
    })
  }
  await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: { blogBootstrapComplete: true } })
  payload.logger.info('Blog importado: 1 post publicado e os demais como rascunho para a equipe escrever.')
}
