import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import sharp from 'sharp'
import { Users, Media, Pages, Cases, Site, Settings } from './cms/collections'
import { Categories, Posts } from './cms/blog'
import { seedPrototype } from './cms/seed'
import { seedBlog } from './cms/seed-blog'
import { migrations } from './migrations'

mkdirSync(path.resolve('.data'), { recursive: true })
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.startsWith('SUBSTITUA')) {
  throw new Error('Defina PAYLOAD_SECRET privado no arquivo .env antes de iniciar.')
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
    // Sem Gravatar: o painel não manda o hash do e-mail de quem está logado a um serviço externo.
    avatar: 'default',
    importMap: { baseDir: path.resolve('src') },
    components: {
      beforeLogin: ['/components/admin/PasswordVisibility'],
      beforeNavLinks: ['/components/admin/PagesNav'],
      graphics: { Logo: '/components/admin/Logo', Icon: '/components/admin/Icon' },
    },
    meta: { titleSuffix: ' | EQ Seguros' },
  },
  collections: [Pages, Posts, Categories, Media, Cases, Users], globals: [Settings, Site],
  editor: lexicalEditor(), sharp,
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URL || 'file:./.data/eq-seguros.db' }, prodMigrations: migrations }),
  i18n: { supportedLanguages: { pt }, fallbackLanguage: 'pt' },
  typescript: { outputFile: path.resolve('src/payload-types.ts') },
  onInit: async (payload) => {
    await seedPrototype(payload)
    await seedBlog(payload)
  },
})
