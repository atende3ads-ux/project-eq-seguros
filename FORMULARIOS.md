# Formulários, e-mail e aviso de cookies

## Como os contatos funcionam

1. A pessoa preenche um formulário do site (Contato, cotações, Seja parceiro, Consignado).
2. O servidor confere os dados, bloqueia robôs e **guarda o contato** em *Mensagens recebidas* no painel.
3. Em seguida avisa a equipe por e-mail, no endereço de *Configurações do site → Formulários* (hoje `comercial@eqseguros.com.br`). O e-mail de quem escreveu vai em "Responder para".
4. A pessoa vai para a página de agradecimento (`/formulario-enviado`), que serve de marcador de conversão.

O e-mail é só um aviso. Se ele falhar, o contato continua salvo e a coluna **E-mail para a equipe** mostra "Falhou". Nenhum contato se perde.

Os textos dos campos, os botões e a página de agradecimento são editáveis no painel como qualquer página. As opções das listas (Assunto, Seguro de interesse) ficam no código, em `Index/src/lib/forms.ts`.

## O que precisa ser criado uma vez (conta do cliente)

Os dois serviços são gratuitos no volume deste site e as chaves ficam no Coolify, nunca no repositório.

### 1. E-mail (Resend)

Por que o Resend e não o e-mail do Microsoft 365: a Microsoft vem desligando o envio por senha (SMTP básico), e uma senha de caixa postal expira ou é trocada. Com o Resend o envio é por uma chave, sem servidor de e-mail para manter.

1. Criar a conta em resend.com com um e-mail do cliente.
2. *Domains → Add Domain* → `eqseguros.com.br`. O Resend mostra 3 ou 4 registros DNS (DKIM, SPF e retorno). Quem cuida do DNS (Google Cloud DNS) cria esses registros. Eles ficam em um subdomínio de envio e **não mexem no e-mail do Microsoft 365**. Aguardar o status *Verified*.
3. *API Keys → Create API Key* (permissão "Sending access"). Copiar a chave.
4. No Coolify, em *Environment Variables* da aplicação:
   - `RESEND_API_KEY` = a chave
   - `MAIL_FROM` = `EQ Seguros <site@eqseguros.com.br>`
5. Fazer o *Redeploy* e enviar um contato de teste.

### 2. reCAPTCHA (Google)

1. Em google.com/recaptcha/admin criar um site, tipo **reCAPTCHA v3**, com os domínios `eqseguros.com.br` e `www.eqseguros.com.br`.
2. No Coolify: `RECAPTCHA_SITE_KEY` (chave do site) e `RECAPTCHA_SECRET` (chave secreta).
3. Redeploy. O selo do reCAPTCHA fica escondido e o aviso exigido pelo Google aparece embaixo do formulário.

Sem essas chaves o formulário funciona, só sem o reCAPTCHA. As outras proteções seguem ativas: campo escondido, tempo mínimo de preenchimento, limite de 5 envios por 10 minutos por origem, aceitação só de envios vindos do próprio site e deduplicação de envios iguais.

## Conferir se está funcionando

- Enviar um contato pelo site e abrir *Mensagens recebidas*: ele deve estar lá, com "E-mail para a equipe: Enviado", e o e-mail deve chegar em `comercial@eqseguros.com.br`.
- Se aparecer "Falhou", o erro está no campo ao lado: quase sempre é domínio ainda não verificado no Resend, ou `MAIL_FROM` em um domínio diferente do verificado.
- Rotina: de vez em quando, olhar se há contatos sem "Atendida" e se algum ficou com e-mail "Falhou".

## Dados pessoais

Os contatos têm nome, e-mail, telefone e, em alguns formulários, CPF/CNPJ. Ficam só no banco do site (volume do Coolify), não vão para o Google Analytics nem para o Tag Manager (o evento `generate_lead` leva apenas o nome do formulário). O sistema **não apaga contatos sozinho**: o prazo de guarda precisa ser definido pelo cliente, e quem tem permissão de administrador pode apagar em *Mensagens recebidas*. O IP e o navegador de quem enviou não são guardados.

## Aviso de cookies (consentimento)

- Aparece na primeira visita, com **Aceitar todos**, **Rejeitar opcionais** e **Personalizar**. Rejeitar não impede nada: o site funciona igual.
- Antes da escolha **nada opcional carrega**: nenhum script do Google, do Clarity ou do Facebook, nenhum cookie opcional.
- O Consent Mode v2 do Google começa tudo negado e muda só depois do clique.
- A escolha fica salva no navegador (versão do aviso, data e categorias). O link **Configurações de privacidade**, no rodapé, reabre o painel para mudar ou revogar. Revogar apaga os cookies opcionais do site e recarrega a página sem as ferramentas.
- **Marketing** liga o Tag Manager (e dentro dele o Meta Pixel e o Google Ads). **Análise** liga o Google Analytics (ID direto) e o Clarity. O Tag Manager só carrega com Marketing porque o Meta Pixel do contêiner não obedece ao Consent Mode sozinho. Se o cliente quiser o GA4 do Tag Manager também com "Análise", é preciso antes, dentro do Tag Manager, exigir o consentimento `ad_storage` na tag do Meta Pixel e publicar o contêiner; depois a regra em `Index/public/assets/consent.js` (função `load`) pode ser aberta.
- Cookies do Clarity e da Microsoft gravados nos domínios deles (`clarity.ms`, `bing.com`) o site não consegue apagar; eles só deixam de ser enviados porque os scripts não carregam mais. Isso está dito no painel de preferências.
- **Mudou a finalidade, entrou uma ferramenta nova?** Atualizar a lista de cookies em `consent.js` (`INVENTORY`) e trocar `CONSENT_VERSION` em `Index/src/lib/tracking.ts`: o aviso volta a aparecer para todos.
- Teste automático, com o site em produção: `npm run test:consent` (aviso) e `npm run test:forms` (formulários, cria mensagens de teste no banco: use um banco de teste).

## Pendências jurídicas (não são código)

- A Política de Privacidade atual (copiada do site antigo, de março de 2023) **não fala de cookies nem de ferramentas de medição**. Recomenda-se que o jurídico do cliente inclua uma seção sobre cookies, finalidade, prazo de guarda dos contatos e canal do titular. O site não inventa esse texto.
- A frase embaixo dos formulários ("Ao enviar, você concorda com o uso dos seus dados para retornarmos o contato…") e os textos do aviso de cookies também precisam da aprovação do jurídico.
