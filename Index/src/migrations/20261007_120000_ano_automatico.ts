import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import { hasPages } from '../cms/fresh'
import { copyrightToToken } from '../lib/year'

/**
 * "© 2026" do rodapé passa a ser "© {ano}", que o site troca pelo ano atual a
 * cada acesso (ver src/lib/year.ts). Só o ano logo depois do © é convertido;
 * anos históricos e intervalos ("© 2019–2026") ficam como estão. Num banco
 * novo não há o que converter: a importação inicial já traz o marcador.
 */
type Row = { value: string }
const convert = <T extends Row>(copy: T[] | null | undefined) => {
  let changed = false
  const next = (copy || []).map((item) => {
    const value = copyrightToToken(item.value)
    if (value === item.value) return item
    changed = true
    return { ...item, value }
  })
  return { changed, next }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true, req })
  const global = convert(site.copy)
  if (global.changed) await payload.updateGlobal({ slug: 'site', overrideAccess: true, req, data: { copy: global.next } })

  if (!await hasPages(db)) return
  const pages = await payload.find({ collection: 'pages', limit: 200, depth: 0, pagination: false, overrideAccess: true, req })
  for (const page of pages.docs) {
    const result = convert(page.copy)
    if (result.changed) await payload.update({ collection: 'pages', id: page.id, overrideAccess: true, req, data: { copy: result.next } })
  }
}

// O ano original não é guardado: não há como saber qual era antes do marcador.
export async function down(_: MigrateDownArgs): Promise<void> {}
