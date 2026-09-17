# Verificação da migração — 17/09/2026

- 26 páginas convertidas para renderização React/Next.js com conteúdo vindo do Payload.
- 52 comparações de captura completa: 26 páginas em 1440 px e 26 em 390 px. Nenhuma diferença de pixels detectada nas condições do teste. Mesma versão do Chromium, fontes e assets; animações neutralizadas. Resultados locais em `test-results/visual/report.json`.
- CSS e arquivos de imagem preservados byte a byte em relação ao protótipo.
- Verificação de tipos e cinco testes automatizados aprovados.
- Menu desktop, menu mobile, filtros de cases, detalhes, páginas inexistentes e redirecionamentos testados sem erros de hidratação.
- Edição de texto pelo CMS refletida no site; tentativa de edição anônima recusada. Conteúdo de teste restaurado.
- Administrador solicitado criado e login validado. Upload e substituição de imagem testados; imagem temporária removida e conteúdo original restaurado.
- Build de produção aprovado sem avisos na execução final.
- Aplicação standalone iniciada com banco de teste isolado. Migração inicial executada, 26 páginas importadas e assets servidos. Dados locais do usuário preservados.
- Prévia com cabeçalho de não indexação e sitemap vazio verificados. Em modo definitivo, robots e sitemap respondem corretamente e cases ilustrativos não aprovados ficam ocultos.

Não foi realizada publicação no GitHub ou na VPS. Docker não foi executado neste Mac. Formulários funcionais, blog com posts independentes, SMTP e backups ainda precisam de preparação, como descrito no README. A senha informada deve ser substituída por uma senha forte e exclusiva antes da publicação na internet.
