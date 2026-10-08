# Trabalho: Crowdfunding

Site da apresentação com **1 slide** e **1 vídeo** (passo a passo, impacto social e plataformas de arrecadação).

| Arquivo | O que é |
|---|---|
| `index.html` | Site da apresentação: aba Slide e aba Vídeo (tela cheia, legendas, capítulos, roteiro de narração) |
| `video-crowdfunding.mp4` | Vídeo exportado (1080p, 1min21s, sem áudio: narre usando o roteiro do site) |
| `slide-crowdfunding.pptx` | O slide em PowerPoint, para entregar ou abrir offline |

Atalhos no site: `F` tela cheia · `S` slide · `V` vídeo · `Espaço` play/pausa.

## Publicar em .pages.dev

Autenticação só por variável de ambiente, nunca em arquivo:

```bash
export CLOUDFLARE_API_TOKEN=...   # token com permissão "Cloudflare Pages: Edit"
npx wrangler pages project create crowdfunding-trabalho --production-branch main   # só na primeira vez
npx wrangler pages deploy trabalho-crowdfunding --project-name crowdfunding-trabalho --branch main
```

Endereço: https://crowdfunding-trabalho.pages.dev
