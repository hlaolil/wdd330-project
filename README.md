# TheologyHub

Search theology books, journal articles and dissertations in one place, keep a reading list, and send it to Zotero.

- Live: https://hlaolil.github.io/wdd130/theologyhub/ (also https://theologicalresearch.netlify.app/ when Netlify rebuilds from this repo)

## What it does

- **One search, three kinds of source.** Books come from [Open Library](https://openlibrary.org/developers/api); journal articles and dissertations come from [OpenAlex](https://docs.openalex.org). Neither needs an API key.
- **Filter and sort.** All / Books / Articles / Dissertations; best match, newest, oldest or title. "Theology only" adds *theology* to the search unless the words already point there.
- **Abstracts and free full text.** Article and dissertation abstracts are shown, with a link to an open-access copy when one exists.
- **Cite.** Each result gives a Turabian bibliography entry you can copy.
- **My Library.** Save anything, mark it *To read*, *Reading* or *Read*, add notes, filter it, and export it all as a `.ris` file that Zotero (or EndNote, Mendeley) imports. Saved items stay in your browser.
- **Shareable searches.** The search is kept in the address, e.g. `#search?q=Pentecostalism&type=article`.

## Code

```
src/index.html      page structure
src/css/styles.css  styles
src/js/api.js       Open Library + OpenAlex requests, mapped to one "resource" shape
src/js/cite.js      Turabian entries and RIS export
src/js/library.js   saved items in localStorage
src/js/main.js      search, rendering and events
```

## Run it

```
npm install
npm start        # local server
npm run build    # production files in dist/
```

Originally built for WDD 330 (Web Frontend Development II), BYU-Pathway Worldwide.
