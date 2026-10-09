/**
 * SEO de cada página do site, escrito a partir do que a própria página diz.
 *
 * - `title`: sem o nome do site, que é acrescentado sozinho ("… | EQ Seguros").
 *   Até 47 caracteres, para o título completo caber nos 60 do Google.
 * - `description`: entre 120 e 156 caracteres, com a frase-chave.
 * - `focusKeyphrase`: o termo principal, que aparece no título, na descrição,
 *   no título principal da página e nos textos. Uma frase por página.
 * - `alts`: descrição das imagens com conteúdo (fotos e logos). Ícones
 *   decorativos ficam sem descrição de propósito.
 *
 * Os valores só entram onde o campo ainda está como veio do protótipo ou vazio:
 * o que a equipe já editou no painel não é sobrescrito (ver seo-apply.ts).
 * O teste tests/seo.test.mjs confere estas regras para todas as páginas.
 */
export type PageSeo = {
  title: string; description: string; focusKeyphrase: string; alts?: Record<string, string>
  /** Valores que este SEO já teve em algum ambiente: se o campo ainda tiver um deles, a equipe não editou e pode ser trocado. */
  replaces?: { title?: string[]; description?: string[] }
}

const PARTNER_LOGOS = ['icred', 'Lecca', 'btw', 'Sotran Logística', 'Vanto Bank', 'Grupo 3RN', 'Fintech do Corban', 'Quero Passagem', 'BusCo', 'rodoviariaonline', 'GoPass']
/** Logos de parceiros em sequência de chaves (page-i15 a page-i25 na home, por exemplo). */
const logos = (first: number) => Object.fromEntries(PARTNER_LOGOS.map((name, index) => [`page-i${first + index}`, `Logo ${name}`]))

