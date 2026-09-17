import type { Field } from 'payload'

export const contentFields: Field[] = [
  { name: 'copy', label: 'Textos', type: 'array', admin: { initCollapsed: true }, fields: [
    { name: 'key', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'label', label: 'Local no layout', type: 'text', admin: { readOnly: true } },
    { name: 'value', label: 'Conteúdo', type: 'textarea', required: true },
  ] },
  { name: 'images', label: 'Imagens', type: 'array', admin: { initCollapsed: true }, fields: [
    { name: 'key', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'label', label: 'Local no layout', type: 'text', admin: { readOnly: true } },
    { name: 'src', label: 'Imagem original (endereço)', type: 'text', required: true },
    { name: 'alt', label: 'Descrição da imagem', type: 'text' },
    { name: 'media', label: 'Substituir por imagem da biblioteca', type: 'upload', relationTo: 'media' },
  ] },
  { name: 'links', label: 'Links e botões', type: 'array', admin: { initCollapsed: true }, fields: [
    { name: 'key', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'label', label: 'Local no layout', type: 'text', admin: { readOnly: true } },
    { name: 'href', label: 'Destino', type: 'text', required: true, validate: (value: string | null | undefined) =>
      !value || /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) || 'Use um caminho /pagina ou um endereço HTTP, e-mail ou telefone válido.' },
  ] },
]
