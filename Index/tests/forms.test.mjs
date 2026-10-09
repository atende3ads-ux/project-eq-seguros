import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { specFor, fieldError, check, createLimiter, escapeHtml, mailHtml, MIN_FILL_MS } from '../src/lib/forms.ts'

const root = path.resolve(import.meta.dirname, '..')
const prototype = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))
const now = 1_800_000_000_000

test('should give every form label of the site a field type', () => {
  const labels = new Set()
  const walk = (nodes, values) => { for (const node of nodes || []) { if (node.tag === 'label') labels.add((node.children || []).map((c) => (c.textKey && values.get(c.textKey)) ?? c.text ?? '').join('').trim()); walk(node.children, values) } }
  for (const page of prototype.pages) walk(page.body, new Map(page.content.copy.map((item) => [item.key, item.value])))
  assert.ok(labels.size >= 8, `poucos rótulos: ${[...labels]}`)
  const kinds = Object.fromEntries([...labels].map((label) => [label, specFor(label).kind]))
  assert.equal(kinds['E-mail'], 'email'); assert.equal(kinds['Telefone'], 'phone'); assert.equal(kinds['Mensagem'], 'textarea')
  assert.equal(kinds['Assunto'], 'select'); assert.equal(kinds['Seguro de interesse'], 'select'); assert.equal(kinds['Possui SUSEP?'], 'select')
  assert.equal(kinds['CPF/CNPJ'], 'document'); assert.equal(kinds['Valor desejado'], 'money'); assert.equal(kinds['Nome'], 'text')
})
test('should use one input name per label inside the same form', () => {
  const names = ['Nome', 'Telefone', 'E-mail', 'Mensagem', 'Assunto'].map((label) => specFor(label).name)
  assert.equal(new Set(names).size, names.length)
})
test('should validate each kind of field with a message in Portuguese', () => {
  assert.equal(fieldError('E-mail', 'ana@exemplo.com.br'), undefined)
  assert.match(fieldError('E-mail', 'ana@exemplo'), /e-mail válido/)
  assert.equal(fieldError('Telefone', '(62) 3572-6000'), undefined)
  assert.equal(fieldError('Telefone', '+55 62 99999-0000'), undefined)
  assert.match(fieldError('Telefone', '1234'), /DDD/)
  assert.equal(fieldError('CPF/CNPJ', '123.456.789-09'), undefined)
  assert.equal(fieldError('CPF/CNPJ', '12.345.678/0001-95'), undefined)
  assert.match(fieldError('CPF/CNPJ', '123'), /CPF/)
  assert.equal(fieldError('Possui SUSEP?', 'Sim'), undefined)
  assert.match(fieldError('Possui SUSEP?', 'Talvez'), /opção/)
  assert.match(fieldError('Nome', '   '), /Preencha/)
  assert.match(fieldError('Mensagem', 'x'.repeat(3001)), /longo/)
  assert.match(fieldError('Nome', 'Ana\u0000'), /inválidos/)
})
test('should drop a robot that fills the hidden field without saying why', () => {
  const result = check({ website: 'http://spam', startedAt: now - 60_000, answers: [{ label: 'Nome', value: 'Ana' }] }, now)
  assert.equal(result.ok, false); assert.equal(result.silent, true)
})
test('should refuse a form sent faster than a person can fill it', () => {
  const result = check({ startedAt: now - (MIN_FILL_MS - 500), answers: [{ label: 'Nome', value: 'Ana' }] }, now)
  assert.equal(result.ok, false); assert.match(result.error, /rápido/)
  assert.equal(check({ startedAt: now + 60_000, answers: [{ label: 'Nome', value: 'Ana' }] }, now).ok, false)
  assert.equal(check({ startedAt: 'agora', answers: [{ label: 'Nome', value: 'Ana' }] }, now).ok, false)
})
test('should accept a complete submission and keep only the known shape', () => {
  const result = check({ form: 'Contato', page: '/contato', startedAt: now - 20_000, answers: [{ label: 'Nome', value: ' Ana ' }, { label: 'E-mail', value: 'ana@exemplo.com' }], extra: 'ignorado' }, now)
  assert.equal(result.ok, true)
  assert.deepEqual(result.answers, [{ label: 'Nome', value: 'Ana' }, { label: 'E-mail', value: 'ana@exemplo.com' }])
  assert.equal(result.page, '/contato')
  assert.equal(check({ page: 'http://evil', startedAt: now - 20_000, answers: [{ label: 'Nome', value: 'Ana' }] }, now).page, '/')
})
test('should reject malformed answers', () => {
  const base = { startedAt: now - 20_000 }
  assert.equal(check({ ...base, answers: [] }, now).ok, false)
  assert.equal(check({ ...base, answers: 'x' }, now).ok, false)
  assert.equal(check({ ...base, answers: [null] }, now).ok, false)
  assert.equal(check({ ...base, answers: Array(13).fill({ label: 'Nome', value: 'Ana' }) }, now).ok, false)
  assert.equal(check({ ...base, answers: [{ label: 'E-mail', value: 'ruim' }] }, now).ok, false)
})
test('should limit attempts per origin and release them after the window', () => {
  const allowed = createLimiter(3, 1000)
  assert.deepEqual([1, 2, 3, 4].map(() => allowed('a', 0)), [true, true, true, false])
  assert.equal(allowed('b', 0), true)
  assert.equal(allowed('a', 1500), true)
})
test('should escape everything a visitor typed before putting it in the e-mail', () => {
  assert.equal(escapeHtml(`<script>"&'`), '&lt;script&gt;&quot;&amp;&#39;')
  const html = mailHtml('Contato', '/contato', [{ label: 'Mensagem', value: '<img src=x onerror=alert(1)>' }])
  assert.ok(!html.includes('<img'))
})
