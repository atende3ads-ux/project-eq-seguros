import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import prototype from '../generated/prototype.json'
import type { Content, PageTemplate, CaseRecord } from './types'
import { casesVisible } from './cases'

export const getCMS = cache(() => getPayload({ config }))
export const templates = prototype.pages as unknown as PageTemplate[]

export const getPageContent = cache(async (slug: string) => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: false })
  return result.docs[0] as unknown as (Content & { title: string; description?: string; featuredImage?: Upload }) | undefined
})
export const getSiteContent = cache(async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'site', depth: 1, overrideAccess: false }) as unknown as Content
})
export type Upload = number | { url?: string | null; alt?: string | null } | null | undefined
export type Settings = { siteName?: string; logo?: Upload; favicon?: Upload; defaultDescription?: string | null; shareImage?: Upload }
export const uploadURL = (upload: Upload) => (typeof upload === 'object' && upload?.url) || undefined
export const getSettings = cache(async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'settings', depth: 1, overrideAccess: false }) as unknown as Settings
})
export const getCases = cache(async () => {
  // Nem chega a consultar enquanto os cases estão fora do ar: nenhum resumo,
  // imagem ou resultado de parceiro sai daqui por um caminho esquecido.
  if (!casesVisible) return []
  const payload = await getCMS()
  const result = await payload.find({ collection: 'cases', depth: 1, limit: 100, sort: 'id', overrideAccess: false })
  return result.docs as unknown as CaseRecord[]
})
