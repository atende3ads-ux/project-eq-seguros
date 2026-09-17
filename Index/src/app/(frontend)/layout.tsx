import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SERVER_URL || 'http://localhost:3000'),
  robots: process.env.SITE_ENV === 'production' ? { index: true, follow: true } : { index: false, follow: false },
}
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="/assets/style.css"/>
  </head><body>{children}</body></html>
}
