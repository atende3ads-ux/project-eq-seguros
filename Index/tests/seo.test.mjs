import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pageSeo, siteDefaultDescription, postSeo } from '../src/cms/seo-pages.ts'
import { mentions, words, STOPWORDS } from '../src/lib/keyphrase.ts'

const root = path.resolve(import.meta.dirname, '..')
const prototype = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))
const sections = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/sections.json'), 'utf8'))
const pages = new Map(prototype.pages.map((page) => [page.slug, page]))

const textOf = (node, values) => node.textKey ? values.get(node.textKey) ?? node.text ?? '' : node.text ?? (node.children || []).map((child) => textOf(child, values)).join('')
const collect = (nodes, test, out = []) => { for (const node of nodes || []) { if (test(node)) out.push(node); collect(node.children, test, out) } return out }

/** Páginas cuja abertura fala de outro assunto: a frase-chave está nos títulos e no corpo, mas não no Hero. */
const OPENING_EXCEPTIONS = new Set(['seguros'])

/** Mesmos dados que a análise do painel usa: título principal, primeira seção e todos os textos. */
function pageFacts(slug) {
  const page = pages.get(slug)
  const values = new Map(page.content.copy.map((item) => [item.key, item.value]))
  const scope = sections.pages[slug]
  const first = page.content.copy.map((item) => scope[item.key]?.secao).find((name) => name && name !== 'Trilha de navegação')
  return {
    headings: collect(page.body, (node) => /^h[1-4]$/.test(node.tag || '')).map((node) => textOf(node, values)),
    opening: page.content.copy.filter((item) => scope[item.key]?.secao === first).map((item) => item.value).join(' '),
    texts: page.content.copy.map((item) => item.value),
    imageKeys: new Set(page.content.images.map((image) => image.key)),
  }
}

test('should define SEO for every page that visitors can reach', () => {
  // `post` é só o modelo dos artigos e `case` mostra o registro de cada case: ambos têm SEO próprio dos dados.
  const covered = new Set(Object.keys(pageSeo))
  for (const slug of pages.keys()) if (!['post', 'case'].includes(slug)) assert.ok(covered.has(slug), `sem SEO: ${slug}`)
  for (const slug of covered) assert.ok(pages.has(slug), `página inexistente: ${slug}`)
})

test('should keep titles and descriptions within search result limits', () => {
  const problems = []
  for (const [slug, seo] of Object.entries(pageSeo)) {
    // O nome do site entra sozinho ("Página | EQ Seguros"), 13 caracteres a mais.
    if (seo.title.length > 47 || seo.title.length < 20) problems.push(`${slug}: título com ${seo.title.length} caracteres`)
    if (seo.description.length < 120 || seo.description.length > 156) problems.push(`${slug}: descrição com ${seo.description.length} caracteres`)
  }
  if (siteDefaultDescription.length < 120 || siteDefaultDescription.length > 156) problems.push(`descrição padrão com ${siteDefaultDescription.length}`)
  const titles = Object.values(pageSeo).map((seo) => seo.title)
  if (new Set(titles).size !== titles.length) problems.push('títulos repetidos')
  const descriptions = Object.values(pageSeo).map((seo) => seo.description)
  if (new Set(descriptions).size !== descriptions.length) problems.push('descrições repetidas')
  assert.deepEqual(problems, [])
})

test('should use one keyphrase per page, present where the analysis looks for it', () => {
  const problems = []
  const seen = new Map()
  for (const [slug, seo] of Object.entries(pageSeo)) {
    const phrase = seo.focusKeyphrase
    const size = words(phrase).filter((word) => !STOPWORDS.has(word)).length
    if (size < 1 || size > 4) problems.push(`${slug}: frase-chave com ${size} palavras importantes`)
    if (seen.has(phrase.toLowerCase())) problems.push(`${slug}: frase-chave repetida em ${seen.get(phrase.toLowerCase())}`)
    seen.set(phrase.toLowerCase(), slug)
    const facts = pageFacts(slug)
    if (!mentions(seo.title, phrase)) problems.push(`${slug}: título não cita "${phrase}"`)
    if (!mentions(seo.description, phrase)) problems.push(`${slug}: descrição não cita "${phrase}"`)
    if (!facts.headings.some((heading) => mentions(heading, phrase))) problems.push(`${slug}: nenhum título cita "${phrase}"`)
    if (!OPENING_EXCEPTIONS.has(slug) && !mentions(facts.opening, phrase)) problems.push(`${slug}: a abertura não cita "${phrase}"`)
    const count = facts.texts.filter((text) => mentions(text, phrase)).length
    if (count < 2) problems.push(`${slug}: "${phrase}" aparece em ${count} texto(s)`)
  }
  assert.deepEqual(problems, [])
})

test('should describe only images that exist and never leave a description empty', () => {
  for (const [slug, seo] of Object.entries(pageSeo)) {
    const { imageKeys } = pageFacts(slug)
    for (const [key, alt] of Object.entries(seo.alts || {})) {
      assert.ok(imageKeys.has(key), `${slug}: imagem ${key} não existe`)
      assert.ok(alt.trim().length >= 8, `${slug}: descrição curta em ${key}`)
    }
  }
})

test('should keep the initial blog post SEO within limits', () => {
  for (const [slug, seo] of Object.entries(postSeo)) {
    assert.ok(seo.seoTitle.length <= 47, `${slug}: seoTitle com ${seo.seoTitle.length}`)
    assert.ok(seo.seoDescription.length >= 120 && seo.seoDescription.length <= 156, `${slug}: seoDescription com ${seo.seoDescription.length}`)
    assert.ok(mentions(seo.seoTitle, seo.focusKeyphrase) && mentions(seo.seoDescription, seo.focusKeyphrase))
  }
})
