'use client'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { check, fieldError, specFor, type Answer } from '@/lib/forms'

type Field = { label: string; placeholder: string }
type Props = { fields: Field[]; button: string; siteKey: string; className?: string }
type Grecaptcha = { ready: (callback: () => void) => void; execute: (key: string, options: { action: string }) => Promise<string> }
declare global { interface Window { grecaptcha?: Grecaptcha; dataLayer?: unknown[] } }

/** O reCAPTCHA só é carregado quando a pessoa começa a preencher: quem não usa o formulário não chama o Google. */
let recaptcha: Promise<boolean> | undefined
const loadRecaptcha = (siteKey: string) => recaptcha ||= new Promise<boolean>((resolve) => {
  if (!siteKey) return resolve(false)
  const script = document.createElement('script')
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
  script.async = true
  script.onload = () => resolve(true)
  script.onerror = () => resolve(false)
  document.head.appendChild(script)
})

export function ContactForm({ fields, button, siteKey, className }: Props) {
  const id = useId()
  const started = useRef(0)
  const form = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')
  const [invalid, setInvalid] = useState('')
  useEffect(() => { started.current = Date.now() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return
    const data = new FormData(event.currentTarget)
    const answers: Answer[] = fields.map((field) => ({ label: field.label, value: String(data.get(specFor(field.label).name) ?? '').trim() }))
    for (const [index, field] of fields.entries()) {
      const message = fieldError(field.label, answers[index].value)
      if (message) {
        setError(message); setInvalid(specFor(field.label).name)
        form.current?.querySelector<HTMLElement>(`[name="${specFor(field.label).name}"]`)?.focus()
        return
      }
    }
    setError(''); setInvalid(''); setState('sending')
    const body = { form: document.querySelector('h1')?.textContent?.trim() || document.title.split('|')[0].trim(), page: location.pathname, answers, website: String(data.get('website') ?? ''), startedAt: started.current }
    // Mesma validação do servidor, para avisar de erros sem uma ida e volta.
    const checked = check(body, Date.now())
    if (!checked.ok && !checked.silent && !/rápido demais/.test(checked.error)) { setError(checked.error); setState('idle'); return }
    try {
      let token = ''
      if (siteKey && await Promise.race([loadRecaptcha(siteKey), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 6000))]) && window.grecaptcha) {
        token = await new Promise<string>((resolve) => window.grecaptcha!.ready(() => window.grecaptcha!.execute(siteKey, { action: 'formulario' }).then(resolve, () => resolve(''))))
      }
      // Se a pessoa foi mais rápida que o tempo mínimo (preenchimento automático do navegador), espera um instante.
      const wait = 2600 - (Date.now() - started.current)
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      const response = await fetch('/enviar-formulario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, token }), signal: AbortSignal.timeout(20_000) })
      const result = await response.json().catch(() => ({ ok: false, error: '' })) as { ok: boolean; error?: string }
      if (!result.ok) { setError(result.error || 'Não conseguimos enviar agora. Tente de novo em instantes.'); setState('idle'); return }
      // Só depois da confirmação do servidor. Sem nenhum dado pessoal: só o nome do formulário.
      window.dataLayer?.push({ event: 'generate_lead', form_name: body.form })
      location.assign('/formulario-enviado')
    } catch {
      setError('Não conseguimos enviar agora. Confira a conexão e tente de novo, ou fale com a gente pelo telefone.')
      setState('idle')
    }
  }

  return <form ref={form} className={className} noValidate onSubmit={submit} onFocusCapture={() => { void loadRecaptcha(siteKey) }} aria-busy={state === 'sending'}>
    {fields.map((field) => {
      const spec = specFor(field.label)
      const fieldId = `${id}-${spec.name}`
      const common = { id: fieldId, name: spec.name, className: 'input', required: true, 'aria-invalid': invalid === spec.name || undefined, 'aria-describedby': invalid === spec.name ? `${id}-error` : undefined }
      return <div className="field" key={spec.name}>
        <label htmlFor={fieldId}>{field.label}</label>
        {spec.kind === 'textarea' ? <textarea {...common} className="input area" placeholder={field.placeholder} maxLength={3000} rows={4}/>
          : spec.kind === 'select' ? <select {...common} defaultValue=""><option value="" disabled>{field.placeholder}</option>{spec.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          : <input {...common} type={spec.kind === 'email' ? 'email' : spec.kind === 'phone' ? 'tel' : 'text'} placeholder={field.placeholder}
              inputMode={spec.kind === 'phone' || spec.kind === 'document' || spec.kind === 'money' ? 'numeric' : spec.kind === 'email' ? 'email' : undefined}
              autoComplete={spec.name === 'nome' ? 'name' : spec.kind === 'email' ? 'email' : spec.kind === 'phone' ? 'tel' : 'off'} maxLength={spec.kind === 'email' ? 200 : 120}/>}
      </div>
    })}
    <div className="eq-hp" aria-hidden="true"><label>Não preencha este campo<input type="text" name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <p className="eq-form-error" id={`${id}-error`} role="alert">{error}</p>
    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={state === 'sending'}>{state === 'sending' ? 'Enviando…' : button}</button>
    <p className="eq-form-note">Ao enviar, você concorda com o uso dos seus dados para retornarmos o contato. Veja a <a href="/privacidade">Política de Privacidade</a>.{siteKey && <> Este site é protegido pelo reCAPTCHA, e valem a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a> e os <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Termos de Serviço</a> do Google.</>}</p>
  </form>
}
