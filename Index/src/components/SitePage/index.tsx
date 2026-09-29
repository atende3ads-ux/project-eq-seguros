import { notFound } from 'next/navigation'
import prototype from '@/generated/prototype.json'
import { getPageContent, getSiteContent, getCases, getSettings, getPosts, templates } from '@/lib/content'
import { toCard } from '@/lib/blog'
import type { TemplateNode } from '@/lib/types'
import { casesVisible, casesSlugs } from '@/lib/cases'
import { Template } from '../Template'
import { Interactions } from '../Interactions'

/** Imagem do logo no cabeçalho; "Configurações do site" pode trocá-la. */
const LOGO_KEY = 'header-i1'

export async function SitePage({ slug, caseSlug }: { slug: string; caseSlug?: string }) {
  if (!casesVisible && casesSlugs.has(slug)) notFound()
  const template = templates.find((page) => page.slug === slug)
  if (!template) notFound()
  // Home e blog mostram posts publicados no lugar dos cards fixos do layout.
  const withPosts = slug === 'index' || slug === 'blog'
  const [page, content, records, settings, posts] = await Promise.all([getPageContent(slug), getSiteContent(), getCases(), getSettings(), withPosts ? getPosts() : Promise.resolve(undefined)])
  if (!page) notFound()
  const logo = typeof settings.logo === 'object' && settings.logo?.url ? settings.logo : undefined
  const site = logo ? { ...content, images: content.images?.map((image) => image.key === LOGO_KEY ? { ...image, media: logo } : image) } : content
  const selectedCase = slug === 'case' ? records.find((r) => r.slug === caseSlug) || (!caseSlug ? records[0] : undefined) : undefined
  if (slug === 'case' && !selectedCase) notFound()
  return <>
    <Template nodes={template.header} content={site}/>
    <Template nodes={template.body} content={page} records={records} selectedCase={selectedCase} posts={posts?.map(toCard)} blogListing={slug === 'blog'}/>
    <Template nodes={prototype.site.footer as TemplateNode[]} content={site}/>
    <Interactions slug={slug}/>
  </>
}
