import { createElement, Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Content, TemplateNode, CaseRecord } from '@/lib/types'
import { CaseCards, CasesListing } from '../Cases'
import { segments, imageURL, casesVisible, casesSectionIds, isCasesHref } from '@/lib/cases'

const names: Record<string, string> = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio', crossorigin: 'crossOrigin', colspan: 'colSpan', rowspan: 'rowSpan', readonly: 'readOnly', maxlength: 'maxLength', srcset: 'srcSet', 'xlink:href': 'xlinkHref', 'xmlns:xlink': 'xmlnsXlink', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', referrerpolicy: 'referrerPolicy', contenteditable: 'contentEditable', autocomplete: 'autoComplete', spellcheck: 'spellCheck' }
const safeURL = (value: string) => /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) ? value : '#'
function style(value: string): CSSProperties {
  return Object.fromEntries(value.split(';').filter((part) => part.includes(':')).map((part) => {
    const index = part.indexOf(':')
    const key = part.slice(0, index).trim()
    return [key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), part.slice(index + 1).trim()]
  }))
}
type Args = { nodes: TemplateNode[]; content: Content; records?: CaseRecord[]; selectedCase?: CaseRecord }
export function Template({ nodes, content, records = [], selectedCase }: Args) {
  const texts = new Map(content.copy?.map((entry) => [entry.key, entry.value]))
  const images = new Map(content.images?.map((entry) => [entry.key, entry]))
  const links = new Map(content.links?.map((entry) => [entry.key, entry.href]))
  const hasCaseListing = nodes.some(function contains(node): boolean { return node.attrs?.id === 'cases-filtro' || Boolean(node.children?.some(contains)) })

  function subtree(node: TemplateNode, test: (node: TemplateNode) => boolean): boolean {
    return test(node) || Boolean(node.children?.some((child) => subtree(child, test)))
  }
  /**
   * Com os cases ocultos, remove a seção inteira que os exibiria e os itens de
   * menu e rodapé que levam até eles. Some o `li` inteiro, não só a âncora,
   * para não sobrar marcador de lista vazio.
   */
  function hide(node: TemplateNode): boolean {
    if (casesVisible) return false
    if (subtree(node, (n) => Boolean(n.attrs?.id && casesSectionIds.has(n.attrs.id)))) return true
    if (node.tag !== 'a' && node.tag !== 'li') return false
    return subtree(node, (n) => isCasesHref(n.linkKey ? links.get(n.linkKey) : n.attrs?.href))
  }
  const visible = (list?: TemplateNode[]) => list?.filter((node) => !hide(node))

  function render(node: TemplateNode, key: string): ReactNode {
    if (!node.tag) return node.textKey && texts.has(node.textKey) ? texts.get(node.textKey) : node.text
    const id = node.attrs?.id
    if (hasCaseListing && id === 'cases-filtro') return <CasesListing key={key} records={records}/>
    if (hasCaseListing && id === 'cases-grid') return null
    const attrs: Record<string, unknown> = { key }
    for (const [name, value] of Object.entries(node.attrs || {})) {
      if (/^on/i.test(name)) continue
      const prop = names[name] || (name.startsWith('aria-') || name.startsWith('data-') ? name : name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()))
      attrs[prop] = name === 'style' ? style(value) : ['hidden', 'disabled', 'required', 'checked', 'multiple', 'allowfullscreen'].includes(name) ? true : value
    }
    if (node.imageKey) {
      const image = images.get(node.imageKey)
      if (image) {
        attrs.src = safeURL(typeof image.media === 'object' && image.media?.url ? image.media.url : image.src)
        attrs.alt = image.alt
      }
    }
    if (node.linkKey && links.has(node.linkKey)) attrs.href = safeURL(links.get(node.linkKey)!)
    let children: ReactNode = node.tag === 'title' || node.tag === 'textarea'
      ? node.children?.map((child) => child.textKey && texts.has(child.textKey) ? texts.get(child.textKey) : child.text || '').join('')
      : visible(node.children)?.map((child, i) => <Fragment key={i}>{render(child, `${key}.${i}`)}</Fragment>)
    if (id === 'cases-destaque') children = <CaseCards records={records.filter((r) => r.destaque).slice(0, 3)}/>
    if (selectedCase) {
      const record = selectedCase
      const values: Record<string, string> = { 'case-crumb': record.parceiro, 'case-seg': segments[record.segmento], 'case-titulo': record.titulo, 'case-resumo': record.resumo, 'case-parceiro': record.parceiro, 'case-desafio': record.desafio, 'case-solucao': record.solucao, 'case-quote': record.depoimento?.texto || '', 'case-autor': record.depoimento?.autor || '', 'case-cargo': record.depoimento?.cargo || '' }
      if (id && id in values) children = values[id]
      if (id === 'case-img') { attrs.src = imageURL(record); attrs.alt = record.titulo }
      if (id === 'case-flag') attrs.hidden = record.aprovado
      if (id === 'case-produtos') children = record.produtos.map((p, i) => <span className="tag" key={i}>{p.nome}</span>)
      if (id === 'case-stats') children = record.resultados.map((r, i) => <div className="item rv-init" key={i}><div className="big">{r.valor}</div><div className="lbl">{r.rotulo}</div></div>)
      if (id === 'case-outros') children = <CaseCards records={records.filter((r) => r.slug !== record.slug).slice(0, 3)}/>
    }
    if (node.tag === 'img' || node.tag === 'input' || node.tag === 'br' || node.tag === 'hr') return createElement(node.tag, attrs)
    return createElement(node.tag, attrs, children)
  }
  return visible(nodes)?.map((node, index) => <Fragment key={index}>{render(node, String(index))}</Fragment>)
}
