'use strict';

/* ============================================================
   Estado e persistência (localStorage)
   ============================================================ */
const STORAGE_KEY = 'produtividade:v1';

const DEFAULT_STATE = {
  tasks: [],
  habits: [],
  notes: [],
  focus: {
    settings: { foco: 25, pausa: 5, longa: 15, ciclos: 4 },
    sessions: [], // { date: 'YYYY-MM-DD', minutes: number }
    timer: { mode: 'foco', running: false, endsAt: null, remaining: null, cycle: 0 },
  },
  ui: { taskFilter: 'abertas', taskSearch: '', activeNote: null, theme: null },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return mergeDefaults(JSON.parse(raw), DEFAULT_STATE);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function mergeDefaults(obj, defaults) {
  const out = structuredClone(defaults);
  for (const key of Object.keys(obj || {})) {
    const d = defaults[key];
    out[key] = d && typeof d === 'object' && !Array.isArray(d) ? mergeDefaults(obj[key], d) : obj[key];
  }
  return out;
}

let state = loadState();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast('Não foi possível salvar os dados neste navegador.');
  }
}

/* ============================================================
   Utilidades
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function lastDays(n) {
  return Array.from({ length: n }, (_, i) => addDays(new Date(), i - n + 1));
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formatDue(iso) {
  if (!iso) return '';
  const today = isoDate();
  if (iso === today) return 'Hoje';
  if (iso === isoDate(addDays(new Date(), 1))) return 'Amanhã';
  if (iso === isoDate(addDays(new Date(), -1))) return 'Ontem';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function mmss(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ============================================================
   Tarefas
   ============================================================ */
const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 };
const PRIORITY_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const da = a.due || '9999-99-99';
    const db = b.due || '9999-99-99';
    if (da !== db) return da < db ? -1 : 1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

