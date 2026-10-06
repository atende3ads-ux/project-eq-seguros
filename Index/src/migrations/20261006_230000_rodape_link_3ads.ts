import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import { validateHref } from '../lib/href'

/**
 * "Desenvolvido por 3ADS" no rodapé passou a ser um link de verdade, com dois
 * campos no painel: o texto (`footer-t51`) e o endereço (`footer-l26`).
 *
 * Esta migração acerta os bancos que já existem:
 * - cria a linha do link, que o painel precisa para mostrar o campo;
 * - se alguém digitou o HTML do link no texto (`<a href="…">3ADS</a>`), separa
 *   o endereço e o texto.
 * Num banco novo não há nada a fazer: a importação inicial já traz tudo.
 */
const TEXT_KEY = 'footer-t51'
const LINK_KEY = 'footer-l26'
const DEFAULT_LINK = { key: LINK_KEY, label: '3ADS', href: 'https://3ads.com.br' }

/** `<a href="https://…">3ADS</a>` → endereço e texto; qualquer outro valor não é tocado. */
function parseAnchor(value: string) {
  const match = /^\s*<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*$/i.exec(value)
  if (!match) return undefined
  const text = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const href = match[1].trim()
  return text && validateHref(href) === true ? { href, text } : undefined
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true, req })
  const copy = site.copy || []
  if (!copy.length) return

  const links = [...(site.links || [])]
  let link = links.find((item) => item.key === LINK_KEY)
  if (!link) {
    links.push({ ...DEFAULT_LINK })
    link = links[links.length - 1]
  }

  const text = copy.find((item) => item.key === TEXT_KEY)
  const anchor = text ? parseAnchor(text.value) : undefined
  if (text && anchor) {
    text.value = anchor.text
    link.href = anchor.href
  }

  await payload.updateGlobal({ slug: 'site', overrideAccess: true, req, data: { copy, links } })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true, req })
  if (!site.links?.some((item) => item.key === LINK_KEY)) return
  await payload.updateGlobal({ slug: 'site', overrideAccess: true, req, data: { links: site.links.filter((item) => item.key !== LINK_KEY) } })
}
