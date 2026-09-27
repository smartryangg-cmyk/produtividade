# Produtividade

Web app pessoal de produtividade: **tarefas, foco (Pomodoro), hábitos e notas** em um só lugar.

Feito em HTML, CSS e JavaScript puros: sem dependências, sem build e sem servidor.
Os dados ficam salvos no próprio navegador (`localStorage`).

## Módulos

- **Hoje**: painel do dia com tarefas pendentes/atrasadas, hábitos para marcar, minutos de foco e gráfico da semana.
- **Tarefas**: prioridade, prazo e projetos (digite `#projeto` no título). Filtros Abertas / Hoje / Próximas / Concluídas / Todas, e busca.
- **Foco**: timer Pomodoro com foco, pausa curta e pausa longa, ciclos configuráveis, som e notificação ao terminar e histórico dos últimos 7 dias. O timer continua rodando mesmo se você trocar de aba no app.
- **Hábitos**: grade dos últimos 7 dias com sequência (🔥) de cada hábito.
- **Notas**: notas com salvamento automático e opção de fixar.

Extras: tema claro/escuro, backup e restauração em JSON, layout para celular e instalação como app (PWA, funciona offline).

## Como rodar

Sirva a pasta com qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Também é possível abrir o `index.html` direto no navegador, mas nesse caso o modo offline/instalação (service worker) fica desativado.

### Publicar no GitHub Pages

Em **Settings → Pages**, escolha *Deploy from a branch*, a branch desejada e a pasta `/ (root)`.

## Estrutura

```
index.html            # estrutura e navegação
styles.css            # visual (tema claro/escuro, responsivo)
app.js                # lógica de todos os módulos
sw.js                 # service worker (offline)
manifest.webmanifest  # metadados do PWA
icons/icon.svg        # ícone
```

> Os dados ficam só no navegador/dispositivo em uso. Use **Backup** de vez em quando para não perdê-los.
