import readline from 'node:readline'
import crypto from 'node:crypto'
import { chromium } from 'playwright'

/**
 * Confere as permissões do Editor rodando o site em MODO PRODUÇÃO com banco de TESTE (cria e apaga um usuário):
 *   echo '{"email":"…","password":"…"}' | npm run test:roles      (credenciais de um ADMINISTRADOR de teste)
 * O Editor pode trabalhar nas mensagens, no blog, nas páginas, nas imagens e nos cases, e não pode ver nem mudar
 * usuários nem as Configurações do site. A senha do usuário de teste é gerada na hora e não é impressa.
 */
const BASE = (process.env.SITE_URL || 'http://127.0.0.1:3100').replace(/\/$/, '')
const input = readline.createInterface({ input: process.stdin, terminal: false })
const line = await new Promise((resolve) => input.once('line', resolve))
input.close()
const admin = JSON.parse(line)
const problems = []
const expect = (ok, message) => { console.log(`${ok ? '  ok ' : '  ERRO'} ${message}`); if (!ok) problems.push(message) }

const login = async (credentials) => (await (await fetch(BASE + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })).json()).token
const call = (token) => (path, init = {}) => fetch(BASE + path, { ...init, headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } })
const asAdmin = call(await login(admin))

const editor = { email: `editor-teste-${Date.now()}@exemplo.com`, password: crypto.randomBytes(12).toString('hex') + 'Aa1' }
const made = await (await asAdmin('/api/users', { method: 'POST', body: JSON.stringify({ ...editor, name: 'Editor de teste', role: 'editor' }) })).json()
const editorId = made.doc?.id
expect(made.doc?.role === 'editor', 'usuário de teste criado com a permissão Editor')
const asEditor = call(await login(editor))

