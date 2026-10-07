import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'

export default withPayload({
  output: 'standalone',
  devIndicators: false,
  turbopack: { root: path.resolve('.') },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/:page.html', destination: '/:page', permanent: true },
    ]
  },
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ] },
      // SVG enviado ao painel é entregue sem poder rodar script, mesmo se alguém abrir o arquivo direto.
      { source: '/api/media/file/:file(.+\\.svg)', headers: [
        { key: 'Content-Security-Policy', value: "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ] },
    ]
  },
}, { devBundleServerPackages: false })
