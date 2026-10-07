import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import { applySeo } from '../cms/seo-apply'

/**
 * SEO completo das páginas: título, descrição, frase-chave e descrição das
 * imagens (dados em src/cms/seo-pages.ts). Só preenche o que ainda está como
 * veio do protótipo ou vazio; o que a equipe editou fica como está. Num banco
 * novo não há páginas ainda: a importação inicial aplica o mesmo SEO.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await applySeo(payload, req)
}

// Os valores anteriores não são guardados: desfazer não restaura o texto antigo.
export async function down(_: MigrateDownArgs): Promise<void> {}
