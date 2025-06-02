import {
  displayResources,
  displayFavourites,
  displayCollection,
} from "./src_js_render.js";

export function addToFavourites(resource) {
  const favourites = JSON.parse(
    localStorage.getItem("theologyFavourites") || "[]",
  );
  if (!favourites.some((f) => f.id === resource.id)) {
    favourites.push(resource);
    localStorage.setItem("theologyFavourites", JSON.stringify(favourites));
    displayFavourites();
    displayResources(
      JSON.parse(localStorage.getItem("lastResources") || "[]"),
      document.querySelector(".nav-link.active")?.dataset.type || null,
    );
  }
}

export function removeFromFavourites(id) {
  let favourites = JSON.parse(
    localStorage.getItem("theologyFavourites") || "[]",
  );
  favourites = favourites.filter((f) => f.id !== id);
  localStorage.setItem("theologyFavourites", JSON.stringify(favourites));
  displayFavourites();
  displayResources(
    JSON.parse(localStorage.getItem("lastResources") || "[]"),
    document.querySelector(".nav-link.active")?.dataset.type || null,
  );
}

export function addToCollection(resource) {
  const resources = JSON.parse(
    localStorage.getItem("theologyCollection") || "[]",
  );
  if (!resources.some((r) => r.id === resource.id)) {
    resources.push(resource);
    localStorage.setItem("theologyCollection", JSON.stringify(resources));
    displayCollection();
  }
}

export function removeFromCollection(id) {
  let resources = JSON.parse(
    localStorage.getItem("theologyCollection") || "[]",
  );
  resources = resources.filter((r) => r.id !== id);
  localStorage.setItem("theologyCollection", JSON.stringify(resources));
  displayCollection();
}

export function markAsRead(id) {
  const readStatus = JSON.parse(
    localStorage.getItem("theologyReadStatus") || "{}",
  );
  readStatus[id] = true;
  localStorage.setItem("theologyReadStatus", JSON.stringify(readStatus));
  displayResources(
    JSON.parse(localStorage.getItem("lastResources") || "[]"),
    document.querySelector(".nav-link.active")?.dataset.type || null,
  );
  displayFavourites();
  displayCollection();
}

export function markAsUnread(id) {
  const readStatus = JSON.parse(
    localStorage.getItem("theologyReadStatus") || "{}",
  );
  delete readStatus[id];
  localStorage.setItem("theologyReadStatus", JSON.stringify(readStatus));
  displayResources(
    JSON.parse(localStorage.getItem("lastResources") || "[]"),
    document.querySelector(".nav-link.active")?.dataset.type || null,
  );
  displayFavourites();
  displayCollection();
}
