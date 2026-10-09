import 'server-only'
import { cache } from 'react'
import { getPayload, type TypedUser } from 'payload'
import config from '@payload-config'
import prototype from '../generated/prototype.json'
import type { Content, PageTemplate, CaseRecord } from './types'
import type { Category, Post } from '../payload-types'
import { casesVisible } from './cases'

export const getCMS = cache(() => getPayload({ config }))
export const templates = prototype.pages as unknown as PageTemplate[]

export const getPageContent = cache(async (slug: string) => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: false })
  return result.docs[0] as unknown as (Content & { title: string; description?: string; featuredImage?: Upload; template?: string | null }) | undefined
})
export const getSiteContent = cache(async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'site', depth: 1, overrideAccess: false }) as unknown as Content
})
export type Upload = number | { url?: string | null; alt?: string | null } | null | undefined
export type Settings = { siteName?: string; logo?: Upload; favicon?: Upload; defaultDescription?: string | null; shareImage?: Upload; gtmId?: string | null; ga4Id?: string | null; clarityId?: string | null; formRecipient?: string | null }
export const uploadURL = (upload: Upload) => (typeof upload === 'object' && upload?.url) || undefined
export const getSettings = cache(async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'settings', depth: 1, overrideAccess: false }) as unknown as Settings
})
export type MenuLink = { slug: string; title: string; description: string; icon: string }
/**
 * Páginas de serviço criadas pelo painel que estão publicadas e marcadas para o menu Seguros,
 * da mais antiga para a mais nova. Rascunhos e páginas apagadas somem do menu sozinhos.
 */
export const getServiceMenu = cache(async (): Promise<MenuLink[]> => {
  const payload = await getCMS()
  const result = await payload.find({
    collection: 'pages', where: { and: [{ template: { exists: true } }, { showInMenu: { equals: true } }] },
    sort: 'createdAt', limit: 50, depth: 0, pagination: false, overrideAccess: false,
  })
  return result.docs.map((page) => ({ slug: page.slug, title: page.menuTitle?.trim() || page.title, description: page.menuDescription?.trim() || '', icon: page.menuIcon || 'doc' }))
})
/** Posts publicados, do mais recente para o mais antigo. */
export const getPosts = cache(async () => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'posts', depth: 1, limit: 200, sort: '-publishedAt', overrideAccess: false, pagination: false })
  return result.docs as Post[]
})
/** Um post pelo endereço. Com `user` (prévia do painel), traz também o rascunho. */
export const getPost = cache(async (slug: string, user?: TypedUser | null) => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, depth: 1, limit: 1, overrideAccess: false, draft: Boolean(user), user: user || undefined })
  return result.docs[0] as Post | undefined
})
export const getCategories = cache(async () => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'categories', depth: 0, limit: 100, sort: 'name', overrideAccess: false, pagination: false })
  return result.docs as Category[]
})
export const getCases = cache(async () => {
  // Nem chega a consultar enquanto os cases estão fora do ar: nenhum resumo,
  // imagem ou resultado de parceiro sai daqui por um caminho esquecido.
  if (!casesVisible) return []
  const payload = await getCMS()
  const result = await payload.find({ collection: 'cases', depth: 1, limit: 100, sort: 'id', overrideAccess: false })
  return result.docs as unknown as CaseRecord[]
})
