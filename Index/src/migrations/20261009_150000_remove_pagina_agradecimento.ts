import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import { hasPages } from '../cms/fresh'

/**
 * A página "Mensagem enviada" (`/formulario-enviado`) deixou de existir: o formulário agora confirma o envio no
 * próprio botão, sem trocar de página. Apaga a página dos bancos que a criaram (a migração anterior a criava).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  if (!await hasPages(db)) return
  await payload.delete({ collection: 'pages', where: { slug: { equals: 'formulario-enviado' } }, overrideAccess: true, req })
}

export async function down(_: MigrateDownArgs): Promise<void> {}
