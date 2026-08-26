/* ===================================================================
   EQ Seguros — protótipo · cabeçalho e rodapé compartilhados
   Cada página traz apenas o seu conteúdo; a moldura é injetada aqui,
   então um ajuste de menu ou rodapé propaga para o site inteiro.
   =================================================================== */
(function () {
  var NAV = [
    { t: 'EQ Grupo',    h: 'grupo-eq.html',   m: ['grupo-eq'] },
    { t: 'Seguros',          h: 'seguros.html',    m: ['seguros','seguro-vida','seguro-prestamista','seguro-viagem','seguro-funeral','seguro-acidentes'] },
    { t: 'Crédito',          h: 'credito.html',    m: ['credito','consignado','peculio'] },
    { t: 'Tecnologia EQ',    h: 'tecnologia.html', m: ['tecnologia','api'] },
    { t: 'Atendimento',      h: 'atendimento.html',m: ['atendimento','ajuda'] },
    { t: 'Para Parceiros',   h: 'parceiros.html',  m: ['parceiros','seja-parceiro'] },
    { t: 'Blog',             h: 'blog.html',       m: ['blog','post'] }
  ];

  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  if (page === '') page = 'index';

  var ICO_FONE = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

  var header =
    '<div class="chancela"><div class="wrap">' +
      '<span>Empresas do grupo:</span>' +
      '<span class="badge">EQ Seguros S.A.</span>' +
      '<span class="badge">Equatorial Previdência</span>' +
      '<div class="right">' +
        '<span class="fone">' + ICO_FONE + ' 0800 201 1838</span>' +
        '<span class="sep"></span>' +
        '<span class="reg">Regulado pela SUSEP</span>' +
      '</div>' +
    '</div></div>' +
    '<header class="nav" id="nav"><div class="wrap">' +
      '<a class="logo" href="index.html"><img src="assets/logo-eq-seguros-2.png" alt="EQ Seguros"></a>' +
      '<nav class="menu" id="menu">' +
        NAV.map(function (i) {
          var on = i.m.indexOf(page) > -1 ? ' class="on"' : '';
          return '<a href="' + i.h + '"' + on + '>' + i.t + '</a>';
        }).join('') +
        '<a class="btn btn-primary" href="contato.html" style="display:none;">Fale com um especialista</a>' +
      '</nav>' +
      '<div class="nav-cta"><a class="btn btn-primary" href="contato.html">Fale com um especialista</a></div>' +
      '<button class="burger" id="burger" aria-label="Abrir menu">' +
        '<svg viewBox="0 0 24 24"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>' +
      '</button>' +
    '</div></header>';

  var SOC = {
    ig: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>',
    fb: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
    yt: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
    li: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>'
  };
  function soc(k, n) { return '<a aria-label="' + n + '" href="#"><svg viewBox="0 0 24 24">' + SOC[k] + '</svg></a>'; }

  var footer =
    '<footer class="ft"><div class="wrap">' +
      '<div class="ft-brands">' +
        '<div class="lk lk-top"><img src="assets/logos-footer.png" alt="EQ Grupo · EQ Seguros"></div>' +
        '<div class="lk lk-bot"><img src="assets/logos-footer.png" alt="Equatorial Previdência"></div>' +
      '</div>' +
      '<div class="ft-top">' +
        '<div>' +
          '<p class="ft-desc">Proteção financeira para pessoas, via parceiros e convênios. EQ Grupo — regulado pela SUSEP.</p>' +
          '<div class="social">' + soc('ig','Instagram') + soc('fb','Facebook') + soc('yt','YouTube') + soc('li','LinkedIn') + '</div>' +
        '</div>' +
        '<div><h4>Soluções</h4><ul>' +
          '<li><a href="seguros.html">Seguros</a></li>' +
          '<li><a href="consignado.html">Empréstimo Consignado</a></li>' +
          '<li><a href="combos.html">Combos e Produtos</a></li>' +
          '<li><a href="tecnologia.html">Tecnologia EQ</a></li>' +
          '<li><a href="parceiros.html">Para Parceiros</a></li>' +
          '<li><a href="blog.html">Blog</a></li>' +
        '</ul></div>' +
        '<div><h4>Institucional</h4><ul>' +
          '<li><a href="grupo-eq.html">EQ Grupo</a></li>' +
          '<li><a href="compliance.html">Compliance</a></li>' +
          '<li><a href="contato.html">Contato</a></li>' +
          '<li><a href="privacidade.html">Política de Privacidade</a></li>' +
          '<li><a href="termos.html">Termos de Uso</a></li>' +
        '</ul></div>' +
        '<div><h4>Atendimento</h4><ul>' +
          '<li><a href="https://wa.me/556235726000">WhatsApp — (62) 3572-6000</a></li>' +
          '<li>SAC — 0800 644 0144 <span class="ft-note">(2ª a 6ª, 8h30–17h30)</span></li>' +
          '<li>Telefone — (62) 3572-6000 <span class="ft-note">(2ª a 6ª, 8h30–17h30)</span></li>' +
          '<li><a href="mailto:atendimento@eqseguros.com.br">atendimento@eqseguros.com.br</a></li>' +
          '<li><a href="atendimento.html">Sinistro 24h</a></li>' +
          '<li><a href="ajuda.html">Central de Ajuda</a></li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="ft-mid">' +
        '<div><h4>SAC Serviços (Assistências)</h4><ul><li>0800 721 3210</li><li>(11) 2853-0348</li></ul>' +
          '<p>Assistências 24h — funeral, pet, residencial, entre outros.</p></div>' +
        '<div><h4>Ouvidoria</h4><ul><li>0800 703 1989</li>' +
          '<li><a href="mailto:ouvidoria@sinapp.org.br">ouvidoria@sinapp.org.br</a></li>' +
          '<li><a href="https://sisgo.sinapp.net.br/solicitacao" target="_blank" rel="noopener">Abrir solicitação</a></li></ul></div>' +
        '<div><h4>Ouvidoria — Def. Auditiva/Fala</h4><ul>' +
          '<li>0800 201 1838 <span class="ft-note">(telefone fixo TDD)</span></li>' +
          '<li><a href="mailto:ouvidoria.auditivo.fala@sinapp.org.br">ouvidoria.auditivo.fala@sinapp.org.br</a></li></ul></div>' +
        '<div><h4>Ouvidoria — Def. Visual</h4><ul><li>0800 703 1989</li>' +
          '<li><a href="mailto:ouvidoria.visual@sinapp.org.br">ouvidoria.visual@sinapp.org.br</a></li></ul></div>' +
      '</div>' +
      '<div class="ft-legal">' +
        '<div><b>EQ Seguros S/A</b> — CNPJ 21.242.451/0001-05 · Cód. SUSEP 01554</div>' +
        '<div><b>Equatorial Previdência Complementar</b> — CNPJ 42.150.987/0001-70 · Cód. SUSEP 10120</div>' +
      '</div>' +
    '</div>' +
    '<div class="ft-bar"><div class="wrap">' +
      '<span>© 2026 EQ Seguros &amp; EQUATORIAL · EQ Grupo</span>' +
      '<span>Desenvolvido com <span class="heart">♥</span> por <b>3ADS</b></span>' +
    '</div></div></footer>';

  function mount() {
    var h = document.getElementById('site-header');
    var f = document.getElementById('site-footer');
    if (h) h.outerHTML = header;
    if (f) f.outerHTML = footer;

    var nav = document.getElementById('nav');
    if (nav) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
    }

    var burger = document.getElementById('burger'), menu = document.getElementById('menu');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        var b = menu.querySelector('.btn');
        if (b) b.style.display = open ? 'inline-flex' : 'none';
      });
    }

    var items = document.querySelectorAll('.rv-init');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('rv'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = Array.prototype.slice.call(el.parentElement.children).filter(function (c) {
          return c.classList.contains('rv-init');
        });
        var i = Math.max(0, sibs.indexOf(el));
        setTimeout(function () { el.classList.add('rv'); }, Math.min(i, 7) * 85);
        io.unobserve(el);
      });
    }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
