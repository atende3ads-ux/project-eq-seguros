import type { Endpoint } from 'payload'
import sections from '../generated/sections.json'
import { SERVICE_MODELS, slugError, withTitle } from '../lib/service-pages'

type Scope = Parameters<typeof withTitle>[1]

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * POST /api/pages/novo-servico  { model, title, slug, description? }
 * Cria uma página de serviço nova a partir de um modelo e devolve o id para o painel abrir.
 * Só administradores. A página nasce como RASCUNHO: não aparece no site nem no menu até alguém publicar,
 * então ninguém vê o texto do modelo com o nome novo por engano.
 */
export const newServicePage: Endpoint = {
  path: '/novo-servico', method: 'post',
  handler: async (req) => {
    if (req.user?.role !== 'admin') return json({ error: 'Só administradores criam páginas.' }, 403)
    let body: Record<string, unknown>
    try { body = await (req.json as () => Promise<Record<string, unknown>>)() } catch { return json({ error: 'Pedido inválido.' }, 400) }
    const model = SERVICE_MODELS.find((item) => item.slug === body.model)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 90) : ''
    if (!model) return json({ error: 'Escolha um modelo.' }, 400)
    if (title.length < 3 || title.length > 60) return json({ error: 'O nome da página precisa ter de 3 a 60 caracteres.' }, 400)
    const problem = slugError(slug)
    if (problem) return json({ error: problem }, 400)

    const { payload } = req
    const taken = await payload.count({ collection: 'pages', where: { slug: { equals: slug } }, overrideAccess: true })
    if (taken.totalDocs) return json({ error: 'Já existe uma página com este endereço.' }, 409)
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: model.slug } }, limit: 1, depth: 0, overrideAccess: true })
    const source = found.docs[0]
    if (!source) return json({ error: 'O modelo não foi encontrado no banco.' }, 404)

    // Sem os ids das linhas: o banco cria ids novos para a cópia.
    const copy = (source.copy || []).map(({ key, label, value }) => ({ key, label, value }))
    const created = await payload.create({
      collection: 'pages', overrideAccess: true,
      data: {
        slug, template: model.slug, title, status: 'draft',
        showInMenu: true, menuTitle: title, menuDescription: description, menuIcon: model.icon as 'heart',
        copy: withTitle(copy, (sections.pages as unknown as Record<string, Scope>)[model.slug], title),
        images: (source.images || []).map(({ key, label, src, alt, media }) => ({ key, label, src, alt, media: typeof media === 'object' && media ? media.id : media })),
        links: (source.links || []).map(({ key, label, href }) => ({ key, label, href })),
      },
    })
    return json({ id: created.id })
  },
}
