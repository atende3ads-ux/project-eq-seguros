# Segurança do projeto EQ Seguros

O site é uma aplicação Next.js com o painel Payload, publicada em Docker pelo Coolify. Não há plugins, temas nem PHP, e o código vem do Git a cada publicação, então a superfície de ataque é bem menor que a de um WordPress. A proteção vem em camadas.

| Camada | Onde está | Como se confere |
|---|---|---|
| Cabeçalhos e política de conteúdo | `Index/next.config.mjs` | `npm run test:security` |
| Login do painel | `Index/src/cms/collections.ts` (bloqueia 10 min após 5 erros) | automático |
| Dependências, código e imagem Docker | `.github/` (Dependabot, CI, CodeQL, Trivy) | aba Actions do GitHub |
| Servidor | `ops/endurecer-vps.sh` | `--simular` mostra o que muda |
| Backup | `ops/backup-eq.sh` | roda sozinho às 03:15 e confere a cópia |

## O que o código faz

- **Cabeçalhos:** HSTS, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `nosniff` e `Referrer-Policy`. O `x-powered-by` é removido.
- **Política de conteúdo (CSP), só em produção:** o site só carrega recursos dele mesmo, as fontes do Google e o mapa do Google Maps da página de Contato. Bloqueia scripts, imagens e conexões de outros endereços, o site dentro de moldura de terceiros e troca do `<base>`. Os scripts e estilos embutidos continuam permitidos porque o Next.js e o painel dependem deles.
- **Ao incluir um serviço externo** (reCAPTCHA, analytics, vídeo, chat), a política vai bloqueá-lo até ser liberada em `next.config.mjs`. Libere só o endereço necessário, na diretiva certa (`script-src`, `frame-src`, `connect-src`, `img-src`), e rode `npm run test:security`.
- **SVG:** a biblioteca de imagens aceita SVG. O Payload recusa SVG com script, eventos ou iframe, e o servidor entrega todo SVG com `sandbox`, então nenhum script roda mesmo se o arquivo for aberto direto.
- **Painel sem Gravatar:** o painel não envia o hash do e-mail de quem está logado a um serviço externo.
- **Permissões:** o Editor de conteúdo não cria usuários nem apaga registros. O cadastro do primeiro usuário só existe enquanto não há nenhum.

## GitHub

- `ci.yml`, a cada push e pull request: tipos, testes, **migrações cobrindo o schema**, `npm audit` (falha em alta ou crítica) e build. A verificação de migração evita o erro de 06/10/2026, quando uma atualização do Payload entrou sem a migração da coluna nova e o painel parou.
- `dependabot.yml`: PRs semanais de atualização, com o Payload e o Next.js em grupos.
- `codeql.yml`: análise de código a cada push e toda segunda.
- `trivy.yml`: varredura semanal das dependências e da imagem Docker.

**O dono do repositório precisa ligar, em Settings → Code security** (não dá para fazer por código):
1. Dependabot alerts e Dependabot security updates.
2. Secret scanning e Push protection.
3. Em Settings → Branches, proteger a `main` exigindo a verificação `CI` antes de aceitar mudanças.

## Servidor

Ordem para a VPS nova (ou qualquer VPS Ubuntu):

1. Veja o que será feito: `ssh root@IP 'bash -s -- --simular' < ops/endurecer-vps.sh`
2. Crie uma chave só para esta VPS: `ssh-keygen -t ed25519 -f ~/.ssh/eq-vps` e envie com `ssh-copy-id -i ~/.ssh/eq-vps.pub root@IP`.
3. Teste: `ssh -i ~/.ssh/eq-vps root@IP`. Só continue se entrou sem pedir senha.
4. Aplique: `ssh -i ~/.ssh/eq-vps root@IP 'bash -s -- --travar-ssh' < ops/endurecer-vps.sh`
   Isso liga o firewall (22, 80, 443), o fail2ban e as atualizações automáticas, e desliga o login por senha.