function taskItem(t) {
  const today = isoDate();
  const overdue = !t.done && t.due && t.due < today;
  return `
    <li class="task ${t.done ? 'done' : ''}">
      <input type="checkbox" data-action="toggle-task" data-id="${t.id}" ${t.done ? 'checked' : ''} aria-label="Concluir tarefa">
      <span class="prio ${t.priority}" title="Prioridade ${PRIORITY_LABEL[t.priority]}"></span>
      <div class="body">
        <div class="title">${esc(t.title)}</div>
        <div class="meta">
          ${t.due ? `<span class="${overdue ? 'overdue' : ''}">📅 ${formatDue(t.due)}${overdue ? ' · atrasada' : ''}</span>` : ''}
          ${t.project ? `<span class="tag">#${esc(t.project)}</span>` : ''}
        </div>
      </div>
      <button class="icon-btn" data-action="edit-task" data-id="${t.id}" title="Editar" aria-label="Editar">✏️</button>
      <button class="icon-btn" data-action="delete-task" data-id="${t.id}" title="Excluir" aria-label="Excluir">🗑️</button>
    </li>`;
}

function taskForm() {
  return `
    <form class="task-form" data-form="task">
      <input type="text" name="title" placeholder="Nova tarefa… (use #projeto para categorizar)" required autocomplete="off">
      <input type="date" name="due" aria-label="Prazo">
      <select name="priority" aria-label="Prioridade">
        <option value="media">Média</option>
        <option value="alta">Alta</option>
        <option value="baixa">Baixa</option>
      </select>
      <button type="submit">Adicionar</button>
    </form>`;
}

function addTaskFromForm(form) {
  const data = new FormData(form);
  let title = String(data.get('title') || '').trim();
  if (!title) return;
  let project = '';
  const m = title.match(/(?:^|\s)#([\p{L}\p{N}_-]+)/u);
  if (m) {
    project = m[1];
    title = title.replace(m[0], ' ').replace(/\s+/g, ' ').trim() || project;
  }
  state.tasks.push({
    id: uid(),
    title,
    project,
    due: data.get('due') || null,
    priority: data.get('priority') || 'media',
    done: false,
    createdAt: Date.now(),
    doneAt: null,
  });
  save();
  render();
  $('[data-form="task"] input[name="title"]')?.focus();
}

function renderTasks() {
  const { taskFilter, taskSearch } = state.ui;
  const today = isoDate();
  const q = taskSearch.trim().toLowerCase();
  const filters = {
    abertas: (t) => !t.done,
    hoje: (t) => !t.done && t.due && t.due <= today,
    proximas: (t) => !t.done && t.due && t.due > today,
    concluidas: (t) => t.done,
    todas: () => true,
  };
  const list = sortTasks(
    state.tasks.filter(filters[taskFilter] || filters.abertas).filter(
      (t) => !q || t.title.toLowerCase().includes(q) || (t.project || '').toLowerCase().includes(q)
    )
  );
  const open = state.tasks.filter((t) => !t.done).length;
  const labels = { abertas: 'Abertas', hoje: 'Hoje', proximas: 'Próximas', concluidas: 'Concluídas', todas: 'Todas' };

  return `
    <div class="page-head">
      <div><h1>Tarefas</h1><div class="muted">${open} em aberto</div></div>
    </div>
    <div class="card">
      ${taskForm()}
      <div class="toolbar">
        <div class="chips">
          ${Object.entries(labels).map(([k, v]) => `<button class="chip ${taskFilter === k ? 'active' : ''}" data-action="task-filter" data-value="${k}">${v}</button>`).join('')}
        </div>
        <input type="search" placeholder="Buscar…" value="${esc(taskSearch)}" data-input="task-search" aria-label="Buscar tarefas">
      </div>
      ${list.length ? `<ul class="task-list">${list.map(taskItem).join('')}</ul>` : `<div class="empty">Nada por aqui. ✨</div>`}
      ${taskFilter === 'concluidas' && list.length ? `<div style="margin-top:12px"><button class="ghost small" data-action="clear-done">Limpar concluídas</button></div>` : ''}
    </div>`;
}

/* ============================================================
   Foco (Pomodoro)
   ============================================================ */
const MODE_LABEL = { foco: 'Foco', pausa: 'Pausa curta', longa: 'Pausa longa' };

function modeDuration(mode) {
  return state.focus.settings[mode] * 60 * 1000;
}

function timerRemaining() {
  const t = state.focus.timer;
  if (t.running && t.endsAt) return t.endsAt - Date.now();
  return t.remaining ?? modeDuration(t.mode);
}

function startTimer() {
  const t = state.focus.timer;
  t.endsAt = Date.now() + timerRemaining();
  t.running = true;
  t.remaining = null;
  save();
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  render();
}

function pauseTimer() {
  const t = state.focus.timer;
  t.remaining = timerRemaining();
  t.running = false;
  t.endsAt = null;
  save();
  render();
}

function setMode(mode) {
  const t = state.focus.timer;
  Object.assign(t, { mode, running: false, endsAt: null, remaining: null });
  save();
  render();
}

function finishTimer() {
  const t = state.focus.timer;
  const finished = t.mode;
  if (finished === 'foco') {
    state.focus.sessions.push({ date: isoDate(), minutes: state.focus.settings.foco });
    t.cycle += 1;
  }
  const next = finished === 'foco' ? (t.cycle % state.focus.settings.ciclos === 0 ? 'longa' : 'pausa') : 'foco';
  Object.assign(t, { mode: next, running: false, endsAt: null, remaining: null });
  save();
  beep();
  const msg = finished === 'foco' ? 'Sessão de foco concluída! Hora de uma pausa.' : 'Pausa encerrada. Bora focar!';
  toast(msg);
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('Produtividade', { body: msg, icon: 'icons/icon.svg' }); } catch { /* ignora */ }
  }
  render();
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.3);
    });
  } catch { /* sem áudio */ }
}

function focusMinutesOn(dateIso) {
  return state.focus.sessions.filter((s) => s.date === dateIso).reduce((a, s) => a + s.minutes, 0);
}

function weekBars() {
  const days = lastDays(7).map((d) => ({ label: WEEKDAYS[d.getDay()], min: focusMinutesOn(isoDate(d)) }));
  const max = Math.max(60, ...days.map((d) => d.min));
  return `<div class="bars">${days
    .map((d) => `<div class="bar-col" title="${d.min} min"><div class="bar" style="height:${(d.min / max) * 100}%"></div><span>${d.label}</span></div>`)
    .join('')}</div>`;
}

const RING_R = 108;
const RING_C = 2 * Math.PI * RING_R;

function renderFocus() {
  const t = state.focus.timer;
  const s = state.focus.settings;
  const rem = timerRemaining();
  const progress = 1 - rem / modeDuration(t.mode);
  return `
    <div class="page-head">
      <div><h1>Foco</h1><div class="muted">Técnica Pomodoro · ciclo ${(t.cycle % s.ciclos) + 1} de ${s.ciclos}</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card timer-card">
        <div class="chips" style="justify-content:center">
          ${Object.entries(MODE_LABEL).map(([k, v]) => `<button class="chip ${t.mode === k ? 'active' : ''}" data-action="focus-mode" data-value="${k}">${v}</button>`).join('')}
        </div>
        <div class="ring" style="margin-top:20px">
          <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
            <circle cx="120" cy="120" r="${RING_R}" fill="none" stroke="var(--surface-2)" stroke-width="12"/>
            <circle id="ring-progress" cx="120" cy="120" r="${RING_R}" fill="none" stroke="var(--accent)" stroke-width="12"
              stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - progress)}"/>
          </svg>
          <div class="timer" id="timer-display">${mmss(rem)}</div>
        </div>
        <div class="timer-actions">
          ${t.running
            ? `<button data-action="focus-pause">⏸ Pausar</button>`
            : `<button data-action="focus-start">▶ ${t.remaining != null ? 'Continuar' : 'Iniciar'}</button>`}
          <button class="ghost" data-action="focus-reset">↺ Reiniciar</button>
          <button class="ghost" data-action="focus-skip">⏭ Pular</button>
        </div>
      </div>
      <div class="grid">
        <div class="card">
          <h2>Últimos 7 dias</h2>
          <div class="muted small">Hoje: <strong>${focusMinutesOn(isoDate())} min</strong> de foco</div>
          ${weekBars()}
        </div>
        <div class="card">
          <h2>Configurações (minutos)</h2>
          <form class="settings" data-form="focus-settings">
            <label>Foco<input type="number" name="foco" min="1" max="180" value="${s.foco}"></label>
            <label>Pausa curta<input type="number" name="pausa" min="1" max="60" value="${s.pausa}"></label>
            <label>Pausa longa<input type="number" name="longa" min="1" max="90" value="${s.longa}"></label>
            <label>Ciclos até pausa longa<input type="number" name="ciclos" min="1" max="12" value="${s.ciclos}"></label>
          </form>
        </div>
      </div>
    </div>`;
}

// Atualiza o relógio sem re-renderizar a página inteira.
function tick() {
  const t = state.focus.timer;
  const rem = timerRemaining();
  if (t.running && rem <= 0) {
    finishTimer();
    return;
  }
  const display = $('#timer-display');
  if (display) display.textContent = mmss(rem);
  const ring = $('#ring-progress');
  if (ring) ring.setAttribute('stroke-dashoffset', RING_C * (rem / modeDuration(t.mode)));

  const pill = $('#focus-pill');
  const onFocusPage = currentRoute() === 'foco';
  if (t.running && !onFocusPage) {
    pill.hidden = false;
    pill.textContent = `${t.mode === 'foco' ? '🎯' : '☕'} ${mmss(rem)}`;
  } else {
    pill.hidden = true;
  }
  document.title = t.running ? `${mmss(rem)} · ${MODE_LABEL[t.mode]}` : 'Produtividade';
}

/* ============================================================
   Hábitos
   ============================================================ */
const HABIT_COLORS = ['#4f46e5', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#c026d3'];

function habitStreak(h) {
  let streak = 0;
  let d = new Date();
  // Se hoje ainda não foi marcado, a sequência conta a partir de ontem.
  if (!h.log[isoDate(d)]) d = addDays(d, -1);
  while (h.log[isoDate(d)]) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

function renderHabits() {
  const days = lastDays(7);
  const today = isoDate();
  const doneToday = state.habits.filter((h) => h.log[today]).length;
  return `
    <div class="page-head">
      <div><h1>Hábitos</h1><div class="muted">${doneToday}/${state.habits.length} feitos hoje</div></div>
    </div>
    <div class="card">
      <form class="task-form" data-form="habit">
        <input type="text" name="name" placeholder="Novo hábito… (ex.: Ler 20 páginas)" required autocomplete="off">
        <button type="submit">Adicionar</button>
      </form>
      ${state.habits.length ? `
      <div class="table-scroll">
        <table class="habit-table">
          <thead><tr><th>Hábito</th>${days.map((d) => `<th>${WEEKDAYS[d.getDay()]}<br>${d.getDate()}</th>`).join('')}<th></th></tr></thead>
          <tbody>
            ${state.habits.map((h) => `
              <tr>
                <td><div class="habit-name"><span>${esc(h.name)}</span><span class="streak">🔥 ${habitStreak(h)}</span></div></td>
                ${days.map((d) => {
                  const key = isoDate(d);
                  return `<td><button class="day-btn ${h.log[key] ? 'on' : ''}" style="--hc:${h.color}" data-action="toggle-habit" data-id="${h.id}" data-date="${key}" aria-pressed="${!!h.log[key]}" aria-label="${esc(h.name)} em ${key}"></button></td>`;
                }).join('')}
                <td><button class="icon-btn" data-action="delete-habit" data-id="${h.id}" aria-label="Excluir hábito">🗑️</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div class="empty">Crie seu primeiro hábito para começar a acompanhar.</div>`}
    </div>`;
}

