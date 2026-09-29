import type { Metadata } from 'next'
import { uploadURL, type Settings } from './content'
import { DEFAULT_SITE_NAME } from './site-title'

/**
 * O Next substitui o `openGraph` do layout pelo da página em vez de mesclar,
 * então nome do site e imagem de compartilhamento entram aqui em todas.
 */
export function openGraph(settings: Settings, page: { title?: string; description?: string; url?: string } = {}): Metadata['openGraph'] {
  const image = uploadURL(settings.shareImage)
  return {
    siteName: settings.siteName?.trim() || DEFAULT_SITE_NAME, locale: 'pt_BR', type: 'website',
    ...page, ...(image ? { images: [image] } : {}),
  }
}