5. **Antes de fechar a sessão, abra outra e confirme que entra.** Se algo travar, use o Console da Hostinger (hPanel) para corrigir.

**Aplicado na VPS do cliente em 07/10/2026:** firewall (22, 80, 443), fail2ban, atualizações automáticas, login SSH só por chave e backup diário. Depois, o acesso é `ssh -i ~/.ssh/eq-vps root@179.236.237.154`.

**Não remova a chave `coolify` de `/root/.ssh/authorized_keys`:** é por ela que o Coolify administra o servidor, entrando por SSH a partir da rede interna do Docker. Por isso o fail2ban ignora as faixas de rede privadas e o firewall mantém a porta 22 aberta.

**Limite importante:** o firewall do Ubuntu não controla portas publicadas pelo Docker. As portas do Coolify (8000, 6001 e 6002) continuam abertas por fora dele. Depois que o painel tiver domínio com HTTPS, feche essas três no firewall da Hostinger (hPanel → VPS → Segurança → Firewall), liberando só 22, 80 e 443.

## Backup

Instalação: `scp -i ~/.ssh/eq-vps ops/backup-eq.sh root@IP:/usr/local/bin/eq-backup` e depois `ssh -i ~/.ssh/eq-vps root@IP '/usr/local/bin/eq-backup --instalar'`. Isso cria uma tarefa diária às 03:15 (horário do servidor, que é UTC: 00:15 em Brasília) e roda a primeira cópia na hora. Guarda em `/var/backups/eq-seguros`: 14 dias de cópias diárias e 8 domingos. Cada cópia do banco é feita com a API de backup do SQLite (consistente com o site no ar), conferida com `integrity_check` antes de ser guardada, e a tarefa falha com mensagem clara se algo estiver errado (`systemctl status eq-backup`).

**Essa cópia fica no mesmo servidor.** Protege de erro humano e de corrupção, mas não da perda da VPS. Para copiar para fora, instale o `rclone`, configure um destino (Google Drive, S3…) e crie `/etc/eq-backup.conf` com `RCLONE_REMOTE=nome:pasta`.

**Restaurar:**
1. No Coolify, **Stop** na aplicação.
2. Na VPS, descubra as pastas: `docker volume inspect -f '{{.Mountpoint}}' <volume>` (volumes que terminam em `-eq-seguros-data` e `-eq-seguros-media`).
3. Banco: `gunzip -c ARQUIVO-banco.db.gz > /tmp/eq.db`, apague `eq-seguros.db-wal` e `eq-seguros.db-shm` da pasta de dados e copie `/tmp/eq.db` para `eq-seguros.db`.
4. Imagens: `tar -xzf ARQUIVO-imagens.tar.gz -C <pasta-media>`.
5. No Coolify, **Start**, e confira o site e o painel.

## Rotina

- **Toda segunda:** olhar os PRs do Dependabot. Atualizações do Payload costumam pedir migração: o CI avisa se faltar. Fazer cópia do banco antes de publicar.
- **Todo mês:** `ssh` na VPS e `systemctl status eq-backup`; testar uma restauração numa pasta temporária.
- **Suspeita de invasão:** trocar `PAYLOAD_SECRET` no Coolify (encerra todas as sessões), trocar as senhas do painel e do Coolify, revisar os usuários do Payload e restaurar o último backup bom, se houver alteração indevida.

## Pendências conhecidas

- Fechar as portas 8000, 6001 e 6002 (depende do domínio com HTTPS do Coolify, `coolify.eqseguros.com.br`).
- Cópia dos backups para fora do servidor.
- Formulários reais (hoje são só desenho) com CAPTCHA, limite por IP e campo-armadilha.
- Contato de segurança (`/.well-known/security.txt`): depende de o cliente indicar um e-mail.
- Os 5 alertas moderados do `npm audit` vêm do `@payloadcms/db-sqlite` e não têm correção disponível. Reavaliar a cada atualização do Payload.
