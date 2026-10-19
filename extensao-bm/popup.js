'use strict';

import { montarMensagem } from './formatar.js';
import { listarBMs, carregarBM, capturarToken } from './meta.js';

const $ = (id) => document.getElementById(id);
let bmAtual = null;

function status(texto, tipo = '') {
  $('status').textContent = texto;
  $('status').className = tipo;
}

async function ocupado(botao, fn) {
  botao.disabled = true;
  try {
    await fn();
  } catch (e) {
    status(e.message || String(e), 'erro');
  } finally {
    botao.disabled = false;
  }
}

// Aceita "1.262,37", "1262,37" ou "1262.37"
function lerNumero(texto) {
  const t = String(texto).trim();
  if (!t) return null;
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return Number.isFinite(n) ? n : null;
}

function atualizarMensagem() {
  if (!bmAtual) return;
  $('mensagem').value = montarMensagem(bmAtual, { codigo: $('codigo').value.trim(), valor: $('valor').value.trim() });
}

function renderContas() {
  const ativas = bmAtual.contas.filter((c) => c.status !== 2 && c.status !== 101);
  const lista = $('contas');
  lista.replaceChildren();
  ativas.forEach((c, i) => {
    const linha = document.createElement('div');
    linha.className = 'conta';
    const nome = document.createElement('span');
    nome.textContent = `CA ${String(i + 1).padStart(2, '0')} · ${c.nome}`;
    nome.title = `${c.nome} (${c.id})`;
    const input = document.createElement('input');
    input.placeholder = c.limiteMeta == null ? 'Sem limite' : c.limiteMeta.toFixed(2).replace('.', ',');
    input.addEventListener('input', () => {
      c.limiteExtensao = lerNumero(input.value);
      atualizarMensagem();
    });
    linha.append(nome, input);
    lista.append(linha);
  });
  $('secaoContas').hidden = ativas.length === 0;
}

$('capturar').addEventListener('click', (e) => ocupado(e.currentTarget, async () => {
  const token = await capturarToken();
  if (!token) throw new Error('Abra o Gerenciador de Anúncios (adsmanager.facebook.com) em outra aba e tente de novo.');
  $('token').value = token;
  await chrome.storage.local.set({ token });
  status('Token capturado.', 'ok');
}));

$('carregarBMs').addEventListener('click', (e) => ocupado(e.currentTarget, async () => {
  const token = $('token').value.trim();
  if (!token) throw new Error('Informe ou capture o token.');
  await chrome.storage.local.set({ token });
  status('Carregando BMs…');
  const bms = await listarBMs(token);
  $('bm').replaceChildren(...bms.map((b) => new Option(`${b.name} (${b.id})`, b.id)));
  $('secaoBM').hidden = bms.length === 0;
  status(bms.length ? `${bms.length} BM(s) encontrada(s).` : 'Nenhuma BM neste perfil.', bms.length ? 'ok' : 'erro');
}));

$('gerar').addEventListener('click', (e) => ocupado(e.currentTarget, async () => {
  status('Lendo contas de anúncio…');
  bmAtual = await carregarBM($('bm').value, $('token').value.trim());
  renderContas();
  atualizarMensagem();
  $('secaoMsg').hidden = false;
  status(`${bmAtual.contas.length} conta(s) lida(s).`, 'ok');
}));

$('codigo').addEventListener('input', atualizarMensagem);
$('valor').addEventListener('input', atualizarMensagem);

$('copiar').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('mensagem').value);
  status('Mensagem copiada!', 'ok');
});

chrome.storage.local.get('token').then(({ token }) => {
  if (token) $('token').value = token;
});
