'use client'

import { useFormFields, useRowLabel } from '@payloadcms/ui'
import sections from '@/generated/sections.json'
import './row-label.css'

type Row = { key?: string; label?: string; value?: string; href?: string; alt?: string; src?: string }
type Section = { secao: string; inicio: boolean }

const pages = sections.pages as Record<string, Record<string, Section>>
const site = sections.site as Record<string, Section>

/** Que tipo de elemento é, lido do trecho mais interno para o mais externo. */
const KINDS: [RegExp, string][] = [
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

function kindOf(label?: string) {
  const path = (label || '').split(' · ')[0].trim()
  if (!path) return ''
  const segments = path.split('>').map((part) => part.trim()).filter(Boolean)
  for (const segment of [...segments].reverse()) {
    const found = KINDS.find(([test]) => test.test(segment))
    if (found) return found[1]
  }
  return ''
}

function preview(data: Row) {
  const text = (data.value ?? data.alt ?? data.href ?? data.src ?? '').trim()
  if (!text) return data.key ? `(sem conteúdo) ${data.key}` : '(sem conteúdo)'
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

/**
 * Substitui os rótulos genéricos ("Copy 01") pelo conteúdo real e abre um
 * divisor sempre que começa uma nova seção da página, na mesma ordem e com os
 * mesmos nomes que o visitante vê no site.
 */
export default function RowLabel() {
  const { data, rowNumber } = useRowLabel<Row>()
  // O documento diz de que página é a linha; o global de cabeçalho/rodapé não
  // tem slug e cai no mapa próprio dele.
  const slug = useFormFields(([fields]) => (fields?.slug?.value as string | undefined))
  const section = data?.key ? (slug ? pages[slug]?.[data.key] : site[data.key]) : undefined

  const position = typeof rowNumber === 'number' ? rowNumber + 1 : undefined
  const kind = kindOf(data?.label)

  return (
    <span className={`eq-row${section?.inicio ? ' eq-row--section-start' : ''}`}>
      {section?.inicio && <span className="eq-row__section">{section.secao}</span>}
      {position !== undefined && <span className="eq-row__number">{String(position).padStart(2, '0')}</span>}
      <span className="eq-row__text">{preview(data || {})}</span>
      {kind && <span className="eq-row__hint">{kind}</span>}
    </span>
  )
}
