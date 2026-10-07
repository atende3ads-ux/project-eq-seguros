import { redirect } from 'next/navigation'
import { SitePage } from '@/components/SitePage'
import { getPageContent, getCases, getSettings } from '@/lib/content'
import { pageTitle } from '@/lib/site-title'
import { openGraph, twitter } from '@/lib/share'
export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string }> }
export async function generateMetadata({ params, searchParams }: Args) {
  const { slug } = await params
  const [page, settings] = await Promise.all([getPageContent(slug), getSettings()])
  const siteName = settings.siteName || ''
  const fallback = settings.defaultDescription || undefined
  if (slug === 'case') {
    const { c } = await searchParams
    const records = await getCases()
    const record = records.find((r) => r.slug === c) || (!c ? records[0] : undefined)
    const title = pageTitle(record ? `${record.titulo} | Cases` : page?.title, siteName, slug)
    const description = record?.resumo || page?.description || fallback
    return { title, description, openGraph: openGraph(settings, { title, description, image: page?.featuredImage }), twitter: twitter(settings, { title, description, image: page?.featuredImage }) }
  }
  const title = pageTitle(page?.title, siteName, slug)
  const description = page?.description || fallback
  return { title, description, openGraph: openGraph(settings, { title, description, url: `/${slug}`, image: page?.featuredImage }), twitter: twitter(settings, { title, description, image: page?.featuredImage }), alternates: { canonical: `/${slug}` } }
}
export default async function Page({ params, searchParams }: Args) {
  const { slug } = await params
  // A antiga página fixa de artigo virou o modelo dos posts; cada post tem seu endereço em /blog/…
  if (slug === 'post') redirect('/blog')
  const { c } = await searchParams
  return <SitePage slug={slug} caseSlug={c}/>
}
