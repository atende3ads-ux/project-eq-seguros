import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` ADD \`template\` text;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`show_in_menu\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`menu_title\` text;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`menu_description\` text;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`menu_icon\` text DEFAULT 'doc';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`template\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`show_in_menu\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`menu_title\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`menu_description\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`menu_icon\`;`)
}
