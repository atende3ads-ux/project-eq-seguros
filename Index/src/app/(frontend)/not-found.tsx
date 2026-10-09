import type { Metadata } from 'next'
import prototype from '@/generated/prototype.json'
import { getServiceMenu, getSettings, getSiteContent, templates } from '@/lib/content'
import type { TemplateNode } from '@/lib/types'
import { MENU_ICONS } from '@/lib/menu-icons'
import { Template } from '@/components/Template'
import { Interactions } from '@/components/Interactions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Página não encontrada', robots: { index: false, follow: false } }

/** Mesmo logo trocável de SitePage ("Configurações do site"). */
const LOGO_KEY = 'header-i1'

/** Atalhos da página 404: levam às páginas mais procuradas. */
const SHORTCUTS = [
  { name: 'Seguro de Vida', href: '/seguro-vida', icon: MENU_ICONS.heart.svg },
  { name: 'Empréstimo Consignado', href: '/consignado', icon: MENU_ICONS.doc.svg },
  { name: 'Atendimento', href: '/atendimento', icon: MENU_ICONS.chat.svg },
  { name: 'Blog', href: '/blog', icon: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/>' },
]

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
        <div className="err404-grid">
          <div className="err404-arte rv-init" aria-hidden="true">
            <span className="err404-num">4<span className="err404-zero">0</span>4</span>
            <svg className="err404-onda" viewBox="0 0 400 100" preserveAspectRatio="none" focusable="false">
              <path className="err404-onda-fundo" d="M0 42 C70 8 140 76 220 46 S340 8 400 34 L400 100 L0 100 Z"/>
              <path className="err404-onda-linha" d="M0 42 C70 8 140 76 220 46 S340 8 400 34"/>
            </svg>
          </div>
          <div className="err404-texto rv-init">
            <span className="kicker">Erro 404</span>
            <h1>Página <span className="accent">não encontrada</span></h1>
            <p className="lead">O endereço pode ter mudado ou a página não existe mais. Volte para o início, veja os nossos seguros ou fale com a gente.</p>
            <div className="btn-row err404-acoes">
              <a className="btn btn-primary" href="/">Ir para a página inicial</a>
              <a className="link-arrow" href="/seguros"><span>Ver os seguros</span><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></a>
              <a className="link-arrow" href="/contato"><span>Falar com a gente</span><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></a>
            </div>
            <p className="err404-contato">Precisa de ajuda agora? Ligue para <a href="tel:+556235726000">(62) 3572-6000</a> ou escreva para <a href="mailto:atendimento@eqseguros.com.br">atendimento@eqseguros.com.br</a>.</p>
          </div>
        </div>
        <nav className="err404-atalhos rv-init" aria-labelledby="err404-atalhos-titulo">
          <h2 className="err404-atalhos-titulo" id="err404-atalhos-titulo">Procurando por algo específico?</h2>
          <ul className="err404-lista">
            {SHORTCUTS.map((item) => <li key={item.href}>
              <a className="err404-atalho" href={item.href}>
                <span className="err404-ico" aria-hidden="true"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: item.icon }}/></span>
                <span className="err404-atalho-nome">{item.name}</span>
                <svg className="err404-seta" viewBox="0 0 24 24" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </a>
            </li>)}
          </ul>
        </nav>
      </div>
    </section>
    <Template nodes={prototype.site.footer as TemplateNode[]} content={site}/>
    <Interactions slug="404"/>
  </>
}
