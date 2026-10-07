import type { Content, TemplateNode } from './types'
import { uploadURL, type Settings } from './content'
import { DEFAULT_SITE_NAME } from './site-title'

/**
 * Dados estruturados (schema.org) que o Google lê para entender quem é a
 * empresa, onde a página fica no site e o que é cada artigo.
 */
export const siteURL = () => (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
export const absolute = (url: string) => /^https?:\/\//i.test(url) ? url : `${siteURL()}${url.startsWith('/') ? '' : '/'}${url}`

const ORGANIZATION_ID = () => `${siteURL()}/#organization`

/** Empresa e site, em todas as páginas. Os dados da empresa são os do rodapé do site. */
export function organizationLd(settings: Settings) {
  const name = settings.siteName?.trim() || DEFAULT_SITE_NAME
  const logo = uploadURL(settings.logo) || '/assets/logo-eq-seguros-2.png'
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'InsuranceAgency', '@id': ORGANIZATION_ID(), name, legalName: 'EQ Seguros S.A.', url: `${siteURL()}/`,
        logo: absolute(logo), telephone: '+55 800 201 1838', taxID: '21.242.451/0001-05', areaServed: 'BR',
        address: {
          '@type': 'PostalAddress', streetAddress: 'Av. Dep. Jamel Cecílio, 2690, Ed. Metropolitan Business, Torre Tokyo, Sl. 2008/2012',
          addressLocality: 'Goiânia', addressRegion: 'GO', postalCode: '74810-100', addressCountry: 'BR',
        },
      },
      { '@type': 'WebSite', '@id': `${siteURL()}/#website`, url: `${siteURL()}/`, name, inLanguage: 'pt-BR', publisher: { '@id': ORGANIZATION_ID() } },
    ],
  }
}

const classes = (node: TemplateNode) => (node.attrs?.class || '').split(' ')
const find = (nodes: TemplateNode[] | undefined, test: (node: TemplateNode) => boolean): TemplateNode | undefined => {
  for (const node of nodes || []) {
    if (test(node)) return node
    const inner = find(node.children, test)
    if (inner) return inner
  }
}

/** Trilha de navegação da página (Home › Seguros › Seguro de Vida), lida do próprio layout. */
export function breadcrumbLd(nodes: TemplateNode[], content: Content) {
  const crumb = find(nodes, (node) => classes(node).includes('crumb'))
  if (!crumb) return undefined
  const texts = new Map(content.copy?.map((entry) => [entry.key, entry.value]))
  const links = new Map(content.links?.map((entry) => [entry.key, entry.href]))
  const textOf = (node: TemplateNode): string => node.textKey ? texts.get(node.textKey) ?? node.text ?? '' : node.text ?? (node.children || []).map(textOf).join('')
  const items = (crumb.children || []).flatMap((node) => {
    const name = textOf(node).replace(/\s+/g, ' ').trim()
    if (node.tag === 'a' && name) return [{ name, item: absolute(node.linkKey ? links.get(node.linkKey) ?? node.attrs?.href ?? '/' : node.attrs?.href ?? '/') }]
    if (node.tag === 'b' && name) return [{ name }]
    return []
  })
  if (items.length < 2) return undefined
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.name, ...('item' in entry ? { item: entry.item } : {}) })),
  }
}

type ArticleData = { title: string; description?: string; url: string; image?: string; published?: string | null; modified?: string | null; author?: string | null; category: string }

/** Artigo do blog e a trilha dele. */
export function articleLd(post: ArticleData) {
  return [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description,
      mainEntityOfPage: absolute(post.url), url: absolute(post.url), inLanguage: 'pt-BR', articleSection: post.category,
      ...(post.image ? { image: absolute(post.image) } : {}),
      ...(post.published ? { datePublished: post.published } : {}), ...(post.modified ? { dateModified: post.modified } : {}),
      ...(post.author ? { author: { '@type': 'Organization', name: post.author } } : {}),
      publisher: { '@id': ORGANIZATION_ID() },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteURL()}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteURL()}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title },
      ],
    },
  ]
}
