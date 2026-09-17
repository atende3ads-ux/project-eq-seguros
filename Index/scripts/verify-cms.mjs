import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { chromium } from 'playwright'

const root = path.resolve(import.meta.dirname, '..')
const output = path.join(root, 'test-results/cms')
fs.mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const base = 'http://localhost:3000'
const context = await browser.newContext({ extraHTTPHeaders: { Origin: base } })
const page = await context.newPage()
const api = context.request
const email = `test-${Date.now()}@example.invalid`
const password = randomBytes(24).toString('base64url')
let pageDoc, userId
try {
  const first = await api.post(base + '/api/users/first-register', { data: { name: 'Teste temporário', email, password } })
  assert.equal(first.status(), 200, await first.text())
  userId = (await first.json()).user.id
  const login = await api.post(base + '/api/users/login', { data: { email, password } })
  assert.equal(login.status(), 200)
  const response = await api.get(base + '/api/pages?where[slug][equals]=index&limit=1')
  pageDoc = (await response.json()).docs[0]
  const edited = structuredClone(pageDoc.copy)
  const hero = edited.find((entry) => entry.value.includes('Proteção financeira feita'))
  assert.ok(hero)
  hero.value = 'Conteúdo editado pelo CMS '
  const patch = await api.patch(base + `/api/pages/${pageDoc.id}`, { data: { copy: edited } })
  assert.equal(patch.status(), 200)
  await page.goto(base, { waitUntil: 'networkidle' })
  assert.ok((await page.locator('h1').innerText()).includes('Conteúdo editado pelo CMS'))
  await page.goto(base + '/admin', { waitUntil: 'networkidle' })
  assert.ok((await page.locator('body').innerText()).includes('Páginas do site'))
  await page.screenshot({ path: path.join(output, 'admin.png'), fullPage: true })
  const anonymous = await browser.newContext()
  const denied = await anonymous.request.patch(base + `/api/pages/${pageDoc.id}`, { data: { title: 'Não autorizado' } })
  assert.ok([401, 403].includes(denied.status()))
  await anonymous.close()
  console.log('PASS: cadastro inicial, login, painel, edição CMS → site, bloqueio de edição anônima.')
} finally {
  if (pageDoc) {
    const restored = await api.patch(base + `/api/pages/${pageDoc.id}`, { data: { copy: pageDoc.copy } })
    assert.equal(restored.status(), 200, 'O conteúdo de teste precisa ser restaurado.')
  }
  if (userId) {
    const removed = await api.delete(base + `/api/users/${userId}`)
    assert.equal(removed.status(), 200, 'A conta temporária precisa ser removida.')
  }
  await context.close(); await browser.close()
}
