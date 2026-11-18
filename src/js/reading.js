// The research reading list (bi-vocational ministry), shipped with the app.
import data from '../data/bivocational.json';
import { esc } from './cite.js';
import * as lib from './library.js';

export const readingList = data;

// Where to find a work: its own link, else a search that should turn it up.
export function findLink(item) {
  if (item.url) return item.url;
  if (item.doi) return `https://doi.org/${item.doi}`;
  const q = encodeURIComponent(`${item.title} ${item.authors[0] || ''}`);
  return item.type === 'book'
    ? `https://openlibrary.org/search?q=${q}`
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${item.title}"`)}`;
}

// Shape a list item as a library resource so it can be saved, cited and exported.
export function toResource(item) {
  const journal = item.type === 'article' ? item.pub.split(/\s\d/)[0] : '';
  const [place, publisher] = item.type === 'book' && item.pub.includes(':') ? item.pub.split(/:\s*/, 2) : ['', item.type === 'book' ? item.pub : ''];
  return {
    id: item.id,
    type: item.type === 'chapter' ? 'book' : item.type,
    title: item.title,
    authors: item.authors,
    year: item.year,
    journal,
    place,
    publisher,
    doi: item.doi,
    link: findLink(item),
    pdf: '',
    abstract: '',
    cite: item.cite,
    citeHtml: item.citeHtml,
    source: 'Reading list',
  };
}

export function renderReadingList(filter = '') {
  const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
  const match = it => !words.length || words.every(w => `${it.cite} ${it.strand}`.toLowerCase().includes(w));
  let html = '';
  let toc = '';
  data.strands.forEach((strand, i) => {
    const items = data.items.filter(it => it.strand === strand && match(it));
    if (!items.length) return;
    toc += `<a href="#reading" data-jump="s${i}">${esc(strand)} <span>${items.length}</span></a>`;
    html += `<section class="rl-section" id="s${i}">
      <h2>${esc(strand)}</h2>
      <ol class="rl-items">${items
        .map(it => {
          const saved = lib.isSaved(it.id);
          const status = saved ? lib.STATUSES[lib.get(it.id).status] : '';
          return `<li class="rl-item ${saved ? `is-${lib.get(it.id).status}` : ''}">
            <span class="badge ${it.type === 'chapter' ? 'book' : it.type}">${it.type}</span>
            <p class="rl-cite">${it.citeHtml}</p>
            <div class="rl-buttons">
              <a href="${esc(findLink(it))}" target="_blank" rel="noopener">${it.url || it.doi ? 'Open ↗' : 'Find ↗'}</a>
              <button type="button" class="ghost" data-act="copy-rl" data-id="${esc(it.id)}">Copy</button>
              ${
                saved
                  ? `<span class="rl-status">${esc(status)}</span>`
                  : `<button type="button" data-act="save-rl" data-id="${esc(it.id)}">Save</button>`
              }
            </div>
          </li>`;
        })
        .join('')}</ol>
    </section>`;
  });
  document.getElementById('rl-toc').innerHTML = toc;
  document.getElementById('rl-list').innerHTML = html || '<p class="empty">Nothing in the reading list matches that filter.</p>';
}
