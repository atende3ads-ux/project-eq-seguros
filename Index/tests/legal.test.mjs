import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const prototype = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))
const page = (slug) => prototype.pages.find((item) => item.slug === slug)
const all = (slug) => page(slug).content.copy.map((item) => item.value).join(' ')

test('should publish the official privacy policy and terms of use', () => {
  for (const slug of ['privacidade', 'termos']) {
    const text = all(slug)
    assert.ok(text.includes('Última atualização: 03 de março de 2023'), `${slug}: sem a data de atualização`)
    assert.ok(text.includes('GRUPO EQUATORIAL'), `${slug}: sem o texto oficial`)
    assert.ok(text.includes('Fernando Costa Doria'), `${slug}: sem o nome do DPO`)
    assert.ok(!/texto-base do protótipo/i.test(text), `${slug}: ainda tem o aviso do texto-base`)
    assert.ok(page(slug).content.links.some((link) => link.href === 'mailto:dpo@grupoequatorial.com.br'), `${slug}: sem o e-mail do DPO como link`)
  }
  assert.ok(all('privacidade').includes('5. Sua anuência e responsabilidade'))
  assert.ok(all('termos').includes('Direitos de Autor e Propriedade Intelectual'))
})
