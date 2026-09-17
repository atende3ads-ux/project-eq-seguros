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
  fields: [
    { name: 'title', label: 'Título SEO', type: 'text', required: true },
    { name: 'slug', label: 'Identificador da página', type: 'text', required: true, unique: true, admin: { readOnly: true } },
    { name: 'description', label: 'Descrição SEO', type: 'textarea' },
    { name: 'status', label: 'Visibilidade', type: 'select', defaultValue: 'published', options: [{ label: 'Publicada', value: 'published' }, { label: 'Rascunho', value: 'draft' }] },
    ...contentFields,
  ],
}

export const Cases: CollectionConfig = {
  slug: 'cases', labels: { singular: 'Case', plural: 'Cases de sucesso' },
  admin: { useAsTitle: 'titulo', defaultColumns: ['titulo', 'parceiro', 'aprovado'] },
  access: { read: ({ req }) => req.user || process.env.SITE_ENV !== 'production' ? true : { aprovado: { equals: true } }, create: signedIn, update: signedIn, delete: adminOnly },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'parceiro', type: 'text', required: true },
    { name: 'segmento', type: 'select', required: true, options: ['fintechs', 'varejo', 'rh', 'corretoras'] },
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'resumo', type: 'textarea', required: true },
    { name: 'imagem', label: 'Imagem original', type: 'text', required: true },
    { name: 'media', label: 'Imagem da biblioteca', type: 'upload', relationTo: 'media' },
    { name: 'produtos', type: 'array', fields: [{ name: 'nome', type: 'text', required: true }] },
    { name: 'resultados', type: 'array', fields: [{ name: 'valor', type: 'text', required: true }, { name: 'rotulo', label: 'Descrição', type: 'text', required: true }] },
    { name: 'desafio', type: 'textarea', required: true },
    { name: 'solucao', label: 'Solução', type: 'textarea', required: true },
    { name: 'depoimento', type: 'group', fields: [{ name: 'texto', type: 'textarea' }, { name: 'autor', type: 'text' }, { name: 'cargo', type: 'text' }] },
    { name: 'destaque', type: 'checkbox', defaultValue: false },
    { name: 'aprovado', label: 'Aprovado para publicação definitiva', type: 'checkbox', defaultValue: false },
  ],
}

export const Site: GlobalConfig = {
  slug: 'site', label: 'Cabeçalho e rodapé', access: { read: () => true, update: signedIn },
  fields: [...contentFields, { name: 'bootstrapComplete', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } }],
}
