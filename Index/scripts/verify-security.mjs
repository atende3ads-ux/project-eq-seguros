import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { chromium } from 'playwright'

/**
 * Confere a segurança do site rodando em MODO PRODUÇÃO (a política de conteúdo só vale lá):
 *   npm run build && npm start        (em outro terminal, com um banco de teste)
 *   echo '{"email":"…","password":"…"}' | npm run test:security
 * Verifica os cabeçalhos de segurança e abre todas as páginas do site e as telas principais do
 * painel procurando bloqueios da política de conteúdo (mapa, fontes, imagens, avatar…).
 * Um teste de controle provoca uma violação de propósito: se ela não for detectada, o teste não vale.
 * Use só com ambiente de teste. As credenciais chegam pela entrada padrão e não são gravadas.
 */
const BASE = (process.env.SITE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const root = path.resolve(import.meta.dirname, '..')
const slugs = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8')).pages.map((page) => page.slug)
  // Modelo do post e área de cases (oculta por padrão) não são páginas abertas.
  .filter((slug) => !['post', 'case', 'cases'].includes(slug))

const input = readline.createInterface({ input: process.stdin, terminal: false })
const line = await new Promise((resolve) => input.once('line', resolve))
input.close()
const { email, password } = JSON.parse(line)

const problems = []
const res = await fetch(BASE + '/', { redirect: 'manual' })
for (const header of ['content-security-policy', 'strict-transport-security', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy']) {
  if (!res.headers.get(header)) problems.push(`cabeçalho ausente: ${header}`)
}
if (res.headers.get('x-powered-by')) problems.push(`x-powered-by revela: ${res.headers.get('x-powered-by')}`)

const browser = await chromium.launch({ headless: true })
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
await page.addInitScript(() => {
  window.__csp = []
  document.addEventListener('securitypolicyviolation', (event) => window.__csp.push(`${event.violatedDirective} bloqueou ${event.blockedURI}`))
})
const visit = async (label, url, after) => {
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 })
  if (after) await after()
  const events = await page.evaluate(() => window.__csp || [])
  for (const event of [...new Set(events)]) problems.push(`${label}: ${event}`)
  console.log(label.padEnd(36), events.length ? '⚠ ' + [...new Set(events)].join(' | ') : 'ok')
}

await page.goto(BASE + '/', { waitUntil: 'networkidle' })
const control = await page.evaluate(async () => {
  const script = document.createElement('script')
  script.src = 'https://example.com/controle.js'
  document.head.appendChild(script)
  await new Promise((resolve) => setTimeout(resolve, 800))
  return window.__csp
})
if (!control.length) problems.push('controle: a política de conteúdo não bloqueou o script de teste (está ativa? use modo produção)')
console.log('controle'.padEnd(36), control.length ? 'bloqueou, como esperado' : 'NÃO BLOQUEOU')

for (const slug of slugs) await visit(`site: ${slug}`, slug === 'index' ? '/' : `/${slug}`)

await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' })
await page.fill('input[name=email], input#field-email', email)
await page.fill('input[name=password], input#field-password', password)
await Promise.all([page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 }), page.click('button[type=submit]')])
for (const [label, url] of [['painel: início', '/admin'], ['painel: páginas', '/admin/collections/pages'], ['painel: posts', '/admin/collections/posts'], ['painel: novo post', '/admin/collections/posts/create'], ['painel: biblioteca', '/admin/collections/media'], ['painel: configurações', '/admin/globals/settings'], ['painel: cabeçalho e rodapé', '/admin/globals/site']]) await visit(label, url)
await browser.close()

if (problems.length) {
  console.error(`\n${problems.length} problema(s):\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log('\nSegurança ok: cabeçalhos presentes e nenhum bloqueio da política de conteúdo.')
