import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { SERVICE_MODELS, slugError, toSlug, withTitle } from '../src/lib/service-pages.ts'

const root = path.resolve(import.meta.dirname, '..')
const prototype = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))
const sections = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/sections.json'), 'utf8'))
const icons = fs.readFileSync(path.join(root, 'src/lib/menu-icons.ts'), 'utf8')

test('should turn a name into an address without accents or symbols', () => {
  assert.equal(toSlug('Seguro Residencial'), 'seguro-residencial')
  assert.equal(toSlug('  Seguro de Proteção & Saúde! '), 'seguro-de-protecao-saude')
  assert.equal(toSlug('---'), '')
})
test('should refuse addresses that are invalid or reserved by the site', () => {
  assert.equal(slugError('seguro-residencial'), undefined)
  for (const bad of ['', 'Seguro', 'seguro residencial', 'seguro_x', '-x', 'x-', 'x--y', 'admin', 'api', 'blog', 'enviar-formulario', 'index', 'post', 'a'.repeat(81)]) assert.ok(slugError(bad), `deveria recusar "${bad}"`)
  assert.ok(slugError(undefined))
})
test('should not let a new address collide with a page that already exists in the layout', () => {
  // As páginas originais já são únicas no banco; o servidor confere isso. Aqui, só que os modelos existem.
  const slugs = new Set(prototype.pages.map((page) => page.slug))
  for (const model of SERVICE_MODELS) assert.ok(slugs.has(model.slug), `modelo inexistente: ${model.slug}`)
  assert.equal(new Set(SERVICE_MODELS.map((m) => m.slug)).size, SERVICE_MODELS.length)
})
test('should use a real menu icon for every model', () => {
  for (const model of SERVICE_MODELS) assert.ok(new RegExp(`\\n  ${model.icon}: \\{`).test(icons), `ícone inexistente: ${model.icon}`)
})
test('should put the new name in the breadcrumb and in the main title of every model, and nowhere else', () => {
  for (const model of SERVICE_MODELS) {
    const page = prototype.pages.find((item) => item.slug === model.slug)
    const copy = page.content.copy.map(({ key, label, value }) => ({ key, label, value }))
    const next = withTitle(copy, sections.pages[model.slug], 'Seguro Residencial')
    const changed = next.filter((item, i) => item.value !== copy[i].value)
    assert.equal(changed.length, 2, `${model.slug}: ${changed.length} textos trocados`)
    assert.ok(changed.every((item) => item.value === 'Seguro Residencial'))
    assert.deepEqual(sections.pages[model.slug][changed[0].key].secao, 'Trilha de navegação')
    assert.equal(sections.pages[model.slug][changed[1].key].papel, 'Título principal')
    assert.equal(next.length, copy.length)
  }
})
test('should keep one menu card per model in the header, so a created page is added after them', () => {
  const header = JSON.stringify(prototype.pages[0].header)
  for (const model of SERVICE_MODELS) assert.ok(header.includes(`"/${model.slug}"`), `sem card no menu: ${model.slug}`)
  assert.ok(header.includes('"id": "seg-pessoas"') || header.includes('"id":"seg-pessoas"'))
})
