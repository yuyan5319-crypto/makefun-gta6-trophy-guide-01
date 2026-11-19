// Progress persistence: the earned set lives in localStorage, and can be
// exported to a JSON file and imported back. Demo mode never touches storage.

export const STORAGE_KEY = 'vice-legends-gta6-trophies-v1';

// Load the earned ids from localStorage. Anything unreadable or unknown is
// dropped, so a corrupt or hand-edited value never breaks the page.
export function loadEarned(allIds) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const known = new Set(allIds);
    return new Set(parsed.filter((id) => known.has(id)));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or blocked (private mode): progress still works in memory.
  }
}

export function clearEarned() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

// Download the earned ids as a JSON file.
export function exportEarned(earned) {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Read an exported file back into an earned set. Returns null when the file
// does not hold a usable list.
export async function importEarnedFile(file, allIds) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) return null;
  const known = new Set(allIds);
  return new Set(list.filter((id) => known.has(id)));
}
