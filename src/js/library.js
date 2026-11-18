// "My Library": saved resources with a reading status and a note,
// kept in this browser's localStorage.

const KEY = 'theologyhub.library.v1';
export const STATUSES = { 'to-read': 'To read', reading: 'Reading', read: 'Read' };

let items = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) return saved;
    return migrateOld();
  } catch {
    return {};
  }
}

// Bring over favourites / collection saved by the first version of the app.
function migrateOld() {
  const out = {};
  try {
    const old = [
      ...JSON.parse(localStorage.getItem('theologyCollection') || '[]'),
      ...JSON.parse(localStorage.getItem('theologyFavourites') || '[]'),
    ];
    const read = JSON.parse(localStorage.getItem('theologyReadStatus') || '{}');
    for (const r of old) {
      if (!r?.id || out[r.id]) continue;
      out[r.id] = {
        ...r,
        authors: typeof r.authors === 'string' ? r.authors.split(', ') : r.authors || [],
        abstract: r.abstract === 'No abstract available' ? '' : r.abstract || '',
        cover: String(r.cover || '').includes('placeholder') ? '' : r.cover || '',
        status: read[r.id] ? 'read' : 'to-read',
        note: '',
        savedAt: Date.now(),
      };
    }
  } catch {
    /* nothing to migrate */
  }
  return out;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

export const isSaved = id => Boolean(items[id]);
export const get = id => items[id];
export const count = () => Object.keys(items).length;

export function all() {
  return Object.values(items).sort((a, b) => b.savedAt - a.savedAt);
}

export function save(resource) {
  if (items[resource.id]) return;
  items[resource.id] = { ...resource, status: 'to-read', note: '', savedAt: Date.now() };
  persist();
}

export function remove(id) {
  delete items[id];
  persist();
}

export function update(id, changes) {
  if (!items[id]) return;
  items[id] = { ...items[id], ...changes };
  persist();
}
