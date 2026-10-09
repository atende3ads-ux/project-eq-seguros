/*
 * Consentimento de cookies e medição.
 *
 * Nada opcional carrega antes da escolha. Modo básico: sem consentimento não há script do Google nem do
 * Clarity, nem cookie opcional, nem requisição para esses serviços. O Consent Mode v2 começa tudo como
 * "denied" e só muda depois do clique. Quem rejeita continua usando o site normalmente.
 *
 * A configuração (IDs, versão do aviso) vem do servidor em <script id="eq-tracking" type="application/json">,
 * a partir de Configurações do site → Rastreamento. Sem nenhum ID configurado, o aviso nem aparece.
 *
 * Decisão de projeto: o Tag Manager da EQ tem tags de marketing (Meta Pixel e Google Ads) e o Google
 * Analytics 4, e o Meta Pixel não obedece ao Consent Mode sozinho. Por isso o Tag Manager só carrega com a
 * categoria Marketing aceita. Com só Analytics, entram o Google Analytics (ID direto) e o Clarity.
 */
(function () {
  'use strict'
  var node = document.getElementById('eq-tracking')
  if (!node) return
  var cfg
  try { cfg = JSON.parse(node.textContent || '{}') } catch (e) { return }
  if (!cfg.gtm && !cfg.ga4 && !cfg.clarity) return

  var KEY = 'eq-consent'
  var OPEN_HASH = '#configuracoes-de-privacidade'
  var loaded = {}
  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }

  // Antes de qualquer tag: tudo negado.
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 })

  /* ---------- Armazenamento da escolha ---------- */
  function read() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null')
      return saved && saved.v === cfg.version ? saved : null
    } catch (e) { return null }
  }
  function write(analytics, marketing) {
    var state = { v: cfg.version, t: new Date().toISOString(), a: analytics, m: marketing, mode: 'basic' }
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* navegação privada: vale só nesta visita */ }
    return state
  }

  /* ---------- Cookies opcionais conhecidos (para apagar na revogação) ---------- */
  var OPTIONAL_COOKIE = /^(_ga|_gid|_gat|_gcl_|_gac_|_gac|_fbp|_fbc|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM|_uetsid|_uetvid|IDE|test_cookie|NID)/
  function clearOptionalCookies() {
    var host = location.hostname.split('.')
    var domains = ['']
    for (var i = 0; i < host.length - 1; i++) domains.push('; domain=' + host.slice(i).join('.'), '; domain=.' + host.slice(i).join('.'))
    document.cookie.split(';').forEach(function (pair) {
      var name = pair.split('=')[0].trim()
      if (!OPTIONAL_COOKIE.test(name)) return
      domains.forEach(function (domain) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domain + '; SameSite=Lax' })
    })
  }

  /* ---------- Carregamento das ferramentas, só depois do consentimento ---------- */
  function script(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); return s }
  function load(state) {
    if (state.m && cfg.gtm && !loaded.gtm) {
      loaded.gtm = true
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
      script('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(cfg.gtm))
    }
    if (state.a && cfg.ga4 && !loaded.ga4) {
      loaded.ga4 = true
      script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4))
      gtag('js', new Date())
      gtag('config', cfg.ga4)
    }
    if (state.a && cfg.clarity && !loaded.clarity) {
      loaded.clarity = true
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments) }
      script('https://www.clarity.ms/tag/' + encodeURIComponent(cfg.clarity))
      window.clarity('consentv2', { ad_Storage: state.m ? 'granted' : 'denied', analytics_Storage: 'granted' })
    }
  }

  function apply(state, previous) {
    var granted = function (value) { return value ? 'granted' : 'denied' }
    gtag('consent', 'update', {
      analytics_storage: granted(state.a), ad_storage: granted(state.m),
      ad_user_data: granted(state.m), ad_personalization: granted(state.m),
    })
    // Sem dados pessoais: só quais categorias estão ligadas.
    window.dataLayer.push({ event: 'eq_consent_update', eq_consent_analytics: state.a, eq_consent_marketing: state.m })
    var lost = previous && ((previous.a && !state.a) || (previous.m && !state.m))
    if (lost) {
      // Scripts já carregados não se descarregam: apaga os cookies e recarrega a página sem eles.
      clearOptionalCookies()
      location.reload()
      return
    }
    load(state)
  }

  /* ---------- Interface ---------- */
  var INVENTORY = [
    { category: 'necessary', provider: 'Este site', name: 'eq-consent', domain: 'Armazenamento local do navegador', purpose: 'Guarda a sua escolha de privacidade.', duration: 'Até você mudar' },
    { category: 'necessary', provider: 'Google reCAPTCHA', name: '_GRECAPTCHA', domain: 'google.com', purpose: 'Protege os formulários contra robôs. Só é criado quando você começa a preencher um formulário.', duration: '6 meses' },
    { category: 'analytics', provider: 'Google Analytics', name: '_ga', domain: 'Site', purpose: 'Distingue visitantes para contar visitas.', duration: '13 meses' },
    { category: 'analytics', provider: 'Google Analytics', name: '_ga_<ID>', domain: 'Site', purpose: 'Mantém a sessão de navegação (uma para cada propriedade do Analytics).', duration: '13 meses' },
    { category: 'analytics', provider: 'Google Analytics', name: '_gid, _gat_*', domain: 'Site', purpose: 'Distingue visitantes e limita a frequência das medições.', duration: '1 dia e 1 minuto' },
    { category: 'analytics', provider: 'Microsoft Clarity', name: '_clck', domain: 'Site', purpose: 'Identifica o visitante nas gravações anônimas e mapas de calor.', duration: '1 ano' },
    { category: 'analytics', provider: 'Microsoft Clarity', name: '_clsk', domain: 'Site', purpose: 'Agrupa as páginas vistas em uma mesma visita.', duration: '1 dia' },
    { category: 'analytics', provider: 'Microsoft Clarity', name: 'CLID, MUID, SM, MR, ANONCHK, SRM_B', domain: 'clarity.ms e bing.com', purpose: 'Identificação do visitante e sincronização da Microsoft.', duration: 'De sessão a 13 meses' },
    { category: 'marketing', provider: 'Meta (Facebook)', name: '_fbp, _fbc', domain: 'Site', purpose: 'Mede anúncios no Facebook e Instagram e permite mostrar anúncios a quem visitou o site.', duration: '3 meses' },
    { category: 'marketing', provider: 'Google Ads', name: '_gcl_au, _gcl_aw', domain: 'Site', purpose: 'Mede o resultado de anúncios do Google. Só é criado se você chegar por um anúncio.', duration: '3 meses' },
  ]
  var CATEGORIES = [
    { id: 'necessary', title: 'Necessários', always: true,
      text: 'Fazem o site funcionar e guardam a sua escolha de privacidade. Não identificam você e não podem ser desligados.' },
    { id: 'analytics', title: 'Análise de uso', key: 'a',
      text: 'Mostram como o site é usado (páginas visitadas, tempo de leitura, gravações anônimas de navegação) para corrigirmos problemas e melhorarmos o conteúdo.' },
    { id: 'marketing', title: 'Marketing', key: 'm',
      text: 'Permitem medir o resultado de anúncios e mostrar anúncios da EQ Seguros a quem já visitou o site, no Google e no Facebook.' },
  ]

  function el(tag, attrs, children) {
    var node = document.createElement(tag)
    Object.keys(attrs || {}).forEach(function (name) {
      if (name === 'text') node.textContent = attrs[name]
      else node.setAttribute(name, attrs[name])
    })
    ;(children || []).forEach(function (child) { node.appendChild(child) })
    return node
  }
  function button(label, kind, onclick) {
    var b = el('button', { type: 'button', class: 'eqc-btn' + (kind === 'line' ? ' eqc-btn--line' : ''), text: label })
    b.addEventListener('click', onclick)
    return b
  }

  var banner, modal, opener

  function decide(analytics, marketing) {
    var previous = read()
    var state = write(analytics, marketing)
    closeModal(true)
    if (banner) { banner.remove(); banner = null }
    apply(state, previous)
  }

  function showBanner() {
    if (banner) return
    banner = el('div', { class: 'eqc', role: 'region', 'aria-label': 'Aviso de cookies', id: 'eq-consent-banner' }, [
      el('div', { class: 'eqc__in' }, [
        el('div', {}, [
          el('p', { class: 'eqc__title', text: 'Sua privacidade' }),
          (function () {
            var p = el('p', { class: 'eqc__text' })
            p.appendChild(document.createTextNode((cfg.site || 'Este site') + ' usa cookies necessários para funcionar e, só com a sua autorização, cookies de análise e de marketing. Você pode aceitar todos, rejeitar os opcionais ou escolher. Saiba mais na '))
            p.appendChild(el('a', { href: cfg.policy || '/privacidade', text: 'Política de Privacidade' }))
            p.appendChild(document.createTextNode('.'))
            return p
          })(),
        ]),
        el('div', { class: 'eqc__actions' }, [
          button('Aceitar todos', 'solid', function () { decide(true, true) }),
          button('Rejeitar opcionais', 'solid', function () { decide(false, false) }),
          button('Personalizar', 'line', function () { openModal() }),
        ]),
      ]),
    ])
    document.body.appendChild(banner)
  }

  var trapHandler
  function openModal() {
    if (modal) return
    opener = document.activeElement
    var current = read() || { a: false, m: false }
    var inputs = {}
    var body = el('div', { class: 'eqc-modal__body' }, [
      el('p', { text: 'Escolha quais cookies opcionais você autoriza. Você pode mudar de ideia quando quiser, pelo link “Configurações de privacidade” no rodapé do site.' }),
    ])
    CATEGORIES.forEach(function (category) {
      var top = el('div', { class: 'eqc-cat__top' }, [el('h3', { text: category.title })])
      if (category.always) top.appendChild(el('span', { class: 'eqc-always', text: 'Sempre ativos' }))
      else {
        var input = el('input', { type: 'checkbox', id: 'eqc-' + category.id, 'aria-label': category.title })
        input.checked = Boolean(current[category.key])
        inputs[category.key] = input
        top.appendChild(el('label', { class: 'eqc-switch' }, [input, el('span')]))
      }
      var box = el('section', { class: 'eqc-cat' }, [top, el('p', { text: category.text })])
      var items = INVENTORY.filter(function (item) { return item.category === category.id })
      if (items.length) {
        var rows = items.map(function (item) {
          return el('tr', {}, [item.provider, item.name, item.domain, item.purpose, item.duration].map(function (value, i) {
            return el(i === 1 ? 'th' : 'td', { text: value, scope: i === 1 ? 'row' : '' })
          }))
        })
        var head = el('tr', {}, ['Quem', 'Nome', 'Onde', 'Para quê', 'Duração'].map(function (title) { return el('th', { text: title, scope: 'col' }) }))
        box.appendChild(el('details', {}, [el('summary', { text: 'Ver detalhes' }), el('table', { class: 'eqc-table' }, [el('thead', {}, [head]), el('tbody', {}, rows)])]))
      }
      body.appendChild(box)
    })
    var close = el('button', { type: 'button', class: 'eqc-modal__close', 'aria-label': 'Fechar sem alterar' , text: '×' })
    close.addEventListener('click', function () { closeModal() })
    var foot = el('div', { class: 'eqc-modal__foot' }, [
      button('Salvar preferências', 'solid', function () { decide(inputs.a.checked, inputs.m.checked) }),
      button('Rejeitar opcionais', 'solid', function () { decide(false, false) }),
      button('Aceitar todos', 'solid', function () { decide(true, true) }),
    ])
    var box = el('div', { class: 'eqc-modal__box', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'eqc-title', tabindex: '-1' }, [
      el('div', { class: 'eqc-modal__head' }, [el('h2', { id: 'eqc-title', text: 'Preferências de privacidade' }), close]),
      body, foot,
    ])
    var link = el('p', {}, [el('a', { href: cfg.policy || '/privacidade', text: 'Ler a Política de Privacidade' })])
    link.style.margin = '0 0 12px'
    body.appendChild(link)
    modal = el('div', { class: 'eqc-modal' }, [box])
    modal.addEventListener('mousedown', function (event) { if (event.target === modal) closeModal() })
    document.body.appendChild(modal)
    document.documentElement.style.overflow = 'hidden'
    box.focus()
    trapHandler = function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closeModal(); return }
      if (event.key !== 'Tab') return
      var focusable = Array.prototype.slice.call(box.querySelectorAll('button, a[href], input, summary'))
        .filter(function (item) { return !item.disabled && item.offsetParent !== null })
      if (!focusable.length) return
      var first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === box)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trapHandler)
  }
  function closeModal(decided) {
    if (!modal) return
    document.removeEventListener('keydown', trapHandler)
    modal.remove(); modal = null
    document.documentElement.style.overflow = ''
    // Depois de escolher, o foco volta para o início da página; ao só fechar, volta para onde estava.
    if (!decided && opener && document.contains(opener)) opener.focus()
  }

  /* ---------- Início ---------- */
  function start() {
    var saved = read()
    if (saved) apply(saved, null)
    else showBanner()
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href$="' + OPEN_HASH + '"]')
      if (!link) return
      event.preventDefault()
      openModal()
    })
    if (location.hash === OPEN_HASH) openModal()
  }
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start)
})()
