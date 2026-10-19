'use strict';

import { montarMensagem, dinheiro, STATUS } from './formatar.js';
import { listarBMs, carregarBM, capturarToken } from './meta.js';

const $ = (id) => document.getElementById(id);
const ehAtiva = (c) => c.status !== 2 && c.status !== 101;

let token = null;
let bms = []; // { id, nome, criadoEm, contas }
// Valores digitados pelo usuário, guardados entre sessões
let ajustes = { codigo: {}, valor: {}, limExt: {} };

function status(texto, tipo = '') {
  $('status').textContent = texto;
  $('status').className = tipo;
}

const salvar = () => chrome.storage.local.set({ ajustes });

// Aceita "1.262,37", "1262,37" ou "1262.37"
function lerNumero(texto) {
  const t = String(texto).trim();
  if (!t) return null;
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return Number.isFinite(n) ? n : null;
}

function el(tag, texto, classe) {
  const e = document.createElement(tag);
  if (texto != null) e.textContent = texto;
  if (classe) e.className = classe;
  return e;
}

function montarComAjustes(bm) {
  for (const c of bm.contas) c.limiteExtensao = ajustes.limExt[c.id] ?? null;
  return montarMensagem(bm, { codigo: ajustes.codigo[bm.id] || '', valor: ajustes.valor[bm.id] || '' });
}

function renderBM(bm) {
  const no = $('tplBM').content.firstElementChild.cloneNode(true);
  const ativas = bm.contas.filter(ehAtiva);
  const desab = bm.contas.length - ativas.length;
  const moeda = (ativas[0] || bm.contas[0] || {}).moeda || 'BRL';
  const gastoTotal = bm.contas.reduce((s, c) => s + (c.gasto || 0), 0);
  const ano = bm.criadoEm ? String(bm.criadoEm).slice(0, 4) : '—';

  no.querySelector('h2').textContent = bm.nome;
  no.querySelector('.sub').textContent = `${bm.id} · ${ano}`;
  const selo = no.querySelector('.selo');
  selo.textContent = desab ? `${desab} desabilitada(s)` : 'Tudo ativo';
  selo.classList.add(desab ? 'warn' : 'ok');

  const resumo = no.querySelector('.resumo');
  const bloco = (rot, val) => {
    const d = el('div');
    d.append(el('b', val), el('span', rot));
    return d;
  };
  resumo.append(
    bloco('Gastos totais', dinheiro(gastoTotal, moeda)),
    bloco('Contas', `${bm.contas.length} (${ativas.length} ativas)`),
  );

  const tbody = no.querySelector('tbody');
  ativas.forEach((c, i) => {
    const tr = el('tr');
    const nome = el('td', c.nome, 'nome');
    nome.title = `${c.nome} (${c.id})`;
    const icone = el('td', c.status === 1 ? '✅' : '⚠️');
    icone.title = STATUS[c.status] || `status ${c.status}`;
    const limExt = el('td');
    const inp = el('input');
    inp.placeholder = c.limiteMeta == null ? 'Sem limite' : c.limiteMeta.toFixed(2).replace('.', ',');
    inp.value = ajustes.limExt[c.id] != null ? String(ajustes.limExt[c.id]).replace('.', ',') : '';
    inp.addEventListener('input', () => {
      const v = lerNumero(inp.value);
      if (v == null) delete ajustes.limExt[c.id];
      else ajustes.limExt[c.id] = v;
      salvar();
    });
    limExt.append(inp);

    const divida = el('td', c.divida > 0 ? dinheiro(c.divida, c.moeda) : '—', c.divida > 0 ? 'divida' : '');
    tr.append(
      icone,
      nome,
      el('td', dinheiro(c.gasto, c.moeda)),
      el('td', c.limiteMeta == null ? 'Sem limite' : dinheiro(c.limiteMeta, c.moeda)),
      limExt,
      el('td', c.ciclo == null ? '—' : dinheiro(c.ciclo, c.moeda)),
      divida,
    );
    tbody.append(tr);
  });
  bm.contas.filter((c) => !ehAtiva(c)).forEach((c) => {
    const tr = el('tr', null, 'off');
    tr.append(
      el('td', '🚫'),
      (() => { const t = el('td', c.nome, 'nome'); t.title = `${c.nome} (${c.id})`; return t; })(),
      el('td', dinheiro(c.gasto, c.moeda)),
      el('td', STATUS[c.status] || `status ${c.status}`),
      el('td', '—'), el('td', '—'), el('td', '—'),
    );
    tbody.append(tr);
  });

  const cod = no.querySelector('.codigo');
  const val = no.querySelector('.valor');
  cod.value = ajustes.codigo[bm.id] || '';
  val.value = ajustes.valor[bm.id] || '';
  cod.addEventListener('input', () => { ajustes.codigo[bm.id] = cod.value.trim(); salvar(); });
  val.addEventListener('input', () => { ajustes.valor[bm.id] = val.value.trim(); salvar(); });

  no.querySelector('.copiar').addEventListener('click', async (e) => {
    await navigator.clipboard.writeText(montarComAjustes(bm));
    const b = e.currentTarget;
    const antes = b.textContent;
    b.textContent = 'Copiado!';
    setTimeout(() => { b.textContent = antes; }, 1200);
  });

  no.dataset.busca = `${bm.nome} ${bm.id} ${bm.contas.map((c) => c.nome).join(' ')}`.toLowerCase();
  return no;
}

function render() {
  const q = $('busca').value.trim().toLowerCase();
  const lista = $('lista');
  lista.replaceChildren();
  const visiveis = bms.filter((bm) => !q || `${bm.nome} ${bm.id} ${bm.contas.map((c) => c.nome).join(' ')}`.toLowerCase().includes(q));
  if (!visiveis.length) {
    lista.append(el('p', q ? 'Nada encontrado para a busca.' : 'Nenhuma BM neste perfil.'));
    return;
  }
  for (const bm of visiveis) lista.append(renderBM(bm));
}

async function carregarTudo() {
  $('atualizar').disabled = true;
  try {
    if (!token) {
      status('Procurando o perfil logado…');
      token = await capturarToken();
    }
    if (!token) {
      status('Abra o Gerenciador de Anúncios (adsmanager.facebook.com) numa aba e clique em ⟳, ou cole um token em "Token manual".', 'erro');
      return;
    }
    status('Carregando BMs…');
    const lista = await listarBMs(token);
    if (!lista.length) { bms = []; render(); status('Nenhuma BM neste perfil.'); return; }
    status(`Lendo ${lista.length} BM(s)…`);
    bms = [];
    for (const b of lista) {
      bms.push(await carregarBM(b.id, token));
      render();
    }
    status(`${bms.length} BM(s) carregada(s).`);
  } catch (e) {
    status(e.message || String(e), 'erro');
  } finally {
    $('atualizar').disabled = false;
  }
}

$('busca').addEventListener('input', render);
$('atualizar').addEventListener('click', () => { token = null; carregarTudo(); });
$('usarToken').addEventListener('click', async () => {
  const t = $('token').value.trim();
  if (!t) return;
  token = t;
  await chrome.storage.local.set({ token: t });
  carregarTudo();
});

(async () => {
  const dados = await chrome.storage.local.get(['ajustes', 'token']);
  if (dados.ajustes) ajustes = { codigo: {}, valor: {}, limExt: {}, ...dados.ajustes };
  if (dados.token) { token = dados.token; $('token').value = dados.token; }
  carregarTudo();
})();
