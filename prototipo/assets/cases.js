/* ===================================================================
   EQ Seguros · protótipo · cases de sucesso
   Esta lista espelha o modelo de conteúdo do CMS: cada objeto é um
   registro. No site final os registros chegam da API do CMS; o
   protótipo usa a mesma estrutura para validar layout e campos.

   Campos do modelo "Case"
     slug         identificador na URL           case.html?c=slug
     parceiro     nome do parceiro (apelido enquanto não houver aprovação)
     segmento     fintechs | varejo | rh | corretoras
     titulo       manchete do case
     resumo       uma ou duas frases para o card
     imagem       foto de capa, proporção 16:10
     produtos     produtos EQ utilizados (lista)
     resultados   até 3 itens { valor, rotulo }
     desafio      texto corrido
     solucao      texto corrido
     depoimento   { texto, autor, cargo }
     destaque     aparece na seção de cases da página Tecnologia EQ
     aprovado     depoimento e números validados pelo parceiro;
                  no site final, só registros aprovados são publicados

   Conteúdo abaixo é ilustrativo e aguarda aprovação dos parceiros.
   =================================================================== */
(function () {
  var SEGMENTOS = {
    fintechs:   'Fintechs e bancos',
    varejo:     'Varejo e e-commerce',
    rh:         'RH e benefícios',
    corretoras: 'Corretoras e correspondentes'
  };

  var CASES = [
    {
      slug: 'plataforma-passagens-rodoviarias',
      parceiro: 'Plataforma de passagens rodoviárias',
      segmento: 'varejo',
      titulo: 'Seguro viagem no checkout da passagem de ônibus',
      resumo: 'O passageiro contrata o Seguro Viagem Nacional no mesmo fluxo da compra da passagem, em um clique.',
      imagem: 'assets/foto-viagem-hero.jpg',
      produtos: ['Seguro Viagem Nacional', 'Assistências'],
      resultados: [
        { valor: '+32%', rotulo: 'das passagens vendidas com seguro' },
        { valor: '1 clique', rotulo: 'para contratar no checkout' },
        { valor: '24h', rotulo: 'de assistência durante o trajeto' }
      ],
      desafio: 'A plataforma vendia milhares de passagens por dia, mas não oferecia nenhuma proteção ao passageiro. Incluir um seguro não podia alongar a compra nem exigir cadastro extra, sob risco de derrubar a conversão.',
      solucao: 'Com a API única da EQ, a cotação e a emissão do Seguro Viagem Nacional passaram a acontecer dentro do checkout. O bilhete do seguro é emitido junto com a passagem, e a assistência 24h fica disponível do embarque ao desembarque.',
      depoimento: {
        texto: 'Colocamos o seguro no checkout sem mudar a experiência de compra. O passageiro contrata em um clique, e toda a operação do seguro fica com a EQ.',
        autor: 'Nome do responsável',
        cargo: 'Head de Produto, plataforma de passagens'
      },
      destaque: true,
      aprovado: false
    },
    {
      slug: 'fintech-credito-pessoal',
      parceiro: 'Fintech de crédito pessoal',
      segmento: 'fintechs',
      titulo: 'Prestamista embarcado na contratação do empréstimo',
      resumo: 'O seguro prestamista entra na jornada de crédito via API e protege a carteira contra inadimplência por morte ou invalidez.',
      imagem: 'assets/foto-prestamista-perfil.jpg',
      produtos: ['Seguro Prestamista'],
      resultados: [
        { valor: '+27%', rotulo: 'de adesão ao seguro na contratação' },
        { valor: '3 semanas', rotulo: 'do contrato à primeira emissão' },
        { valor: '-18%', rotulo: 'de perda da carteira por sinistro' }
      ],
      desafio: 'A fintech crescia rápido na concessão de crédito, e a exposição a eventos como morte e invalidez do tomador aumentava junto. Faltava uma proteção que coubesse no fluxo 100% digital do app.',
      solucao: 'O Seguro Prestamista foi integrado à etapa de simulação do empréstimo. O cliente vê o valor da proteção junto da parcela e contrata no mesmo aceite, enquanto a fintech acompanha emissões e sinistros pelo painel da EQ.',
      depoimento: {
        texto: 'A integração foi direta. Hoje o prestamista faz parte da nossa oferta de crédito, e a carteira ficou mais protegida sem adicionar atrito ao app.',
        autor: 'Nome do responsável',
        cargo: 'Diretor de Crédito, fintech parceira'
      },
      destaque: true,
      aprovado: false
    },
    {
      slug: 'plataforma-beneficios-corporativos',
      parceiro: 'Plataforma de benefícios corporativos',
      segmento: 'rh',
      titulo: 'Vida em grupo e assistências no pacote de benefícios',
      resumo: 'Empresas clientes oferecem Seguro de Vida e assistências aos colaboradores direto pela plataforma de benefícios.',
      imagem: 'assets/foto-consignado-hero.jpg',
      produtos: ['Seguro de Vida', 'Seguro Funeral', 'Assistências'],
      resultados: [
        { valor: '+40 mil', rotulo: 'vidas protegidas' },
        { valor: '120', rotulo: 'empresas com o benefício ativo' },
        { valor: '24h', rotulo: 'de telemedicina para o colaborador' }
      ],
      desafio: 'A plataforma queria ampliar o cardápio de benefícios com proteção de vida, mas contratar e administrar apólice por empresa cliente era inviável para o time.',
      solucao: 'Com a EQ, o Seguro de Vida em grupo, o Funeral e as assistências viraram itens do catálogo da plataforma. Cada empresa ativa o benefício em poucos cliques, e a movimentação de vidas é sincronizada via API.',
      depoimento: {
        texto: 'O seguro de vida virou um dos benefícios mais procurados da plataforma, e a gestão das apólices é toda digital.',
        autor: 'Nome do responsável',
        cargo: 'Gerente de Parcerias, plataforma de benefícios'
      },
      destaque: true,
      aprovado: false
    },
    {
      slug: 'correspondente-bancario-consignado',
      parceiro: 'Correspondente bancário',
      segmento: 'corretoras',
      titulo: 'Proteção ao servidor na contratação do consignado',
      resumo: 'O correspondente passa a oferecer seguro prestamista e pecúlio ao servidor conveniado no mesmo atendimento.',
      imagem: 'assets/foto-parceiro-hero.jpg',
      produtos: ['Seguro Prestamista', 'Pecúlio'],
      resultados: [
        { valor: '2 produtos', rotulo: 'a mais por atendimento' },
        { valor: '+35%', rotulo: 'de receita por cliente' },
        { valor: '1 portal', rotulo: 'para cotar, emitir e acompanhar' }
      ],
      desafio: 'O correspondente atendia servidores públicos conveniados apenas com crédito, e a receita dependia exclusivamente do volume de contratos.',
      solucao: 'Pelo portal do corretor da EQ, a equipe passou a cotar e emitir Prestamista e Pecúlio durante o próprio atendimento do consignado, com suporte do time comercial da EQ.',
      depoimento: {
        texto: 'Ganhamos produtos para oferecer ao servidor no mesmo atendimento, com um suporte muito próximo do time da EQ.',
        autor: 'Nome do responsável',
        cargo: 'Sócio, correspondente bancário'
      },
      destaque: false,
      aprovado: false
    }
  ];

  window.EQ_CASES = CASES;
  window.EQ_SEGMENTOS = SEGMENTOS;

  var SETA = '<svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function card(c) {
    var kpi = c.resultados && c.resultados[0];
    return '<a class="casecard rv-init" href="case.html?c=' + esc(c.slug) + '" data-seg="' + esc(c.segmento) + '">' +
      '<div class="cc-media"><img src="' + esc(c.imagem) + '" alt="" loading="lazy">' +
        '<span class="cc-seg">' + esc(SEGMENTOS[c.segmento]) + '</span></div>' +
      '<div class="cc-body">' +
        (c.aprovado ? '' : '<span class="cc-flag">Case ilustrativo</span>') +
        '<span class="cc-parceiro">' + esc(c.parceiro) + '</span>' +
        '<h4>' + esc(c.titulo) + '</h4>' +
        '<p>' + esc(c.resumo) + '</p>' +
        (kpi ? '<div class="cc-kpi"><b>' + esc(kpi.valor) + '</b><span>' + esc(kpi.rotulo) + '</span></div>' : '') +
        '<span class="link-arrow"><span>Ler o case</span>' + SETA + '</span>' +
      '</div></a>';
  }

  function porSlug(slug) {
    for (var i = 0; i < CASES.length; i++) if (CASES[i].slug === slug) return CASES[i];
    return null;
  }

  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ---------- listagem com filtro por segmento ---------- */
  var grid = document.getElementById('cases-grid');
  if (grid) {
    grid.innerHTML = CASES.map(card).join('');
    var filtro = document.getElementById('cases-filtro');
    if (filtro) {
      var chips = '<button class="chip on" type="button" data-seg="">Todos</button>';
      Object.keys(SEGMENTOS).forEach(function (k) {
        var n = CASES.filter(function (c) { return c.segmento === k; }).length;
        if (n) chips += '<button class="chip" type="button" data-seg="' + k + '">' + esc(SEGMENTOS[k]) + '</button>';
      });
      filtro.innerHTML = chips;
      filtro.addEventListener('click', function (e) {
        var b = e.target.closest('.chip');
        if (!b) return;
        filtro.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        var seg = b.getAttribute('data-seg');
        grid.querySelectorAll('.casecard').forEach(function (el) {
          var mostra = !seg || el.getAttribute('data-seg') === seg;
          el.hidden = !mostra;
          if (mostra) el.classList.add('rv');
        });
      });
    }
  }

  /* ---------- destaques (Tecnologia EQ) ---------- */
  var dest = document.getElementById('cases-destaque');
  if (dest) {
    dest.innerHTML = CASES.filter(function (c) { return c.destaque; }).slice(0, 3).map(card).join('');
  }

  /* ---------- página do case ---------- */
  if (document.getElementById('case-titulo')) {
    var slug = new URLSearchParams(location.search).get('c');
    var c = porSlug(slug) || CASES[0];

    document.title = c.titulo + ' | Cases | EQ Seguros';
    set('case-crumb', esc(c.parceiro));
    set('case-seg', esc(SEGMENTOS[c.segmento]));
    set('case-titulo', esc(c.titulo));
    set('case-resumo', esc(c.resumo));
    set('case-produtos', c.produtos.map(function (p) { return '<span class="tag">' + esc(p) + '</span>'; }).join(''));
    set('case-parceiro', esc(c.parceiro));
    var img = document.getElementById('case-img');
    if (img) { img.src = c.imagem; img.alt = c.titulo; }
    var flag = document.getElementById('case-flag');
    if (flag) flag.hidden = !!c.aprovado;

    set('case-stats', c.resultados.map(function (r) {
      return '<div class="item rv-init"><div class="big">' + esc(r.valor) + '</div><div class="lbl">' + esc(r.rotulo) + '</div></div>';
    }).join(''));
    set('case-desafio', esc(c.desafio));
    set('case-solucao', esc(c.solucao));
    set('case-quote', esc(c.depoimento.texto));
    set('case-autor', esc(c.depoimento.autor));
    set('case-cargo', esc(c.depoimento.cargo));

    set('case-outros', CASES.filter(function (x) { return x.slug !== c.slug; }).slice(0, 3).map(card).join(''));
  }
})();
