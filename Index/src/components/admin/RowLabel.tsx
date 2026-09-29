'use client'

import { useFormFields, useRowLabel } from '@payloadcms/ui'
import { entryFor, kindOf, rowIndex } from './content-map'
import './row-label.css'

type Row = { key?: string; label?: string; value?: string; href?: string; alt?: string; src?: string }

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
  const slug = useFormFields(([fields]) => (fields?.slug?.value as string | undefined))
  const section = entryFor(slug, data?.key)
  // Em "Links e botões", o texto do link diz mais do que o endereço sozinho.
  const linkText = useFormFields(([fields]) => {
    const index = data?.href !== undefined ? rowIndex(fields, 'copy', section?.textos?.[0]) : -1
    return index < 0 ? '' : String(fields[`copy.${index}.value`]?.value || '').trim()
  })

  const position = typeof rowNumber === 'number' ? rowNumber + 1 : undefined
  const kind = kindOf(data?.label)

  return (
    <span className={`eq-row${section?.inicio ? ' eq-row--section-start' : ''}`}>
      {section?.inicio && <span className="eq-row__section">{section.secao}</span>}
      {position !== undefined && <span className="eq-row__number">{String(position).padStart(2, '0')}</span>}
      <span className="eq-row__text">{linkText ? `${linkText} → ${preview(data || {})}` : preview(data || {})}</span>
      {kind && <span className="eq-row__hint">{kind}</span>}
    </span>
  )
}
