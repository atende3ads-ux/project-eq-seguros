import readline from 'node:readline'
import { chromium } from 'playwright'

/**
 * Confere "Nova página de serviço" rodando o site em MODO PRODUÇÃO com banco de TESTE (cria e apaga páginas):
 *   echo '{"email":"…","password":"…"}' | npm run test:service-pages
 * Cria uma página a partir de um modelo pelo painel, confere que nasce como rascunho (404 no site, fora do menu e do
 * sitemap), publica, confere a página, o card no menu Seguros em outras páginas e no blog, o sitemap, o editor de
 * seções, as defesas do servidor e a exclusão. Credenciais pela entrada padrão; nada é gravado.
 */
const BASE = (process.env.SITE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '')
const input = readline.createInterface({ input: process.stdin, terminal: false })
const line = await new Promise((resolve) => input.once('line', resolve))
input.close()
const { email, password } = JSON.parse(line)
const problems = []
const expect = (ok, message) => { console.log(`${ok ? '  ok ' : '  ERRO'} ${message}`); if (!ok) problems.push(message) }
const SLUG = 'seguro-residencial-teste'

const login = await fetch(BASE + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
const { token } = await login.json()
const auth = { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' }
const api = (path, init = {}) => fetch(BASE + path, { ...init, headers: { ...auth, ...(init.headers || {}) } })
const page = (path) => fetch(BASE + path)
const menuCards = async (path) => (await (await page(path)).text()).match(/<a class="dd-card" href="\/[^"]+"/g)?.map((tag) => tag.replace(/.*href="/, '').replace(/"$/, '')) || []

// Limpa sobra de uma execução anterior.
for (const slug of [SLUG, 'seguro-pet-teste']) {
  const old = await (await api(`/api/pages?where[slug][equals]=${slug}&depth=0`)).json()
  for (const doc of old.docs) await api(`/api/pages/${doc.id}`, { method: 'DELETE' })
}

console.log('\n1. Criar a partir de um modelo')
const create = (body) => api('/api/pages/novo-servico', { method: 'POST', body: JSON.stringify(body) })
const base = { model: 'seguro-vida', title: 'Seguro Residencial', slug: SLUG, description: 'Proteção para a sua casa e seus bens.' }
const created = await create(base)
const { id } = await created.json()
expect(created.status === 200 && id, `página criada (id ${id})`)
const doc = await (await api(`/api/pages/${id}?depth=0`)).json()
expect(doc.template === 'seguro-vida' && doc.status === 'draft' && doc.slug === SLUG, 'usa o desenho do Seguro de Vida e nasce como rascunho')
expect(doc.copy.length === 62 && doc.links.length === 5, `copiou os ${doc.copy.length} textos e ${doc.links.length} links do modelo`)
expect(doc.copy.find((c) => c.key === 'page-t7').value === 'Seguro Residencial' && doc.copy.find((c) => c.key === 'page-t5').value === 'Seguro Residencial', 'título principal e trilha de navegação com o nome novo')
expect(doc.copy.find((c) => c.key === 'page-t8').value.startsWith('Proteção financeira para quem depende'), 'o resto do texto continua o do modelo, para editar')
expect(doc.showInMenu === true && doc.menuTitle === 'Seguro Residencial' && doc.menuDescription.startsWith('Proteção para a sua casa'), 'menu já preenchido')

console.log('\n2. Rascunho não aparece')
expect((await page('/' + SLUG)).status === 404, 'o endereço dá 404 enquanto é rascunho')
expect(!(await menuCards('/')).includes('/' + SLUG), 'não está no menu Seguros')
expect(!(await (await page('/sitemap.xml')).text()).includes(SLUG), 'não está no sitemap')

console.log('\n3. Publicar')
const publish = await api(`/api/pages/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) })
expect(publish.status === 200, 'publicada')
const res = await page('/' + SLUG)
const html = await res.text()
expect(res.status === 200 && html.includes('<h1>Seguro Residencial</h1>'), 'a página abre, com o desenho do modelo e o título novo')
expect(/<title>[^<]*Seguro Residencial[^<]*<\/title>/.test(html) && html.includes(`rel="canonical" href="${BASE}/${SLUG}"`) || html.includes(`/${SLUG}"`), 'título e endereço canônico da página')
const originals = ['/seguro-vida', '/seguro-prestamista', '/seguro-acidentes', '/seguro-funeral', '/seguro-viagem']
for (const where of ['/', '/contato', '/blog', '/' + SLUG, '/blog/open-insurance-entenda-o-que-e-como-funciona-e-suas-vantagens']) {
  const cards = await menuCards(where)
  const own = cards.filter((href) => originals.includes(href) || href === '/' + SLUG)
  expect(JSON.stringify(own) === JSON.stringify([...originals, '/' + SLUG]), `${where}: card novo no menu, depois dos 5 atuais`)
}
const card = (await (await page('/')).text()).match(new RegExp(`<a class="dd-card" href="/${SLUG}".*?</a>`))[0]
expect(card.includes('Seguro Residencial') && card.includes('Proteção para a sua casa') && card.includes('<svg') && card.includes('Saiba mais'), 'o card tem nome, frase, ícone e “Saiba mais”')
expect((await (await page('/sitemap.xml')).text()).includes(`/${SLUG}</loc>`), 'entra no sitemap')

console.log('\n4. Painel')
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
await context.addCookies([{ name: 'payload-token', value: token, url: BASE }])
const admin = await context.newPage()
await admin.goto(BASE + '/admin/collections/pages', { waitUntil: 'networkidle' })
expect(await admin.getByRole('button', { name: '+ Nova página de serviço' }).count() === 1, 'a lista de páginas tem o botão “Nova página de serviço”')
expect(await admin.getByRole('link', { name: 'Criar novo' }).count() === 0 && await admin.locator('a[href="/admin/collections/pages/create"]').count() === 0, 'o “Criar novo” em branco não existe mais')
expect(await admin.locator('.eq-nav__group', { hasText: 'Seguros' }).getByText('Seguro Residencial').count() === 1, 'a página nova aparece no grupo Seguros do menu lateral')
await admin.getByRole('button', { name: '+ Nova página de serviço' }).click()
await admin.getByLabel('Nome da página').fill('Seguro Pet Teste')
expect(await admin.getByLabel('Endereço (slug)').inputValue() === 'seguro-pet-teste', 'o endereço é sugerido a partir do nome')
await admin.screenshot({ path: process.env.SHOT || 'nova-pagina.png' })
await admin.getByLabel('Endereço (slug)').fill('seguro-vida')
await admin.getByRole('button', { name: 'Criar página' }).click()
await admin.waitForTimeout(800)
expect((await admin.locator('.eq-new__error').innerText()).includes('Já existe'), 'endereço já usado é recusado com mensagem')
await admin.getByLabel('Endereço (slug)').fill('admin')
await admin.getByRole('button', { name: 'Criar página' }).click(); await admin.waitForTimeout(800)
expect((await admin.locator('.eq-new__error').innerText()).includes('reservado'), 'endereço reservado é recusado')
await admin.getByLabel('Endereço (slug)').fill('seguro-pet-teste')
await Promise.all([admin.waitForURL(/\/admin\/collections\/pages\/\d+$/, { timeout: 20000 }), admin.getByRole('button', { name: 'Criar página' }).click()])
const petId = Number(admin.url().split('/').pop())
await admin.waitForLoadState('networkidle'); await admin.waitForTimeout(1500)
expect(await admin.getByText('Hero', { exact: false }).count() > 0, 'o editor de seções abre com as seções do modelo')
await admin.locator('[class*=tabs-field__tab-button]', { hasText: 'SEO e publicação' }).click()
expect(await admin.getByLabel('Nome no menu').inputValue() === 'Seguro Pet Teste', 'a seção “Menu Seguros” existe nas páginas criadas e vem preenchida')
await admin.screenshot({ path: process.env.SHOT2 || 'aba-menu.png' })
const original = await (await api('/api/pages?where[slug][equals]=seguro-vida&depth=0')).json()
await admin.goto(BASE + `/admin/collections/pages/${original.docs[0].id}`, { waitUntil: 'networkidle' })
await admin.locator('[class*=tabs-field__tab-button]', { hasText: 'SEO e publicação' }).click()
expect(await admin.getByLabel('Nome no menu').count() === 0, 'as páginas originais não têm a seção “Menu Seguros” (o menu delas é o do cabeçalho)')
await browser.close()

console.log('\n5. Regras do servidor')
expect((await create({ ...base, slug: 'seguro-vida' })).status === 409, 'endereço repetido: 409')
expect((await create({ ...base, slug: 'Sem Acento' })).status === 400, 'endereço inválido: 400')
expect((await create({ ...base, model: 'privacidade' })).status === 400, 'só os modelos de serviço são aceitos')
expect((await create({ ...base, title: 'ab' })).status === 400, 'nome curto demais: 400')
expect((await fetch(BASE + '/api/pages/novo-servico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(base) })).status === 403, 'sem login: 403')
expect((await api(`/api/pages/${original.docs[0].id}`, { method: 'DELETE' })).status === 403, 'página original não pode ser apagada')
expect((await api('/api/pages', { method: 'POST', body: JSON.stringify({ slug: 'em-branco', title: 'x', copy: [], images: [], links: [] }) })).status === 403, 'página em branco não pode ser criada pela API')

console.log('\n6. Apagar tira do site e do menu')
for (const pageId of [id, petId]) expect((await api(`/api/pages/${pageId}`, { method: 'DELETE' })).status === 200, `página ${pageId} apagada`)
expect((await page('/' + SLUG)).status === 404, 'o endereço volta a dar 404')
expect(!(await menuCards('/')).includes('/' + SLUG), 'o card sai do menu')
expect((await menuCards('/')).filter((href) => originals.includes(href)).length === 5, 'os 5 seguros originais continuam no menu')

console.log(problems.length ? `\n${problems.length} problema(s).` : '\nTudo certo.')
process.exit(problems.length ? 1 : 0)
