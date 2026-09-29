'use client'

import { useMemo, useState } from 'react'
import type { PostCard } from '@/lib/blog'
import './blog.css'

const PAGE = 6

/** Mesma marcação dos cards do layout (`a.post`), agora com os posts publicados. */
export function PostCards({ posts }: { posts: PostCard[] }) {
  return posts.map((post) => (
    <a className="post" href={`/blog/${encodeURIComponent(post.slug)}`} key={post.id}>
      <div className="pimg">{post.image && <img src={post.image} alt={post.imageAlt} loading="lazy" />}</div>
      <div className="pbody"><span className="tag">{post.category}</span><h4>{post.title}</h4></div>
    </a>
  ))
}

/** Listagem da página do blog: filtro por categoria e "carregar mais". */
export function BlogListing({ posts }: { posts: PostCard[] }) {
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState(PAGE)
  // Só as categorias que têm posts publicados viram filtro.
  const categories = useMemo(() => [...new Map(posts.filter((post) => post.categorySlug).map((post) => [post.categorySlug, post.category])).entries()], [posts])
  const filtered = category ? posts.filter((post) => post.categorySlug === category) : posts
  const choose = (value: string) => { setCategory(value); setLimit(PAGE) }

  return (
    <>
      {categories.length > 1 && (
        <div className="blog-filters" role="group" aria-label="Filtrar posts por categoria">
          <button type="button" className={`tag blog-filter${!category ? ' is-active' : ''}`} aria-pressed={!category} onClick={() => choose('')}>Todos</button>
          {categories.map(([slug, name]) => (
            <button type="button" key={slug} className={`tag blog-filter${category === slug ? ' is-active' : ''}`} aria-pressed={category === slug} onClick={() => choose(slug)}>{name}</button>
          ))}
        </div>
      )}
      <div className="post-grid"><PostCards posts={filtered.slice(0, limit)} /></div>
      {!filtered.length && <p className="blog-empty" role="status">Novos conteúdos serão publicados em breve.</p>}
      {filtered.length > limit && (
        <div className="btn-row blog-more">
          <button type="button" className="link-arrow" onClick={() => setLimit((value) => value + PAGE)}>Carregar mais posts →</button>
        </div>
      )}
    </>
  )
}
