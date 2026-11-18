// Turabian (Chicago notes-bibliography) entries and RIS export for Zotero.

// "John Mark Smith" -> { first: "John Mark", last: "Smith" }
export function splitName(name = '') {
  const clean = name.trim();
  if (clean.includes(',')) {
    const [last, first] = clean.split(',').map(s => s.trim());
    return { first, last };
  }
  const parts = clean.split(/\s+/);
  const last = parts.pop() || '';
  return { first: parts.join(' '), last };
}

function authorList(authors) {
  if (!authors?.length) return '';
  const names = authors.map((a, i) => {
    const { first, last } = splitName(a);
    if (i === 0) return first ? `${last}, ${first}` : last;
    return `${first} ${last}`.trim();
  });
  if (names.length === 1) return names[0];
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
  return `${names[0]}, et al`;
}

const end = s => (/[.?!]$/.test(s) ? s : `${s}.`);

// Returns { text, html } — html keeps the italics.
export function turabian(r) {
  const who = authorList(r.authors);
  const lead = who ? `${end(who)} ` : '';
  if (r.type === 'book') {
    const pub = [r.place, r.publisher].filter(Boolean).join(': ');
    const tail = [pub, r.year].filter(Boolean).join(', ');
    return {
      text: `${lead}${end(r.title)} ${tail ? end(tail) : ''}`.trim(),
      html: `${esc(lead)}<i>${esc(end(r.title))}</i> ${esc(tail ? end(tail) : '')}`.trim(),
    };
  }
  if (r.type === 'dissertation') {
    const tail = ['PhD diss.', r.institution, r.year].filter(Boolean).join(', ');
    const s = `${lead}“${end(r.title)}” ${end(tail)}`;
    return { text: s, html: esc(s) };
  }
  // article
  let journal = r.journal || '';
  let jHtml = journal ? `<i>${esc(journal)}</i>` : '';
  const vol = [r.volume, r.issue ? `no. ${r.issue}` : ''].filter(Boolean).join(', ');
  const yearPages = `${r.year ? ` (${r.year})` : ''}${r.pages ? `: ${r.pages}` : ''}`;
  const doi = r.doi ? ` https://doi.org/${r.doi}.` : '';
  const body = `${vol ? ` ${vol}` : ''}${yearPages}.${doi}`;
  return {
    text: `${lead}“${end(r.title)}” ${journal}${body}`.trim(),
    html: `${esc(lead)}“${esc(end(r.title))}” ${jHtml}${esc(body)}`.trim(),
  };
}

const RIS_TYPE = { book: 'BOOK', article: 'JOUR', dissertation: 'THES' };

export function toRis(items) {
  return items
    .map(r => {
      const lines = [`TY  - ${RIS_TYPE[r.type] || 'GEN'}`, `TI  - ${r.title}`];
      for (const a of r.authors || []) {
        const { first, last } = splitName(a);
        lines.push(`AU  - ${first ? `${last}, ${first}` : last}`);
      }
      if (r.year) lines.push(`PY  - ${r.year}`);
      if (r.journal) lines.push(`JO  - ${r.journal}`);
      if (r.volume) lines.push(`VL  - ${r.volume}`);
      if (r.issue) lines.push(`IS  - ${r.issue}`);
      if (r.pages) {
        const [sp, ep] = r.pages.split('–');
        lines.push(`SP  - ${sp}`);
        if (ep) lines.push(`EP  - ${ep}`);
      }
      if (r.publisher) lines.push(`PB  - ${r.publisher}`);
      if (r.institution) lines.push(`PB  - ${r.institution}`);
      if (r.place) lines.push(`CY  - ${r.place}`);
      if (r.isbn) lines.push(`SN  - ${r.isbn}`);
      if (r.doi) lines.push(`DO  - ${r.doi}`);
      if (r.link && !/search\?|scholar\?/.test(r.link)) lines.push(`UR  - ${r.link}`);
      if (r.abstract) lines.push(`AB  - ${r.abstract}`);
      if (r.note) lines.push(`N1  - ${r.note}`);
      lines.push('ER  - ');
      return lines.join('\r\n');
    })
    .join('\r\n\r\n');
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
