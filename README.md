# Wireframe EQ Seguros — deploy

Site estático de arquivo único. O `index.html` é autossuficiente
(CSS e JS embutidos; fontes via Google Fonts CDN). Não precisa de build.

## Opções para subir em server temporário

**Netlify Drop (mais rápido, sem conta de CLI)**
1. Acesse https://app.netlify.com/drop
2. Arraste a pasta `deploy/` inteira para a página.
3. Recebe uma URL temporária na hora.

**Surge**
    npm i -g surge
    cd deploy
    surge .

**Vercel**
    npm i -g vercel
    cd deploy
    vercel

**GitHub Pages**
    Suba o conteúdo de `deploy/` num repositório e ative Pages na branch.

**Teste local**
    cd deploy
    python3 -m http.server 8080
    # abre http://localhost:8080
