# EQ Seguros — Next.js + Payload

Aplicação independente criada a partir de `../project-eq-seguros-main/prototipo`. As pastas de origem não foram modificadas. A pasta `payload-main` é o repositório de desenvolvimento do próprio CMS; este projeto usa os pacotes publicados do Payload, não todo aquele monorepo.

## Rodar no Mac

Requer Node.js 22 ou 24. As dependências já foram instaladas neste computador.

```sh
npm ci
npm run dev
```

Site: http://localhost:3000. Painel de conteúdo: http://localhost:3000/admin.

Foi criado um `.env` privado com uma chave exclusiva para desenvolvimento. Não envie esse arquivo ao GitHub. Em outro computador, copie `.env.example` para `.env` e substitua a chave de exemplo por uma chave aleatória longa. A chave do ambiente publicado deve ser outra, salva no gerenciador de senhas da empresa.

Neste computador já foi criado o administrador com o e-mail solicitado pelo usuário, sem gravar a senha no código. Em uma instalação com banco novo, o primeiro acesso ao `/admin` permite criar seu usuário. Não há senha padrão, login automático nem usuário de teste permanente. O primeiro usuário recebe a função Administrador. Ele pode criar editores; os editores não podem criar usuários nem promover a própria permissão. O usuário do Payload é separado do usuário do Coolify.

## Conteúdo editável

- **Páginas do site:** título SEO, descrição, visibilidade, textos, imagens e destinos dos links das 26 páginas existentes.
- **Cabeçalho e rodapé:** textos, logos, endereços, contatos e links compartilhados.
- **Biblioteca de imagens:** upload de imagens e substituição das originais sem mudar as classes do layout.
- **Cases de sucesso:** parceiro, segmento, título, resumo, produtos, resultados, depoimento e imagem. O filtro e a página de detalhe são componentes React.
- **Posts e categorias:** artigos independentes com rascunho, agendamento, prévia, imagem de destaque e SEO.
- **Configurações do site:** nome, logo, favicon, descrição e imagem padrão de compartilhamento.

Os conteúdos originais são importados no primeiro início. A marca de importação fica no banco: reiniciar ou atualizar a aplicação não redefine textos já editados. Rascunhos de páginas não ficam acessíveis publicamente.

Para conservar o visual, o DOM do protótipo foi convertido em árvores renderizadas por componentes React no servidor, sem iframe nem execução de páginas HTML. O CSS e as imagens foram preservados byte a byte. O conteúdo vem do banco do Payload; texto é renderizado como texto React, não como HTML arbitrário. Estrutura e posição dos elementos ficam nos templates e não são um construtor livre de páginas.

## Banco e imagens

Esta versão usa **SQLite local**, adequado ao desenvolvimento e às prévias pequenas descritas. Banco: `.data/eq-seguros.db`. Uploads: `media/`. A aplicação deve ter uma única instância gravadora, com esses diretórios persistentes. Não aumente réplicas nem migre automaticamente para outro banco. Caso o volume de uso exija Postgres, será uma mudança explícita de adaptador e dados, não apenas trocar o endereço de conexão.

Há migração inicial versionada. No modo de produção, o Payload executa as migrações incluídas antes da importação inicial. Para futuras mudanças de schema, gere, revise e teste uma nova migração antes da publicação.

## Atualização no Coolify

O site de aprovação está hospedado em `https://eqseguros.3adsux.com.br`. Alterações de código são enviadas à branch `main`; como o deploy automático está desligado, o push não atualiza sozinho a aplicação em execução.

1. Testar as alterações e enviá-las ao repositório oficial. Não versionar `.env`, `.data`, `media`, dependências ou relatórios de teste.
2. Antes de uma atualização com migrações, fazer backup consistente do banco e dos uploads e confirmar que os volumes continuam montados em `/app/.data` e `/app/media`.
3. No Coolify, executar o redeploy da aplicação existente. Não criar outra aplicação, não trocar `PAYLOAD_SECRET` e não substituir os volumes.
4. Manter `DATABASE_URL=file:/app/.data/eq-seguros.db`, `SERVER_URL=https://eqseguros.3adsux.com.br`, `SITE_ENV=preview` enquanto o endereço for de aprovação e `CASES_VISIBLE=false` até o material definitivo ser autorizado.
5. Após o redeploy, conferir `/health`, HTTPS, navegação, login, edição e permanência das imagens e do conteúdo após reinício.

## Prévia e migração para o cliente

`SITE_ENV=preview` aplica `noindex` nas páginas e cabeçalho HTTP, bloqueia indexação no robots e deixa o sitemap vazio. Isso não impede acesso de pessoas: configure proteção de acesso no servidor quando a prévia for confidencial.

Os cases herdados são **ilustrativos e não aprovados**. No ambiente definitivo (`SITE_ENV=production`), o acesso público ao CMS só retorna cases aprovados. Números, depoimentos, contatos e conteúdo institucional precisam de validação do cliente antes da publicação final.

Na migração, levar código, backup consistente do banco e uploads; criar uma chave secreta do ambiente de destino, ajustar `SERVER_URL` para o domínio do cliente e testar antes do DNS. Trocar a chave encerra sessões existentes. Usar `SITE_ENV=production` apenas quando o site definitivo estiver aprovado e a indexação for desejada.

## Limites herdados do protótipo

- Formulários são demonstrações visuais, sem campos e sem envio no protótipo. Esta migração não simula mensagens enviadas nem configura e-mail/CRM. Isso exige implementação e definição de destino e proteção contra abuso.
- O blog usa posts independentes e categorias. A listagem tem busca, filtro e carregamento em lotes de seis. Os modelos importados permanecem demonstrativos até revisão editorial.
- As fontes licenciadas Neulis não foram fornecidas no protótipo. O CSS original mantém o fallback Urbanist; não foram baixadas fontes licenciadas nem inventadas versões.
- SMTP/recuperação de senha e backups não estão configurados. Definir antes do uso em produção.
- A auditoria de dependências não encontrou alertas altos ou críticos após as correções aplicadas. Ainda há alertas moderados transitivos ligados à ferramenta de migração do adaptador SQLite, sem correção compatível indicada pelo gerenciador. Reavaliar antes de publicar.

O container possui uma verificação de saúde em `/health`, que confirma a resposta da aplicação e uma consulta simples ao banco. Ela não substitui monitoramento externo do domínio nem testes de jornada do usuário.

## Verificação

```sh
npm run typecheck
npm test
npm run build
# Com o site local rodando:
npm run test:visual
npm run test:cms
```

O teste visual compara todas as páginas com os originais em desktop e celular; gera capturas e relatório em `test-results/visual`. Ele neutraliza animações e usa o mesmo navegador e fontes para os dois lados. Não substitui revisão humana ou garante igualdade em todos os navegadores.

O teste CMS é exclusivo de um ambiente local de teste **sem usuários existentes**: cria e remove uma conta temporária, edita e restaura conteúdo. Não executar no ambiente de clientes.
