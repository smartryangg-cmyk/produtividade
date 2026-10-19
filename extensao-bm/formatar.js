'use strict';

/* ============================================================
   Monta a mensagem da BM no padrão UNIT MIDIA.
   Recebe dados já normalizados (valores em unidades da moeda,
   não em centavos) e devolve o texto pronto para colar.
   ============================================================ */

// account_status da Marketing API
export const STATUS = {
  1: 'ATIVA',
  2: 'DESABILITADA',
  3: 'PENDENTE DE PAGAMENTO',
  7: 'EM ANÁLISE DE RISCO',
  8: 'PENDENTE DE LIQUIDAÇÃO',
  9: 'PERÍODO DE CARÊNCIA',
  100: 'PENDENTE DE FECHAMENTO',
  101: 'FECHADA',
};

const SIMBOLOS = { BRL: 'R$', USD: 'US$', EUR: '€', GBP: '£', MXN: 'MX$', ARS: 'AR$', COP: 'COL$' };

export function dinheiro(valor, moeda = 'BRL') {
  const num = Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${SIMBOLOS[moeda] || moeda} ${num}`;
}

function fuso(offset) {
  const n = Number(offset || 0);
  return n > 0 ? `+${n}` : `${n}`;
}

// Fuso que mais aparece entre as contas
function fusoPrincipal(contas) {
  const contagem = new Map();
  for (const c of contas) {
    if (!c.fuso) continue;
    const chave = `${c.fuso} (${fuso(c.fusoOffset)})`;
    contagem.set(chave, (contagem.get(chave) || 0) + 1);
  }
  let melhor = null;
  for (const [chave, qtd] of contagem) if (!melhor || qtd > melhor[1]) melhor = [chave, qtd];
  return melhor ? melhor[0] : null;
}

function moedaPrincipal(contas) {
  const contagem = {};
  for (const c of contas) contagem[c.moeda] = (contagem[c.moeda] || 0) + 1;
  return Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])[0] || 'BRL';
}

/* ---------- formatação do WhatsApp (porte fiel do site unitmidia.com.br) ----------
   Recebe texto puro (sem marcação) e aplica *negrito* e `destaque` linha a linha,
   exatamente como a função formatarWhatsApp do site. */
const normalizaTexto = (t) =>
  String(t || '').replace(/\r/g, '').replace(/([^\n*`])[ \t]*(?=👉|Ⓜ|\*?`?💰\s*VALOR)/gu, '$1\n');

export function formatarWhatsApp(texto) {
  if (/[*`]/.test(String(texto || ''))) return normalizaTexto(texto);
  let titulo = false;
  return normalizaTexto(texto).split('\n').map((l) => {
    const s = l.trim();
    if (!s) return l;
    if (!titulo) { titulo = true; return `*${s}*`; }
    let m;
    if ((m = s.match(/^(✅\s*CA\s*\d+\s*-\s*)(.+)$/i))) return `${m[1]}*\`${m[2]}\`*`;
    if ((m = s.match(/^(Limite (?:Meta|Extens[ãa]o):\s*)(.+)$/i))) return `${m[1]}*${m[2]}*`;
    if (/^Ⓜ️?\s*Informa[çc][õo]es Extras/i.test(s) || /^👉/u.test(s)) return `*\`${s}\`*`;
    if (/^💰\s*VALOR/i.test(s)) return `*${s}*`;
    return l;
  }).join('\n');
}

/**
 * bm: { nome, criadoEm: 'YYYY-MM-DD...', contas: [conta] }
 * conta: { nome, moeda, status, gasto, limiteMeta (null = sem limite),
 *          limiteExtensao, ciclo (null = sem ciclo), divida, fuso, fusoOffset }
 * opcoes: { codigo, valor }
 */
export function montarMensagem(bm, opcoes = {}) {
  const contas = bm.contas || [];
  const moeda = moedaPrincipal(contas);
  const ativas = contas.filter((c) => c.status !== 2 && c.status !== 101);
  const desabilitadas = contas.length - ativas.length;
  const gastoTotal = contas.reduce((s, c) => s + (c.gasto || 0), 0);
  const cicloAberto = ativas.reduce((s, c) => s + (c.ciclo || 0), 0);
  const ano = bm.criadoEm ? String(bm.criadoEm).slice(0, 4) : '—';

  // Linhas em texto puro; a marcação do WhatsApp é aplicada no fim.
  const titulo = ['UNIT MIDIA', moeda, opcoes.codigo].filter(Boolean).join(' ');
  const linhas = [
    `🔥 ${titulo} 🔥`,
    '',
    `💰 Gastos Totais: ${dinheiro(gastoTotal, moeda)}`,
    `💉 Ciclo Aberto: ${dinheiro(cicloAberto, moeda)}`,
    `🕰️ Ano de criação: ${ano}`,
    `⭐ ${contas.length} ${contas.length === 1 ? 'Conta' : 'Contas'} de Anúncios`,
  ];

  ativas.forEach((c, i) => {
    const num = String(i + 1).padStart(2, '0');
    const rotulo = c.status === 1 ? `CONTA EM ${c.moeda}` : `CONTA EM ${c.moeda} · ${STATUS[c.status] || 'STATUS ' + c.status}`;
    linhas.push('', `✅ CA ${num} - ${rotulo}`);
    linhas.push(`Gastos: ${dinheiro(c.gasto, c.moeda)}`);
    linhas.push(`Limite Meta: ${c.limiteMeta == null ? 'Sem limite' : dinheiro(c.limiteMeta, c.moeda)}`);
    const ext = c.limiteExtensao ?? c.limiteMeta;
    linhas.push(`Limite Extensão: ${ext == null ? 'Sem limite' : dinheiro(ext, c.moeda)}`);
    if (c.ciclo != null) linhas.push(`Ciclo: ${dinheiro(c.ciclo, c.moeda)}`);
    linhas.push(c.divida > 0 ? `Dívida: ${dinheiro(c.divida, c.moeda)}` : 'Sem Dívidas');
  });

  const extras = [];
  if (desabilitadas > 0) {
    extras.push(`👉🏼 ${desabilitadas} ${desabilitadas === 1 ? 'Conta desabilitada' : 'Contas desabilitadas'}`);
  }
  const fp = fusoPrincipal(contas);
  if (fp) extras.push(`👉🏼 Fuso Horário Principal: ${fp}`);
  if (extras.length) linhas.push('', 'Ⓜ️ Informações Extras', '', ...extras);

  if (opcoes.valor) linhas.push('', `💰 VALOR: ${opcoes.valor}`);

  return formatarWhatsApp(linhas.join('\n'));
}
