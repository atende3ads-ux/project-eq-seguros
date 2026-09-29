import type { FormState } from 'payload'
import sections from '@/generated/sections.json'

/** O que o layout diz sobre cada chave: seção e, quando for o caso, o link que envolve o texto. */
export type Entry = { secao: string; inicio: boolean; link?: string; textos?: string[] }

const pages = sections.pages as Record<string, Record<string, Entry>>
const site = sections.site as Record<string, Entry>

/** O documento diz de que página é a linha; o global de cabeçalho/rodapé não tem slug e cai no mapa próprio dele. */
export const entryFor = (slug?: string, key?: string): Entry | undefined =>
  key ? (slug ? pages[slug]?.[key] : site[key]) : undefined

/** Posição da linha com esta chave dentro de uma lista (`copy`, `links`…) do formulário. */
export function rowIndex(fields: FormState, list: string, key?: string) {
  if (!key) return -1
  for (let index = 0; fields[`${list}.${index}.key`]; index += 1) {
    if (fields[`${list}.${index}.key`]?.value === key) return index
  }
  return -1
}

/** Caminho da linha a partir do caminho de um campo dela: `copy.3.algo` → `copy.3`. */
export const rowPath = (path: string) => path.slice(0, path.lastIndexOf('.'))

/** Que tipo de elemento é, lido do trecho mais interno para o mais externo. */
const KINDS: [RegExp, string][] = [
  [/^a\.dd-cat\b/, 'aba do menu'],
  [/^a\.btn\b/, 'botão'],
  [/^(details|div\.faq|div\.fa-body)\b/, 'FAQ'],
  [/^(form\.form|div\.field|label|textarea|input)\b/, 'formulário'],
  [/^h[1-4]\b/, 'título'],
  [/^span\.kicker\b/, 'etiqueta'],
  [/^p\.lead\b/, 'destaque'],
  [/^div\.sechead\b/, 'cabeçalho'],
  [/^(div\.card|a\.card)\b/, 'card'],
  [/^span\.tag\b/, 'tag'],
  [/^li\b/, 'item'],
  [/^a\b/, 'link'],
  [/^(p|span|b|strong)\b/, 'texto'],
]

const segmentsOf = (label?: string) => (label || '').split(' · ')[0].split('>').map((part) => part.trim()).filter(Boolean)

export function kindOf(label?: string) {
  for (const segment of segmentsOf(label).reverse()) {
    const found = KINDS.find(([test]) => test.test(segment))
    if (found) return found[1]
  }
  return ''
}

/** Âncora mais interna em volta do texto, mesmo quando ela não tem endereço próprio. */
export const anchorOf = (label?: string) => segmentsOf(label).reverse().find((segment) => /^a\b/.test(segment))
