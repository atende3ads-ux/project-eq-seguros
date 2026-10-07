import type { Payload, PayloadRequest } from 'payload'
import prototype from '../generated/prototype.json'
import { stripSiteName } from '../lib/site-title'
import { pageSeo, postSeo, siteDefaultDescription } from './seo-pages'

/**
 * Coloca o SEO de seo-pages.ts no banco, sem passar por cima do que a equipe
 * já escreveu: título e descrição só são trocados enquanto ainda estão como
 * vieram do protótipo (ou vazios); frase-chave e descrição de imagem, só se
 * estiverem vazias. Rodar de novo não muda mais nada.
 */
export async function applySeo(payload: Payload, req?: Partial<PayloadRequest>) {
  const original = new Map(prototype.pages.map((page) => [page.slug, { title: stripSiteName(page.title, page.slug), description: page.description }]))
  const done = { pages: 0, keptPages: 0, images: 0, posts: 0 }

  const pages = await payload.find({ collection: 'pages', limit: 200, depth: 0, pagination: false, overrideAccess: true, req })
  for (const doc of pages.docs) {
    const seo = pageSeo[doc.slug]
    const proto = original.get(doc.slug)
    if (!seo || !proto) continue
    const data: Record<string, unknown> = {}
    const edited: string[] = []

    if (doc.title === proto.title) { if (doc.title !== seo.title) data.title = seo.title } else edited.push('título')
    if (!doc.description || doc.description === proto.description) { if (doc.description !== seo.description) data.description = seo.description } else edited.push('descrição')
    if (!doc.focusKeyphrase) data.focusKeyphrase = seo.focusKeyphrase

    let described = 0
    const images = (doc.images || []).map((image) => {
      const alt = seo.alts?.[image.key]
      if (!alt || image.alt?.trim()) return image
      described += 1
      return { ...image, alt }
    })
    if (described) { data.images = images; done.images += described }

    if (edited.length) done.keptPages += 1
    if (!Object.keys(data).length) continue
    await payload.update({ collection: 'pages', id: doc.id, data, overrideAccess: true, req })
    done.pages += 1
  }

  const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true, req })
  if (!settings.defaultDescription?.trim()) {
    await payload.updateGlobal({ slug: 'settings', data: { defaultDescription: siteDefaultDescription }, overrideAccess: true, req })
  }

  for (const [slug, seo] of Object.entries(postSeo)) {
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true, overrideAccess: true, req })
    const post = found.docs[0]
    if (!post) continue
    const data: Record<string, unknown> = {}
    if (!post.seoTitle) data.seoTitle = seo.seoTitle
    if (!post.seoDescription) data.seoDescription = seo.seoDescription
    if (!post.focusKeyphrase) data.focusKeyphrase = seo.focusKeyphrase
    if (!Object.keys(data).length) continue
    await payload.update({ collection: 'posts', id: post.id, data, overrideAccess: true, req })
    done.posts += 1
  }

  payload.logger.info(`SEO aplicado: ${done.pages} páginas atualizadas, ${done.images} imagens descritas, ${done.posts} post(s); ${done.keptPages} página(s) com título ou descrição editados pela equipe foram mantidas.`)
  return done
}
