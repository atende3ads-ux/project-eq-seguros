import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { prototypeSource } from '../scripts/prototype-source.mjs'

const root = path.resolve(import.meta.dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json')))
const source = prototypeSource

test('should preserve all prototype pages', () => {
  const slugs = fs.readdirSync(source).filter((x) => x.endsWith('.html')).map((x) => x.replace('.html', '')).sort()
  assert.deepEqual(data.pages.map((p) => p.slug).sort(), slugs)
})
test('should copy every original visual asset without changes', () => {
  function walk(folder, prefix = '') {
    return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(folder, entry.name), prefix + entry.name + '/') : [prefix + entry.name])
  }
  const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  for (const file of walk(path.join(source, 'assets'))) {
    assert.equal(hash(path.join(root, 'public/assets', file)), hash(path.join(source, 'assets', file)), file)
  }
})
test('should have editable content keys that match the rendered templates', () => {
  for (const page of data.pages) {
    const keys = page.content.copy.map((t) => t.key)
    assert.equal(keys.length, new Set(keys).size)
    const visit = (nodes) => nodes.forEach((node) => {
      if (node.textKey) assert.ok(keys.includes(node.textKey))
      if (node.children) visit(node.children)
    })
    visit(page.body)
  }
})
test('should not embed executable HTML handlers or scripts in React templates', () => {
  const visit = (nodes) => nodes.forEach((node) => {
    assert.notEqual(node.tag, 'script')
    assert.ok(!Object.keys(node.attrs || {}).some((key) => /^on/i.test(key)))
    if (node.children) visit(node.children)
  })
  for (const page of data.pages) { visit(page.body); visit(page.header) }
  visit(data.site.footer)
})
test('should retain illustrative case approval flags', () => {
  assert.equal(data.cases.length, 4)
  assert.ok(data.cases.every((record) => record.aprovado === false))
})
