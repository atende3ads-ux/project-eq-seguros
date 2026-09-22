import type { Access, CollectionConfig, GlobalConfig } from 'payload'
import { contentFields } from './fields'

const signedIn: Access = ({ req }) => Boolean(req.user)
const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users', labels: { singular: 'Usuário', plural: 'Usuários' },
  auth: { maxLoginAttempts: 5, lockTime: 600000 }, admin: { useAsTitle: 'name' },
  access: { create: adminOnly, read: signedIn, update: ({ req }) => req.user?.role === 'admin' ? true : { id: { equals: req.user?.id ?? -1 } }, delete: adminOnly },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'role', label: 'Permissão', type: 'select', required: true, defaultValue: 'editor', saveToJWT: true,
      options: [{ label: 'Administrador', value: 'admin' }, { label: 'Editor de conteúdo', value: 'editor' }],
      access: { update: ({ req }) => req.user?.role === 'admin' } },
  ],
  hooks: { beforeChange: [async ({ data, operation, req }) => {
    if (operation === 'create') {
      const count = await req.payload.count({ collection: 'users', overrideAccess: true, req })
      data.role = count.totalDocs === 0 ? 'admin' : (req.user?.role === 'admin' ? data.role : 'editor')
    }
    return data
  }] },
}

export const Media: CollectionConfig = {
  slug: 'media', labels: { singular: 'Imagem', plural: 'Biblioteca de imagens' },
  access: { read: () => true, create: signedIn, update: signedIn, delete: adminOnly },
  upload: { staticDir: 'media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] },
  fields: [{ name: 'alt', label: 'Descrição acessível', type: 'text', required: true }],
}

export const Pages: CollectionConfig = {
  slug: 'pages', labels: { singular: 'Página', plural: 'Páginas do site' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'status', 'updatedAt'], description: 'Edite os textos e imagens sem alterar a estrutura visual. As chaves identificam a posição de cada conteúdo.' },
  access: { read: ({ req }) => req.user ? true : { status: { equals: 'published' } }, create: adminOnly, update: signedIn, delete: adminOnly },
  // Abas sem `name` são apenas visuais: os campos continuam na raiz do documento.
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Conteúdo da página', description: 'O que aparece para quem visita o site.', fields: contentFields },
      { label: 'SEO e publicação', description: 'Como a página aparece na busca e se está visível.', fields: [
        { name: 'title', label: 'Título SEO', type: 'text', required: true },
        { name: 'description', label: 'Descrição SEO', type: 'textarea' },
        { name: 'status', label: 'Visibilidade', type: 'select', defaultValue: 'published', options: [{ label: 'Publicada', value: 'published' }, { label: 'Rascunho', value: 'draft' }] },
        { name: 'slug', label: 'Identificador da página', type: 'text', required: true, unique: true, admin: { readOnly: true, className: 'eq-technical-field', description: 'Define o endereço da página. Não editável.' } },
      ] },
    ] },
  ],
}

export const Cases: CollectionConfig = {
  slug: 'cases', labels: { singular: 'Case', plural: 'Cases de sucesso' },
  admin: { useAsTitle: 'titulo', defaultColumns: ['titulo', 'parceiro', 'aprovado'] },
  access: { read: ({ req }) => req.user || process.env.SITE_ENV !== 'production' ? true : { aprovado: { equals: true } }, create: signedIn, update: signedIn, delete: adminOnly },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'O case', description: 'Identificação e resumo que aparecem na listagem.', fields: [
        { name: 'titulo', label: 'Título', type: 'text', required: true },
        { name: 'parceiro', label: 'Parceiro', type: 'text', required: true },
        { name: 'segmento', label: 'Segmento', type: 'select', required: true,
          options: [
            { label: 'Fintechs', value: 'fintechs' }, { label: 'Varejo', value: 'varejo' },
            { label: 'RH', value: 'rh' }, { label: 'Corretoras', value: 'corretoras' },
          ] },
        { name: 'resumo', label: 'Resumo', type: 'textarea', required: true },
        { name: 'slug', label: 'Identificador do case', type: 'text', required: true, unique: true,
          admin: { className: 'eq-technical-field', description: 'Define o endereço do case.' } },
      ] },
      { label: 'História', description: 'O problema do parceiro e como a EQ resolveu.', fields: [
        { name: 'desafio', label: 'Desafio', type: 'textarea', required: true },
        { name: 'solucao', label: 'Solução', type: 'textarea', required: true },
        { name: 'produtos', label: 'Produtos envolvidos', type: 'array',
          admin: { initCollapsed: true }, fields: [{ name: 'nome', label: 'Nome', type: 'text', required: true }] },
        { name: 'resultados', label: 'Resultados', type: 'array', admin: { initCollapsed: true },
          fields: [
            { name: 'valor', label: 'Número', type: 'text', required: true },
            { name: 'rotulo', label: 'Descrição', type: 'text', required: true },
          ] },
        { name: 'depoimento', label: 'Depoimento', type: 'group', fields: [
          { name: 'texto', label: 'Texto', type: 'textarea' },
          { name: 'autor', label: 'Autor', type: 'text' },
          { name: 'cargo', label: 'Cargo', type: 'text' },
        ] },
      ] },
      { label: 'Imagem e publicação', description: 'Imagem de capa e liberação para o site.', fields: [
        { name: 'media', label: 'Imagem da biblioteca', type: 'upload', relationTo: 'media' },
        { name: 'imagem', label: 'Imagem original', type: 'text', required: true,
          admin: { className: 'eq-technical-field', description: 'Usada quando não há imagem da biblioteca.' } },
        { name: 'destaque', label: 'Exibir em destaque na home', type: 'checkbox', defaultValue: false },
        { name: 'aprovado', label: 'Aprovado para publicação definitiva', type: 'checkbox', defaultValue: false },
      ] },
    ] },
  ],
}

export const Site: GlobalConfig = {
  slug: 'site', label: 'Cabeçalho e rodapé', access: { read: () => true, update: signedIn },
  fields: [...contentFields, { name: 'bootstrapComplete', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } }],
}
