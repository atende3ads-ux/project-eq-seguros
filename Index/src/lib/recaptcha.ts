import 'server-only'

/**
 * reCAPTCHA v3 (invisível). Chaves criadas em https://www.google.com/recaptcha/admin, na conta do cliente:
 * RECAPTCHA_SITE_KEY (pública) e RECAPTCHA_SECRET (privada). Sem as duas, a verificação é pulada e o formulário
 * continua protegido pelo campo escondido, pelo tempo mínimo e pelo limite por origem.
 */
export const recaptchaSiteKey = () => process.env.RECAPTCHA_SITE_KEY || ''
const THRESHOLD = 0.5

export async function verifyRecaptcha(token: unknown): Promise<{ ok: boolean; skipped?: boolean }> {
  const secret = process.env.RECAPTCHA_SECRET
  if (!secret || !recaptchaSiteKey()) return { ok: true, skipped: true }
  if (typeof token !== 'string' || !token || token.length > 4000) return { ok: false }
  try {
    const response = await fetch(process.env.RECAPTCHA_VERIFY_URL || 'https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(8_000),
    })
    const result = await response.json() as { success?: boolean; score?: number; action?: string }
    return { ok: Boolean(result.success && (result.score ?? 0) >= THRESHOLD && result.action === 'formulario') }
  } catch {
    // Google fora do ar: melhor aceitar (os outros filtros seguem valendo) do que perder um contato.
    return { ok: true, skipped: true }
  }
}