/* ============================================================
   Notas
   ============================================================ */
function sortedNotes() {
  return [...state.notes].sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
}

function noteItem(n) {
  const preview = n.body.split('\n').find((l) => l.trim()) || 'Sem conteúdo';
  return `
    <li class="note-item ${state.ui.activeNote === n.id ? 'active' : ''}" data-action="open-note" data-id="${n.id}">
      <div class="t">${n.pinned ? '📌 ' : ''}${esc(n.title || 'Sem título')}</div>
      <div class="p">${esc(preview)}</div>
    </li>`;
}

function renderNotes() {
  const notes = sortedNotes();
  const active = state.notes.find((n) => n.id === state.ui.activeNote) || null;
  return `
    <div class="page-head">
      <div><h1>Notas</h1><div class="muted">${state.notes.length} nota${state.notes.length === 1 ? '' : 's'}</div></div>
      <button data-action="new-note">＋ Nova nota</button>
    </div>
    <div class="notes-layout">
      <div class="card">
        ${notes.length ? `<ul class="note-list" id="note-list">${notes.map(noteItem).join('')}</ul>` : `<div class="empty">Nenhuma nota ainda.</div>`}
      </div>
      <div class="card editor">
        ${active ? `
          <div class="toolbar" style="margin:0">
            <span class="muted small" id="note-saved">Salvo automaticamente</span>
            <div>
              <button class="icon-btn" data-action="pin-note" data-id="${active.id}" title="${active.pinned ? 'Desafixar' : 'Fixar'}">${active.pinned ? '📌 Fixada' : '📍 Fixar'}</button>
              <button class="icon-btn" data-action="delete-note" data-id="${active.id}" title="Excluir">🗑️ Excluir</button>
            </div>
          </div>
          <input type="text" data-input="note-title" value="${esc(active.title)}" placeholder="Título" aria-label="Título da nota">
          <textarea data-input="note-body" placeholder="Escreva aqui…" aria-label="Conteúdo da nota">${esc(active.body)}</textarea>
        ` : `<div class="empty">Selecione ou crie uma nota.</div>`}
      </div>
    </div>`;
}

