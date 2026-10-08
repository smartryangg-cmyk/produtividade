# Trabalho: Crowdfunding

Versão final para visualizadores e professores, em **duas versões**: com e sem a parte de videogames financiados por crowdfunding (Hollow Knight, Undertale, Chroma Squad e Star Citizen).

| | Com videogames | Sem videogames |
|---|---|---|
| Site | `index.html` (17 slides) | `sem-videogame.html` (16 slides) |
| Vídeo narrado | `video-com-videogame.mp4` (4min55s) | `video-sem-videogame.mp4` (4min16s) |
| Vídeo leve (para enviar) | `video-com-videogame-leve.mp4` | `video-sem-videogame-leve.mp4` |
| Narração | `narracao-com-videogame.mp3` | `narracao-sem-videogame.mp3` |
| Slides | `slides-com-videogame.pptx` | `slides-sem-videogame.pptx` |

Cada site tem um link no topo para a outra versão. Narração gerada com ElevenLabs (Eleven v4, voz "Henrique"). Imagens em `img/`, com créditos no fim de cada site.

Atalhos no site: setas trocam de slide · `F` tela cheia · `S` slides · `V` vídeo · `Espaço` play/pausa.

## Publicar em .pages.dev

Autenticação só por variável de ambiente, nunca em arquivo:

```bash
export CLOUDFLARE_API_TOKEN=...   # token com permissão "Cloudflare Pages: Edit"
npx wrangler pages project create crowdfunding-trabalho --production-branch main   # só na primeira vez
npx wrangler pages deploy trabalho-crowdfunding --project-name crowdfunding-trabalho --branch main
```

Endereços: https://crowdfunding-trabalho.pages.dev (com videogames) e https://crowdfunding-trabalho.pages.dev/sem-videogame (sem videogames).
