import { chromium } from 'playwright'

/**
 * Confere os formulários rodando o site em MODO PRODUÇÃO, com banco de TESTE (cria mensagens de verdade nele):
 *   npm start   (SITE_ENV=production, RESEND_API_KEY/MAIL_API_URL apontando para um servidor de teste)
 *   npm run test:forms
 * Verifica campos reais, erros em português, envio, página de agradecimento, campo escondido, origem de outro
 * site e limite por origem. Cada teste usa um endereço de origem próprio (X-Forwarded-For) para não esgotar o limite.
 */
const BASE = (process.env.SITE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '')
const problems = []
const expect = (ok, message) => { console.log(`${ok ? '  ok ' : '  ERRO'} ${message}`); if (!ok) problems.push(message) }
const browser = await chromium.launch({ headless: true })
const open = async (ip, viewport = { width: 1280, height: 900 }) => {
  const context = await browser.newContext({ viewport, extraHTTPHeaders: { 'x-forwarded-for': ip } })
  const page = await context.newPage()
  const posts = []
  page.on('request', (request) => { if (request.method() === 'POST' && request.url().includes('/enviar-formulario')) posts.push(request.postData()) })
  return { context, page, posts }
}

console.log('\n1. Contato: campos de verdade')
{
  const { context, page, posts } = await open('10.1.0.1')
  await page.goto(BASE + '/contato'); await page.waitForTimeout(800)
  const form = page.locator('form.form')
  expect(await form.count() === 1, 'há um formulário')
  expect(await form.locator('input[type=email][name=email][autocomplete=email]').count() === 1, 'campo de e-mail com tipo e preenchimento automático')
  expect(await form.locator('select[name=assunto] option').count() > 2, 'assunto é uma lista de opções')
  expect(await form.locator('textarea[name=mensagem]').count() === 1, 'mensagem é uma área de texto')
  expect(await form.locator('label[for]').count() === 4, 'todo campo tem rótulo associado')
  await form.getByRole('button', { name: 'Enviar mensagem' }).click()
  expect((await page.locator('.eq-form-error').innerText()).includes('Preencha'), 'enviar vazio mostra erro em português')
  expect(posts.length === 0, 'nada é enviado ao servidor enquanto há erro')
  expect(await page.evaluate(() => document.activeElement?.getAttribute('name')) === 'nome', 'o foco vai para o primeiro campo com erro')
  await page.fill('[name=nome]', 'Teste Automático'); await page.fill('[name=email]', 'sem-arroba')
  await form.getByRole('button', { name: 'Enviar mensagem' }).click()
  expect((await page.locator('.eq-form-error').innerText()).includes('e-mail válido'), 'e-mail inválido é recusado')
  await context.close()
}

console.log('\n2. Envio completo')
{
  const { context, page, posts } = await open('10.1.0.2')
  await page.goto(BASE + '/contato'); await page.waitForTimeout(500)
  await page.fill('[name=nome]', 'Maria Teste'); await page.fill('[name=email]', 'maria.teste@exemplo.com')
  await page.selectOption('[name=assunto]', { index: 1 }); await page.fill('[name=mensagem]', 'Mensagem de teste automático <b>com html</b>.')
  await page.evaluate(() => { window.dataLayer = window.dataLayer || [] })
  await Promise.all([page.waitForURL('**/formulario-enviado', { timeout: 20000 }), page.locator('form.form').getByRole('button', { name: 'Enviar mensagem' }).click()])
  expect(posts.length === 1, 'um único envio ao servidor')
  const sent = JSON.parse(posts[0])
  expect(!('email' in sent) && sent.answers.some((a) => a.label === 'E-mail'), 'o corpo leva as respostas por rótulo')
  expect(await page.locator('h1').innerText() === 'Mensagem enviada com sucesso', 'página de agradecimento aparece')
  expect(await page.locator('meta[name=robots]').getAttribute('content') === 'noindex, nofollow', 'a página de agradecimento é noindex')
  const sitemap = await (await fetch(BASE + '/sitemap.xml')).text()
  expect(!sitemap.includes('formulario-enviado'), 'e não entra no sitemap')
  await context.close()
}

console.log('\n3. Outros formulários (por página)')
for (const [slug, button, ip] of [['seguro-vida', 'Simular agora', '10.1.0.3'], ['seguros', 'Fazer cotação', '10.1.0.4'], ['seja-parceiro', 'Quero ser Parceiro', '10.1.0.5'], ['consignado', 'Simular agora', '10.1.0.6']]) {
  const { context, page } = await open(ip)
  await page.goto(BASE + '/' + slug); await page.waitForTimeout(500)
  const count = await page.locator('form.form input:not([name=website]), form.form select, form.form textarea').count()
  expect(count >= 2 && await page.getByRole('button', { name: button }).count() === 1, `/${slug}: ${count} campos e botão “${button}”`)
  await context.close()
}

console.log('\n4. Defesas do servidor')
{
  const post = (body, headers = {}) => fetch(BASE + '/enviar-formulario', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE, 'x-forwarded-for': '10.1.0.9', ...headers }, body: JSON.stringify(body) })
  const valid = (extra = {}) => ({ form: 'Teste', page: '/contato', startedAt: Date.now() - 30000, answers: [{ label: 'Nome', value: 'Robô ' + Math.random() }], ...extra })
  const honeypot = await post(valid({ website: 'http://spam.example' }))
  expect(honeypot.status === 200 && (await honeypot.json()).ok === true, 'campo escondido preenchido: responde sucesso sem guardar')
  const other = await post(valid(), { Origin: 'https://site-de-outro.example', 'x-forwarded-for': '10.1.0.10' })
  expect(other.status === 403, `envio vindo de outro site é recusado (${other.status})`)
  const noOrigin = await fetch(BASE + '/enviar-formulario', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.1.0.11' }, body: JSON.stringify(valid()) })
  expect(noOrigin.status === 403, `envio sem origem é recusado (${noOrigin.status})`)
  const fast = await post(valid({ startedAt: Date.now() }), { 'x-forwarded-for': '10.1.0.12' })
  expect(fast.status === 400, `envio rápido demais é recusado (${fast.status})`)
  const big = await post(valid({ answers: [{ label: 'Mensagem', value: 'x'.repeat(30000) }] }), { 'x-forwarded-for': '10.1.0.13' })
  expect(big.status === 413 || big.status === 400, `corpo gigante é recusado (${big.status})`)
  const garbage = await fetch(BASE + '/enviar-formulario', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE, 'x-forwarded-for': '10.1.0.14' }, body: '{nao é json' })
  expect(garbage.status === 400, `JSON inválido é recusado (${garbage.status})`)
  expect((await fetch(BASE + '/enviar-formulario')).status === 405, 'GET não é aceito')
  const codes = []
  for (let i = 0; i < 7; i++) codes.push((await post(valid({ answers: [{ label: 'Nome', value: 'Limite ' + i }] }), { 'x-forwarded-for': '10.1.0.15' })).status)
  expect(codes.slice(0, 5).every((code) => code === 200) && codes.slice(5).every((code) => code === 429), `limite por origem: ${codes.join(', ')}`)
}

await browser.close()
console.log(problems.length ? `\n${problems.length} problema(s).` : '\nTudo certo.')
process.exit(problems.length ? 1 : 0)
