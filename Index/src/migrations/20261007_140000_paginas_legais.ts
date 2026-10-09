import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import prototype from '../generated/prototype.json'
import { hasPages } from '../cms/fresh'
import { applySeo } from '../cms/seo-apply'

/**
 * Política de Privacidade e Termos de Uso passam a ter o texto publicado no
 * site atual da EQ (eqseguros.com.br), no lugar do texto-base do protótipo.
 * Substitui textos, links e imagens dessas duas páginas; o resto do site não
 * é tocado. Depois ajusta o SEO delas, que ainda falava em LGPD e "canais
 * digitais". Num banco novo não há páginas ainda: a importação inicial já traz
 * o texto novo.
 */
const SLUGS = ['privacidade', 'termos']

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  if (!await hasPages(db)) return
  for (const slug of SLUGS) {
    const source = prototype.pages.find((page) => page.slug === slug)
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, req })
    const doc = found.docs[0]
    if (!source || !doc) continue
    await payload.update({
      collection: 'pages', id: doc.id, overrideAccess: true, req,
      data: { copy: source.content.copy, images: source.content.images, links: source.content.links },
    })
  }
  await applySeo(payload, req, { settings: false })
}

// O texto anterior era o do protótipo e não é guardado.
export async function down(_: MigrateDownArgs): Promise<void> {}
