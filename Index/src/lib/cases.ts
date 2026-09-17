import type { CaseRecord } from './types'
export const segments: Record<string, string> = { fintechs: 'Fintechs e bancos', varejo: 'Varejo e e-commerce', rh: 'RH e benefícios', corretoras: 'Corretoras e correspondentes' }
export function imageURL(record: CaseRecord) {
  return typeof record.media === 'object' && record.media?.url ? record.media.url : record.imagem
}
