import { searchBooks, searchWorks, PAGE_SIZE } from './api.js';
import { turabian, toRis, esc } from './cite.js';
import * as lib from './library.js';
import { readingList, renderReadingList, toResource } from './reading.js';

const $ = sel => document.querySelector(sel);
const TYPE_LABEL = { book: 'Book', article: 'Article', dissertation: 'Dissertation' };

// ---------- search state ----------
const state = { query: '', type: 'all', sort: 'relevance', theoOnly: true, page: 1, results: [], total: 0, token: 0 };
let libStatus = 'all';
const shown = new Map(); // id -> resource currently on screen (for Save / Cite buttons)

// ---------- views ----------
function showView() {
  const h = location.hash;
  const view = h.startsWith('#library') ? 'library' : h.startsWith('#search') ? 'search' : 'reading';
  for (const v of ['reading', 'search', 'library']) $(`#view-${v}`).hidden = v !== view;
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  if (view === 'library') renderLibrary();
  if (view === 'reading') renderReadingList($('#rl-filter').value);
}

function updateCount() {
  $('#lib-count').textContent = lib.count();
}

// ---------- searching ----------
function effectiveQuery() {
  const q = state.query.trim();
  return state.theoOnly && !/theolog|bibl|church|christ|scripture|mission/i.test(q) ? `${q} theology` : q;
}

async function runSearch({ append = false } = {}) {
  if (!state.query.trim()) return;
  const token = ++state.token;
  if (!append) {
    state.page = 1;
    state.results = [];
    $('#results').innerHTML = skeletons(6);
  }
  $('#suggestions').hidden = true;
  $('#load-more').hidden = true;
  setStatus(append ? 'Loading more…' : 'Searching…');

  const query = effectiveQuery();
  const opts = { query, sort: state.sort, page: state.page };
  const jobs =
    state.type === 'all'
      ? [
          searchBooks({ ...opts, perPage: 4 }),
          searchWorks({ ...opts, kind: 'article', perPage: 4 }),
          searchWorks({ ...opts, kind: 'dissertation', perPage: 4 }),
        ]
      : state.type === 'book'
        ? [searchBooks(opts)]
        : [searchWorks({ ...opts, kind: state.type })];

  const settled = await Promise.allSettled(jobs);
  if (token !== state.token) return; // a newer search started meanwhile

  const ok = settled.filter(s => s.status === 'fulfilled').map(s => s.value);
  const failed = settled.filter(s => s.status === 'rejected');
  const batch = state.type === 'all' ? interleave(ok.map(r => r.items)) : ok[0]?.items || [];
  state.total = ok.reduce((n, r) => n + r.total, 0);
  state.results = append ? state.results.concat(batch) : batch;

  renderResults();

  if (!ok.length) {
    setStatus(`Search failed: ${failed[0].reason.message} Check your connection and try again.`, true);
  } else if (!state.results.length) {
    setStatus(`Nothing found for “${state.query}”. Try other words or another type.`);
  } else {
    const partial = failed.length ? ' (one source did not answer)' : '';
    setStatus(`Showing ${state.results.length} of about ${state.total.toLocaleString()} results${partial}`);
    const fullPage = state.type === 'all' ? 1 : PAGE_SIZE;
    $('#load-more').hidden = batch.length < fullPage || state.results.length >= state.total;
  }
}

