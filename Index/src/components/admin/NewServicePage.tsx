'use client'

import { useState } from 'react'
import { useAuth } from '@payloadcms/ui'
import { SERVICE_MODELS, slugError, toSlug } from '@/lib/service-pages'
import './new-service-page.css'

/**
 * Botão da lista "Páginas do site": cria uma página de serviço nova a partir de um modelo.
 * A página nasce como rascunho, com o conteúdo do modelo, e o painel já abre nela para editar.
 */
export default function NewServicePage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState(SERVICE_MODELS[0].slug)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  if ((user as { role?: string } | null)?.role !== 'admin') return null

  const finalSlug = slugTouched ? slug : toSlug(title)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const problem = slugError(finalSlug) || (title.trim().length < 3 ? 'Dê um nome à página (mínimo de 3 letras).' : '')
    if (problem) return setError(problem)
    setError(''); setSending(true)
    try {
      const response = await fetch('/api/pages/novo-servico', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, title: title.trim(), slug: finalSlug, description: description.trim() }),
      })
      const result = await response.json().catch(() => ({})) as { id?: number; error?: string }
      if (!response.ok || !result.id) { setError(result.error || 'Não foi possível criar a página.'); setSending(false); return }
      window.location.href = `/admin/collections/pages/${result.id}`
    } catch {
      setError('Sem conexão com o servidor. Tente de novo.'); setSending(false)
    }
  }

  return <div className="eq-new">
    {!open
      ? <button type="button" className="btn btn--style-primary btn--size-medium" onClick={() => setOpen(true)}>+ Nova página de serviço</button>
      : <form className="eq-new__form" onSubmit={submit}>
        <h3>Nova página de serviço</h3>
        <p className="eq-new__hint">A página começa como uma cópia do modelo escolhido, como ele está hoje no painel, e fica como <b>rascunho</b>: só aparece no site e no menu Seguros depois que você publicar.</p>
        <label>Modelo
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            {SERVICE_MODELS.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
          </select>
        </label>
        <label>Nome da página
          <input type="text" value={title} maxLength={60} placeholder="Ex.: Seguro Residencial" onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <label>Endereço (slug)
          <input type="text" value={finalSlug} maxLength={80} placeholder="seguro-residencial" onChange={(event) => { setSlug(toSlug(event.target.value)); setSlugTouched(true) }} />
          <span className="eq-new__hint">Fica assim: <b>/{finalSlug || 'endereco-da-pagina'}</b>. Depois de publicado e divulgado, não mude.</span>
        </label>
        <label>Frase curta para o menu <span className="eq-new__hint">(opcional)</span>
          <input type="text" value={description} maxLength={90} placeholder="Ex.: Proteção para a sua casa e seus bens." onChange={(event) => setDescription(event.target.value)} />
        </label>
        {error && <p className="eq-new__error" role="alert">{error}</p>}
        <div className="eq-new__actions">
          <button type="submit" className="btn btn--style-primary btn--size-medium" disabled={sending}>{sending ? 'Criando…' : 'Criar página'}</button>
          <button type="button" className="btn btn--style-secondary btn--size-medium" onClick={() => setOpen(false)} disabled={sending}>Cancelar</button>
        </div>
      </form>}
  </div>
}
