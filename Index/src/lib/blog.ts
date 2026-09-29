import type { Category, Media, Post } from '@/payload-types'

/** Só o que os cards precisam: vai para o navegador na listagem com filtro. */
export type PostCard = { id: number; slug: string; title: string; image?: string; imageAlt: string; category: string; categorySlug: string }

const media = (value: Post['featuredImage']) => typeof value === 'object' && value ? value as Media : undefined
const category = (value: Post['category']) => typeof value === 'object' && value ? value as Category : undefined

export const categoryName = (post: Post) => category(post.category)?.name || 'Blog'
export const coverURL = (post: Post) => media(post.featuredImage)?.url || undefined
export const coverAlt = (post: Post) => media(post.featuredImage)?.alt || post.title

export const toCard = (post: Post): PostCard => ({
  id: post.id, slug: post.slug, title: post.title, image: coverURL(post), imageAlt: coverAlt(post),
  category: categoryName(post), categorySlug: category(post.category)?.slug || '',
})

/** Texto corrido do conteúdo, para tempo de leitura e análise de SEO. */
export function plainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: string; root?: unknown; children?: unknown[] }
  if (typeof node.text === 'string') return node.text
  if (node.root) return plainText(node.root)
  return (node.children || []).map(plainText).join(' ')
}

export const readingTime = (content: unknown) => Math.max(1, Math.ceil(plainText(content).split(/\s+/).filter(Boolean).length / 200))

export const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(value))
  : ''
