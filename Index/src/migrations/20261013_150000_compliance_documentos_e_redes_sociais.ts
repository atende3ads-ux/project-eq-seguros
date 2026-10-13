import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import prototype from '../generated/prototype.json'
import { hasPages } from '../cms/fresh'

/**
 * Para os bancos que já existem:
 * - Rodapé: Instagram, Facebook e YouTube da EQ passam a ter endereço (só onde o link ainda está em "#";
 *   o que a equipe já preencheu não é mexido). O LinkedIn segue sem endereço e o ícone fica escondido.
 * - Compliance: os cartões de Sustentabilidade e Balanço passam a baixar os PDFs, e entram três cartões novos
 *   (Estatuto Social, Código de Ética e Conduta, Prevenção à Lavagem de Dinheiro) que estavam no site antigo.
 *   Os três ficam no meio da página, então os textos de baixo (Autorizações SUSEP e Ouvidoria) trocam de chave:
 *   page-t27 em diante viram page-t33 em diante. O texto que a equipe editou vai junto com a chave.
 * Num banco novo a importação inicial já traz tudo.
 */
const SOCIAL: Record<string, string> = {
  'footer-l1': 'https://www.instagram.com/eq.seguros/',
  'footer-l2': 'https://www.facebook.com/eqseguros',
  'footer-l3': 'https://www.youtube.com/@grupoequatorial3548',
}
const FIRST_SHIFTED = 27   // page-t27 em diante
const SHIFT = 6            // três cartões novos × (título + frase)
const NEW_TEXTS = [27, 28, 29, 30, 31, 32]
const NEW_LINKS = ['page-l6', 'page-l7', 'page-l8']
const FILLED_LINKS: Record<string, string> = { 'page-l3': '/documentos/politica-de-sustentabilidade.pdf', 'page-l4': '/documentos/demonstracoes-contabeis.pdf' }

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true, req })
  if (site.links?.length) {
    let changed = false
    const links = site.links.map((link) => {
      if (SOCIAL[link.key] && link.href === '#') { changed = true; return { ...link, href: SOCIAL[link.key] } }
      return link
    })
    if (changed) await payload.updateGlobal({ slug: 'site', overrideAccess: true, req, data: { links } })
  }

  if (!await hasPages(db)) return
  const found = await payload.find({ collection: 'pages', where: { slug: { equals: 'compliance' } }, limit: 1, depth: 0, overrideAccess: true, req })
  const page = found.docs[0]
  const source = prototype.pages.find((item) => item.slug === 'compliance')
  if (!page || !source) return
  const copy = page.copy || []
  // Já tem os cartões novos: nada a fazer (rodar de novo não muda mais nada).
  if (copy.some((item) => item.key === 'page-t27' && item.value === 'Estatuto Social')) return

  const shifted = copy.map((item) => {
    const number = Number(/^page-t(\d+)$/.exec(item.key)?.[1])
    if (!number || number < FIRST_SHIFTED) return { key: item.key, label: item.label, value: item.value }
    const key = `page-t${number + SHIFT}`
    return { key, label: source.content.copy.find((entry) => entry.key === key)?.label ?? item.label, value: item.value }
  })
  const added = NEW_TEXTS.map((n) => source.content.copy.find((entry) => entry.key === `page-t${n}`)!).map(({ key, label, value }) => ({ key, label, value }))
  const links = (page.links || []).map(({ key, label, href }) => ({ key, label, href: FILLED_LINKS[key] && href === '#' ? FILLED_LINKS[key] : href }))
  const addedLinks = NEW_LINKS.filter((key) => !links.some((link) => link.key === key)).map((key) => source.content.links.find((entry) => entry.key === key)!).map(({ key, label, href }) => ({ key, label, href }))
  await payload.update({ collection: 'pages', id: page.id, overrideAccess: true, req, data: { copy: [...shifted, ...added], links: [...links, ...addedLinks] } })
}

// O conteúdo editado depois (textos, endereços) não é desfeito.
export async function down(_: MigrateDownArgs): Promise<void> {}
