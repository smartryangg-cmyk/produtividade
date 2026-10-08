# Trabalho: Crowdfunding

Versão final para visualizadores e professores: **16 slides** e **1 vídeo narrado** sobre financiamento coletivo, com passo a passo, impacto social, plataformas de arrecadação, casos reais, imagens reais e referências.

| Arquivo | O que é |
|---|---|
| `index.html` | Site da apresentação: aba Slides (16 slides, setas, tela cheia) e aba Vídeo (narração, legendas, capítulos) |
| `video-crowdfunding.mp4` | Vídeo final em 1080p com narração (4min16s) |
| `narracao-crowdfunding.mp3` | Narração do vídeo, gerada com ElevenLabs (Eleven v4, voz "Henrique") |
| `slides-crowdfunding.pptx` | Os 16 slides em PowerPoint |
| `img/` | Imagens usadas: fotos do Wikimedia Commons e capturas de tela das plataformas (créditos no site) |

Atalhos no site: setas trocam de slide · `F` tela cheia · `S` slides · `V` vídeo · `Espaço` play/pausa.

## Publicar em .pages.dev

Autenticação só por variável de ambiente, nunca em arquivo:

```bash
export CLOUDFLARE_API_TOKEN=...   # token com permissão "Cloudflare Pages: Edit"
npx wrangler pages project create crowdfunding-trabalho --production-branch main   # só na primeira vez
npx wrangler pages deploy trabalho-crowdfunding --project-name crowdfunding-trabalho --branch main
```

Endereço: https://crowdfunding-trabalho.pages.dev
