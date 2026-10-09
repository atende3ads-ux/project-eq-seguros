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
  // SVG serve para ícones e logos. O Payload recusa SVG com script, eventos ou outro conteúdo
  // perigoso, e o servidor entrega todo SVG com uma política que impede scripts (next.config.mjs).
  upload: { staticDir: 'media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'] },
  fields: [{ name: 'alt', label: 'Descrição acessível', type: 'text', required: true }],
}

export const Pages: CollectionConfig = {
  slug: 'pages', labels: { singular: 'Página', plural: 'Páginas do site' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'status', 'updatedAt'], description: 'Cada linha é uma seção da página, na ordem do site. Abra a seção para editar títulos, textos, botões, links e imagens.' },
  access: { read: ({ req }) => req.user ? true : { status: { equals: 'published' } }, create: adminOnly, update: signedIn, delete: adminOnly },
  // Abas sem `name` são apenas visuais: os campos continuam na raiz do documento.
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Conteúdo da página', description: 'O que aparece para quem visita o site.', fields: contentFields },
      { label: 'SEO e publicação', description: 'Como a página aparece na busca e se está visível.', fields: [
        { name: 'focusKeyphrase', label: 'Frase-chave foco', type: 'text',
          admin: { description: 'O termo principal que alguém digitaria no Google para encontrar esta página, como "seguro de vida". Não aparece no site: serve para a análise abaixo.' } },
        { name: 'title', label: 'Título SEO', type: 'text', required: true,
          admin: { description: 'Sem o nome do site: ele é acrescentado automaticamente, conforme "Configurações do site".' } },
        { name: 'description', label: 'Descrição SEO', type: 'textarea' },
        { name: 'featuredImage', label: 'Imagem de destaque', type: 'upload', relationTo: 'media',
          admin: { description: 'Prévia desta página ao compartilhar o link no WhatsApp, LinkedIn ou Facebook. Tamanho ideal: 1200 × 630 px. Sem seleção, usa a imagem padrão de "Configurações do site".' } },
        { name: 'seoAnalysis', type: 'ui', admin: { components: { Field: '/components/admin/SeoAnalysis' } } },
        { name: 'status', label: 'Visibilidade', type: 'select', defaultValue: 'published', options: [{ label: 'Publicada', value: 'published' }, { label: 'Rascunho', value: 'draft' }] },
        { name: 'slug', label: 'Identificador da página', type: 'text', required: true, unique: true, admin: { hidden: true, readOnly: true } },
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
  slug: 'site', label: 'Cabeçalho e rodapé', access: { read: () => true, update: signedIn }, admin: { group: 'Configurações' },
  fields: [
    ...contentFields,
    { name: 'bootstrapComplete', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } },
    { name: 'blogBootstrapComplete', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } },
  ],
}

/** Informações gerais do site, como em Configurações → Geral do WordPress. */
export const Settings: GlobalConfig = {
  slug: 'settings', label: 'Configurações do site', access: { read: () => true, update: signedIn },
  admin: { group: 'Configurações', description: 'Nome, logo, ícone e informações padrão de busca e compartilhamento, válidos para o site inteiro.' },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Identidade', fields: [
        { name: 'siteName', label: 'Nome do site', type: 'text', required: true, defaultValue: 'EQ Seguros',
          admin: { description: 'Entra no título de todas as páginas: "Blog | EQ Seguros". Na página inicial vem primeiro: "EQ Seguros | …".' } },
        { name: 'logo', label: 'Logo do cabeçalho', type: 'upload', relationTo: 'media',
          admin: { description: 'PNG ou SVG com fundo transparente. Sem seleção, fica o logo atual. Tem prioridade sobre a imagem do logo em "Cabeçalho e rodapé".' } },
        { name: 'favicon', label: 'Ícone do site (favicon)', type: 'upload', relationTo: 'media',
          admin: { description: 'Aparece na aba do navegador e nos favoritos. Use uma imagem quadrada, em SVG ou PNG de preferência 512 × 512 px. Com SVG, os navegadores que não o aceitam usam o símbolo da EQ. Sem seleção, fica o símbolo da EQ.' } },
      ] },
      { label: 'Busca e compartilhamento', fields: [
        { name: 'defaultDescription', label: 'Descrição padrão', type: 'textarea',
          admin: { description: 'Usada no Google e nas redes quando a página não tem descrição própria. Cada página tem a sua em "SEO e publicação".' } },
        { name: 'shareImage', label: 'Imagem de compartilhamento', type: 'upload', relationTo: 'media',
          admin: { description: 'Prévia que aparece ao enviar um link do site no WhatsApp, LinkedIn ou Facebook. Use JPG ou PNG de 1200 × 630 px: as redes não mostram SVG.' } },
      ] },
      { label: 'Rastreamento', fields: [
        { name: 'gtmId', label: 'Google Tag Manager', type: 'text',
          validate: (value: string | null | undefined) => !value || /^GTM-[A-Z0-9]{4,12}$/.test(value.trim()) || 'Use o formato GTM-XXXXXXX.',
          admin: { description: 'ID do contêiner, no formato GTM-XXXXXXX. Tudo o que está configurado dentro dele (Google Analytics, Google Ads, remarketing) passa a funcionar no site. Deixe vazio para não carregar.' } },
        { name: 'ga4Id', label: 'Google Analytics 4 (direto)', type: 'text',
          validate: (value: string | null | undefined) => !value || /^G-[A-Z0-9]{6,12}$/.test(value.trim()) || 'Use o formato G-XXXXXXXXXX.',
          admin: { description: 'ID da métrica, no formato G-XXXXXXXXXX. Use só para uma propriedade que NÃO esteja configurada dentro do Tag Manager: se estiver nas duas, cada visita é contada duas vezes.' } },
        { name: 'clarityId', label: 'Microsoft Clarity', type: 'text',
          validate: (value: string | null | undefined) => !value || /^[a-z0-9]{6,16}$/.test(value.trim()) || 'Use só letras minúsculas e números, como no painel do Clarity.',
          admin: { description: 'ID do projeto no Clarity (gravações e mapas de calor). Deixe vazio para não carregar.' } },
      ] },
      { label: 'Formulários', fields: [
        { name: 'formRecipient', label: 'E-mail que recebe os contatos', type: 'email',
          admin: { description: 'Os contatos enviados pelos formulários do site chegam neste e-mail, com o e-mail de quem escreveu em “Responder para”. Todo contato também fica salvo em Mensagens recebidas, mesmo se este e-mail não chegar.' } },
      ] },
    ] },
  ],
}
