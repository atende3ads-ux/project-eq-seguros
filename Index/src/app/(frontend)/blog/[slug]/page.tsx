import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Article } from '@/components/Blog/Article'
import { getCMS, getPageContent, getPost, getPosts, getServiceMenu, getSettings, getSiteContent, templates } from '@/lib/content'
import { coverURL, plainText } from '@/lib/blog'
import { openGraph, twitter } from '@/lib/share'
import { pageTitle } from '@/lib/site-title'

export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }>; searchParams: Promise<{ previa?: string }> }

/** Com ?previa=1 e login no painel, mostra também o rascunho (botão "Prévia" do post). */
async function load({ params, searchParams }: Args) {
  const { slug } = await params
  const { previa } = await searchParams
  const user = previa ? (await (await getCMS()).auth({ headers: await headers() })).user : null
  return { post: await getPost(decodeURIComponent(slug), user), preview: Boolean(user) }
}

export async function generateMetadata(args: Args) {
  const [{ post, preview }, settings] = await Promise.all([load(args), getSettings()])
  if (!post) return { title: 'Post não encontrado' }
  const title = pageTitle(post.seoTitle || post.title, settings.siteName || '', 'post')
  const description = post.seoDescription || post.excerpt || plainText(post.content).slice(0, 156) || settings.defaultDescription || undefined
  const url = `/blog/${post.slug}`
  const image = coverURL(post)
  return {
    title, description, alternates: { canonical: url },
    twitter: twitter(settings, { title, description, image: post.featuredImage }),
    ...(preview ? { robots: { index: false, follow: false } } : {}),
    openGraph: { ...openGraph(settings, { title, description, url }), type: 'article' as const,
      ...(image ? { images: [image] } : {}), publishedTime: post.publishedAt, modifiedTime: post.updatedAt, authors: post.authorName ? [post.authorName] : undefined },
  }
}

export default async function BlogPost(args: Args) {
  const { post, preview } = await load(args)
  const template = templates.find((item) => item.slug === 'post')
  if (!post || !template) notFound()
  const [page, site, posts, serviceMenu] = await Promise.all([getPageContent('post'), getSiteContent(), getPosts(), getServiceMenu()])
  if (!page) notFound()
  // "Leia também": primeiro os da mesma categoria, depois os mais recentes.
  const categoryId = (value: typeof post.category) => typeof value === 'object' && value ? value.id : value
  const related = posts.filter((item) => item.id !== post.id)
    .sort((a, b) => Number(categoryId(b.category) === categoryId(post.category)) - Number(categoryId(a.category) === categoryId(post.category)))
  return <Article post={post} related={related} template={template} page={page} site={site} preview={preview} serviceMenu={serviceMenu} />
}
