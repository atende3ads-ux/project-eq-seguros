import { chromium } from 'playwright'

/**
 * Confere o aviso de cookies e o consentimento rodando o site em MODO PRODUÇÃO com rastreamento configurado:
 *   SITE_ENV=production npm start   (banco de teste, com os IDs em Configurações → Rastreamento)
 *   npm run test:consent
 * Verifica, em um navegador de verdade e com a rede real: nada opcional antes da escolha, botões de aceitar e
 * rejeitar com o mesmo tamanho, rejeitar, aceitar tudo, só análise, persistência, revogação e teclado.
 * Imprime os cookies que cada escolha cria, para manter o inventário do painel correto.
 */
const BASE = (process.env.SITE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '')
const OPTIONAL_HOSTS = /googletagmanager|google-analytics|clarity\.ms|facebook|doubleclick|googleadservices|bing\.com/
const problems = []
const expect = (ok, message) => { console.log(`${ok ? '  ok ' : '  ERRO'} ${message}`); if (!ok) problems.push(message) }

const browser = await chromium.launch({ headless: true })

async function visit(viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => { if (OPTIONAL_HOSTS.test(new URL(request.url()).host)) requests.push(request.url()) })
  const csp = []
  await page.addInitScript(() => { document.addEventListener('securitypolicyviolation', (e) => (window.__csp ||= []).push(`${e.violatedDirective} ${e.blockedURI}`)) })
  return { context, page, requests, csp }
}
const cookies = (context) => context.cookies().then((list) => list.map((cookie) => cookie.name))
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('eq-consent') || 'null'))
const settle = (page, ms = 3500) => page.waitForTimeout(ms)

console.log('\n1. Primeira visita')
{
  const { context, page, requests } = await visit()
  await page.goto(BASE + '/', { waitUntil: 'load' }); await settle(page)
  expect(await page.locator('#eq-consent-banner').isVisible(), 'o aviso aparece')
  expect(requests.length === 0, `nenhuma requisição a serviço opcional antes da escolha (${requests.length})`)
  expect((await cookies(context)).length === 0, 'nenhum cookie antes da escolha')
  expect(await stored(page) === null, 'nada guardado antes da escolha')
  const names = await page.locator('#eq-consent-banner button').allInnerTexts()
  expect(JSON.stringify(names) === JSON.stringify(['Aceitar todos', 'Rejeitar opcionais', 'Personalizar']), `três botões no primeiro nível: ${names.join(' | ')}`)
  const [accept, reject] = await Promise.all(['Aceitar todos', 'Rejeitar opcionais'].map((name) => page.getByRole('button', { name }).first().boundingBox()))
  expect(Math.abs(accept.width - reject.width) < 1 && Math.abs(accept.height - reject.height) < 1, `aceitar e rejeitar têm o mesmo tamanho (${accept.width}×${accept.height} e ${reject.width}×${reject.height})`)
  const styles = await page.evaluate(() => ['Aceitar todos', 'Rejeitar opcionais'].map((name) => { const b = [...document.querySelectorAll('#eq-consent-banner button')].find((x) => x.textContent === name); const s = getComputedStyle(b); return [s.backgroundColor, s.color, s.fontSize, s.fontWeight].join('|') }))
  expect(styles[0] === styles[1], 'aceitar e rejeitar têm o mesmo estilo')
  expect(await page.locator('footer a[href$="#configuracoes-de-privacidade"]').count() === 1, 'rodapé tem “Configurações de privacidade”')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  expect(!overflow, 'sem rolagem horizontal')
  await context.close()
}

