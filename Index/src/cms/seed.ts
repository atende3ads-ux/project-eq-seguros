import type { Payload } from 'payload'
import data from '../generated/prototype.json'
import type { Case } from '../payload-types'

export async function seedPrototype(payload: Payload) {
  // One-time import of source content, never a reset of an existing client's data.
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true })
  if (site.bootstrapComplete) return
  for (const page of data.pages) {
    const found = await payload.count({ collection: 'pages', where: { slug: { equals: page.slug } }, overrideAccess: true })
    if (found.totalDocs) continue
    await payload.create({ collection: 'pages', overrideAccess: true, data: {
      slug: page.slug, title: page.title, description: page.description,
      status: 'published', ...page.content,
    } })
  }
  if (!site.copy?.length) {
    await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: data.site.content })
  }
  for (const record of data.cases) {
    const found = await payload.count({ collection: 'cases', where: { slug: { equals: record.slug } }, overrideAccess: true })
    if (found.totalDocs) continue
    await payload.create({ collection: 'cases', overrideAccess: true, data: { ...record, segmento: record.segmento as Case['segmento'] } })
  }
  await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: { bootstrapComplete: true } })
  payload.logger.info('Conteúdo original da EQ Seguros importado. Nenhum usuário ou senha padrão foi criado.')
}
