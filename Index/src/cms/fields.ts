import type { Field } from 'payload'
import { validateHref } from '../lib/href'

/**
 * `key` liga cada entrada à posição dela no layout: se mudar, o conteúdo some da página.
 * Fica oculto no painel, mas continua no formulário e é salvo junto com a linha.
 */
const reference: Field[] = [
  { name: 'key', label: 'Chave', type: 'text', required: true, admin: { hidden: true, readOnly: true } },
  { name: 'label', label: 'Onde aparece no site', type: 'text', admin: { hidden: true, readOnly: true } },
]

/** Texto e destino de um mesmo link aparecem juntos, nas duas listas. */
const linkDestination: Field = { name: 'linkDestination', type: 'ui', admin: { components: { Field: '/components/admin/LinkDestination' } } }
const linkText: Field = { name: 'linkText', type: 'ui', admin: { components: { Field: '/components/admin/LinkText' } } }

/** Mostra o conteúdo real na linha fechada, no lugar de "Copy 01", "Copy 02"… */
const rowLabel = { components: { RowLabel: '/components/admin/RowLabel' } }

export const contentFields: Field[] = [
  { name: 'copy', label: 'Textos', type: 'array',
    admin: { initCollapsed: true, description: 'Cada linha é um texto da página. Abra a linha para editar.', ...rowLabel },
    fields: [
      ...reference,
      { name: 'value', label: 'Texto', type: 'textarea', required: true },
      linkDestination,
    ] },
  { name: 'images', label: 'Imagens', type: 'array',
    admin: { initCollapsed: true, description: 'Troque a imagem pela biblioteca e mantenha a descrição acessível preenchida.', ...rowLabel },
    fields: [
      ...reference,
      { name: 'src', label: 'Imagem original (endereço)', type: 'text', required: true },
      { name: 'alt', label: 'Descrição da imagem', type: 'text' },
      { name: 'media', label: 'Substituir por imagem da biblioteca', type: 'upload', relationTo: 'media' },
    ] },
  { name: 'links', label: 'Links e botões', type: 'array',
    admin: { initCollapsed: true, description: 'Destino de cada link e botão da página.', ...rowLabel },
    fields: [
      ...reference,
      linkText,
      { name: 'href', label: 'Link (destino)', type: 'text', required: true, validate: validateHref },
    ] },
]
