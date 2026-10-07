/**
 * Comparação de frase-chave usada pela análise do painel e pelo teste de SEO
 * das páginas: sem acento, sem diferença de maiúsculas, ignorando palavras
 * vazias e tolerando singular e plural.
 */
export const STOPWORDS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'um', 'uma', 'ao', 'que'])
export const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export const words = (value: string) => normalize(value).split(' ').filter(Boolean)
/** Mesma palavra ou variação curta de singular/plural ("seguro" e "seguros"). */
export const sameWord = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2)

/** A frase aparece inteira ou com todas as palavras importantes, em qualquer ordem. */
export function mentions(text: string, phrase: string) {
  const key = words(phrase).filter((word) => !STOPWORDS.has(word))
  if (!key.length) return false
  if (normalize(text).includes(normalize(phrase))) return true
  const found = words(text)
  return key.every((word) => found.some((candidate) => sameWord(candidate, word)))
}
