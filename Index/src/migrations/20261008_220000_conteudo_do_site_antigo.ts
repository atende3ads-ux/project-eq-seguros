import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { importLegacyPosts } from '../cms/legacy-posts'
import { siteDefaultDescription } from '../cms/seo-pages'
import { fillSettings } from '../cms/settings-sql'

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

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const image = path.resolve('public/assets/compartilhar-eq.jpg')
  await fillSettings(db, { gtm_id: TRACKING.gtmId, ga4_id: TRACKING.ga4Id, clarity_id: TRACKING.clarityId, default_description: siteDefaultDescription }, async () =>
    existsSync(image) ? (await payload.create({ collection: 'media', data: { alt: 'Equipe da EQ Seguros no escritório' }, filePath: image, overrideAccess: true, req })).id : undefined)
  await importLegacyPosts(payload, req)
}

// Texto e imagens importados passam a ser conteúdo da equipe: não são apagados ao reverter.
export async function down(_: MigrateDownArgs): Promise<void> {}