/* ============================================================
   Hoje (painel)
   ============================================================ */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function renderToday() {
  const today = isoDate();
  const dueTasks = sortTasks(state.tasks.filter((t) => !t.done && t.due && t.due <= today));
  const doneToday = state.tasks.filter((t) => t.done && t.doneAt && isoDate(new Date(t.doneAt)) === today).length;
  const habitsDone = state.habits.filter((h) => h.log[today]).length;
  const bestStreak = Math.max(0, ...state.habits.map(habitStreak));
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return `
    <div class="page-head">
      <div><h1>${greeting()}! 👋</h1><div class="muted">${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</div></div>
    </div>
    <div class="stats">
      <div class="card stat"><div class="value">${dueTasks.length}</div><div class="label">Tarefas para hoje</div></div>
      <div class="card stat"><div class="value">${doneToday}</div><div class="label">Concluídas hoje</div></div>
      <div class="card stat"><div class="value">${focusMinutesOn(today)}<span class="small muted"> min</span></div><div class="label">Tempo em foco</div></div>
      <div class="card stat"><div class="value">${habitsDone}/${state.habits.length}</div><div class="label">Hábitos · melhor sequência ${bestStreak}🔥</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <h2>Para hoje</h2>
        ${taskForm().replace('name="due"', `name="due" value="${today}"`)}
        ${dueTasks.length ? `<ul class="task-list">${dueTasks.map(taskItem).join('')}</ul>` : `<div class="empty">Nenhuma tarefa pendente para hoje. 🎉</div>`}
      </div>
      <div class="grid">
        <div class="card">
          <h2>Hábitos de hoje</h2>
          ${state.habits.length ? `<ul class="task-list">${state.habits.map((h) => `
            <li class="task ${h.log[today] ? 'done' : ''}">
              <input type="checkbox" data-action="toggle-habit" data-id="${h.id}" data-date="${today}" ${h.log[today] ? 'checked' : ''} aria-label="Marcar ${esc(h.name)}">
              <div class="body"><div class="title">${esc(h.name)}</div></div>
              <span class="muted small">🔥 ${habitStreak(h)}</span>
            </li>`).join('')}</ul>` : `<div class="empty"><a href="#habitos">Crie um hábito</a> para acompanhar aqui.</div>`}
        </div>
        <div class="card">
          <h2>Foco na semana</h2>
          ${weekBars()}
          <div style="margin-top:12px"><a href="#foco" class="btn-like ghost small" style="text-decoration:none">⏱️ Abrir Pomodoro</a></div>
        </div>
      </div>
    </div>
    ${mobileTools()}`;
}

