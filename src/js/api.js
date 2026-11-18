// Talks to the two free, key-less sources and turns their answers
// into one common "resource" shape the rest of the app uses.
//   Books:                       Open Library  (openlibrary.org)
//   Journal articles, theses:    OpenAlex      (openalex.org)

const OPEN_LIBRARY = 'https://openlibrary.org/search.json';
const OPENALEX = 'https://api.openalex.org/works';
export const PAGE_SIZE = 12;

const OL_SORT = { newest: 'new', oldest: 'old', title: 'title' };
const OA_SORT = {
  newest: 'publication_year:desc',
  oldest: 'publication_year:asc',
  title: 'display_name:asc',
};

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 429) throw new Error('Too many searches in a short time. Wait a moment and try again.');
  if (!res.ok) throw new Error(`The service answered with an error (${res.status}).`);
  return res.json();
}

export async function searchBooks({ query, sort, page, perPage = PAGE_SIZE }) {
  const params = new URLSearchParams({
    q: query,
    page,
    limit: perPage,
    fields: 'key,title,subtitle,author_name,first_publish_year,cover_i,isbn,publisher,publish_place,number_of_pages_median',
  });
  if (OL_SORT[sort]) params.set('sort', OL_SORT[sort]);
  const data = await getJson(`${OPEN_LIBRARY}?${params}`);
  return {
    items: (data.docs || []).map(fromOpenLibrary),
    total: data.numFound ?? data.num_found ?? 0,
  };
}

export async function searchWorks({ query, kind, sort, page, perPage = PAGE_SIZE }) {
  const params = new URLSearchParams({
    search: query,
    filter: `type:${kind}`,
    page,
    'per-page': perPage,
  });
  if (OA_SORT[sort]) params.set('sort', OA_SORT[sort]);
  const data = await getJson(`${OPENALEX}?${params}`);
  return {
    items: (data.results || []).map(fromOpenAlex),
    total: data.meta?.count ?? 0,
  };
}

function fromOpenLibrary(doc) {
  return {
    id: `ol:${doc.key}`,
    type: 'book',
    title: doc.subtitle ? `${doc.title}: ${doc.subtitle}` : doc.title || 'Untitled',
    authors: (doc.author_name || []).slice(0, 4),
    year: doc.first_publish_year || '',
    publisher: doc.publisher?.[0] || '',
    place: doc.publish_place?.[0] || '',
    isbn: doc.isbn?.find(i => i.length === 13) || doc.isbn?.[0] || '',
    cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
    link: `https://openlibrary.org${doc.key}`,
    pdf: '',
    abstract: '',
    source: 'Open Library',
  };
}

function fromOpenAlex(w) {
  const loc = w.primary_location || {};
  const firstInstitution = w.authorships?.[0]?.institutions?.[0]?.display_name || '';
  const isThesis = w.type === 'dissertation';
  const doi = w.doi ? w.doi.replace('https://doi.org/', '') : '';
  return {
    id: `oa:${(w.id || '').split('/').pop()}`,
    type: isThesis ? 'dissertation' : 'article',
    title: w.display_name || w.title || 'Untitled',
    authors: (w.authorships || []).slice(0, 4).map(a => a.author?.display_name).filter(Boolean),
    year: w.publication_year || '',
    journal: isThesis ? '' : loc.source?.display_name || '',
    institution: isThesis ? firstInstitution || loc.source?.host_organization_name || '' : '',
    volume: w.biblio?.volume || '',
    issue: w.biblio?.issue || '',
    pages: [w.biblio?.first_page, w.biblio?.last_page].filter(Boolean).join('–'),
    doi,
    cover: '',
    link: doi ? `https://doi.org/${doi}` : loc.landing_page_url || w.id,
    pdf: w.open_access?.oa_url || '',
    abstract: rebuildAbstract(w.abstract_inverted_index),
    source: 'OpenAlex',
  };
}

// OpenAlex stores abstracts as { word: [positions] }; put the words back in order.
function rebuildAbstract(index) {
  if (!index) return '';
  const words = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter(Boolean).join(' ');
}