console.log('\n2. Rejeitar opcionais')
{
  const { context, page, requests } = await visit()
  await page.goto(BASE + '/'); await settle(page, 1500)
  await page.getByRole('button', { name: 'Rejeitar opcionais' }).first().click(); await settle(page)
  const state = await stored(page)
  expect(state && state.a === false && state.m === false && state.v && state.t && state.mode === 'basic', `escolha guardada com versão e data (${JSON.stringify(state)})`)
  expect(!(await page.locator('#eq-consent-banner').count()), 'o aviso some')
  await page.goto(BASE + '/blog'); await settle(page)
  expect(!(await page.locator('#eq-consent-banner').count()), 'não pergunta de novo ao navegar')
  expect(requests.length === 0, `nenhum serviço opcional carregado depois de rejeitar (${requests.length})`)
  expect((await cookies(context)).length === 0, 'nenhum cookie depois de rejeitar')
  expect(await page.locator('h1').first().isVisible(), 'o site continua utilizável')
  await context.close()
}

console.log('\n3. Aceitar todos')
let inventory = []
{
  const { context, page, requests } = await visit()
  await page.goto(BASE + '/'); await settle(page, 1500)
  await page.getByRole('button', { name: 'Aceitar todos' }).first().click(); await settle(page, 7000)
  const state = await stored(page)
  expect(state && state.a === true && state.m === true, 'escolha guardada')
  const joined = requests.join(' ')
  expect(/googletagmanager\.com\/gtm\.js/.test(joined), 'Tag Manager carregou')
  expect(/googletagmanager\.com\/gtag\/js\?id=G-/.test(joined), 'Google Analytics (ID direto) carregou')
  expect(/clarity\.ms\/tag/.test(joined), 'Clarity carregou')
  expect(/facebook/.test(joined), 'Meta Pixel (dentro do Tag Manager) carregou')
  const consent = await page.evaluate(() => window.dataLayer.filter((x) => x && x[0] === 'consent').map((x) => [x[1], JSON.stringify(x[2])]))
  expect(consent[0]?.[0] === 'default' && /"analytics_storage":"denied"/.test(consent[0][1]) && /"ad_user_data":"denied"/.test(consent[0][1]), 'Consent Mode: padrão negado nos 4 sinais')
  expect(consent.some(([kind, value]) => kind === 'update' && /"analytics_storage":"granted"/.test(value) && /"ad_personalization":"granted"/.test(value)), 'Consent Mode: atualizado para concedido')
  const pii = await page.evaluate(() => JSON.stringify(window.dataLayer).match(/@|\bcpf\b/i))
  expect(!pii, 'dataLayer sem dados pessoais')
  const violations = await page.evaluate(() => window.__csp || [])
  expect(violations.length === 0, `sem bloqueios da política de conteúdo ${violations.join(', ')}`)
  inventory = (await context.cookies()).map((cookie) => ({ name: cookie.name, domain: cookie.domain, days: cookie.expires > 0 ? Math.round((cookie.expires - Date.now() / 1000) / 86400) : 0 }))
  console.log('  cookies criados:', JSON.stringify(inventory))

  console.log('\n4. Revogar pelo rodapé')
  await page.locator('footer a[href$="#configuracoes-de-privacidade"]').click()
  const dialog = page.getByRole('dialog')
  expect(await dialog.isVisible(), 'o painel abre pelo link do rodapé')
  expect(await page.locator('#eqc-analytics').isChecked() && await page.locator('#eqc-marketing').isChecked(), 'o painel mostra as escolhas atuais')
  await Promise.all([page.waitForLoadState('load'), dialog.getByRole('button', { name: 'Rejeitar opcionais' }).click()])
  await settle(page, 2500)
  // Cookies do próprio site (_ga, _fbp, _clck…) o site apaga. Os que Clarity e Bing gravam nos domínios deles
  // não são acessíveis ao site: só deixam de ser enviados, porque nenhum script deles carrega mais.
  const host = new URL(BASE).hostname
  const left = (await context.cookies()).filter((cookie) => cookie.domain.replace(/^\./, '') === host && /^(_ga|_gcl|_fb|_clck|_clsk|CLID|MUID|SM|ANONCHK|MR)/.test(cookie.name)).map((cookie) => cookie.name)
  expect(left.length === 0, `cookies opcionais do próprio site apagados (sobraram: ${left.join(', ') || 'nenhum'})`)
  console.log('  cookies de terceiros que continuam no navegador (não são apagáveis pelo site):', (await context.cookies()).filter((cookie) => cookie.domain.replace(/^\./, '') !== host).map((cookie) => cookie.name + '@' + cookie.domain).join(', ') || 'nenhum')
  const after = requests.length
  await settle(page, 3000)
  expect(requests.length === after, 'nenhuma requisição nova depois de revogar')
  const revoked = await page.evaluate(() => !window.google_tag_manager && typeof window.clarity === 'undefined')
  expect(revoked, 'ferramentas descarregadas (página recarregada)')
  await context.close()
}

