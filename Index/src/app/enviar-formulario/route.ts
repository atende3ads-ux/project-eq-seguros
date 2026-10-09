import { NextResponse } from 'next/server'
import { getCMS } from '@/lib/content'
import { check, createLimiter, mailHtml, mailText, type Answer } from '@/lib/forms'
import { sendMail } from '@/lib/mail'
import { verifyRecaptcha } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

const allowed = createLimiter(5, 10 * 60 * 1000)
const recent = new Map<string, number>()
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } })
const ok = () => NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })

/** Atrás do Traefik do Coolify, o último endereço de X-Forwarded-For é o que o proxy viu de verdade. */
const clientKey = (request: Request) => (request.headers.get('x-forwarded-for')?.split(',').pop() || request.headers.get('x-real-ip') || 'desconhecido').trim()

/** Só aceita envio vindo do próprio site: um formulário em outro endereço não consegue usar esta rota. */
function sameSite(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const host = new URL(origin).host
    const own = [request.headers.get('host'), process.env.SERVER_URL ? new URL(process.env.SERVER_URL).host : null]
    return own.includes(host)
  } catch { return false }
}

export async function POST(request: Request) {
  if (!sameSite(request)) return fail('Envio não autorizado.', 403)
  if (Number(request.headers.get('content-length') || 0) > 20_000) return fail('Mensagem grande demais.', 413)
  if (!allowed(clientKey(request))) return fail('Muitas tentativas. Aguarde alguns minutos e tente de novo.', 429)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return fail('Formulário inválido. Recarregue a página.', 400) }

  const checked = check(body)
  if (!checked.ok) return checked.silent ? ok() : fail(checked.error, 400)
  if (!(await verifyRecaptcha(body.token)).ok) return fail('Não conseguimos confirmar que você não é um robô. Tente de novo.', 400)

  // Dois envios iguais em sequência (duplo clique, volta e reenvia) viram um só contato.
  const fingerprint = checked.answers.map((item) => item.value).join('|').toLowerCase()
  const now = Date.now()
  for (const [key, time] of recent) if (now - time > 60_000) recent.delete(key)
  if (recent.has(fingerprint)) return ok()
  recent.set(fingerprint, now)

  const payload = await getCMS()
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: true })
  const name = checked.answers.find((item) => /^nome/i.test(item.label))?.value
  const email = checked.answers.find((item) => /e-?mail/i.test(item.label))?.value
  const summary = [name || email || checked.answers[0]?.value, checked.form].filter(Boolean).join(' · ').slice(0, 160)
  const answers: Answer[] = checked.answers
  let message
  try {
    message = await payload.create({ collection: 'messages', overrideAccess: true, data: { summary, form: checked.form, page: checked.page, answers, mailStatus: 'not-configured' } })
  } catch (error) {
    payload.logger.error({ err: error }, 'Formulário: não foi possível guardar o contato.')
    recent.delete(fingerprint)
    return fail('Não conseguimos enviar agora. Tente de novo em instantes ou fale com a gente pelo telefone.', 500)
  }

  const to = settings.formRecipient?.trim()
  if (to) {
    const result = await sendMail({ to, subject: `Contato pelo site: ${summary}`, text: mailText(checked.form, checked.page, answers), html: mailHtml(checked.form, checked.page, answers), replyTo: email })
    if (result.status === 'failed') payload.logger.error(`Formulário: o e-mail para a equipe falhou (${result.error}). O contato ${message.id} está salvo em Mensagens recebidas.`)
    await payload.update({ collection: 'messages', id: message.id, overrideAccess: true, data: { mailStatus: result.status, mailError: result.error } }).catch(() => undefined)
  }
  return ok()
}
