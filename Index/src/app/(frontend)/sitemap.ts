import type { MetadataRoute } from 'next'
import { getCMS } from '@/lib/content'
import { casesVisible, casesSlugs } from '@/lib/cases'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_ENV !== 'production') return []
  const payload = await getCMS()
  const pages = await payload.find({ collection: 'pages', limit: 100, overrideAccess: false })
  const url = process.env.SERVER_URL || 'http://localhost:3000'
  const hidden = (slug: string) => slug === 'case' || (!casesVisible && casesSlugs.has(slug))
  return pages.docs.filter((p) => !hidden(p.slug)).map((p) => ({ url: `${url}${p.slug === 'index' ? '/' : '/' + p.slug}`, lastModified: new Date(p.updatedAt) }))
}
