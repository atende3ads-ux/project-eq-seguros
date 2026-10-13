import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { legacyRedirects, canonicalOrigin, otherHosts } from '../redirects.mjs'

const root = path.resolve(import.meta.dirname, '..')
const prototype = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))
const legacyPosts = JSON.parse(fs.readFileSync(path.join(root, 'src/cms/legacy-posts.json'), 'utf8'))
const slugs = new Set(prototype.pages.map((page) => page.slug))

/** Todos os endereços do mapa do site antigo (eqseguros.com.br/sitemap.xml e links do menu), em 08/10/2026. */
const OLD_SITE = [
  '/', '/404', '/api', '/area-do-corretor', '/aviso-de-sinistro', '/blog', '/blog-categorias/api', '/blog-categorias/dicas-de-vendas',
  '/blog-categorias/insurtech', '/cases-de-sucesso', '/duvidas', '/duvidas/api', '/duvidas/gerais', '/duvidas/insurtech',
  '/duvidas/seguros-e-coberturas', '/fale-conosco', '/integre-sua-api', '/nossas-solucoes', '/ouvidoria', '/politica-de-privacidade',
  '/quem-somos', '/seguros', '/seguros/eq-prestamista', '/seguros/microsseguros-de-pessoas', '/seguros/seguro-eq-ap-saude',
  '/seguros/seguro-eq-app-passageiros', '/seguros/seguro-eq-pet-lar', '/seguros/seguro-eq-pme', '/seguros/seguro-eq-senior',
  '/seguros/seguros-eq-business', '/seja-um-parceiro', '/termos-de-uso',
  '/portal-do-cliente', '/politica-de-sustentabilidade', '/area-do-corretor',
  ...['POEQASG__Politica_Sustentabilidade', 'Demonstracoes_Contabeis', 'Estatuto_Social', 'POEQCODEC__Codigo_de_Etica_e_Conduta__EPC_EQ__V006__Assinado_1742481645144856', 'POEQPLD__Politica_de_Prevencao_a_Lavagem_de_Dinheiro__Assinada_1742481639175711'].map((name) => `/uploads/${name}.pdf`),
  ...legacyPosts.map((post) => `/blog/${post.slug}`),
]

/** Mesma regra do Next: `:nome` casa um trecho do endereço, sem barra. */
const matches = (pattern, url) => new RegExp(`^${pattern.replace(/:[a-z]+/g, '[^/]+')}$`).test(url)
const isFile = (url) => url.startsWith('/documentos/') && fs.existsSync(path.join(root, 'public', url))
const exists = (url) => isFile(url) || url === '/' || slugs.has(url.slice(1)) || url === '/blog' || legacyPosts.some((post) => url === `/blog/${post.slug}`)

test('should send every redirect to a page that exists', () => {
  for (const [, destination] of legacyRedirects) assert.ok(exists(destination), `destino inexistente: ${destination}`)
})

test('should not send visitors to pages that are offline while cases are hidden', () => {
  for (const [, destination] of legacyRedirects) assert.ok(!['/cases', '/case'].includes(destination), `destino fora do ar: ${destination}`)
})

test('should not redirect an address that the new site already answers', () => {
  // Redirecionar uma página que existe a esconderia.
  for (const [source] of legacyRedirects) assert.ok(!exists(source) || source === '/404', `origem já existe no site novo: ${source}`)
})

test('should leave no address of the old site without an answer', () => {
  const lost = OLD_SITE.filter((url) => !exists(url) && !legacyRedirects.some(([source]) => matches(source, url)))
  assert.deepEqual(lost, [])
})

test('should never redirect to itself or chain through another redirect', () => {
  for (const [source, destination] of legacyRedirects) {
    assert.notEqual(source, destination)
    assert.ok(!legacyRedirects.some(([other]) => matches(other, destination)), `${source} → ${destination} cai em outro redirecionamento`)
  }
})

test('should send the other domains to the official address, never to themselves', () => {
  const official = new URL(canonicalOrigin)
  assert.equal(official.protocol, 'https:'); assert.equal(official.pathname, '/')
  assert.ok(otherHosts.includes('eqgrupo.com.br') && otherHosts.includes('www.eqgrupo.com.br') && otherHosts.includes('www.eqseguros.com.br'))
  assert.ok(!otherHosts.includes(official.host), 'o domínio oficial não pode redirecionar para si mesmo')
  assert.equal(new Set(otherHosts).size, otherHosts.length)
})

test('should keep the compliance PDFs in the site and link every one on the Compliance page', () => {
  const compliance = prototype.pages.find((page) => page.slug === 'compliance')
  const hrefs = compliance.content.links.map((link) => link.href).filter((href) => href.startsWith('/documentos/'))
  assert.equal(hrefs.length, 5)
  for (const href of hrefs) {
    const file = path.join(root, 'public', href)
    assert.ok(fs.existsSync(file), `PDF ausente: ${href}`)
    assert.equal(fs.readFileSync(file).subarray(0, 5).toString(), '%PDF-', `não é PDF: ${href}`)
  }
  for (const [, destination] of legacyRedirects.filter(([source]) => source.startsWith('/uploads/'))) assert.ok(hrefs.includes(destination), `redirecionamento sem cartão: ${destination}`)
})
test('should give the three social networks of the footer a real address', () => {
  const footer = prototype.site.content.links
  for (const [key, host] of [['footer-l1', 'instagram.com/eq.seguros'], ['footer-l2', 'facebook.com/eqseguros'], ['footer-l3', 'youtube.com/@grupoequatorial3548']]) assert.ok(footer.find((link) => link.key === key).href.includes(host), key)
})
