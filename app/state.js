// Tracker state: filters, spoiler setting, view and demo mode, all read from the
// page's own controls and from URL query params (?filter=, ?spoiler=on,
// ?open=<trophy id>, ?view=roadmap|missable|checklist, ?demo=1).
// Demo mode ticks a few trophies in memory for screenshots only and never
// writes to localStorage.

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

// The roadmap stages, in the order to earn them. A trophy's `stage` number in
// trophies.json points at one of these.
export const ROADMAP_STAGES = [
  {
    id: 0,
    title: 'Stage 0 — Before you start: saves and the one missable',
    text: 'Keep a manual save at the start of every chapter (15 manual slots plus one autosave, no mission replay), do Lucia’s balcony meditation in Chapter 1, and never use cheats on your trophy save.',
  },
  {
    id: 1,
    title: 'Stage 1 — Story: Chapters 1–4 and the final mission',
    text: 'Play the story straight through. Chapter trophies, the named missions (Gone Fishing, Breakfast Run, The Cartel Heist, Child’s Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission all pop as you go.',
  },
  {
    id: 2,
    title: 'Stage 2 — Stranger strands',
    text: 'Finish the stranger finals — Andy, Kenton, Billy, Randy and Tyrone — and any 8 stranger strands for Strangers & Freaks. Andy’s, Billy’s and Tyrone’s strands do not count toward the 8, and the Chapter 3 race against Yago is time-sensitive.',
  },
  {
    id: 3,
    title: 'Stage 3 — Collectibles',
    text: 'Cards (3 sets for the trophy, 15 of 18 for 100%), WAiNK scans at 100 locations, all 18 meditation spots, 100 vehicles discovered, all 52 areas explored, all 8 garages bought, 10 vehicles registered to Scooter Bros.',
  },
  {
    id: 4,
    title: 'Stage 4 — Activities, robberies and feats',
    text: '250 stunts, 42 shooting-range gold medals, a drone race win at all 14 Top Fun locations, 20 race wins, fishing, arcade, 50 challenges, bank vaults, armored trucks, jewelry stores, shops, gangs and the wanted-level feats.',
  },
  {
    id: 5,
    title: 'Stage 5 — 100% completion: A Long Road',
    text: 'After the credits, open the 35-item checklist under Progress, then Stats, then 100% Completion and clear what is left. Nothing on it is missable.',
  },
  {
    id: 6,
    title: 'Stage 6 — Platinum: Vice Got a Price!',
    text: 'Pops automatically when the other 54 are earned. In practice A Long Road is the last gate.',
  },
];

// Demo ticks for ?demo=1: a spread across the list, in memory only.
export const DEMO_EARNED_IDS = [2, 3, 15, 28, 35];

export function readQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const kind = params.get('filter');
  const view = params.get('view');
  const open = params.get('open');
  return {
    kind: kind && (kind === 'all' || kind in KIND_LABELS) ? kind : 'all',
    spoiler: params.get('spoiler') === 'on',
    view: view === 'roadmap' || view === 'missable' ? view : 'checklist',
    openId: open ? Number.parseInt(open, 10) : null,
    demo: params.get('demo') === '1',
  };
}

export function createState(query) {
  return {
    kind: query.kind,
    grade: 'all',
    search: '',
    earnedOnly: false,
    spoiler: query.spoiler,
    view: query.view,
    openId: query.openId,
    demo: query.demo,
  };
}

// A trophy passes the current filters when every active filter lets it through.
export function trophyMatches(trophy, state, earned) {
  if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.earnedOnly && !earned.has(trophy.id)) return false;
  if (state.search) {
    const needle = state.search.toLowerCase();
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.sources}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}
