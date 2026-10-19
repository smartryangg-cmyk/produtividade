// Teste do formatador: node extensao-bm/teste.mjs
import assert from 'node:assert/strict';
import { montarMensagem } from './formatar.js';
import { normalizarConta } from './meta.js';

const fuso = { timezone_name: 'America/Los_Angeles', timezone_offset_hours_utc: -7 };
const contas = [
  { name: 'A', account_id: '1', account_status: 1, currency: 'BRL', amount_spent: '1432971', balance: '26268',
    adtrust_dsl: 1549.24, adspaymentcycle: { data: [{ threshold_amount: 41000 }] }, ...fuso },
  { name: 'B', account_id: '2', account_status: 1, currency: 'BRL', amount_spent: '506745', balance: '0',
    adtrust_dsl: 1248.44, adspaymentcycle: { data: [{ threshold_amount: 5700 }] }, ...fuso },
  { name: 'C', account_id: '3', account_status: 2, currency: 'BRL', amount_spent: '2000000', balance: '0', adtrust_dsl: -1, ...fuso },
  { name: 'D', account_id: '4', account_status: 2, currency: 'BRL', amount_spent: '2000000', balance: '0', adtrust_dsl: -1, ...fuso },
  { name: 'E', account_id: '5', account_status: 2, currency: 'BRL', amount_spent: '557820', balance: '0', adtrust_dsl: -1, ...fuso },
].map(normalizarConta);
contas[1].limiteExtensao = 1262.37;

const esperado = `*🔥 UNIT MIDIA BRL A3290 🔥*

💰 Gastos Totais: R$ 64.975,36
💉 Ciclo Aberto: R$ 467,00
🕰️ Ano de criação: 2024
⭐ 5 Contas de Anúncios

✅ CA 01 - *\`CONTA EM BRL\`*
Gastos: R$ 14.329,71
Limite Meta: *R$ 1.549,24*
Limite Extensão: *R$ 1.549,24*
Ciclo: R$ 410,00
Dívida: R$ 262,68

✅ CA 02 - *\`CONTA EM BRL\`*
Gastos: R$ 5.067,45
Limite Meta: *R$ 1.248,44*
Limite Extensão: *R$ 1.262,37*
Ciclo: R$ 57,00
Sem Dívidas

*\`Ⓜ️ Informações Extras\`*

*\`👉🏼 3 Contas desabilitadas\`*
*\`👉🏼 Fuso Horário Principal: America/Los_Angeles (-7)\`*

*💰 VALOR: 700*`;

const msg = montarMensagem({ criadoEm: '2024-03-10T12:00:00+0000', contas }, { codigo: 'A3290', valor: '700' });
assert.equal(msg, esperado);
console.log('ok');
