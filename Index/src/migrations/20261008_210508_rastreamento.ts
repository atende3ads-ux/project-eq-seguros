import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` ADD \`gtm_id\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`ga4_id\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`clarity_id\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`gtm_id\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`ga4_id\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`clarity_id\`;`)
}
