// Vice Legends bootstrap: load the trophy data, restore saved progress, wire
// the controls, and render. The page works with the network off — the only
// thing it loads is its own data/trophies.json.

import { createState, readQueryParams, DEMO_EARNED_IDS } from './state.js';
import { loadEarned, saveEarned, clearEarned, exportEarned, importEarnedFile } from './storage.js';
import { renderChecklist, renderKindCounts, renderMissable, renderProgress, renderRoadmap } from './render.js';

const query = readQueryParams();
const state = createState(query);

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const allIds = trophies.map((trophy) => trophy.id);

// Demo mode ticks a few trophies in memory for screenshots and never writes.
let earned = query.demo
  ? new Set(DEMO_EARNED_IDS.filter((id) => allIds.includes(id)))
  : loadEarned(allIds);

const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const earnedOnlyBox = document.getElementById('earnedOnly');
const spoilerBox = document.getElementById('spoiler');
const viewButtons = [...document.querySelectorAll('.view-btn')];
const kindButtons = [...document.querySelectorAll('.kind-btn')];
const views = {
  checklist: document.getElementById('view-checklist'),
  roadmap: document.getElementById('view-roadmap'),
  missable: document.getElementById('view-missable'),
};
const controls = document.getElementById('controls');

function renderAll() {
  renderProgress(trophies, earned);
  renderChecklist(trophies, state, earned, {
    onToggle: toggleEarned,
    onOpen: openTrophy,
  });
  renderRoadmap(trophies, earned);
  renderMissable(trophies, earned);
}

function toggleEarned(id, checked) {
  if (checked) earned.add(id);
  else earned.delete(id);
  if (!state.demo) saveEarned(earned);
  renderAll();
}

function openTrophy(id) {
  state.openId = state.openId === id ? null : id;
  renderChecklist(trophies, state, earned, { onToggle: toggleEarned, onOpen: openTrophy });
  if (state.openId !== null) {
    document.getElementById(`trophy-${id}`)?.scrollIntoView({ block: 'nearest' });
  }
}

function setView(view) {
  state.view = view;
  for (const [name, section] of Object.entries(views)) {
    section.hidden = name !== view;
  }
  for (const button of viewButtons) {
    button.classList.toggle('active', button.dataset.view === view);
  }
  controls.style.display = view === 'checklist' ? '' : 'none';
}

function setKind(kind) {
  state.kind = kind;
  for (const button of kindButtons) {
    button.classList.toggle('active', button.dataset.kind === kind);
  }
  renderChecklist(trophies, state, earned, { onToggle: toggleEarned, onOpen: openTrophy });
}

searchInput.addEventListener('input', () => {
  state.search = searchInput.value.trim();
  renderChecklist(trophies, state, earned, { onToggle: toggleEarned, onOpen: openTrophy });
});
gradeSelect.addEventListener('change', () => {
  state.grade = gradeSelect.value;
  renderChecklist(trophies, state, earned, { onToggle: toggleEarned, onOpen: openTrophy });
});
earnedOnlyBox.addEventListener('change', () => {
  state.earnedOnly = earnedOnlyBox.checked;
  renderChecklist(trophies, state, earned, { onToggle: toggleEarned, onOpen: openTrophy });
});
spoilerBox.addEventListener('change', () => {
  state.spoiler = spoilerBox.checked;
  renderChecklist(trophies, state, earned, { onToggle: toggleEarned, onOpen: openTrophy });
});
for (const button of kindButtons) {
  button.addEventListener('click', () => setKind(button.dataset.kind));
}
for (const button of viewButtons) {
  button.addEventListener('click', () => setView(button.dataset.view));
}

document.getElementById('exportBtn').addEventListener('click', () => exportEarned(earned));
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!window.confirm('Clear all earned ticks? This cannot be undone — export first if you want a backup.')) return;
  earned = new Set();
  if (!state.demo) clearEarned();
  renderAll();
});
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = await importEarnedFile(file, allIds);
    if (!imported) {
      window.alert('That file does not hold a trophy progress list.');
      return;
    }
    earned = imported;
    if (!state.demo) saveEarned(earned);
    renderAll();
  } catch {
    window.alert('Could not read that file — it is not a valid progress export.');
  }
  event.target.value = '';
});

// Apply the URL state, then render.
if (state.kind !== 'all') {
  for (const button of kindButtons) {
    button.classList.toggle('active', button.dataset.kind === state.kind);
  }
}
if (state.spoiler) spoilerBox.checked = true;
renderKindCounts(trophies);
setView(state.view);
renderAll();

// A ?open=<id> link opens that trophy's guide and scrolls to it — but only
// when it is not already on screen, so a linked card near the top does not
// shove the header out of view.
if (state.openId !== null && allIds.includes(state.openId)) {
  document.getElementById(`trophy-${state.openId}`)?.scrollIntoView({ block: 'nearest' });
}
