import { notFound } from 'next/navigation'
import prototype from '@/generated/prototype.json'
import { getPageContent, getSiteContent, getCases, templates } from '@/lib/content'
import type { TemplateNode } from '@/lib/types'
import { Template } from '../Template'
import { Interactions } from '../Interactions'

export async function SitePage({ slug, caseSlug }: { slug: string; caseSlug?: string }) {
  const template = templates.find((page) => page.slug === slug)
  if (!template) notFound()
  const [page, site, records] = await Promise.all([getPageContent(slug), getSiteContent(), getCases()])
  if (!page) notFound()
  const selectedCase = slug === 'case' ? records.find((r) => r.slug === caseSlug) || (!caseSlug ? records[0] : undefined) : undefined
  if (slug === 'case' && !selectedCase) notFound()
  return <>
    <Template nodes={template.header} content={site}/>
    <Template nodes={template.body} content={page} records={records} selectedCase={selectedCase}/>
    <Template nodes={prototype.site.footer as TemplateNode[]} content={site}/>
    <Interactions slug={slug}/>
  </>
}
