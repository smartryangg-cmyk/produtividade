# Trabalho: Crowdfunding

Site da apresentação com **12 slides** e **1 vídeo** (passo a passo, impacto social e plataformas de arrecadação), com fala sugerida para cada slide e referências.

| Arquivo | O que é |
|---|---|
| `index.html` | Site da apresentação: aba Slides (12 slides, setas, tela cheia, fala de cada slide) e aba Vídeo (legendas, capítulos, roteiro) |
| `video-crowdfunding.mp4` | Vídeo exportado (1080p, 1min41s, sem áudio: narre usando o roteiro do site) |
| `slides-crowdfunding.pptx` | Os 12 slides em PowerPoint, com a fala nas anotações do apresentador |

Atalhos no site: setas trocam de slide · `F` tela cheia · `S` slides · `V` vídeo · `Espaço` play/pausa.

## Publicar em .pages.dev

Autenticação só por variável de ambiente, nunca em arquivo:

```bash
export CLOUDFLARE_API_TOKEN=...   # token com permissão "Cloudflare Pages: Edit"
npx wrangler pages project create crowdfunding-trabalho --production-branch main   # só na primeira vez
npx wrangler pages deploy trabalho-crowdfunding --project-name crowdfunding-trabalho --branch main
```

Endereço: https://crowdfunding-trabalho.pages.dev
