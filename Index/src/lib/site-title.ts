/**
 * O nome do site vem de "Configurações do site" e entra no título de todas as
 * páginas, como no WordPress. Na página inicial ele vem primeiro.
 */
export const DEFAULT_SITE_NAME = 'EQ Seguros'

export function pageTitle(title: string | undefined, siteName: string, slug: string) {
  const name = siteName.trim() || DEFAULT_SITE_NAME
  const own = (title || '').trim()
  if (!own) return name
  return slug === 'index' ? `${name} | ${own}` : `${own} | ${name}`
}

/**
 * Os títulos importados do protótipo já traziam o nome escrito à mão
 * ("Blog | EQ Seguros"). Remove essa parte para o nome não sair duplicado.
 */
export function stripSiteName(title: string, slug: string, siteName = DEFAULT_SITE_NAME) {
  if (slug === 'index' && title.startsWith(`${siteName} | `)) return title.slice(siteName.length + 3).trim()
  // Corta a partir do primeiro trecho que cita o nome ("| EQ Seguros", "| Blog EQ Seguros"…).
  const parts = title.split(' | ')
  const at = parts.findIndex((part, index) => index > 0 && part.includes(siteName))
  return at > 0 ? parts.slice(0, at).join(' | ').trim() : title
}
