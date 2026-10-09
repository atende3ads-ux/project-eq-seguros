# Páginas de serviço pelo painel

Para o cliente acrescentar um seguro novo ao site sem chamar a agência.

## Como criar

1. Entrar no painel (`/admin`) com um usuário **Administrador**.
2. Abrir **Páginas do site** e clicar em **+ Nova página de serviço**.
3. Escolher o **modelo** (Seguro de Vida, Prestamista, Acidentes Pessoais, Funeral ou Viagem), dar o **nome** da página e conferir o **endereço**. O endereço é sugerido a partir do nome (`Seguro Residencial` vira `/seguro-residencial`) e pode ser mudado. Opcional: uma **frase curta** para o card do menu.
4. **Criar página.** O painel abre a página nova, que é uma cópia do modelo, como ele está hoje no painel, com o nome novo no título principal e na trilha de navegação.
5. Reescrever as seções (textos, coberturas, FAQ, imagens, links), preencher a aba **SEO e publicação** (frase-chave, título e descrição) e, na seção **Menu Seguros** da mesma aba, conferir o nome, a frase e o ícone do card.
6. Em **Visibilidade**, trocar de *Rascunho* para *Publicada* e salvar.

A página nasce como **rascunho**: enquanto não for publicada ela não existe no site (dá 404), não aparece no menu e não entra no sitemap. Assim ninguém vê o texto do modelo com o nome novo por engano.

## O que acontece sozinho ao publicar

- O card entra no menu **Seguros → Para Pessoas**, depois dos cinco atuais, em todas as páginas do site (inclusive no menu do celular).
- A página entra no `sitemap.xml`.
- Nas **Páginas do site**, ela aparece no grupo *Seguros* do menu lateral, com o nome do menu.
- Desmarcar **Mostrar no menu Seguros**, voltar para rascunho ou apagar a página tira o card do menu na hora.

## O que não acontece sozinho

- A lista de produtos da página **/seguros** é um bloco de cards editável da própria página. Para o seguro novo aparecer lá também, edite essa seção.
- O endereço não pode ser mudado depois de criado (para não quebrar links já divulgados). Para trocar, crie uma página nova com o endereço certo e apague a errada.
- Só as páginas criadas pelo painel podem ser apagadas. As páginas originais do site não.
- A página usa o **desenho** do modelo: dá para mudar tudo o que é texto, imagem e link, mas não acrescentar seções que o modelo não tem. Para um desenho novo, é trabalho de desenvolvimento.

## Para o desenvolvedor

- Modelos e ícones: `Index/src/lib/service-pages.ts` (`SERVICE_MODELS`) e `Index/src/lib/menu-icons.ts`.
- A página criada guarda o modelo em `template`; o site usa o desenho dele (`SitePage`) e o painel, o mapa de seções dele (`SectionsEditor`, `SeoAnalysis`).
- Criação: `POST /api/pages/novo-servico` (só administrador), em `Index/src/cms/service-pages-endpoint.ts`. Criar página em branco pela API está bloqueado de propósito (`access.create`).
- Teste de ponta a ponta, com o site em produção e banco de teste: `echo '{"email":"…","password":"…"}' | npm run test:service-pages`.
