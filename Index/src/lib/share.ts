import type { Metadata } from 'next'
import { uploadURL, type Settings, type Upload } from './content'
import { DEFAULT_SITE_NAME } from './site-title'

/**
 * O Next substitui o `openGraph` do layout pelo da página em vez de mesclar,
 * então nome do site e imagem de compartilhamento entram aqui em todas.
 */
/** Imagem de reserva: o símbolo da EQ, quadrado, para o link nunca aparecer sem imagem. */
export const FALLBACK_IMAGE = '/assets/eq-simbolo.png'

export function openGraph(settings: Settings, page: { title?: string; description?: string; url?: string; image?: Upload } = {}): Metadata['openGraph'] {
  // A imagem de destaque da página vem antes da imagem padrão do site.
  const { image: featured, ...rest } = page
  const image = uploadURL(featured) || uploadURL(settings.shareImage)
  return {
    siteName: settings.siteName?.trim() || DEFAULT_SITE_NAME, locale: 'pt_BR', type: 'website',
    ...rest, images: [image || FALLBACK_IMAGE],
  }
}

/** Cartão do X/Twitter: grande com imagem de verdade, pequeno (quadrado) com a imagem de reserva. */
export function twitter(settings: Settings, page: { title?: string; description?: string; image?: Upload } = {}): Metadata['twitter'] {
  const image = uploadURL(page.image) || uploadURL(settings.shareImage)
  return { card: image ? 'summary_large_image' : 'summary', title: page.title, description: page.description, images: [image || FALLBACK_IMAGE] }
}
