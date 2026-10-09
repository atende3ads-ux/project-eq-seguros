import { sql } from '@payloadcms/db-sqlite'
import type { MigrateUpArgs } from '@payloadcms/db-sqlite'

/**
 * Banco novo: ainda não há nenhuma página (a importação inicial as cria depois, já no formato atual).
 * As migrações de dados que ajustam páginas existentes devem pular nesse caso. Além de não haver o que
 * ajustar, o Payload consulta TODAS as colunas do schema atual, e num banco novo as migrações mais antigas
 * rodam antes das que criaram colunas novas em `pages`: a consulta falharia ("no such column").
 */
export async function hasPages(db: MigrateUpArgs['db']) {
  const rows = await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM pages`)
  return Number(rows[0]?.n ?? 0) > 0
}
