import readline from 'node:readline'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Credentials arrive over stdin. They are never written to project files or logs.
const input = readline.createInterface({ input: process.stdin, terminal: false })
const line = await new Promise<string>((resolve) => input.once('line', resolve))
input.close()
const { email, password, name = '3ADS' } = JSON.parse(line) as { email: string; password: string; name?: string }
if (!email || !password || password.length < 8) throw new Error('Informe e-mail e senha de pelo menos 8 caracteres.')
const payload = await getPayload({ config })
const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, overrideAccess: true, limit: 1 })
if (found.docs[0]) {
  await payload.update({ collection: 'users', id: found.docs[0].id, data: { password }, overrideAccess: true })
} else {
  const total = await payload.count({ collection: 'users', overrideAccess: true })
  if (total.totalDocs > 0) throw new Error('Há outros usuários. Crie novos acessos pelo administrador existente.')
  await payload.create({ collection: 'users', data: { name, email, password, role: 'admin' }, overrideAccess: true })
}
console.log('Acesso local configurado. Credenciais não gravadas no código.')
await payload.destroy()
process.exit(0)
