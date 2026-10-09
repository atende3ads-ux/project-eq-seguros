/**
 * Páginas de serviço criadas pelo painel a partir de um modelo.
 *
 * O desenho (layout) de cada página mora no código; o conteúdo, no banco. Uma página nova usa o desenho de
 * um dos modelos abaixo (`template`) e começa com uma cópia do conteúdo do modelo, como estiver no painel.
 * Sem dependências, para o painel, o servidor e os testes usarem as mesmas regras.
 */

/** Páginas que servem de modelo, com o ícone sugerido para o card do menu. */
export const SERVICE_MODELS: { slug: string; label: string; icon: string }[] = [
  { slug: 'seguro-vida', label: 'Seguro de Vida', icon: 'heart' },
  { slug: 'seguro-prestamista', label: 'Seguro Prestamista', icon: 'shield' },
  { slug: 'seguro-acidentes', label: 'Seguro de Acidentes Pessoais', icon: 'pulse' },
  { slug: 'seguro-funeral', label: 'Seguro Funeral', icon: 'leaf' },
  { slug: 'seguro-viagem', label: 'Seguro Viagem', icon: 'plane' },
]

/** Endereços que já pertencem a rotas do site ou do painel. */
const RESERVED = new Set(['admin', 'api', 'blog', 'enviar-formulario', 'health', 'sitemap.xml', 'robots.txt', 'assets', 'media', 'post', 'case', 'index', 'favicon.ico', 'llms.txt'])

export const toSlug = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '')

/** Mensagem em português se o endereço não puder ser usado; `undefined` se estiver bom. */
export function slugError(slug: unknown): string | undefined {
  if (typeof slug !== 'string' || !slug) return 'Informe o endereço da página.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'Use só letras minúsculas sem acento, números e hífens.'
  if (slug.length > 80) return 'O endereço está longo demais (máximo de 80 caracteres).'
  if (RESERVED.has(slug)) return 'Este endereço é reservado pelo site. Escolha outro.'
  return undefined
}

type Entry = { key: string; value: string }
type Scope = Record<string, { secao?: string; papel?: string }>

/**
 * Troca o nome do modelo pelo da página nova nos dois lugares que o mostram logo de cara: a última etapa da
 * trilha de navegação (Home › Seguros › Nome) e o título principal. O restante do texto é do modelo e a equipe
 * reescreve nas seções.
 */
export function withTitle(copy: Entry[], scope: Scope, title: string): Entry[] {
  const crumbs = copy.filter((item) => scope[item.key]?.secao === 'Trilha de navegação' && scope[item.key]?.papel === 'Texto' && item.value.trim() !== '›')
  const crumb = crumbs[crumbs.length - 1]?.key
  const heading = copy.find((item) => scope[item.key]?.papel === 'Título principal')?.key
  return copy.map((item) => item.key === crumb || item.key === heading ? { ...item, value: title } : item)
}
