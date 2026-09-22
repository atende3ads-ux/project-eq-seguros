'use client'

import { useRowLabel } from '@payloadcms/ui'
import './row-label.css'

type Row = { key?: string; label?: string; value?: string; href?: string; alt?: string; src?: string }

/** Onde o conteúdo fica na página, deduzido do seletor guardado em `label`. */
const AREAS: [RegExp, string][] = [
  [/^nav\b/, 'Menu'],
  [/^div\.crumbbar\b/, 'Trilha'],
  [/^section\.p?hero\b/, 'Topo'],
  [/^footer\.ft\b/, 'Rodapé'],
  [/^section\.sec\b/, 'Seção'],
]

/** Que tipo de elemento é, lido do trecho mais interno para o mais externo. */
const KINDS: [RegExp, string][] = [
  [/^a\.btn\b/, 'botão'],
  [/^(details|div\.faq|div\.fa-body)\b/, 'FAQ'],
  [/^(form\.form|div\.field|label|textarea|input)\b/, 'formulário'],
  [/^h[1-4]\b/, 'título'],
  [/^span\.kicker\b/, 'etiqueta'],
  [/^p\.lead\b/, 'destaque'],
  [/^div\.sechead\b/, 'cabeçalho'],
  [/^a?\.?(div\.card|a\.card)\b/, 'card'],
  [/^span\.tag\b/, 'tag'],
  [/^li\b/, 'item'],
  [/^a\b/, 'link'],
  [/^(p|span|b|strong)\b/, 'texto'],
]

function hint(label?: string) {
  const path = (label || '').split(' · ')[0].trim()
  if (!path || !path.includes('.') && !path.includes('>')) return ''
  const segments = path.split('>').map((part) => part.trim()).filter(Boolean)
  const area = AREAS.find(([test]) => test.test(segments[0] || ''))?.[1] || ''
  let kind = ''
  for (const segment of [...segments].reverse()) {
    const found = KINDS.find(([test]) => test.test(segment))
    if (found) { kind = found[1]; break }
  }
  return [area, kind].filter(Boolean).join(' · ')
}

function preview(data: Row) {
  const raw = data.value ?? data.alt ?? data.href ?? data.src ?? ''
  const text = raw.trim()
  if (!text) return data.key ? `(sem conteúdo) ${data.key}` : '(sem conteúdo)'
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

/** Substitui os rótulos genéricos ("Copy 01") pelo conteúdo real da linha. */
export default function RowLabel() {
  const { data, rowNumber } = useRowLabel<Row>()
  const position = typeof rowNumber === 'number' ? rowNumber + 1 : undefined
  const location = hint(data?.label)

  return (
    <span className="eq-row">
      {position !== undefined && <span className="eq-row__number">{String(position).padStart(2, '0')}</span>}
      <span className="eq-row__text">{preview(data || {})}</span>
      {location && <span className="eq-row__hint">{location}</span>}
    </span>
  )
}
