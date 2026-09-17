import { SitePage } from '@/components/SitePage'
import { getPageContent } from '@/lib/content'
export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  const page = await getPageContent('index')
  return { title: page?.title, description: page?.description, alternates: { canonical: '/' } }
}
export default function Home() { return <SitePage slug="index"/> }
