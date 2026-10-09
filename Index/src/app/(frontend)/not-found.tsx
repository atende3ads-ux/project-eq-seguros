import type { Metadata } from 'next'
import prototype from '@/generated/prototype.json'
import { getServiceMenu, getSettings, getSiteContent, templates } from '@/lib/content'
import type { TemplateNode } from '@/lib/types'
import { Template } from '@/components/Template'
import { Interactions } from '@/components/Interactions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Página não encontrada', robots: { index: false, follow: false } }

/** Mesmo logo trocável de SitePage ("Configurações do site"). */
const LOGO_KEY = 'header-i1'

/** Página 404 com o cabeçalho e o rodapé do site, no lugar da tela preta padrão do Next.js. */
export default async function NotFound() {
  const [content, settings, serviceMenu] = await Promise.all([getSiteContent(), getSettings(), getServiceMenu()])
  const template = templates.find((page) => page.slug === 'index')!
  const logo = typeof settings.logo === 'object' && settings.logo?.url ? settings.logo : undefined
  const site = logo ? { ...content, images: content.images?.map((image) => image.key === LOGO_KEY ? { ...image, media: logo } : image) } : content
  return <>
    <Template nodes={template.header} content={site} serviceMenu={serviceMenu}/>
    <section className="phero"><div className="wrap"><div className="rv-init">
      <span className="kicker">Erro 404</span>
      <h1>Página não encontrada</h1>
      <p className="lead">O endereço pode ter mudado ou a página não existe mais. Volte para o início, veja os nossos seguros ou fale com a gente.</p>
    </div></div></section>
    <section className="sec"><div className="wrap rv-init"><div className="btn-row">
      <a className="btn btn-primary" href="/">Ir para a página inicial</a>
      <a className="link-arrow" href="/seguros"><span>Ver os seguros</span></a>
      <a className="link-arrow" href="/contato"><span>Falar com a gente</span></a>
    </div></div></section>
    <Template nodes={prototype.site.footer as TemplateNode[]} content={site}/>
    <Interactions slug="404"/>
  </>
}
