import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import prototype from '../generated/prototype.json'
import { applySeo } from '../cms/seo-apply'
import { stripSiteName } from '../lib/site-title'
import { hasPages } from '../cms/fresh'
import { fillSettings } from '../cms/settings-sql'

/**
 * Prepara os bancos que já existem para o aviso de cookies e os formulários de verdade:
 * - rodapé: o link "Configurações de privacidade" (texto `footer-t52`, endereço `footer-l27`), que reabre as
 *   preferências de cookies;
 * - Configurações → Formulários: e-mail que recebe os contatos, se ainda vazio;
 * - página "Mensagem enviada" (`/formulario-enviado`), para onde o visitante vai depois de enviar um contato.
 * Num banco novo, o rodapé e as páginas já vêm da importação inicial; aqui só entra o que falta.
 */
const FOOTER_TEXT = { key: 'footer-t52', label: 'footer.ft > div.ft-bar > div.wrap > span.ft-priv > a · Configurações de privacidade', value: 'Configurações de privacidade' }
const FOOTER_LINK = { key: 'footer-l27', label: 'Configurações de privacidade', href: '#configuracoes-de-privacidade' }
const RECIPIENT = 'comercial@eqseguros.com.br'
const THANKS = 'formulario-enviado'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true, req })
  if (site.copy?.length) {
    const copy = site.copy.some((item) => item.key === FOOTER_TEXT.key) ? site.copy : [...site.copy, { ...FOOTER_TEXT }]
    const links = (site.links || []).some((item) => item.key === FOOTER_LINK.key) ? site.links || [] : [...(site.links || []), { ...FOOTER_LINK }]
    if (copy.length !== site.copy.length || links.length !== (site.links || []).length) {
      await payload.updateGlobal({ slug: 'site', overrideAccess: true, req, data: { copy, links } })
    }
  }

  await fillSettings(db, { form_recipient: RECIPIENT })

  // Banco novo: a importação inicial cria todas as páginas, inclusive esta.
  if (!await hasPages(db)) return
  const page = prototype.pages.find((item) => item.slug === THANKS)
  const exists = await payload.count({ collection: 'pages', where: { slug: { equals: THANKS } }, overrideAccess: true, req })
  if (page && !exists.totalDocs) {
    await payload.create({ collection: 'pages', overrideAccess: true, req, data: {
      slug: page.slug, title: stripSiteName(page.title, page.slug), description: page.description, status: 'published', ...page.content,
    } })
    await applySeo(payload, req, { settings: false })
  }
}

// O que a equipe editou depois (link, destinatário, página) não é desfeito.
export async function down(_: MigrateDownArgs): Promise<void> {}
