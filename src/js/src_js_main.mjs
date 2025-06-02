import { fetchResources } from "./src_js_api.js";
import {
  renderHeader,
  renderFooter,
  renderResourceCard,
  displayResources,
  displayFavourites,
  displayCollection,
} from "./src_js_render.js";
import {
  addToFavourites,
  removeFromFavourites,
  addToCollection,
  removeFromCollection,
  markAsRead,
  markAsUnread,
} from "./src_js_state.js";

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();

  // Initial fetch
  fetchResources();

  // Event listeners
  document.getElementById("main-content").addEventListener("submit", (e) => {
    if (e.target.id === "search-form") {
      e.preventDefault();
      const query = document.getElementById("search-input").value.trim();
      const activeNav =
        document.querySelector(".nav-link.active")?.dataset.type || "all";
      fetchResources(query || "theology", activeNav);
    }
  });

  document.getElementById("main-content").addEventListener("change", (e) => {
    if (e.target.id === "sort-select") {
      const query =
        document.getElementById("search-input").value.trim() || "theology";
      const activeNav =
        document.querySelector(".nav-link.active")?.dataset.type || "all";
      fetchResources(query, activeNav);
    }
  });

  document.getElementById("main-content").addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-collection")) {
      const resource = JSON.parse(e.target.dataset.resource);
      addToCollection(resource);
    } else if (e.target.classList.contains("add-to-favourites")) {
      const resource = JSON.parse(e.target.dataset.resource);
      addToFavourites(resource);
    } else if (e.target.classList.contains("remove-from-favourites")) {
      const resource = JSON.parse(e.target.dataset.resource);
      removeFromFavourites(resource.id);
    } else if (e.target.classList.contains("mark-as-read")) {
      const id = e.target.dataset.id;
      markAsRead(id);
    } else if (e.target.classList.contains("mark-as-unread")) {
      const id = e.target.dataset.id;
      markAsUnread(id);
    } else if (e.target.classList.contains("remove-from-collection")) {
      const id = e.target.dataset.id;
      removeFromCollection(id);
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("nav-link")) {
      e.preventDefault();
      const type = e.target.dataset.type;
    }
  });

  // Set Home as active by default
  setTimeout(() => {
    const homeLink = document.querySelector(".nav-link[data-type=\"home\"]");
    if (homeLink) {
      homeLink.classList.add("active");
    }
  }, 0);
});
