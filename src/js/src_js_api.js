import { displayResources } from "./src_js_render.js";

const OPEN_LIBRARY_API_URL = "https://openlibrary.org/search.json";
const DOAJ_API_URL = "https://doaj.org/api/v2/search/articles";

export async function fetchWithRetry(
  url,
  options,
  retries = 3,
  backoff = 4000,
) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorText = "No response text available";
        try {
          errorText = await response.text();
        } catch (e) {
          e;
        }
        let message = `HTTP error! Status: ${response.status}`;
        if (response.status === 429)
          message = "Rate limit exceeded. Please wait and try again.";
        else if (response.status >= 500)
          message = "Server error. Check API status.";
        throw new Error(`${message} Details: ${errorText}`);
      }
      return await response.json();
    } catch (err) {
      const isCorsError =
        err.message.includes("CORS") || err.message.includes("access-control");
      const errorMessage = isCorsError
        ? "CORS restriction detected. Host on a server or use a proxy."
        : err.message || "Network error";
      if (i < retries - 1) {
        console.log(`Retrying`);
      } else {
        throw new Error(errorMessage);
      }
    }
  }
}

export function normalizeResource(resource, source) {
  if (source === "openlibrary") {
    return {
      type: "book",
      title: resource.title || "Untitled",
      authors: resource.author_name?.slice(0, 3).join(", ") || "Unknown Author",
      year: resource.first_publish_year || "Unknown",
      id: resource.isbn?.[0] || resource.key || "No ID",
      cover: resource.cover_i
        ? `https://covers.openlibrary.org/b/id/${resource.cover_i}-M.jpg`
        : "https://via.placeholder.com/100x150?text=No+Cover",
      link: `https://openlibrary.org${resource.key}`,
      abstract: "No abstract available",
    };
  } else if (source === "doaj") {
    const bibjson = resource.bibjson || {};
    const doi =
      bibjson.identifier?.find((id) => id.type === "doi")?.id ||
      bibjson.link?.[0]?.url ||
      "No DOI";
    return {
      type: bibjson.journal?.title ? "article" : "dissertation",
      title: bibjson.title || "Untitled",
      authors: bibjson.author?.length
        ? bibjson.author
            .slice(0, 3)
            .map((a) => a.name)
            .join(", ")
        : "Unknown Author",
      year: bibjson.year || "Unknown",
      id: doi,
      cover: "https://via.placeholder.com/100x150?text=Article",
      link: doi.startsWith("http") ? doi : `https://doi.org/${doi}`,
      abstract: bibjson.abstract
        ? bibjson.abstract.substring(0, 100) + "..."
        : "No abstract available",
    };
  }
}

export async function fetchResources(query = "theology", type = "all") {
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  if (loading) loading.classList.remove("hidden");
  if (error) error.classList.add("hidden");
  let resources = [];

  try {
    if (type === "all" || type === "book") {
      try {
        const openLibraryUrl = `${OPEN_LIBRARY_API_URL}?q=${encodeURIComponent(query + " theology")}&limit=6`;
        const openLibraryData = await fetchWithRetry(openLibraryUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        resources = resources.concat(
          (openLibraryData.docs || []).map((resource) =>
            normalizeResource(resource, "openlibrary"),
          ),
        );
      } catch (openLibraryErr) {
        console.warn(
          "Open Library API failed:",
          openLibraryErr.message || "Unknown error",
          { url: OPEN_LIBRARY_API_URL },
        );
      }
    }

    if (type === "all" || type === "article" || type === "dissertation") {
      try {
        const doajUrl = `${DOAJ_API_URL}/${encodeURIComponent(query + " theology")}?sort=year-desc&pageSize=6`;
        const doajData = await fetchWithRetry(doajUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        resources = resources.concat(
          (doajData.results || []).map((resource) =>
            normalizeResource(resource, "doaj"),
          ),
        );
      } catch (doajErr) {
        console.warn("DOAJ API failed:", doajErr.message || "Unknown error", {
          url: DOAJ_API_URL,
        });
      }
    }

    if (resources.length === 0) {
      throw new Error("No resources found. Try a different query or category.");
    }

    localStorage.setItem("lastResources", JSON.stringify(resources));
    displayResources(resources, type === "all" ? null : type);
  } catch (err) {
    const errorMessage =
      err.message ||
      "Network error or CORS restriction. Host on a server or use a proxy.";
    if (error) error.textContent = `Failed to fetch resources: ${errorMessage}`;
    if (error) error.classList.remove("hidden");
    console.error("Fetch error details:", {
      message: err.message || "Unknown",
      stack: err.stack || "No stack trace",
      url: err.url || "Unknown",
      time: new Date().toISOString(),
    });
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}
