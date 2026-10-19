'use strict';

/* ============================================================
   Leitura dos dados da BM pela Graph API (Marketing API).
   ============================================================ */
const API = 'https://graph.facebook.com/v23.0';

// Moedas sem centavos na API da Meta (offset 1); o resto usa offset 100
const SEM_CENTAVOS = new Set(['CLP', 'COP', 'CRC', 'HUF', 'ISK', 'IDR', 'JPY', 'KRW', 'PYG', 'TWD', 'VND']);

const CAMPOS_CONTA = [
  'name', 'account_id', 'account_status', 'currency', 'amount_spent', 'balance',
  'adtrust_dsl', 'timezone_name', 'timezone_offset_hours_utc', 'adspaymentcycle{threshold_amount}',
].join(',');

async function get(caminho, token, params = {}) {
  const url = new URL(caminho.startsWith('http') ? caminho : `${API}/${caminho}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!url.searchParams.has('access_token')) url.searchParams.set('access_token', token);
  const resp = await fetch(url);
  const json = await resp.json();
  if (json.error) throw new Error(json.error.error_user_msg || json.error.message);
  return json;
}

// Percorre todas as páginas de uma lista
async function todos(caminho, token, params) {
  const itens = [];
  let pagina = await get(caminho, token, { limit: 100, ...params });
  for (;;) {
    itens.push(...(pagina.data || []));
    if (!pagina.paging?.next) return itens;
    pagina = await get(pagina.paging.next, token);
  }
}

export function listarBMs(token) {
  return todos('me/businesses', token, { fields: 'id,name,created_time' });
}

function valor(centavos, moeda) {
  if (centavos == null || centavos === '') return 0;
  return Number(centavos) / (SEM_CENTAVOS.has(moeda) ? 1 : 100);
}

export function normalizarConta(c) {
  const moeda = c.currency || 'BRL';
  const dsl = Number(c.adtrust_dsl);
  const threshold = c.adspaymentcycle?.data?.[0]?.threshold_amount;
  return {
    id: c.account_id,
    nome: c.name,
    moeda,
    status: c.account_status,
    gasto: valor(c.amount_spent, moeda),
    // adtrust_dsl já vem em unidades da moeda; -1 significa sem limite
    limiteMeta: c.adtrust_dsl == null || dsl < 0 ? null : dsl,
    ciclo: threshold == null ? null : valor(threshold, moeda),
    divida: valor(c.balance, moeda),
    fuso: c.timezone_name,
    fusoOffset: c.timezone_offset_hours_utc,
  };
}

export async function carregarBM(bmId, token) {
  const [bm, contas] = await Promise.all([
    get(bmId, token, { fields: 'id,name,created_time' }),
    todos(`${bmId}/owned_ad_accounts`, token, { fields: CAMPOS_CONTA }),
  ]);
  return { id: bm.id, nome: bm.name, criadoEm: bm.created_time, contas: contas.map(normalizarConta) };
}

// Tenta pegar o token da sessão numa aba aberta do Gerenciador de Anúncios
export async function capturarToken() {
  const abas = await chrome.tabs.query({
    url: ['https://adsmanager.facebook.com/*', 'https://business.facebook.com/*'],
  });
  for (const aba of abas) {
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: aba.id },
        world: 'MAIN',
        func: () => window.__accessToken || (document.documentElement.innerHTML.match(/EAA[A-Za-z0-9]{30,}/) || [])[0] || null,
      });
      if (res?.result) return res.result;
    } catch {
      // aba sem permissão ou ainda carregando: tenta a próxima
    }
  }
  return null;
}
