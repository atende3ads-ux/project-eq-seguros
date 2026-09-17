import { SitePage } from '@/components/SitePage'
import { getPageContent, getCases } from '@/lib/content'
export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string }> }
export async function generateMetadata({ params, searchParams }: Args) {
  const { slug } = await params
  const page = await getPageContent(slug)
  if (slug === 'case') {
    const { c } = await searchParams
    const records = await getCases()
    const record = records.find((r) => r.slug === c) || (!c ? records[0] : undefined)
    return { title: record ? `${record.titulo} | Cases | EQ Seguros` : page?.title, description: record?.resumo || page?.description }
  }
  return { title: page?.title, description: page?.description, alternates: { canonical: `/${slug}` } }
}
export default async function Page({ params, searchParams }: Args) {
  const { slug } = await params
  const { c } = await searchParams
  return <SitePage slug={slug} caseSlug={c}/>
}
