import sections from '@/generated/sections.json'

/**
 * O que o layout diz sobre cada chave: seção, papel no layout ("Título",
 * "Botão"…), grupo repetido (card, item) e o link que envolve o texto.
 */
export type Entry = {
  secao: string; inicio: boolean; papel?: string; parte?: number; partes?: number
  grupo?: { id: string; tipo: string }; link?: string; textos?: string[]; imagem?: string
  /** Vem dos posts do blog, não da página: 'posts' (cards) ou 'artigo' (modelo do post). */
  gerenciado?: 'posts' | 'artigo'
}
export type Scope = Record<string, Entry>

const pages = sections.pages as Record<string, Scope>
const site = sections.site as Scope

/** O documento diz de que página é; o global de cabeçalho/rodapé não tem slug e usa o mapa próprio. */
export const scopeFor = (slug?: string): Scope => (slug ? pages[slug] : site) || {}

export type List = 'copy' | 'images' | 'links'
/** `page-t12` é texto, `page-i3` imagem e `header-l2` link. */
export const listOf = (key: string): List | undefined =>
  ({ t: 'copy', i: 'images', l: 'links' } as const)[/-([til])\d+$/.exec(key)?.[1] as 't' | 'i' | 'l']
