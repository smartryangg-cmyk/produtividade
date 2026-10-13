# Trabalho: Crowdfunding

Versão final para visualizadores e professores, em **duas versões**: com e sem a parte de videogames financiados por crowdfunding (Hollow Knight, Undertale, Chroma Squad e Star Citizen).

| | Com videogames | Sem videogames |
|---|---|---|
| Site | `index.html` (tema branco, principal, 19 slides), `classico.html` e `comico.html` (quadrinhos) | `sem-videogame.html` (17 slides) |
| Vídeo narrado | `video-com-videogame.mp4` (6min51s) | `video-sem-videogame.mp4` (4min25s) |
| Vídeo leve (para enviar) | `video-com-videogame-leve.mp4` | `video-sem-videogame-leve.mp4` |
| Narração | `narracao-com-videogame.mp3` | `narracao-sem-videogame.mp3` |
| Slides | `slides-com-videogame.pptx` | `slides-sem-videogame.pptx` |

Cada site tem duas abas, **Slides** e **Vídeo**. O vídeo tem controles como os do YouTube (play/pausa, volume, barra de progresso arrastável, legendas, tela cheia e sair da tela cheia). O site também tem links no topo para as outras versões e a seção "Quem fez este trabalho" (Ryan, Wesley e Pedro) com QR code e botões de compartilhar.

Fontes: Halvarson (Måns Greback, uso pessoal) nos títulos e Anak Manja (Khurasan, grátis) nos destaques, em `fonts/`. Narração da versão com videogames gerada com ElevenLabs (Eleven v4, voz "Sandro Dutra", narração neutra); a versão sem videogames ainda usa a narração anterior (voz "Henrique"). Números e valores usam a fonte Rubik. Imagens em `img/`, com créditos no fim de cada site.

Atalhos no site: setas trocam de slide (no vídeo, voltam/avançam 5 s) · `F` tela cheia · `Esc` sai da tela cheia · `S` slides · `V` vídeo · `Espaço` play/pausa · `M` som · `C` legendas. No celular, deslize para o lado para trocar de slide.

## Publicar em .pages.dev

Autenticação só por variável de ambiente, nunca em arquivo:

```bash
export CLOUDFLARE_API_TOKEN=...   # token com permissão "Cloudflare Pages: Edit"
npx wrangler pages project create crowdfunding-trabalho --production-branch main   # só na primeira vez
npx wrangler pages deploy trabalho-crowdfunding --project-name crowdfunding-trabalho --branch main
```

Domínio: https://kranoedu.site (tema branco, principal), https://kranoedu.site/classico (tema clássico), https://kranoedu.site/comico (tema de quadrinhos) e https://kranoedu.site/sem-videogame (sem videogames). No painel do Cloudflare Pages, adicione o domínio em Custom domains.
