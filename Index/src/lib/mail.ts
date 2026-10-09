import 'server-only'

/**
 * E-mail de aviso à equipe. Usa a API do Resend (https://resend.com): uma chave, sem servidor de e-mail
 * para manter, sem senha de caixa postal que expira. O contato já foi guardado no painel antes de chegar aqui,
 * então uma falha de e-mail nunca perde um contato: aparece como "Falhou" em Mensagens recebidas.
 *
 * Variáveis de ambiente: RESEND_API_KEY (chave) e MAIL_FROM (ex.: "EQ Seguros <site@eqseguros.com.br>",
 * em um domínio verificado no Resend). MAIL_API_URL existe só para teste.
 */
export type MailResult = { status: 'sent' | 'failed' | 'not-configured'; error?: string }

export async function sendMail(mail: { to: string; subject: string; text: string; html: string; replyTo?: string }): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM
  if (!key || !from) return { status: 'not-configured' }
  try {
    const response = await fetch(process.env.MAIL_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    })
    if (response.ok) return { status: 'sent' }
    return { status: 'failed', error: `${response.status} ${(await response.text()).slice(0, 300)}` }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message.slice(0, 300) : 'erro desconhecido' }
  }
}
