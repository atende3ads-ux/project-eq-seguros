'use client'

import { FieldPathContext, TextField, useFieldPath, useFormFields } from '@payloadcms/ui'
import type { TextFieldClient } from 'payload'
import { validateHref } from '@/lib/href'
import { anchorOf, entryFor, rowIndex, rowPath } from './content-map'
import './row-label.css'

/**
 * Dentro de um texto que é link (menu, botão, card…), mostra o destino logo
 * abaixo. O campo aponta para a linha correspondente em "Links e botões", então
 * editar aqui ou lá altera o mesmo valor.
 */
export default function LinkDestination() {
  const row = rowPath(useFieldPath() || '')
  const key = useFormFields(([fields]) => fields[`${row}.key`]?.value as string | undefined)
  const label = useFormFields(([fields]) => fields[`${row}.label`]?.value as string | undefined)
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const entry = entryFor(slug, key)
  const index = useFormFields(([fields]) => rowIndex(fields, 'links', entry?.link))

  if (!entry?.link || index < 0) {
    const anchor = anchorOf(label)
    if (!anchor) return null
    const note = /^a\.dd-cat\b/.test(anchor)
      ? 'Aba do menu suspenso: troca a lista exibida ao lado e não leva a outra página.'
      : 'Botão de envio do formulário: não leva a outra página.'
    return <p className="eq-link-note">{note}</p>
  }

  const shared = (entryFor(slug, entry.link)?.textos?.length || 0) > 1
  const path = `links.${index}.href`
  const field: TextFieldClient = {
    name: 'href', type: 'text', label: 'Link (destino)', required: true,
    admin: { description: shared ? 'Este link vale para o bloco inteiro, incluindo os outros textos dele.' : 'Página do site, como /contato, ou endereço completo com https://.' },
  }
  return (
    <div className="eq-link-pair">
      <FieldPathContext value={path}>
        <TextField path={path} field={field} validate={validateHref} />
      </FieldPathContext>
    </div>
  )
}
