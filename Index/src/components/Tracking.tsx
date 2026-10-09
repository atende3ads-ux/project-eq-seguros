import { CONSENT_VERSION, type Tracking } from '@/lib/tracking'

/**
 * Medição com consentimento: este componente não carrega nenhuma ferramenta. Ele só entrega a
 * configuração e o gerenciador de consentimento (public/assets/consent.js), que mostra o aviso e
 * carrega o Tag Manager, o Google Analytics e o Clarity depois da escolha do visitante.
 * Sem nenhum ID configurado (ou fora de produção), não sai nada: nem aviso, nem script.
 */
export function TrackingHead({ tracking, siteName }: { tracking: Tracking; siteName: string }) {
  if (!tracking.gtm && !tracking.ga4 && !tracking.clarity) return null
  const config = { ...tracking, site: siteName, version: CONSENT_VERSION, policy: '/privacidade' }
  return <>
    <link rel="stylesheet" href={`/assets/consent.css?v=${CONSENT_VERSION}`} />
    <script id="eq-tracking" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(config).replace(/</g, '\\u003c') }} />
    <script src={`/assets/consent.js?v=${CONSENT_VERSION}`} defer />
  </>
}
