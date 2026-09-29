import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { pageTitle, stripSiteName, DEFAULT_SITE_NAME } from '../lib/site-title'

type PageRow = { id: number; slug: string; title: string }

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'EQ Seguros' NOT NULL,
  	\`logo_id\` integer,
  	\`favicon_id\` integer,
  	\`default_description\` text,
  	\`share_image_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`favicon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`settings_logo_idx\` ON \`settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`settings_favicon_idx\` ON \`settings\` (\`favicon_id\`);`)
  await db.run(sql`CREATE INDEX \`settings_share_image_idx\` ON \`settings\` (\`share_image_id\`);`)

  // O nome do site passa a entrar sozinho no título; tira o que estava escrito à mão.
  const pages = await db.all<PageRow>(sql`SELECT id, slug, title FROM pages`)
  for (const page of pages) {
    const title = stripSiteName(page.title, page.slug)
    if (title !== page.title) await db.run(sql`UPDATE pages SET title = ${title} WHERE id = ${page.id}`)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const pages = await db.all<PageRow>(sql`SELECT id, slug, title FROM pages`)
  for (const page of pages) {
    if (page.title.includes(DEFAULT_SITE_NAME)) continue
    await db.run(sql`UPDATE pages SET title = ${pageTitle(page.title, DEFAULT_SITE_NAME, page.slug)} WHERE id = ${page.id}`)
  }
  await db.run(sql`DROP TABLE \`settings\`;`)
}
