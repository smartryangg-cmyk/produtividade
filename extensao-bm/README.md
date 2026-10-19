# BM Unit Midia (extensão Chrome)

Lê os dados de uma Business Manager pela Graph API da Meta e monta a mensagem no padrão UNIT MIDIA, pronta para copiar e colar no WhatsApp.

## Instalar

1. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e escolha a pasta `extensao-bm/`.

## Usar

1. Faça login no Facebook com o perfil que quer consultar e deixe uma aba do [Gerenciador de Anúncios](https://adsmanager.facebook.com) aberta.
2. Clique no ícone da extensão. Ela lista sozinha **todas as BMs** do perfil logado, cada uma num cartão com o resumo e a tabela de contas.
3. Use a busca no topo para filtrar por nome de BM ou conta. O botão ⟳ recarrega (útil ao trocar de perfil).
4. Em cada cartão, preencha **Código** (ex.: `A3290`) e **Valor** (ex.: `700`), ajuste o *Lim. ext.* das contas se precisar e clique em **Copiar mensagem**.

Funciona em qualquer perfil: ela usa a sessão do Facebook logada no navegador, sem precisar colar nada. Se a captura automática falhar, abra **Token manual** e cole um token com `ads_read` / `business_management`.

O que você digita (código, valor, limite de extensão) e o token ficam salvos só neste navegador (`chrome.storage.local`).

## De onde vem cada dado

| Mensagem | Campo da API |
|---|---|
| Moeda no título | moeda mais comum entre as contas |
| Gastos Totais | soma de `amount_spent` de todas as contas |
| Ciclo Aberto | soma do *Ciclo* das contas não desabilitadas |
| Ano de criação | `created_time` da BM |
| Contas de Anúncios | total de `owned_ad_accounts` |
| Gastos | `amount_spent` |
| Limite Meta | `adtrust_dsl` (limite de gasto diário; `-1` = sem limite) |
| Limite Extensão | digitado no popup; se vazio, igual ao Limite Meta |
| Ciclo | `adspaymentcycle.threshold_amount` (limite de cobrança) |
| Dívida | `balance` |
| Contas desabilitadas | contas com `account_status` 2 ou 101 |
| Fuso Horário Principal | fuso mais comum entre as contas |

Contas com outro status (pendente de pagamento, em análise etc.) aparecem com ⚠️ e o status ao lado.

## Teste

```bash
node teste.mjs
```
