import readline from 'node:readline'
import assert from 'node:assert/strict'
import { PNG } from 'pngjs'

const input = readline.createInterface({ input: process.stdin, terminal: false })
const line = await new Promise<string>((resolve) => input.once('line', resolve))
input.close()
const { email, password } = JSON.parse(line)
const base = 'http://localhost:3000'
const login = await fetch(base + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
assert.equal(login.status, 200)
const auth = await login.json()
assert.equal(auth.user.role, 'admin')
const headers = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
const pages = await (await fetch(base + '/api/pages?where[slug][equals]=index&limit=1', { headers })).json()
const original = pages.docs[0]
let mediaID: number | undefined
try {
  const png = new PNG({ width: 4, height: 4 }); png.data.fill(255)
  const form = new FormData()
  form.set('file', new Blob([PNG.sync.write(png)], { type: 'image/png' }), 'verificacao-temporaria.png')
  form.set('_payload', JSON.stringify({ alt: 'Imagem temporária de verificação' }))
  const uploaded = await fetch(base + '/api/media', { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: form })
  assert.equal(uploaded.status, 201, await uploaded.clone().text())
  const media = (await uploaded.json()).doc
  mediaID = media.id
  const images = structuredClone(original.images)
  images[0].media = media.id
  const edited = await fetch(base + `/api/pages/${original.id}`, { method: 'PATCH', headers, body: JSON.stringify({ images }) })
  assert.equal(edited.status, 200)
  const html = await (await fetch(base)).text()
  assert.ok(html.includes(media.filename))
  console.log('PASS: acesso solicitado com função Administrador; upload e substituição de imagem pelo CMS.')
} finally {
  const restore = await fetch(base + `/api/pages/${original.id}`, { method: 'PATCH', headers, body: JSON.stringify({ images: original.images }) })
  assert.equal(restore.status, 200)
  if (mediaID) {
    const removed = await fetch(base + `/api/media/${mediaID}`, { method: 'DELETE', headers })
    assert.equal(removed.status, 200)
  }
}
