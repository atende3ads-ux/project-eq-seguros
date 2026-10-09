import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { legacyRedirects } from './redirects.mjs'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Serviços de medição liberados: só os endereços que o contêiner do Google Tag Manager da EQ
 * usa (Google Analytics 4, Google Ads, Meta Pixel) mais o Microsoft Clarity. Uma ferramenta
 * nova no Tag Manager que fale com outro endereço será bloqueada até ser liberada aqui.
 */
const google = ['https://www.googletagmanager.com', 'https://*.googletagmanager.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com']
const googleAds = ['https://www.googleadservices.com', 'https://googleads.g.doubleclick.net', 'https://*.g.doubleclick.net', 'https://ad.doubleclick.net', 'https://pagead2.googlesyndication.com', 'https://www.google.com', 'https://www.google.com.br']
const meta = ['https://connect.facebook.net', 'https://www.facebook.com']
/** reCAPTCHA v3 dos formulários: só os caminhos do reCAPTCHA, não o Google inteiro. */
const recaptcha = ['https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/']
const clarity = ['https://www.clarity.ms', 'https://scripts.clarity.ms', 'https://*.clarity.ms', 'https://c.bing.com']

/**
 * Política de conteúdo: o site só carrega recursos dele mesmo, mais as fontes do Google.
 * Bloqueia scripts, imagens e conexões de outros endereços, o site dentro de moldura de
 * terceiros, troca de `<base>` e envio de formulário para fora. `unsafe-inline` é
 * necessário porque o Next.js e o painel do Payload usam scripts e estilos embutidos.
 * Só em produção: o modo de desenvolvimento usa `eval`.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  ['script-src', "'self'", "'unsafe-inline'", ...google, 'https://www.googleadservices.com', meta[0], clarity[0], clarity[1], ...recaptcha].join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  ['img-src', "'self'", 'data:', 'blob:', ...google, ...googleAds, ...meta, ...clarity].join(' '),
  "media-src 'self'",
  ['connect-src', "'self'", ...google, ...googleAds, ...meta, ...clarity].join(' '),
  // O mapa da página de Contato e o trecho do Tag Manager para quem navega sem JavaScript.
  "frame-src 'self' https://maps.google.com https://www.google.com https://www.googletagmanager.com https://td.doubleclick.net",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Um ano; sem includeSubDomains de propósito, para não afetar outros subdomínios do cliente (e-mail, sistemas antigos).
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  ...(isProduction ? [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }] : []),
]

export default withPayload({
  output: 'standalone',
  devIndicators: false,
  // Não anuncia o framework em cada resposta.
  poweredByHeader: false,
  turbopack: { root: path.resolve('.') },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/:page.html', destination: '/:page', permanent: true },
      // Endereços do site antigo (ver redirects.mjs).
      ...legacyRedirects.map(([source, destination]) => ({ source, destination, permanent: true })),
    ]
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // SVG enviado ao painel é entregue sem poder rodar script, mesmo se alguém abrir o arquivo direto.
      { source: '/api/media/file/:file(.+\\.svg)', headers: [
        { key: 'Content-Security-Policy', value: "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ] },
    ]
  },
}, { devBundleServerPackages: false })
