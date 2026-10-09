/**
 * Formulários do site: quais campos existem, como cada um é validado e as defesas contra spam.
 * Sem dependências, para o mesmo código validar no navegador e no servidor e o teste rodar direto.
 *
 * Os formulários são desenhados pelo modelo da página (rótulo e texto de exemplo editáveis no painel).
 * O tipo de cada campo vem do rótulo: "E-mail" é e-mail, "Telefone" é telefone, e assim por diante.
 */

export type Kind = 'text' | 'email' | 'phone' | 'document' | 'money' | 'select' | 'textarea'
export type Spec = { kind: Kind; name: string; options?: string[] }

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const SUBJECTS = ['Quero contratar um seguro', 'Dúvida sobre minha apólice ou certificado', 'Parceria comercial', 'Outro assunto']
const INSURANCES = ['Seguro de Vida', 'Seguro Prestamista', 'Seguro de Acidentes Pessoais', 'Seguro Funeral', 'Seguro Viagem', 'Empréstimo Consignado', 'Pecúlio', 'Ainda não sei']

/** Tipo do campo a partir do rótulo que a equipe vê no painel. */
export function specFor(label: string): Spec {
  const key = normalize(label)
  const name = key.replace(/ /g, '-') || 'campo'
  if (/\be mail\b|\bemail\b/.test(key)) return { kind: 'email', name: 'email' }
  if (/telefone|celular|whatsapp/.test(key)) return { kind: 'phone', name: 'telefone' }
  if (/cpf|cnpj|documento/.test(key)) return { kind: 'document', name: name }
  if (/valor/.test(key)) return { kind: 'money', name }
  if (/mensagem|observac|comentario/.test(key)) return { kind: 'textarea', name }
  if (/assunto/.test(key)) return { kind: 'select', name, options: SUBJECTS }
  if (/seguro de interesse|produto de interesse/.test(key)) return { kind: 'select', name, options: INSURANCES }
  if (/susep/.test(key)) return { kind: 'select', name, options: ['Sim', 'Não'] }
  return { kind: 'text', name: key.startsWith('nome') ? 'nome' : name }
}

const digits = (value: string) => value.replace(/\D/g, '')
const LIMITS: Record<Kind, number> = { text: 120, email: 200, phone: 25, document: 25, money: 25, select: 80, textarea: 3000 }

/** Mensagem em português para o campo inválido, ou `undefined` se estiver certo. */
export function fieldError(label: string, raw: unknown): string | undefined {
  const spec = specFor(label)
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return `Preencha o campo “${label}”.`
  if (value.length > LIMITS[spec.kind]) return `O campo “${label}” está muito longo.`
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) return `O campo “${label}” tem caracteres inválidos.`
  switch (spec.kind) {
    case 'email': return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(value) ? undefined : 'Informe um e-mail válido.'
    case 'phone': return digits(value).length >= 10 && digits(value).length <= 13 ? undefined : 'Informe o telefone com DDD.'
    case 'document': return [11, 14].includes(digits(value).length) ? undefined : 'Informe um CPF (11 números) ou CNPJ (14 números).'
    case 'money': return digits(value).length ? undefined : 'Informe o valor desejado.'
    case 'select': return spec.options?.includes(value) ? undefined : `Escolha uma opção em “${label}”.`
    default: return undefined
  }
}

export type Answer = { label: string; value: string }
export type Submission = { form?: unknown; page?: unknown; answers?: unknown; website?: unknown; startedAt?: unknown; token?: unknown }
export type Checked = { ok: true; form: string; page: string; answers: Answer[] } | { ok: false; error: string; silent?: boolean }

/** Tempo mínimo entre abrir a página e enviar: pessoas levam mais de alguns segundos para preencher; robôs não. */
export const MIN_FILL_MS = 2500
const MAX_FILL_MS = 6 * 60 * 60 * 1000

export function check(input: Submission, now = Date.now()): Checked {
  // Campo escondido: só robô preenche. Responde como se tivesse dado certo e não guarda nada.
  if (typeof input.website === 'string' && input.website.trim()) return { ok: false, error: 'spam', silent: true }
  const started = typeof input.startedAt === 'number' ? input.startedAt : NaN
  if (!Number.isFinite(started) || now - started > MAX_FILL_MS || started > now + 5000) return { ok: false, error: 'Recarregue a página e tente de novo.' }
  if (now - started < MIN_FILL_MS) return { ok: false, error: 'Calma, você preencheu rápido demais. Confira os dados e envie de novo.' }
  if (!Array.isArray(input.answers) || input.answers.length < 1 || input.answers.length > 12) return { ok: false, error: 'Formulário inválido. Recarregue a página.' }
  const answers: Answer[] = []
  for (const item of input.answers) {
    const { label, value } = (item ?? {}) as Record<string, unknown>
    if (typeof label !== 'string' || !label.trim() || label.length > 80) return { ok: false, error: 'Formulário inválido. Recarregue a página.' }
    const error = fieldError(label, value)
    if (error) return { ok: false, error }
    answers.push({ label: label.trim(), value: String(value).trim() })
  }
  const form = typeof input.form === 'string' ? input.form.slice(0, 120) : ''
  const page = typeof input.page === 'string' && /^\/[a-z0-9/-]*$/i.test(input.page) ? input.page.slice(0, 120) : '/'
  return { ok: true, form, page, answers }
}

/** Limite por origem, na memória do servidor: a quinta tentativa em 10 minutos é recusada. */
export function createLimiter(max = 5, windowMs = 10 * 60 * 1000) {
  const hits = new Map<string, number[]>()
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs)
    if (recent.length >= max) { hits.set(key, recent); return false }
    recent.push(now); hits.set(key, recent)
    if (hits.size > 5000) for (const [k, list] of hits) if (!list.some((time) => now - time < windowMs)) hits.delete(k)
    return true
  }
}

/** Texto do e-mail para a equipe. */
export function mailText(form: string, page: string, answers: Answer[]) {
  return [`Novo contato pelo site: ${form || 'formulário'}`, `Página: ${page}`, '', ...answers.map((item) => `${item.label}: ${item.value}`)].join('\n')
}
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
export function mailHtml(form: string, page: string, answers: Answer[]) {
  const rows = answers.map((item) => `<tr><td style="padding:6px 14px 6px 0;color:#555;vertical-align:top">${escapeHtml(item.label)}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(item.value)}</td></tr>`).join('')
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222"><p><b>Novo contato pelo site</b><br>${escapeHtml(form || 'Formulário')} · ${escapeHtml(page)}</p><table style="border-collapse:collapse">${rows}</table></div>`
}
