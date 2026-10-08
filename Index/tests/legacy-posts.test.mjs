import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { mentions } from '../src/lib/keyphrase.ts'
import { toLexical } from '../src/cms/legacy-lexical.ts'

const root = path.resolve(import.meta.dirname, '..')
const posts = JSON.parse(fs.readFileSync(path.join(root, 'src/cms/legacy-posts.json'), 'utf8'))
const flat = (blocks) => blocks.map((block) => block.parts.map((part) => part.text ?? (part.br ? '\n' : '')).join('')).join('\n\n')

test('should bring the three articles of the old site', () => {
  assert.equal(posts.length, 3)
  for (const post of posts) {
    assert.ok(post.blocks.length >= 15, `${post.slug}: texto curto demais (${post.blocks.length} blocos)`)
    assert.ok(post.title && post.excerpt && post.category && post.publishedAt)
    assert.ok(fs.existsSync(path.join(root, 'public/assets', post.cover)), `${post.slug}: capa ausente`)
  }
})

test('should keep the text as published, without stray markup or entities', () => {
  for (const post of posts) {
    const text = flat(post.blocks)
    assert.ok(!/&[a-z]+;|<\/?[a-z]/i.test(text), `${post.slug}: sobrou HTML no texto`)
    assert.ok(!/ /.test(text), `${post.slug}: espaço não separável`)
    assert.ok(!/ {2,}/.test(text.replace(/●\s+/g, '')), `${post.slug}: espaços duplicados`)
  }
})

test('should keep SEO within search limits and the keyphrase where analysis looks for it', () => {
  for (const post of posts) {
    assert.ok(post.seoTitle.length >= 20 && post.seoTitle.length <= 47, `${post.slug}: título SEO com ${post.seoTitle.length}`)
    assert.ok(post.seoDescription.length >= 120 && post.seoDescription.length <= 156, `${post.slug}: descrição com ${post.seoDescription.length}`)
    const text = flat(post.blocks)
    assert.ok(mentions(post.seoTitle, post.focusKeyphrase), `${post.slug}: título SEO sem a frase-chave`)
    assert.ok(mentions(post.seoDescription, post.focusKeyphrase), `${post.slug}: descrição sem a frase-chave`)
    // O título e a abertura são os do artigo original e não mudam: a frase-chave tem de estar em um dos dois.
    const opening = post.blocks[0].parts.map((part) => part.text || '').join('')
    assert.ok(mentions(post.title, post.focusKeyphrase) || mentions(opening, post.focusKeyphrase), `${post.slug}: nem o título nem o primeiro parágrafo citam a frase-chave`)
    assert.ok(post.blocks.filter((block) => mentions(block.parts.map((part) => part.text || '').join(''), post.focusKeyphrase)).length >= 2, `${post.slug}: frase-chave em menos de 2 parágrafos`)
    assert.ok(text.split(/\s+/).length > 300, `${post.slug}: poucas palavras`)
  }
  assert.equal(new Set(posts.map((post) => post.focusKeyphrase)).size, posts.length)
})

test('should convert to the editor format and point old internal links to the new addresses', () => {
  const content = JSON.stringify(posts.map((post) => toLexical(post.blocks)))
  assert.ok(content.includes('"url":"/contato"'), 'link de fale-conosco não foi para /contato')
  assert.ok(!content.includes('eqseguros.com.br'), 'sobrou link com o domínio antigo')
  const first = toLexical(posts[0].blocks).root
  assert.equal(first.type, 'root')
  assert.ok(first.children.some((node) => node.type === 'heading' && node.tag === 'h2'))
})