export const pageSeo: Record<string, PageSeo> = {
  index: {
    title: 'Proteção financeira feita para pessoas',
    description: 'Proteção financeira para pessoas: seguros de vida, prestamista e viagem, seguros via API e consignado para servidores. EQ Grupo, regulado pela SUSEP.',
    focusKeyphrase: 'proteção financeira',
    alts: logos(15),
  },
  seguros: {
    title: 'Seguros de pessoas via parceiros e API',
    description: 'Portfólio de seguros de pessoas do EQ Grupo: vida, prestamista, acidentes, viagem, funeral e assistências, distribuídos via parceiros, convênios e API.',
    focusKeyphrase: 'seguros de pessoas',
    alts: {
      'page-i9': 'Ilustração: escalabilidade, distribuição em escala via API',
      'page-i10': 'Ilustração: integração na jornada do parceiro',
      'page-i11': 'Ilustração: monetização ao parceiro',
      'page-i12': 'Ilustração: suporte e tecnologia',
    },
  },
  'seguro-vida': {
    title: 'Seguro de Vida coletivo e individual',
    description: 'Seguro de Vida: proteção financeira para quem depende de você. Coletivo e individual, com coberturas flexíveis que se ajustam ao seu momento de vida.',
    focusKeyphrase: 'seguro de vida',
    alts: { 'page-i1': 'Família sorrindo diante de um notebook, protegida pelo Seguro de Vida' },
  },
  'seguro-prestamista': {
    title: 'Seguro Prestamista para operações de crédito',
    description: 'Seguro prestamista que quita parcial ou totalmente o saldo devedor em morte, invalidez permanente ou perda de renda. Protege clientes e carteira.',
    focusKeyphrase: 'seguro prestamista',
    alts: { 'page-i1': 'Profissional sorrindo com um notebook, cuidando de uma operação de crédito' },
  },
  'seguro-acidentes': {
    title: 'Seguro de Acidentes Pessoais: morte e invalidez',
    description: 'Seguro de acidentes pessoais com indenização por morte ou invalidez por acidente e reembolso de despesas médicas. Complemento natural do Seguro de Vida.',
    focusKeyphrase: 'seguro de acidentes pessoais',
  },
  'seguro-funeral': {
    title: 'Seguro Funeral: auxílio para a família',
    description: 'Seguro funeral com auxílio para o titular e a família, livre escolha do prestador e reembolso até o capital contratado. Autorizada em todo o Brasil.',
    focusKeyphrase: 'seguro funeral',
  },
  'seguro-viagem': {
    title: 'Seguro Viagem Nacional: ônibus, carro e avião',
    description: 'Seguro viagem nacional para quem viaja pelo Brasil de ônibus, carro ou avião: despesas médicas, bagagem, cancelamento e assistência 24h durante o trajeto.',
    focusKeyphrase: 'seguro viagem nacional',
  },
  combos: {
    title: 'Combos e produtos de seguros e assistências',
    description: 'Combos e produtos do EQ Grupo: pacotes que combinam seguros de vida, prestamista, viagem, funeral e acidentes com assistências e sorteios em uma só oferta.',
    focusKeyphrase: 'combos e produtos',
  },
  credito: {
    title: 'Empréstimo consignado e pecúlio para servidores',
    description: 'Empréstimo consignado e pecúlio para servidores públicos de órgãos conveniados: parcela descontada em folha e indenização por morte. Do EQ Grupo.',
    focusKeyphrase: 'empréstimo consignado',
  },
  consignado: {
    title: 'Consignado Público para servidores conveniados',
    description: 'Consignado público do EQ Grupo: crédito com desconto em folha para servidores de órgãos conveniados. Veja se o seu órgão é conveniado e simule.',
    focusKeyphrase: 'consignado público',
  },
  peculio: {
    title: 'Pecúlio: amparo financeiro para a sua família',
    description: 'Pecúlio do EQ Grupo: benefício financeiro pago aos beneficiários indicados em caso de falecimento do titular, por qualquer causa, com contribuição mensal.',
    focusKeyphrase: 'pecúlio',
    alts: { 'page-i1': 'Família reunida diante de um notebook, amparada pelo pecúlio' },
  },
  tecnologia: {
    title: 'Tecnologia EQ: integração de seguros via API',
    description: 'Tecnologia EQ: integração de seguros via API única, com processos de vendas e gestão de produtos na jornada do cliente. Veja a documentação para parceiros.',
    focusKeyphrase: 'tecnologia EQ',
    alts: {
      'page-i2': 'Ilustração: API única para todos os produtos',
      'page-i3': 'Ilustração: equipe Tech EQ especializada',
      'page-i4': 'Ilustração: Business Intelligence com as vendas em tempo real',
      ...logos(5),
      ...logos(16),
    },
  },
  api: {
    title: 'Integrações e API de seguros para parceiros',
    description: 'Integrações e API do EQ Grupo: documentação técnico-comercial, eventos em tempo real e credenciais de sandbox para parceiros e empresas integrarem seguros.',
    focusKeyphrase: 'integrações e API',
  },
  parceiros: {
    title: 'Para parceiros: cresça com o EQ Grupo',
    description: 'Hub para corretores e representantes: seja parceiro do EQ Grupo e distribua seguros, consignado e pecúlio com materiais de venda e suporte comercial.',
    focusKeyphrase: 'parceiro do EQ Grupo',
    alts: { 'page-i1': 'Profissional sorrindo com um notebook, parceira do EQ Grupo' },
  },
  'seja-parceiro': {
    title: 'Seja um parceiro e distribua seguros e crédito',
    description: 'Seja um parceiro do EQ Grupo: cadastre-se como corretor ou representante, conheça as vantagens da parceria e comece a distribuir seguros e crédito.',
    focusKeyphrase: 'seja um parceiro',
  },
  atendimento: {
    title: 'Atendimento EQ Grupo: como acionar um sinistro',
    description: 'Atendimento EQ Grupo: veja como acionar um sinistro em 3 passos, usar as assistências, conferir os sorteios e falar com a gente pelos canais oficiais.',
    focusKeyphrase: 'acionar sinistro',
  },
  ajuda: {
    title: 'Central de Ajuda: dúvidas sobre seguros',
    description: 'Central de ajuda do EQ Grupo: dúvidas frequentes sobre contratação, sinistro, área do cliente e pagamentos, além do portal e dos materiais do corretor.',
    focusKeyphrase: 'central de ajuda',
  },
  contato: {
    title: 'Fale com o EQ Grupo: canais de atendimento',
    description: 'Fale com o EQ Grupo: canais de atendimento, Aviso de Sinistro, Ouvidoria e formulário de contato. Escritório da EQ Seguros S.A. em Goiânia, GO.',
    focusKeyphrase: 'canais de atendimento',
  },
  'grupo-eq': {
    title: 'EQ Grupo: solidez e confiança desde 1972',
    description: 'EQ Grupo, entidade de previdência complementar e seguradora desde 1972: conheça a história, os números e o compromisso ambiental, social e de governança.',
    focusKeyphrase: 'EQ Grupo',
  },
  compliance: {
    title: 'Compliance e governança: SUSEP e LGPD',
    description: 'Compliance e governança no EQ Grupo: regulação SUSEP, governança corporativa, segurança de dados conforme a LGPD e canais da Ouvidoria.',
    focusKeyphrase: 'compliance',
  },
  blog: {
    title: 'Blog do EQ Grupo: seguros, crédito e finanças',
    description: 'Blog do EQ Grupo: conteúdos sobre proteção financeira, seguros embarcados, crédito consignado e educação financeira, para pessoas e parceiros.',
    focusKeyphrase: 'blog',
  },
  privacidade: {
    title: 'Política de Privacidade e proteção de dados',
    description: 'Política de privacidade do Grupo Equatorial (Equatorial Previdência e EQ Seguros): finalidade do tratamento dos dados, orientações gerais e contato do DPO.',
    focusKeyphrase: 'política de privacidade',
    replaces: { description: ['Política de privacidade do EQ Grupo: como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).'] },
  },
  termos: {
    title: 'Termos de Uso do site e dos aplicativos',
    description: 'Termos de uso do site e dos aplicativos do Grupo Equatorial: comunicação, garantias e responsabilidades, confidencialidade e direitos de autor.',
    focusKeyphrase: 'termos de uso',
    replaces: {
      title: ['Termos de Uso do site e dos canais digitais'],
      description: ['Termos de uso do site e dos canais digitais do EQ Grupo: aceitação, uso dos serviços, propriedade intelectual, responsabilidade e foro em Goiânia.'],
    },
  },
  'formulario-enviado': {
    title: 'Mensagem enviada: obrigado pelo contato',
    description: 'Mensagem enviada com sucesso: a equipe do EQ Grupo retorna o contato em até 1 dia útil. Para urgências, fale pelo WhatsApp ou pelo telefone (62) 3572-6000.',
    focusKeyphrase: 'mensagem enviada',
  },
  cases: {
    title: 'Cases de sucesso: parceiros que vendem mais',
    description: 'Cases de sucesso de parceiros que vendem mais com os seguros da EQ na jornada de venda: fintechs, varejistas, plataformas de benefícios e corretoras.',
    focusKeyphrase: 'cases',
  },
}

/** Descrição padrão do site, usada quando uma página não tem a sua. */
export const siteDefaultDescription = 'EQ Seguros: seguros de pessoas distribuídos via parceiros e API, empréstimo consignado e pecúlio para servidores públicos. EQ Grupo, regulado pela SUSEP.'

/** Post inicial do blog, identificado pelo endereço. */
export const postSeo: Record<string, { seoTitle: string; seoDescription: string; focusKeyphrase: string }> = {
  'como-os-seguros-embarcados-ajudam-empresas-a-aumentar-a-receita-sem-complicar-a-jornada-do-cliente': {
    seoTitle: 'Seguros embarcados: aumente a receita',
    seoDescription: 'Entenda como os seguros embarcados (embedded insurance) permitem ao parceiro oferecer proteção na jornada do cliente e criar uma nova linha de receita.',
    focusKeyphrase: 'seguros embarcados',
  },
}
