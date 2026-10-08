import path from 'node:path'
import { existsSync } from 'node:fs'
import type { Payload, PayloadRequest } from 'payload'
import legacy from './legacy-posts.json'
import { toSlug } from './blog'
import { toLexical } from './legacy-lexical'

/**
 * Traz para o blog novo os artigos que estavam no site atual (eqseguros.com.br),
 * com o mesmo texto, o mesmo endereço e as mesmas capas. Só cria o que ainda não
 * existe (pelo endereço): rodar de novo, ou depois de a equipe editar, não muda nada.
 * O site antigo não mostra data nem categoria em cada artigo: a data é a de envio da
 * capa e a categoria vem das listas "API" e "Dicas de vendas" dele. Ajustáveis no painel.
 */
export async function importLegacyPosts(payload: Payload, req?: Partial<PayloadRequest>) {
  const categories = new Map<string, number>()
  const category = async (name: string) => {
    if (categories.has(name)) return categories.get(name)!
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: toSlug(name) } }, limit: 1, depth: 0, overrideAccess: true, req })
    const id = (found.docs[0] || await payload.create({ collection: 'categories', data: { name, slug: toSlug(name) }, overrideAccess: true, req })).id
    categories.set(name, id)
    return id
  }
  let created = 0
  for (const post of legacy) {
    const exists = await payload.count({ collection: 'posts', where: { slug: { equals: post.slug } }, overrideAccess: true, req })
    if (exists.totalDocs) continue
    const file = path.resolve('public/assets', post.cover)
    const featuredImage = existsSync(file)
      ? (await payload.create({ collection: 'media', data: { alt: post.coverAlt }, filePath: file, overrideAccess: true, req })).id
      : undefined
    await payload.create({
      collection: 'posts', overrideAccess: true, req,
      data: {
        title: post.title, slug: post.slug, category: await category(post.category), featuredImage, authorName: 'Equipe EQ',
        publishedAt: post.publishedAt, excerpt: post.excerpt, content: toLexical(post.blocks),
        seoTitle: post.seoTitle, seoDescription: post.seoDescription, focusKeyphrase: post.focusKeyphrase, _status: 'published',
      },
    })
    created += 1
  }
  if (created) payload.logger.info(`Blog: ${created} artigo(s) do site antigo importado(s).`)
  return created
}
