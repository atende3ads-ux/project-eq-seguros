'use client'

import { FieldPathContext, TextareaField, useFieldPath, useFormFields } from '@payloadcms/ui'
import type { TextareaFieldClient } from 'payload'
import { entryFor, kindOf, rowPath } from './content-map'
import './row-label.css'

/**
 * Em "Links e botões", mostra o texto que aparece no link, acima do destino.
 * Cada campo aponta para a linha correspondente em "Textos".
 */
export default function LinkText() {
  const row = rowPath(useFieldPath() || '')
  const key = useFormFields(([fields]) => fields[`${row}.key`]?.value as string | undefined)
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const textos = entryFor(slug, key)?.textos || []
  // Índices em uma string para o seletor devolver um valor estável entre renderizações.
  const found = useFormFields(([fields]) => textos.map((textKey) => {
    for (let index = 0; fields[`copy.${index}.key`]; index += 1) {
      if (fields[`copy.${index}.key`]?.value === textKey) return `${index}:${String(fields[`copy.${index}.label`]?.value || '')}`
    }
    return ''
  }).join('\n'))

  const items = found.split('\n').filter(Boolean).map((item) => {
    const separator = item.indexOf(':')
    return { index: item.slice(0, separator), kind: kindOf(item.slice(separator + 1)) }
  })
  if (!items.length) return <p className="eq-link-note">Este link não tem texto: é um ícone ou uma imagem.</p>

  return (
    <div className="eq-link-pair">
      {items.map(({ index, kind }) => {
        const path = `copy.${index}.value`
        const label = items.length > 1 && kind ? `Texto do link (${kind})` : 'Texto do link'
        const field: TextareaFieldClient = { name: 'value', type: 'textarea', label, required: true, admin: { rows: 1 } }
        return (
          <FieldPathContext key={path} value={path}>
            <TextareaField path={path} field={field} />
          </FieldPathContext>
        )
      })}
    </div>
  )
}
