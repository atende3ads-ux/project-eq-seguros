import { sql } from '@payloadcms/db-sqlite'
import type { MigrateUpArgs } from '@payloadcms/db-sqlite'

/**
 * Leitura e gravação das Configurações do site por SQL, para uso dentro de migrações de dados.
 *
 * Por que não `payload.findGlobal`/`updateGlobal`: o Payload consulta TODAS as colunas do schema atual.
 * Num banco novo, uma migração de dados mais antiga roda antes das migrações que criaram colunas novas
 * nas Configurações, e a consulta falha ("no such column"). SQL com as colunas que a própria migração
 * conhece funciona em qualquer ordem. Só as colunas listadas aqui existem desde a migração de rastreamento.
 */
type Db = MigrateUpArgs['db']
export type SettingsColumn = 'default_description' | 'share_image_id' | 'gtm_id' | 'ga4_id' | 'clarity_id' | 'form_recipient'

/** Garante a linha única das Configurações (um banco novo ainda não a tem) e devolve o id. */
async function row(db: Db) {
  const rows = await db.all<{ id: number }>(sql`SELECT id FROM settings LIMIT 1`)
  if (rows[0]) return rows[0].id
  const now = new Date().toISOString()
  await db.run(sql`INSERT INTO settings (site_name, created_at, updated_at) VALUES ('EQ Seguros', ${now}, ${now})`)
  return (await db.all<{ id: number }>(sql`SELECT id FROM settings LIMIT 1`))[0].id
}

/** Preenche só o que ainda está vazio: o que a equipe já digitou no painel nunca é trocado. */
export async function fillSettings(db: Db, values: Partial<Record<SettingsColumn, string | number>>, mediaNeeded?: () => Promise<number | undefined>) {
  const id = await row(db)
  const current = (await db.all<Record<string, unknown>>(sql`SELECT * FROM settings WHERE id = ${id}`))[0]
  const empty = (column: SettingsColumn) => current[column] === null || current[column] === undefined || String(current[column]).trim() === ''
  const changed: string[] = []
  for (const [column, value] of Object.entries(values) as [SettingsColumn, string | number][]) {
    if (!empty(column)) continue
    // Colunas fixas e conhecidas, nunca texto vindo de fora.
    if (column === 'default_description') await db.run(sql`UPDATE settings SET default_description = ${value} WHERE id = ${id}`)
    else if (column === 'gtm_id') await db.run(sql`UPDATE settings SET gtm_id = ${value} WHERE id = ${id}`)
    else if (column === 'ga4_id') await db.run(sql`UPDATE settings SET ga4_id = ${value} WHERE id = ${id}`)
    else if (column === 'clarity_id') await db.run(sql`UPDATE settings SET clarity_id = ${value} WHERE id = ${id}`)
    else if (column === 'form_recipient') await db.run(sql`UPDATE settings SET form_recipient = ${value} WHERE id = ${id}`)
    else continue
    changed.push(column)
  }
  if (mediaNeeded && empty('share_image_id')) {
    const media = await mediaNeeded()
    if (media) { await db.run(sql`UPDATE settings SET share_image_id = ${media} WHERE id = ${id}`); changed.push('share_image_id') }
  }
  return changed
}