try {
  console.log('\n1. O Editor NÃO acessa')
  const users = await (await asEditor('/api/users')).json()
  expect(users.docs?.length === 1 && users.docs[0].id === editorId, `lista de usuários mostra só ele mesmo (${users.docs?.length})`)
  const otherAdmin = await asAdmin('/api/users?limit=50&depth=0'); const adminDoc = (await otherAdmin.json()).docs.find((u) => u.role === 'admin')
  expect((await asEditor(`/api/users/${adminDoc.id}`)).status === 404 || (await asEditor(`/api/users/${adminDoc.id}`)).status === 403, 'o perfil do administrador não é lido')
  expect((await asEditor('/api/users', { method: 'POST', body: JSON.stringify({ email: 'x@exemplo.com', password: 'Senha-Segura-123', name: 'x', role: 'admin' }) })).status === 403, 'não cria usuários')
  expect((await asEditor(`/api/users/${adminDoc.id}`, { method: 'PATCH', body: JSON.stringify({ name: 'hack' }) })).status !== 200, 'não altera o administrador')
  expect((await asEditor(`/api/users/${editorId}`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) })).status !== 200 || (await (await asEditor(`/api/users/${editorId}?depth=0`)).json()).role === 'editor', 'não promove a si mesmo a administrador')
  expect((await asEditor('/api/globals/settings', { method: 'POST', body: JSON.stringify({ gtmId: 'GTM-AAAAAAA' }) })).status === 403, 'não altera as Configurações do site')
  expect((await asEditor(`/api/users/${editorId}`, { method: 'DELETE' })).status === 403, 'não apaga usuários')

  console.log('\n2. O Editor acessa')
  expect((await asEditor('/api/messages?limit=1')).status === 200, 'lê as mensagens recebidas')
  expect((await asEditor('/api/posts?limit=1&draft=true')).status === 200, 'lê os posts do blog')
  expect((await asEditor('/api/categories?limit=1')).status === 200, 'lê as categorias')
  expect((await asEditor('/api/pages?limit=1')).status === 200, 'lê as páginas')
  expect((await asEditor('/api/media?limit=1')).status === 200, 'lê a biblioteca de imagens')
  expect((await asEditor('/api/cases?limit=1')).status === 200, 'lê os cases')
  expect((await asEditor('/api/globals/settings')).status === 200, 'o site continua lendo as Configurações (leitura pública)')
  const cat = await (await asEditor('/api/categories', { method: 'POST', body: JSON.stringify({ name: 'Categoria de teste de permissão' }) })).json()
  expect(Boolean(cat.doc?.id), 'cria categoria')
  expect((await asEditor(`/api/categories/${cat.doc.id}`, { method: 'PATCH', body: JSON.stringify({ name: 'Categoria de teste 2' }) })).status === 200, 'edita categoria')
  expect((await asEditor(`/api/categories/${cat.doc.id}`, { method: 'DELETE' })).status === 403, 'apagar fica com o administrador')
  await asAdmin(`/api/categories/${cat.doc.id}`, { method: 'DELETE' })
  // Post: cria um rascunho e apaga.
  const cat2 = await (await asAdmin('/api/categories', { method: 'POST', body: JSON.stringify({ name: 'Categoria do post de teste' }) })).json()
  const lexical = { root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: null, textFormat: 0, textStyle: '', children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: 'Texto de teste.' }] }] } }
  const post = await (await asEditor('/api/posts?draft=true', { method: 'POST', body: JSON.stringify({ title: 'Post de teste de permissão', content: lexical, category: cat2.doc.id, authorName: 'Teste', _status: 'draft' }) })).json()
  expect(Boolean(post.doc?.id), 'cria post (rascunho)')
  expect((await asEditor(`/api/posts/${post.doc.id}`, { method: 'DELETE' })).status === 200, 'APAGA post do blog')
  await asAdmin(`/api/categories/${cat2.doc.id}`, { method: 'DELETE' })
  // Imagem: envia um PNG de 1 pixel e apaga.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAXk3OOQAAAABJRU5ErkJggg==', 'base64')
  const form = new FormData(); form.append('_payload', JSON.stringify({ alt: 'Imagem de teste' })); form.append('file', new Blob([png], { type: 'image/png' }), 'teste-permissao.png')
  const tokenEditor = await login(editor)
  const media = await (await fetch(BASE + '/api/media', { method: 'POST', headers: { Authorization: `JWT ${tokenEditor}` }, body: form })).json()
  expect(Boolean(media.doc?.id), 'envia imagem para a biblioteca')
  expect((await asEditor(`/api/media/${media.doc.id}`, { method: 'DELETE' })).status === 200, 'APAGA imagem da biblioteca')
  // Mensagem: o formulário cria uma; o Editor não consegue apagar.
  const sent = await fetch(BASE + '/enviar-formulario', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE, 'x-forwarded-for': '10.3.3.3' }, body: JSON.stringify({ form: 'Teste de permissão', page: '/contato', startedAt: Date.now() - 30000, answers: [{ label: 'Nome', value: 'Teste de permissão ' + Date.now() }] }) })
  const message = (await (await asAdmin('/api/messages?limit=1&sort=-createdAt&depth=0')).json()).docs[0]
  expect(sent.status === 200 && Boolean(message), 'mensagem de teste criada pelo formulário')
  expect((await asEditor(`/api/messages/${message.id}`, { method: 'DELETE' })).status === 403, 'NÃO apaga mensagens recebidas')
  expect((await asAdmin(`/api/messages/${message.id}`, { method: 'DELETE' })).status === 200, '(o Administrador apaga a mensagem de teste)')
  const page = (await (await asEditor('/api/pages?where[slug][equals]=seguro-vida&depth=0')).json()).docs[0]
  const same = await asEditor(`/api/pages/${page.id}`, { method: 'PATCH', body: JSON.stringify({ focusKeyphrase: page.focusKeyphrase || 'seguro de vida' }) })
  expect(same.status === 200, 'edita páginas do site')
  expect((await asEditor('/api/pages/novo-servico', { method: 'POST', body: JSON.stringify({ model: 'seguro-vida', title: 'Teste', slug: 'teste-perm' }) })).status === 403, 'não cria páginas de serviço (só administrador)')
  const msgs = (await (await asEditor('/api/messages?limit=1&depth=0')).json()).docs[0]
  if (msgs) expect((await asEditor(`/api/messages/${msgs.id}`, { method: 'PATCH', body: JSON.stringify({ handled: msgs.handled }) })).status === 200, 'marca mensagens como atendidas')
  expect((await asEditor('/api/globals/site')).status === 200, 'lê o Cabeçalho e rodapé')

  console.log('\n3. Painel (o que o Editor vê)')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const token = await login(editor)
  await context.addCookies([{ name: 'payload-token', value: token, url: BASE }])
  const view = await context.newPage()
  await view.goto(BASE + '/admin', { waitUntil: 'networkidle' }); await view.waitForTimeout(1200)
  const nav = await view.locator('nav a, aside a').allInnerTexts()
  const text = nav.join(' | ')
  for (const wanted of ['Mensagens recebidas', 'Posts', 'Categorias', 'Páginas do site', 'Biblioteca de imagens', 'Cases de sucesso']) expect(text.includes(wanted), `menu mostra “${wanted}”`)
  expect(!/Usuários/.test(text), 'menu NÃO mostra “Usuários”')
  expect(!/Configurações do site/.test(text), 'menu NÃO mostra “Configurações do site”')
  expect(/Cabeçalho e rodapé/.test(text), 'menu mostra “Cabeçalho e rodapé”')
  await view.goto(BASE + '/admin/collections/users', { waitUntil: 'networkidle' }); await view.waitForTimeout(800)
  expect(!(await view.locator('table').count()), 'a página /admin/collections/users não lista usuários')
  await view.goto(BASE + '/admin/account', { waitUntil: 'networkidle' }); await view.waitForTimeout(800)
  expect((await view.locator('input[type=email], #field-email').count()) > 0, 'o Editor consegue abrir a própria Conta (nome e senha)')
  await browser.close()
} finally {
  if (editorId) expect((await asAdmin(`/api/users/${editorId}`, { method: 'DELETE' })).status === 200, 'usuário de teste apagado')
}
console.log(problems.length ? `\n${problems.length} problema(s).` : '\nTudo certo.')
process.exit(problems.length ? 1 : 0)
