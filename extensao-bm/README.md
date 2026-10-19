# BM Unit Midia (extensão Chrome)

Lê os dados de uma Business Manager pela Graph API da Meta e monta a mensagem no padrão UNIT MIDIA, pronta para copiar e colar no WhatsApp.

## Instalar

1. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e escolha a pasta `extensao-bm/`.

## Usar

1. Faça login no Facebook e deixe uma aba do [Gerenciador de Anúncios](https://adsmanager.facebook.com) aberta.
2. Abra a extensão e clique em **Capturar**. Se preferir, cole um token de acesso com a permissão `ads_read` / `business_management`.
3. Clique em **Carregar BMs**, escolha a BM e preencha **Código** (ex.: `A3290`) e **Valor** (ex.: `700`).
4. Clique em **Gerar mensagem**. Se quiser, ajuste o *Limite Extensão* de cada conta e clique em **Copiar**.

O token fica salvo só neste navegador (`chrome.storage.local`).

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
