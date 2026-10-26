import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_links\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`site_links\` ADD \`hidden\` integer DEFAULT false;`)
  // O link já foi retirado pelo editor; ocultar só este card e manter um destino válido no formulário.
  await db.run(sql`UPDATE pages_links SET hidden = true, href = '#'
    WHERE key = 'page-l6' AND _parent_id IN (SELECT id FROM pages WHERE slug = 'compliance');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_links\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`site_links\` DROP COLUMN \`hidden\`;`)
}
