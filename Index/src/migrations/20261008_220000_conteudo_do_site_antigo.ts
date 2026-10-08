import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { importLegacyPosts } from '../cms/legacy-posts'
import { siteDefaultDescription } from '../cms/seo-pages'

/**
 * Prepara o site para assumir o endereço do site antigo da EQ:
 * - rastreamento: os IDs que o site antigo usa (Tag Manager, Google Analytics 4 e Clarity),
 *   só onde o campo ainda está vazio;
 * - descrição padrão do site, se ainda vazia (as migrações de SEO deixam esse campo para esta, que roda
 *   quando as colunas das Configurações já existem);
 * - imagem de compartilhamento: uma foto da equipe, só se ainda não houver uma;
 * - blog: os 3 artigos do site antigo, com o mesmo texto e endereço.
 * O que a equipe já preencheu no painel não é mexido.
 */
const TRACKING = { gtmId: 'GTM-M6GGJCP', ga4Id: 'G-CX9NWGZ8FY', clarityId: 'mcupj06yj5' } as const

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: true, req })
  const data: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(TRACKING)) if (!settings[field as keyof typeof TRACKING]) data[field] = value
  if (!settings.defaultDescription?.trim()) data.defaultDescription = siteDefaultDescription
  const image = path.resolve('public/assets/compartilhar-eq.jpg')
  if (!settings.shareImage && existsSync(image)) {
    const media = await payload.create({ collection: 'media', data: { alt: 'Equipe da EQ Seguros no escritório' }, filePath: image, overrideAccess: true, req })
    data.shareImage = media.id
  }
  if (Object.keys(data).length) await payload.updateGlobal({ slug: 'settings', data, overrideAccess: true, req })
  await importLegacyPosts(payload, req)
}

// Texto e imagens importados passam a ser conteúdo da equipe: não são apagados ao reverter.
export async function down(_: MigrateDownArgs): Promise<void> {}
