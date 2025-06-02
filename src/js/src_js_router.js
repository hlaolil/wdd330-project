import {
  fetchResources,
  fetchWithRetry,
  normalizeResource,
} from "./src_js_api.js";
import {
  renderHeader,
  displayResources,
  displayFavourites,
  displayCollection,
} from "./src_js_render.js";

export function initRouter() {
  const mainContent = document.getElementById("main-content");

  const routes = {
    home: () => {
      mainContent.innerHTML = `
        <section class="mb-8">
          <form id="search-form" class="flex flex-col md:flex-row gap-4 items-center">
            <label for="search-input" class="sr-only">Search theology resources</label>
            <input
              id="search-input"
              type="text"
              placeholder="Enter keywords (e.g., miracles, Pentecostalism)"
              class="w-full md:w-1/2 p-2 border rounded-lg"
              aria-label="Search theology resources"
            >
            <select id="sort-select" class="p-2 border rounded-lg">
              <option value="relevance">Sort by Relevance</option>
              <option value="year-desc">Sort by Year (Newest First)</option>
              <option value="year-asc">Sort by Year (Oldest First)</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </section>
        <section id="error" class="hidden text-red-600 text-center mb-4"></section>
        <section id="loading" class="hidden">
          <div class="spinner"></div>
        </section>
        <section id="resourceList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></section>
        <section class="mt-6">
          <h2 class="text-2xl font-semibold divider">My Favourites</h2>
          <div id="favouritesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"></div>
        </section>
        <section class="mt-6">
          <h2 class="text-2xl font-semibold divider">My Theology Collection</h2>
          <div id="collectionList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"></div>
        </section>
      `;
      fetchResources();
      displayFavourites();
      displayCollection();
    },
    book: () => {
      mainContent.innerHTML = `
        <section class="mb-8">
          <form id="search-form" class="flex flex-col md:flex-row gap-4 items-center">
            <label for="search-input" class="sr-only">Search theology books</label>
            <input
              id="search-input"
              type="text"
              placeholder="Enter keywords for books"
              class="w-full md:w-1/2 p-2 border rounded-lg"
              aria-label="Search theology books"
            >
            <select id="sort-select" class="p-2 border rounded-lg">
              <option value="relevance">Sort by Relevance</option>
              <option value="year-desc">Sort by Year (Newest First)</option>
              <option value="year-asc">Sort by Year (Oldest First)</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </section>
        <section id="error" class="hidden text-red-600 text-center mb-4"></section>
        <section id="loading" class="hidden">
          <div class="spinner"></div>
        </section>
        <section id="resourceList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></section>
      `;
      fetchResources("theology", "book");
    },
    article: () => {
      mainContent.innerHTML = `
        <section class="mb-8">
          <form id="search-form" class="flex flex-col md:flex-row gap-4 items-center">
            <label for="search-input" class="sr-only">Search journal articles</label>
            <input
              id="search-input"
              type="text"
              placeholder="Enter keywords for articles"
              class="w-full md:w-1/2 p-2 border rounded-lg"
              aria-label="Search journal articles"
            >
            <select id="sort-select" class="p-2 border rounded-lg">
              <option value="relevance">Sort by Relevance</option>
              <option value="year-desc">Sort by Year (Newest First)</option>
              <option value="year-asc">Sort by Year (Oldest First)</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </section>
        <section id="error" class="hidden text-red-600 text-center mb-4"></section>
        <section id="loading" class="hidden">
          <div class="spinner"></div>
        </section>
        <section id="resourceList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></section>
      `;
      fetchResources("theology", "article");
    },
    dissertation: () => {
      mainContent.innerHTML = `
        <section class="mb-8">
          <form id="search-form" class="flex flex-col md:flex-row gap-4 items-center">
            <label for="search-input" class="sr-only">Search dissertations</label>
            <input
              id="search-input"
              type="text"
              placeholder="Enter keywords for dissertations"
              class="w-full md:w-1/2 p-2 border rounded-lg"
              aria-label="Search dissertations"
            >
            <select id="sort-select" class="p-2 border rounded-lg">
              <option value="relevance">Sort by Relevance</option>
              <option value="year-desc">Sort by Year (Newest First)</option>
              <option value="year-asc">Sort by Year (Oldest First)</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </section>
        <section id="error" class="hidden text-red-600 text-center mb-4"></section>
        <section id="loading" class="hidden">
          <div class="spinner"></div>
        </section>
        <section id="resourceList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></section>
      `;
      fetchResources("theology", "dissertation");
    },
  };

  function handleRoute() {
    const path = window.location.hash.slice(1) || "home";
    const route = routes[path] || routes["home"];
    route();
  }

  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

export function navigate(type) {
  window.location.hash = type;
  document
    .querySelectorAll(".nav-link")
    .forEach((link) => link.classList.remove("active"));
  const activeLink = document.querySelector(`.nav-link[data-type="${type}"]`);
  if (activeLink) activeLink.classList.add("active");
}
