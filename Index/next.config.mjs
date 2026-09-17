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
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }]
  },
}, { devBundleServerPackages: false })