function interleave(lists) {
  const out = [];
  const longest = Math.max(0, ...lists.map(l => l.length));
  for (let i = 0; i < longest; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

function setStatus(text, isError = false) {
  const el = $('#status');
  el.textContent = text;
  el.classList.toggle('error', isError);
}

function skeletons(n) {
  return Array.from({ length: n }, () => '<div class="card skeleton" aria-hidden="true"></div>').join('');
}

function pushHash() {
  const p = new URLSearchParams({ q: state.query, type: state.type, sort: state.sort });
  if (!state.theoOnly) p.set('all', '1');
  history.replaceState(null, '', `#search?${p}`);
}

function readHash() {
  if (!location.hash.startsWith('#search?')) return;
  const p = new URLSearchParams(location.hash.slice(8));
  state.query = p.get('q') || '';
  state.type = ['all', 'book', 'article', 'dissertation'].includes(p.get('type')) ? p.get('type') : 'all';
  state.sort = p.get('sort') || 'relevance';
  state.theoOnly = p.get('all') !== '1';
  $('#q').value = state.query;
  $('#sort').value = state.sort;
  $('#theo-only').checked = state.theoOnly;
  pressed('#type-chips', 'type', state.type);
}

function pressed(group, attr, value) {
  document.querySelectorAll(`${group} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === value)));
}

// ---------- cards ----------
function cover(r) {
  if (r.cover) return `<img class="cover" src="${esc(r.cover)}" alt="" loading="lazy" data-icon="${r.type === 'book' ? '📖' : '📄'}">`;
  return `<div class="cover tile" aria-hidden="true">${r.type === 'book' ? '📖' : r.type === 'dissertation' ? '🎓' : '📄'}</div>`;
}

function meta(r) {
  const who = r.authors?.length ? r.authors.join(', ') : 'Unknown author';
  const where = r.type === 'book' ? [r.publisher, r.place].filter(Boolean).join(', ') : r.journal || r.institution;
  return `<p class="by">${esc(who)}${r.year ? ` · ${esc(r.year)}` : ''}</p>${where ? `<p class="where">${esc(where)}</p>` : ''}`;
}

function card(r, { inLibrary = false } = {}) {
  shown.set(r.id, r);
  const saved = lib.isSaved(r.id);
  const abstract = r.abstract
    ? `<details class="abstract"><summary>Abstract</summary><p>${esc(r.abstract)}</p></details>`
    : '';
  const links = `
    <a href="${esc(r.link)}" target="_blank" rel="noopener">Open ↗</a>
    ${r.pdf ? `<a href="${esc(r.pdf)}" target="_blank" rel="noopener">Free full text ↗</a>` : ''}`;
  const libControls = inLibrary
    ? `<div class="lib-controls">
        <label>Status
          <select data-act="status" data-id="${esc(r.id)}">
            ${Object.entries(lib.STATUSES).map(([v, l]) => `<option value="${v}" ${r.status === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>
        <label>Notes<textarea data-act="note" data-id="${esc(r.id)}" rows="2" placeholder="Why it matters, page numbers…">${esc(r.note)}</textarea></label>
      </div>`
    : '';
  return `
    <article class="card ${inLibrary ? `status-${esc(r.status)}` : ''}">
      <div class="card-top">
        ${cover(r)}
        <div class="card-body">
          <span class="badge ${r.type}">${TYPE_LABEL[r.type] || 'Resource'}</span>
          <h3>${esc(r.title)}</h3>
          ${meta(r)}
        </div>
      </div>
      ${abstract}
      ${libControls}
      <div class="actions">
        <div class="links">${links}</div>
        <div class="buttons">
          <button type="button" class="ghost" data-act="cite" data-id="${esc(r.id)}">Cite</button>
          ${
            inLibrary
              ? `<button type="button" class="ghost danger" data-act="remove" data-id="${esc(r.id)}">Remove</button>`
              : `<button type="button" class="${saved ? 'saved' : ''}" data-act="save" data-id="${esc(r.id)}" ${saved ? 'disabled' : ''}>${saved ? 'Saved ✓' : 'Save'}</button>`
          }
        </div>
      </div>
    </article>`;
}

function renderResults() {
  $('#results').innerHTML = state.results.map(r => card(r)).join('');
}

function renderLibrary() {
  const filter = $('#lib-filter').value.trim().toLowerCase();
  const items = lib
    .all()
    .filter(r => libStatus === 'all' || r.status === libStatus)
    .filter(r => !filter || `${r.title} ${(r.authors || []).join(' ')}`.toLowerCase().includes(filter));
  $('#library').innerHTML = items.length
    ? items.map(r => card(r, { inLibrary: true })).join('')
    : `<div class="empty"><p>${lib.count() ? 'Nothing matches this filter.' : 'Your library is empty. Search for a topic and press <b>Save</b> on anything you want to keep.'}</p></div>`;
  $('#export').disabled = !lib.count();
}

// ---------- events ----------
$('#search-form').addEventListener('submit', e => {
  e.preventDefault();
  state.query = $('#q').value;
  pushHash();
  runSearch();
});

$('#type-chips').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  state.type = b.dataset.type;
  pressed('#type-chips', 'type', state.type);
  pushHash();
  runSearch();
});

$('#sort').addEventListener('change', e => {
  state.sort = e.target.value;
  pushHash();
  runSearch();
});

$('#theo-only').addEventListener('change', e => {
  state.theoOnly = e.target.checked;
  pushHash();
  runSearch();
});

document.querySelectorAll('.topic').forEach(b =>
  b.addEventListener('click', () => {
    $('#q').value = state.query = b.textContent;
    pushHash();
    runSearch();
  }),
);

$('#load-more').addEventListener('click', () => {
  state.page += 1;
  runSearch({ append: true });
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.tagName === 'SELECT' || b.tagName === 'TEXTAREA') return;
  const id = b.dataset.id;
  const r = lib.get(id) || shown.get(id);
  if (b.dataset.act === 'save' && r) {
    lib.save(r);
    b.textContent = 'Saved ✓';
    b.disabled = true;
    b.classList.add('saved');
    updateCount();
  } else if (b.dataset.act === 'remove') {
    lib.remove(id);
    updateCount();
    renderLibrary();
  } else if (b.dataset.act === 'cite' && r) {
    const c = r.citeHtml ? { html: r.citeHtml, text: r.cite } : turabian(r);
    $('#cite-text').innerHTML = c.html;
    $('#cite-text').dataset.plain = c.text;
    $('#copy-cite').textContent = 'Copy';
    $('#cite-dialog').showModal();
  }
});

$('#library').addEventListener('change', e => {
  if (e.target.dataset.act === 'status') {
    lib.update(e.target.dataset.id, { status: e.target.value });
    renderLibrary();
  }
});

$('#library').addEventListener('input', e => {
  if (e.target.dataset.act === 'note') lib.update(e.target.dataset.id, { note: e.target.value });
});

$('#status-chips').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  libStatus = b.dataset.status;
  pressed('#status-chips', 'status', libStatus);
  renderLibrary();
});

