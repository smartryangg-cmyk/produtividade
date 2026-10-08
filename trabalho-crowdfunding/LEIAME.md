# Trabalho: Crowdfunding

Versão final para visualizadores e professores, em **duas versões**: com e sem a parte de videogames financiados por crowdfunding (Hollow Knight, Undertale, Chroma Squad e Star Citizen).

| | Com videogames | Sem videogames |
|---|---|---|
| Site | `index.html` (18 slides) | `sem-videogame.html` (17 slides) |
| Vídeo narrado | `video-com-videogame.mp4` (5min04s) | `video-sem-videogame.mp4` (4min25s) |
| Vídeo leve (para enviar) | `video-com-videogame-leve.mp4` | `video-sem-videogame-leve.mp4` |
| Narração | `narracao-com-videogame.mp3` | `narracao-sem-videogame.mp3` |
| Slides | `slides-com-videogame.pptx` | `slides-sem-videogame.pptx` |

Cada site tem três abas: **Slides**, **Vídeo** e **Atividade** (simulador de campanha e quiz para os apresentadores fazerem com a turma), um link no topo para a outra versão, a seção "Quem fez este trabalho" (Ryan, Wesley e Pedro) com QR code e botões de compartilhar.

Fontes: Halvarson (Måns Greback, uso pessoal) nos títulos e Anak Manja (Khurasan, grátis) nos destaques, em `fonts/`. Narração gerada com ElevenLabs (Eleven v4, voz "Henrique"). Imagens em `img/`, com créditos no fim de cada site.

Atalhos no site: setas trocam de slide · `F` tela cheia · `S` slides · `V` vídeo · `Espaço` play/pausa.

## Publicar em .pages.dev

Autenticação só por variável de ambiente, nunca em arquivo:

```bash
export CLOUDFLARE_API_TOKEN=...   # token com permissão "Cloudflare Pages: Edit"
npx wrangler pages project create crowdfunding-trabalho --production-branch main   # só na primeira vez
npx wrangler pages deploy trabalho-crowdfunding --project-name crowdfunding-trabalho --branch main
```

Domínio: https://kranoedu.site (com videogames) e https://kranoedu.site/sem-videogame (sem videogames). No painel do Cloudflare Pages, adicione o domínio em Custom domains.
