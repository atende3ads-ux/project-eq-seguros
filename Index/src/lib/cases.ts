import type { CaseRecord } from './types'

/**
 * Os cases seguem fora do ar até o cliente enviar o material definitivo
 * (alinhamento de 21/09/2026). Enquanto isso some do site a área inteira —
 * páginas, seção da Tecnologia e links de menu e rodapé —, não só os cards,
 * para não deixar link apontando para página inexistente.
 *
 * Oculto por padrão de propósito: quando o material chegar, basta publicar
 * com CASES_VISIBLE=true. Um ambiente sem a variável não revela os cases.
 */
export const casesVisible = process.env.CASES_VISIBLE === 'true'

/** Páginas que só existem por causa dos cases. */
export const casesSlugs = new Set(['cases', 'case'])

/** Ids das seções que montam listagem ou vitrine de cases dentro de outras páginas. */
export const casesSectionIds = new Set(['cases-filtro', 'cases-grid', 'cases-destaque'])

/** Reconhece /cases e /case, com ou sem query string. */
export const isCasesHref = (href?: string | null) => Boolean(href && /^\/cases?(?:[/?#]|$)/.test(href))

export const segments: Record<string, string> = { fintechs: 'Fintechs e bancos', varejo: 'Varejo e e-commerce', rh: 'RH e benefícios', corretoras: 'Corretoras e correspondentes' }
export function imageURL(record: CaseRecord) {
  return typeof record.media === 'object' && record.media?.url ? record.media.url : record.imagem
}
