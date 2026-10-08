import type { Post } from '../payload-types'

/** Conversão do texto dos artigos do site antigo para o formato do editor do blog. Sem dependências, para o teste rodar direto. */
type Lexical = Post['content']
type Part = { text?: string; bold?: boolean; br?: boolean; link?: string; newTab?: boolean }
const base = { direction: null, format: '', indent: 0, version: 1 }

/** Endereços do site antigo que mudaram de nome no novo. */
const moved: Record<string, string> = { '/fale-conosco': '/contato' }
const internal = (url: string) => {
  const match = url.match(/^https?:\/\/(?:www\.)?eqseguros\.com\.br(\/[^?#]*)?/i)
  return match ? moved[match[1] || '/'] ?? (match[1] || '/') : url
}

const inline = (part: Part) => {
  if (part.br) return { type: 'linebreak', version: 1 }
  const text = { type: 'text', version: 1, detail: 0, format: part.bold ? 1 : 0, mode: 'normal', style: '', text: part.text }
  return part.link
    ? { ...base, type: 'link', version: 3, fields: { linkType: 'custom', url: internal(part.link), newTab: Boolean(part.newTab) }, children: [text] }
    : text
}

/** Texto do artigo antigo, parágrafo por parágrafo, no formato do editor do blog. */
export function toLexical(blocks: { tag: string; parts: Part[] }[]) {
  return { root: { ...base, type: 'root', children: blocks.map((block) => block.tag === 'h2'
    ? { ...base, type: 'heading', tag: 'h2', children: block.parts.map(inline) }
    : { ...base, type: 'paragraph', textFormat: 0, textStyle: '', children: block.parts.map(inline) }) } } as unknown as Lexical
}
