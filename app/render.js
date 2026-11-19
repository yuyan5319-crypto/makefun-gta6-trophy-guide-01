// Rendering: the checklist cards, the progress bar, the roadmap stages and the
// missable-trophies panel. All text comes from trophies.json; this file only
// lays it out. It never fetches anything and never touches the network.

import { KIND_LABELS, ROADMAP_STAGES, trophyMatches } from './state.js';

const listEl = document.getElementById('trophyList');
const hintEl = document.getElementById('resultHint');
const emptyEl = document.getElementById('emptyState');
const fillEl = document.getElementById('progressFill');
const progressTextEl = document.getElementById('progressText');
const gradeCountsEl = document.getElementById('gradeCounts');
const roadmapEl = document.getElementById('roadmapList');
const missableEl = document.getElementById('missablePanel');

function gradeBadge(grade) {
  const badge = document.createElement('span');
  badge.className = `badge ${grade}`;
  badge.textContent = grade;
  return badge;
}

function kindTag(kind) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = KIND_LABELS[kind] ?? kind;
  return tag;
}

// The spoiler setting hides a story trophy's name and description until it is
// earned. The guide stays visible: the point of the page is to guide, and the
// spoiler rule covers names and descriptions only.
function displayName(trophy, state, earned) {
  if (state.spoiler && trophy.kind === 'story' && !earned.has(trophy.id)) {
    return 'Hidden story trophy';
  }
  return trophy.name;
}

function displayDescription(trophy, state, earned) {
  if (state.spoiler && trophy.kind === 'story' && !earned.has(trophy.id)) {
    return 'Spoiler hidden — earn this trophy to reveal its official name and description.';
  }
  return trophy.description;
}

function buildGuideBlock(trophy) {
  const block = document.createElement('div');
  block.className = 'trophy-guide';
  const text = document.createElement('p');
  text.textContent = trophy.guide;
  block.append(text);
  const sources = document.createElement('p');
  sources.className = 'trophy-sources';
  const label = document.createElement('strong');
  label.textContent = 'Sources: ';
  sources.append(label, document.createTextNode(trophy.sources));
  block.append(sources);
  return block;
}

export function renderProgress(trophies, earned) {
  const total = trophies.length;
  const done = earned.size;
  const percent = total ? Math.round((done / total) * 100) : 0;
  fillEl.style.width = `${percent}%`;
  progressTextEl.textContent = `${done} of ${total} earned · ${percent}%`;
  const byGrade = {};
  for (const trophy of trophies) {
    byGrade[trophy.grade] = byGrade[trophy.grade] ?? { done: 0, total: 0 };
    byGrade[trophy.grade].total += 1;
    if (earned.has(trophy.id)) byGrade[trophy.grade].done += 1;
  }
  gradeCountsEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((grade) => `${grade[0].toUpperCase() + grade.slice(1)} ${byGrade[grade].done}/${byGrade[grade].total}`)
    .join(' · ');
}

export function renderKindCounts(trophies) {
  const counts = { all: trophies.length, online: 0 };
  for (const trophy of trophies) {
    counts[trophy.kind] = (counts[trophy.kind] ?? 0) + 1;
  }
  for (const [kind, count] of Object.entries(counts)) {
    const el = document.getElementById(`count-${kind}`);
    if (el) el.textContent = `(${count})`;
  }
}

export function renderChecklist(trophies, state, earned, callbacks) {
  listEl.replaceChildren();
  const shown = trophies.filter((trophy) => trophyMatches(trophy, state, earned));
  hintEl.textContent = shown.length === trophies.length
    ? 'All 55 trophies. Tick one off when you earn it — progress is saved in this browser.'
    : `Showing ${shown.length} of ${trophies.length} trophies.`;
  emptyEl.hidden = shown.length > 0;

  for (const trophy of shown) {
    const isEarned = earned.has(trophy.id);
    const isOpen = state.openId === trophy.id;
    const item = document.createElement('li');
    item.className = 'trophy' + (isEarned ? ' earned' : '') + (isOpen ? ' open' : '');
    item.id = `trophy-${trophy.id}`;

    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('change', () => callbacks.onToggle(trophy.id, box.checked));
    head.append(box);

    const main = document.createElement('div');
    main.className = 'trophy-main';
    const title = document.createElement('h3');
    title.className = 'trophy-title';
    const nameButton = document.createElement('button');
    nameButton.type = 'button';
    nameButton.textContent = displayName(trophy, state, earned);
    nameButton.addEventListener('click', () => callbacks.onOpen(trophy.id));
    title.append(nameButton, gradeBadge(trophy.grade), kindTag(trophy.kind));
    if (trophy.hidden) {
      const hiddenTag = document.createElement('span');
      hiddenTag.className = 'tag hidden-t';
      hiddenTag.textContent = 'Hidden on PS5';
      title.append(hiddenTag);
    }
    if (trophy.missable) {
      const missableTag = document.createElement('span');
      missableTag.className = 'tag missable';
      missableTag.textContent = 'Possibly missable';
      title.append(missableTag);
    }
    main.append(title);

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = displayDescription(trophy, state, earned);
    main.append(desc);

    if (trophy.countLabel) {
      const count = document.createElement('p');
      count.className = 'trophy-count';
      count.textContent = `Target: ${trophy.countLabel}`;
      main.append(count);
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.textContent = isOpen ? 'Hide guide ▲' : 'Show guide ▼';
    toggle.addEventListener('click', () => callbacks.onOpen(trophy.id));
    main.append(toggle);

    if (isOpen) main.append(buildGuideBlock(trophy));
    head.append(main);
    item.append(head);
    listEl.append(item);
  }
}

// The roadmap: six stages in order, each listing its trophies with earned
// ticks, so the reader sees what is left at a glance.
export function renderRoadmap(trophies, earned) {
  roadmapEl.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const stageTrophies = trophies.filter((trophy) => trophy.stage === stage.id);
    const done = stageTrophies.filter((trophy) => earned.has(trophy.id)).length;
    const item = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = stageTrophies.length ? `${done}/${stageTrophies.length} earned` : 'read first';
    heading.append(count);
    item.append(heading);
    const text = document.createElement('p');
    text.textContent = stage.text;
    item.append(text);
    if (stageTrophies.length) {
      const names = document.createElement('ul');
      for (const trophy of stageTrophies) {
        const line = document.createElement('li');
        if (earned.has(trophy.id)) line.className = 'done';
        line.textContent = `${trophy.name} — ${trophy.grade}`;
        names.append(line);
      }
      item.append(names);
    }
    roadmapEl.append(item);
  }
}

// The missable panel is built from the data: every trophy flagged missable
// gets a full card here, with its guide and sources.
export function renderMissable(trophies, earned) {
  missableEl.replaceChildren();
  const missables = trophies.filter((trophy) => trophy.missable);
  if (!missables.length) {
    const none = document.createElement('p');
    none.textContent = 'No trophy in this list is flagged missable.';
    missableEl.append(none);
    return;
  }
  for (const trophy of missables) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const heading = document.createElement('h3');
    heading.textContent = `${trophy.name} — ${trophy.grade}`;
    card.append(heading);
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = trophy.description;
    card.append(desc);
    const earnedNote = document.createElement('p');
    earnedNote.textContent = earned.has(trophy.id)
      ? 'Earned — you are safe. Keep your chapter saves anyway until the platinum pops.'
      : 'Not earned yet — do the Chapter 1 meditation before you finish Chapter 1.';
    card.append(earnedNote);
    card.append(buildGuideBlock(trophy));
    missableEl.append(card);
  }
}