console.log('\n5. Só análise, pelo painel e por teclado')
{
  const { context, page, requests } = await visit()
  await page.goto(BASE + '/'); await settle(page, 1500)
  await page.getByRole('button', { name: 'Personalizar' }).click()
  const dialog = page.getByRole('dialog')
  expect(await dialog.isVisible(), 'Personalizar abre o painel')
  expect(!(await page.locator('#eqc-analytics').isChecked()) && !(await page.locator('#eqc-marketing').isChecked()), 'opcionais começam desligados')
  expect(await dialog.getByText('Sempre ativos').count() === 1, '“Necessários” aparece como sempre ativo, sem chave')
  const focusInside = async () => page.evaluate(() => Boolean(document.activeElement?.closest('.eqc-modal')))
  expect(await focusInside(), 'o foco vai para dentro do painel')
  let escaped = false
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); if (!(await focusInside())) escaped = true }
  expect(!escaped, 'o foco fica preso no painel ao usar Tab')
  await page.keyboard.press('Escape')
  expect(!(await dialog.isVisible()), 'Escape fecha o painel')
  expect(await page.locator('#eq-consent-banner').isVisible(), 'fechar sem salvar não decide nada: o aviso continua')
  expect(await stored(page) === null, 'nada foi guardado')
  await page.getByRole('button', { name: 'Personalizar' }).click()
  await page.locator('#eqc-analytics').check()
  await dialog.getByRole('button', { name: 'Salvar preferências' }).click(); await settle(page, 6000)
  const state = await stored(page)
  expect(state && state.a === true && state.m === false, 'só análise guardada')
  const joined = requests.join(' ')
  expect(/gtag\/js\?id=G-CX9NWGZ8FY/.test(joined) && /clarity\.ms\/tag/.test(joined), 'Google Analytics e Clarity carregaram')
  expect(!/gtm\.js/.test(joined) && !/facebook/.test(joined), 'Tag Manager e Meta Pixel NÃO carregaram sem Marketing')
  await context.close()
}

console.log('\n6. Celular (320 e 375 px)')
for (const width of [320, 375]) {
  const { context, page } = await visit({ width, height: 700 })
  await page.goto(BASE + '/'); await settle(page, 1500)
  const box = await page.locator('#eq-consent-banner').boundingBox()
  expect(box && box.width <= width + 0.5 && box.height <= 700 * 0.85 + 1, `${width}px: o aviso cabe na tela (${Math.round(box.width)}×${Math.round(box.height)})`)
  // O site já passa alguns pixels da largura nesta tela (SVG dos divisores); o aviso não pode piorar isso.
  const withBanner = await page.evaluate(() => document.documentElement.scrollWidth)
  await page.evaluate(() => document.getElementById('eq-consent-banner').remove())
  expect(withBanner <= await page.evaluate(() => document.documentElement.scrollWidth), `${width}px: o aviso não cria rolagem horizontal`)
  const small = await page.evaluate(() => [...document.querySelectorAll('#eq-consent-banner button')].filter((b) => b.getBoundingClientRect().height < 44).length)
  expect(small === 0, `${width}px: botões com pelo menos 44 px de altura`)
  await context.close()
}

await browser.close()
console.log(problems.length ? `\n${problems.length} problema(s).` : '\nTudo certo.')
process.exit(problems.length ? 1 : 0)
