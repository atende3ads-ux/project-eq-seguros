/**
 * Endereços do site antigo da EQ (eqseguros.com.br) e para onde cada um vai no site novo.
 * São redirecionamentos permanentes (301): quem tinha o endereço antigo nos favoritos, em
 * e-mails ou em outro site chega na página certa, e o Google transfere para o endereço
 * novo a posição que o antigo tinha, em vez de tratar tudo como página nova.
 *
 * Os produtos antigos (Seguro EQ Pet Lar, PME, Sênior…) não existem mais no portfólio
 * novo; levam à página de seguros, que é a mais próxima.
 * O teste tests/redirects.test.mjs confere que todo destino existe.
 */
export const legacyRedirects = [
  ['/quem-somos', '/grupo-eq'],
  ['/nossas-solucoes', '/seguros'],
  ['/seguros/:produto', '/seguros'],
  ['/integre-sua-api', '/api'],
  ['/area-do-corretor', '/parceiros'],
  ['/seja-um-parceiro', '/seja-parceiro'],
  ['/aviso-de-sinistro', '/atendimento'],
  // Os cases estão fora do ar (CASES_VISIBLE): enquanto isso levam a Parceiros. Quando voltarem, troque por '/cases'.
  ['/cases-de-sucesso', '/parceiros'],
  ['/duvidas', '/ajuda'],
  ['/duvidas/:assunto', '/ajuda'],
  ['/fale-conosco', '/contato'],
  ['/ouvidoria', '/contato'],
  ['/politica-de-privacidade', '/privacidade'],
  ['/termos-de-uso', '/termos'],
  ['/blog-categorias/:categoria', '/blog'],
  ['/404', '/'],
]

/**
 * Endereço oficial do site e os outros endereços que levam a ele: o `www` e o domínio eqgrupo.com.br
 * (que antes só repassava para grupoeq.com.br). Redirecionamento permanente, mantendo o caminho.
 * Cada domínio daqui também precisa estar em *Domains* da aplicação no Coolify e com o DNS apontado
 * para o servidor, senão o pedido nem chega ao site.
 */
export const canonicalOrigin = 'https://eqseguros.com.br'
export const otherHosts = ['www.eqseguros.com.br', 'eqgrupo.com.br', 'www.eqgrupo.com.br']
