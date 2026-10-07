import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Política de conteúdo: o site só carrega recursos dele mesmo, mais as fontes do Google.
 * Bloqueia scripts, imagens e conexões de outros endereços, o site dentro de moldura de
 * terceiros, troca de `<base>` e envio de formulário para fora. `unsafe-inline` é
 * necessário porque o Next.js e o painel do Payload usam scripts e estilos embutidos.
 * Só em produção: o modo de desenvolvimento usa `eval`.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self'",
  // Só o mapa da página de Contato.
  "frame-src 'self' https://maps.google.com https://www.google.com",
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
