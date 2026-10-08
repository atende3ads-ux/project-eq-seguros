import type { Settings } from './content'

/**
 * Códigos de rastreamento que o painel permite configurar. Só entram no site em
 * produção: o endereço provisório e as prévias não podem sujar os números do Analytics.
 * Cada ID passa por um formato fixo antes de ir para o HTML, então nada digitado no
 * painel vira código do site.
 */
const FORMAT = {
  gtm: /^GTM-[A-Z0-9]{4,12}$/,
  ga4: /^G-[A-Z0-9]{6,12}$/,
  clarity: /^[a-z0-9]{6,16}$/,
} as const

const valid = (value: string | null | undefined, kind: keyof typeof FORMAT) => {
  const id = value?.trim()
  return id && FORMAT[kind].test(id) ? id : undefined
}

export type Tracking = { gtm?: string; ga4?: string; clarity?: string }

export function trackingFor(settings: Settings, production = process.env.SITE_ENV === 'production'): Tracking {
  if (!production) return {}
  return { gtm: valid(settings.gtmId, 'gtm'), ga4: valid(settings.ga4Id, 'ga4'), clarity: valid(settings.clarityId, 'clarity') }
}
