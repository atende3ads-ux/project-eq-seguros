import { getPayload } from 'payload'
import config from '@payload-config'
import { casesVisible } from '@/lib/cases'
import './pages-nav.css'

/**
 * "Páginas do site" lista 26 documentos em ordem alfabética, o que obriga a
 * procurar pelo título para achar uma página. Aqui elas aparecem agrupadas na
 * mesma ordem do menu do site, que é o mapa que a equipe já tem na cabeça.
 */
const GROUPS: { titulo: string; slugs: string[] }[] = [
  { titulo: 'Início', slugs: ['index'] },
  { titulo: 'Seguros', slugs: ['seguros', 'seguro-vida', 'seguro-prestamista', 'seguro-acidentes', 'seguro-funeral', 'seguro-viagem', 'combos'] },
  { titulo: 'Crédito', slugs: ['credito', 'consignado', 'peculio'] },
  { titulo: 'Tecnologia', slugs: ['tecnologia', 'api'] },
  { titulo: 'Para Parceiros', slugs: ['parceiros', 'seja-parceiro', 'cases', 'case'] },
  { titulo: 'Atendimento', slugs: ['atendimento', 'ajuda', 'contato'] },
  { titulo: 'Institucional', slugs: ['grupo-eq', 'compliance', 'privacidade', 'termos'] },
  { titulo: 'Blog', slugs: ['blog', 'post'] },
]

/** Nomes curtos: o título do documento é o título de SEO, longo demais para o menu. */
const NAMES: Record<string, string> = {
  index: 'Home', seguros: 'Seguros (lista)', 'seguro-vida': 'Seguro de Vida',
  'seguro-prestamista': 'Seguro Prestamista', 'seguro-acidentes': 'Acidentes Pessoais',
  'seguro-funeral': 'Seguro Funeral', 'seguro-viagem': 'Seguro Viagem', combos: 'Combos e Produtos',
  credito: 'Crédito (lista)', consignado: 'Empréstimo Consignado', peculio: 'Pecúlio',
  tecnologia: 'Tecnologia EQ', api: 'Integrações e API',
  parceiros: 'Para Parceiros', 'seja-parceiro': 'Seja um Parceiro',
  cases: 'Cases (listagem)', case: 'Case (detalhe)',
  atendimento: 'Atendimento', ajuda: 'Central de Ajuda', contato: 'Contato',
  'grupo-eq': 'EQ Grupo', compliance: 'Compliance', privacidade: 'Política de Privacidade', termos: 'Termos de Uso',
  blog: 'Blog (listagem)', post: 'Post (detalhe)',
}

export default async function PagesNav() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'pages', limit: 100, depth: 0, overrideAccess: true, pagination: false })
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  const grouped = new Set(GROUPS.flatMap((group) => group.slugs))
  const leftovers = docs.filter((doc) => !grouped.has(doc.slug)).map((doc) => doc.slug)
  const groups = leftovers.length ? [...GROUPS, { titulo: 'Outras', slugs: leftovers }] : GROUPS

  return (
    <div className="eq-nav">
      <div className="eq-nav__title">Páginas por seção do site</div>
      {groups.map((group) => {
        const items = group.slugs.map((slug) => bySlug.get(slug)).filter(Boolean)
        if (!items.length) return null
        return (
          <div className="eq-nav__group" key={group.titulo}>
            <div className="eq-nav__group-title">{group.titulo}</div>
            <ul className="eq-nav__list">
              {items.map((doc) => {
                const oculta = !casesVisible && (doc!.slug === 'cases' || doc!.slug === 'case')
                return (
                  <li key={doc!.id}>
                    <a className="eq-nav__link" href={`/admin/collections/pages/${doc!.id}`}>
                      <span>{NAMES[doc!.slug] || doc!.slug}</span>
                      {oculta && <span className="eq-nav__badge" title="Fora do ar até o material chegar">oculta</span>}
                      {doc!.status === 'draft' && <span className="eq-nav__badge">rascunho</span>}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
