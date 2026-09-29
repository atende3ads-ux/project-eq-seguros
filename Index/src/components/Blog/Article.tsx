import { RichText } from '@payloadcms/richtext-lexical/react'
import prototype from '@/generated/prototype.json'
import type { Post } from '@/payload-types'
import type { Content, PageTemplate, TemplateNode } from '@/lib/types'
import { categoryName, coverAlt, coverURL, formatDate, readingTime, toCard } from '@/lib/blog'
import { Template } from '../Template'
import { Interactions } from '../Interactions'

const safeURL = (value: unknown) => typeof value === 'string' && /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) ? value : '#'
const classes = (node: TemplateNode) => (node.attrs?.class || '').split(' ')
/** Topo e texto do modelo viram os dados do post; a chamada final e "Leia também" continuam do modelo. */
const isArticle = (node: TemplateNode): boolean =>
  classes(node).includes('crumbbar') || classes(node).includes('phero') || classes(node).includes('prose') || Boolean(node.children?.some(isArticle))

type Args = { post: Post; related: Post[]; template: PageTemplate; page: Content; site: Content; preview?: boolean }

export function Article({ post, related, template, page, site, preview }: Args) {
  const image = coverURL(post)
  const date = formatDate(post.publishedAt)
  return <>
    <Template nodes={template.header} content={site} />
    {preview && post._status !== 'published' && <div className="blog-preview-bar">Prévia do rascunho: este post ainda não está publicado.</div>}
    <div className="crumbbar"><div className="wrap"><div className="crumb">
      <a href="/">Home</a><span className="sep">›</span><a href="/blog">Blog</a><span className="sep">›</span><b>{categoryName(post)}</b>
    </div></div></div>
    <section className="phero"><div className="wrap"><div className="rv-init">
      <span className="kicker">{categoryName(post)}</span>
      <h1>{post.title}</h1>
      <p className="lead">{[date, `${readingTime(post.content)} min de leitura`, post.authorName && `por ${post.authorName}`].filter(Boolean).join(' · ')}</p>
    </div></div></section>
    <section className="sec"><div className="wrap prose rv-init">
      {image && <div className="imgbox"><img src={image} alt={coverAlt(post)} /></div>}
      {post.content && <RichText data={post.content} converters={({ defaultConverters }) => ({
        ...defaultConverters,
        // Link para outro post ou página do site escolhido no editor.
        link: ({ node, nodesToJSX }) => {
          const doc = node.fields.doc
          const value = doc && typeof doc.value === 'object' ? doc.value as { slug?: string } : undefined
          const internal = value?.slug ? doc?.relationTo === 'posts' ? `/blog/${value.slug}` : doc?.relationTo === 'pages' ? (value.slug === 'index' ? '/' : `/${value.slug}`) : undefined : undefined
          const newTab = Boolean(node.fields.newTab)
          return <a href={safeURL(internal || node.fields.url)} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>{nodesToJSX({ nodes: node.children })}</a>
        },
      })} />}
    </div></section>
    <Template nodes={(template.body as TemplateNode[]).filter((node) => !isArticle(node))} content={page} posts={related.map(toCard)} />
    <Template nodes={prototype.site.footer as TemplateNode[]} content={site} />
    <Interactions slug="post" />
  </>
}
