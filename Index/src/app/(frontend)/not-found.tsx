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

/**
 * Página 404 com o cabeçalho e o rodapé do site. O desenho vem de public/assets/err404.css
 * (classes .err404-*), que só carrega aqui.
 */
export default async function NotFound() {
  const [content, settings, serviceMenu] = await Promise.all([getSiteContent(), getSettings(), getServiceMenu()])
  const template = templates.find((page) => page.slug === 'index')!
  const logo = typeof settings.logo === 'object' && settings.logo?.url ? settings.logo : undefined
  const site = logo ? { ...content, images: content.images?.map((image) => image.key === LOGO_KEY ? { ...image, media: logo } : image) } : content
  return <>
    <link rel="stylesheet" href="/assets/err404.css" precedence="default"/>
    <Template nodes={template.header} content={site} serviceMenu={serviceMenu}/>
    <section className="phero err404-tela">
      <div className="wrap">
        <div className="err404-bloco">
          <span className="err404-num err404-anim" aria-hidden="true">4<span className="err404-zero">0</span>4</span>
          <h1 className="err404-anim">Página não encontrada</h1>
          <p className="err404-sub err404-anim">O endereço pode ter mudado ou a página não existe mais. Volte para o início e continue navegando.</p>
          <a className="btn btn-primary err404-anim" href="/">Voltar para a página inicial</a>
        </div>
      </div>
    </section>
    <Template nodes={prototype.site.footer as TemplateNode[]} content={site}/>
    <Interactions slug="404"/>
  </>
}
