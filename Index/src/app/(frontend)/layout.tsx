import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getSettings, uploadURL } from '@/lib/content'
import { DEFAULT_SITE_NAME } from '@/lib/site-title'
import { openGraph, twitter } from '@/lib/share'
import { organizationLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/JsonLd'

/** Padrões do site inteiro; cada página sobrescreve título e descrição. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    metadataBase: new URL(process.env.SERVER_URL || 'http://localhost:3000'),
    robots: process.env.SITE_ENV === 'production'
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
      : { index: false, follow: false },
    title: settings.siteName?.trim() || DEFAULT_SITE_NAME,
    description: settings.defaultDescription || undefined,
    icons: { icon: uploadURL(settings.favicon) || '/assets/eq-simbolo.png' },
    openGraph: openGraph(settings),
    twitter: twitter(settings),
  }
}
export default async function Layout({ children }: { children: ReactNode }) {
  const settings = await getSettings()
  return <html lang="pt-BR"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="/assets/style.css"/>
  </head><body><JsonLd data={organizationLd(settings)}/>{children}</body></html>
}
