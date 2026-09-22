import type { Field } from 'payload'

/**
 * `key` liga cada entrada à posição dela no layout: se mudar, o conteúdo some da página.
 * Por isso continua visível e somente-leitura, apenas com menos peso visual.
 */
const reference: Field[] = [
  { name: 'key', label: 'Chave', type: 'text', required: true,
    admin: { readOnly: true, className: 'eq-technical-field', description: 'Identificador interno. Não editável.' } },
  { name: 'label', label: 'Onde aparece no site', type: 'text',
    admin: { readOnly: true, className: 'eq-technical-field' } },
]

/** Mostra o conteúdo real na linha fechada, no lugar de "Copy 01", "Copy 02"… */
const rowLabel = { components: { RowLabel: '/components/admin/RowLabel' } }

export const contentFields: Field[] = [
  { name: 'copy', label: 'Textos', type: 'array',
    admin: { initCollapsed: true, description: 'Cada linha é um texto da página. Abra a linha para editar.', ...rowLabel },
    fields: [
      ...reference,
      { name: 'value', label: 'Conteúdo', type: 'textarea', required: true },
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
      { name: 'href', label: 'Destino', type: 'text', required: true, validate: (value: string | null | undefined) =>
        !value || /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) || 'Use um caminho /pagina ou um endereço HTTP, e-mail ou telefone válido.' },
    ] },
]