$('#lib-filter').addEventListener('input', renderLibrary);

$('#copy-cite').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#cite-text').dataset.plain);
    $('#copy-cite').textContent = 'Copied ✓';
  } catch {
    $('#copy-cite').textContent = 'Select and copy manually';
  }
});

$('#export').addEventListener('click', () => {
  const blob = new Blob([toRis(lib.all())], { type: 'application/x-research-info-systems' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `theologyhub-library-${new Date().toISOString().slice(0, 10)}.ris`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

window.addEventListener('hashchange', showView);

// A cover that fails to load becomes a plain tile
document.addEventListener(
  'error',
  e => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.classList.contains('cover')) return;
    const tile = Object.assign(document.createElement('div'), { className: 'cover tile', textContent: img.dataset.icon });
    img.replaceWith(tile);
  },
  true,
);

// ---------- reading list ----------
const rlById = new Map(readingList.items.map(it => [it.id, it]));
$('#rl-title').textContent = readingList.title;
$('#rl-intro').textContent = `${readingList.items.length} works in ${readingList.strands.length} areas. Save any of them to My Library to track your reading and export to Zotero.`;

$('#view-reading').addEventListener('click', async e => {
  const jump = e.target.closest('[data-jump]');
  if (jump) {
    e.preventDefault();
    document.getElementById(jump.dataset.jump)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const it = rlById.get(b.dataset.id);
  if (b.dataset.act === 'save-rl' && it) {
    lib.save(toResource(it));
    updateCount();
    renderReadingList($('#rl-filter').value);
  } else if (b.dataset.act === 'copy-rl' && it) {
    try {
      await navigator.clipboard.writeText(it.cite);
      b.textContent = 'Copied ✓';
    } catch {
      b.textContent = 'Select and copy';
    }
  }
});

$('#rl-save-all').addEventListener('click', () => {
  let added = 0;
  for (const it of readingList.items) {
    if (!lib.isSaved(it.id)) {
      lib.save(toResource(it));
      added++;
    }
  }
  updateCount();
  renderReadingList($('#rl-filter').value);
  $('#rl-save-all').textContent = added ? `Added ${added} ✓` : 'All already saved ✓';
});

$('#rl-filter').addEventListener('input', e => renderReadingList(e.target.value));

// ---------- start ----------
readHash();
updateCount();
showView();
if (state.query) runSearch();