function mobileTools() {
  return `<div class="mobile-tools">
    <button class="ghost small" data-action="theme">🌓 Tema</button>
    <button class="ghost small" data-action="export">⬇️ Backup</button>
    <label class="ghost small btn-like">⬆️ Restaurar<input type="file" data-input="import" accept="application/json" hidden></label>
  </div>`;
}

/* ============================================================
   Roteamento e renderização
   ============================================================ */
const ROUTES = { hoje: renderToday, tarefas: renderTasks, foco: renderFocus, habitos: renderHabits, notas: renderNotes };

function currentRoute() {
  const r = location.hash.replace('#', '');
  return ROUTES[r] ? r : 'hoje';
}

function render() {
  const route = currentRoute();
  $('#view').innerHTML = ROUTES[route]();
  document.querySelectorAll('.sidebar a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route);
    if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  tick();
}

window.addEventListener('hashchange', () => {
  render();
  $('#view').focus({ preventScroll: true });
  window.scrollTo(0, 0);
});

/* ============================================================
   Ações
   ============================================================ */
const actions = {
  'toggle-task': (el) => {
    const t = state.tasks.find((x) => x.id === el.dataset.id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : null;
    save();
    render();
  },
  'delete-task': (el) => {
    const idx = state.tasks.findIndex((x) => x.id === el.dataset.id);
    if (idx < 0) return;
    const [removed] = state.tasks.splice(idx, 1);
    save();
    render();
    toast(`Tarefa "${removed.title}" excluída.`);
  },
  'edit-task': (el) => {
    const t = state.tasks.find((x) => x.id === el.dataset.id);
    if (!t) return;
    const title = prompt('Editar tarefa:', t.title);
    if (title === null) return;
    if (title.trim()) t.title = title.trim();
    const due = prompt('Prazo (AAAA-MM-DD, vazio para nenhum):', t.due || '');
    if (due !== null) t.due = /^\d{4}-\d{2}-\d{2}$/.test(due.trim()) ? due.trim() : null;
    const project = prompt('Projeto (vazio para nenhum):', t.project || '');
    if (project !== null) t.project = project.trim().replace(/^#/, '');
    save();
    render();
  },
  'task-filter': (el) => {
    state.ui.taskFilter = el.dataset.value;
    save();
    render();
  },
  'clear-done': () => {
    if (!confirm('Excluir todas as tarefas concluídas?')) return;
    state.tasks = state.tasks.filter((t) => !t.done);
    save();
    render();
  },

  'focus-start': startTimer,
  'focus-pause': pauseTimer,
  'focus-reset': () => setMode(state.focus.timer.mode),
  'focus-skip': () => {
    const t = state.focus.timer;
    setMode(t.mode === 'foco' ? 'pausa' : 'foco');
  },
  'focus-mode': (el) => setMode(el.dataset.value),

  'toggle-habit': (el) => {
    const h = state.habits.find((x) => x.id === el.dataset.id);
    if (!h) return;
    const d = el.dataset.date;
    if (h.log[d]) delete h.log[d];
    else h.log[d] = true;
    save();
    render();
  },
  'delete-habit': (el) => {
    const h = state.habits.find((x) => x.id === el.dataset.id);
    if (!h || !confirm(`Excluir o hábito "${h.name}" e todo o histórico?`)) return;
    state.habits = state.habits.filter((x) => x !== h);
    save();
    render();
  },

  'new-note': () => {
    const n = { id: uid(), title: '', body: '', pinned: false, updatedAt: Date.now() };
    state.notes.push(n);
    state.ui.activeNote = n.id;
    save();
    render();
    $('[data-input="note-title"]')?.focus();
  },
  'open-note': (el) => {
    state.ui.activeNote = el.dataset.id;
    save();
    render();
  },
  'pin-note': (el) => {
    const n = state.notes.find((x) => x.id === el.dataset.id);
    if (!n) return;
    n.pinned = !n.pinned;
    save();
    render();
  },
  'delete-note': (el) => {
    const n = state.notes.find((x) => x.id === el.dataset.id);
    if (!n || !confirm(`Excluir a nota "${n.title || 'Sem título'}"?`)) return;
    state.notes = state.notes.filter((x) => x !== n);
    state.ui.activeNote = sortedNotes()[0]?.id ?? null;
    save();
    render();
  },

  theme: toggleTheme,
  export: exportData,
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  if (form.dataset.form === 'task') addTaskFromForm(form);
  if (form.dataset.form === 'habit') {
    const name = String(new FormData(form).get('name') || '').trim();
    if (!name) return;
    state.habits.push({ id: uid(), name, color: HABIT_COLORS[state.habits.length % HABIT_COLORS.length], log: {} });
    save();
    render();
    $('[data-form="habit"] input')?.focus();
  }
});

let noteSaveTimer;
document.addEventListener('input', (e) => {
  const el = e.target;
  const kind = el.dataset?.input;
  if (kind === 'task-search') {
    state.ui.taskSearch = el.value;
    save();
    const pos = el.selectionStart;
    render();
    const input = $('[data-input="task-search"]');
    input.focus();
    input.setSelectionRange(pos, pos);
  }
  if (kind === 'note-title' || kind === 'note-body') {
    const n = state.notes.find((x) => x.id === state.ui.activeNote);
    if (!n) return;
    n[kind === 'note-title' ? 'title' : 'body'] = el.value;
    n.updatedAt = Date.now();
    $('#note-saved').textContent = 'Salvando…';
    clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(() => {
      save();
      const list = $('#note-list');
      if (list) list.innerHTML = sortedNotes().map(noteItem).join('');
      const saved = $('#note-saved');
      if (saved) saved.textContent = 'Salvo automaticamente';
    }, 400);
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  const form = el.closest('[data-form="focus-settings"]');
  if (form) {
    const s = state.focus.settings;
    const n = Math.round(Number(el.value));
    const max = Number(el.max) || 180;
    if (Number.isFinite(n) && n >= 1) s[el.name] = Math.min(n, max);
    const t = state.focus.timer;
    if (!t.running) t.remaining = null;
    save();
    render();
  }
  if (el.id === 'import-input' || el.dataset?.input === 'import') importData(el);
});

// Salva notas pendentes antes de sair.
window.addEventListener('beforeunload', save);

/* ============================================================
   Tema, backup e restauração
   ============================================================ */
function applyTheme() {
  if (state.ui.theme) document.documentElement.dataset.theme = state.ui.theme;
  else delete document.documentElement.dataset.theme;
}

function toggleTheme() {
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const current = state.ui.theme || (systemDark ? 'dark' : 'light');
  state.ui.theme = current === 'dark' ? 'light' : 'dark';
  applyTheme();
  save();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `produtividade-backup-${isoDate()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup baixado.');
}

function importData(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.tasks)) throw new Error('formato inválido');
      if (!confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
      state = mergeDefaults(data, DEFAULT_STATE);
      save();
      applyTheme();
      render();
      toast('Backup restaurado.');
    } catch {
      toast('Arquivo de backup inválido.');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

$('#theme-toggle').addEventListener('click', toggleTheme);
$('#export-btn').addEventListener('click', exportData);
$('#focus-pill').addEventListener('click', () => { location.hash = '#foco'; });

/* ============================================================
   Início
   ============================================================ */
applyTheme();
render();
setInterval(tick, 250);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
