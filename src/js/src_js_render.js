const appConfig = {
  header: {
    title: 'TheologyHub',
    tagline: 'Search and manage theology books, journals, and dissertations',
    navLinks: [
      { type: 'home', label: 'Home', href: 'index.html' },
      { type: 'book', label: 'Books', href: 'books.html' },
      { type: 'article', label: 'Journal Articles', href: 'articles.html' },
      { type: 'dissertation', label: 'Dissertations', href: 'dissertations.html' }
    ]
  },
  footer: {
    message: `© ${new Date().getFullYear()} TheologyHub. Not a real business.`,
  },
};

export function renderHeader() {
  const header = document.getElementById('dynamic-header');
  header.innerHTML = `
    <div class="header-container">
      <div>
        <h1 class="header-title">${appConfig.header.title}</h1>
        <p class="header-tagline">${appConfig.header.tagline}</p>
      </div>
      <nav class="nav">
        ${appConfig.header.navLinks.map(link => `
          <a href="${link.href}" class="nav-link" data-type="${link.type}">${link.label}</a>
        `).join('')}
      </nav>
    </div>
  `;
}

export function renderFooter() {
  const footer = document.getElementById('dynamic-footer');
  footer.innerHTML = `<p>${appConfig.footer.message}</p>`;
}

export function sortResources(resources, sortBy) {
  if (sortBy === 'year-desc') {
    return resources.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  } else if (sortBy === 'year-asc') {
    return resources.sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
  } else if (sortBy === 'title') {
    return resources.sort((a, b) => a.title.localeCompare(b.title));
  }
  return resources;
}

export function renderResourceCard(resource, options = {}) {
  const template = document.getElementById('resource-card-template');
  const clone = template.content.cloneNode(true);
  const isRead = options.readStatus?.[resource.id] || false;
  const isFavourite = options.favourites?.some(f => f.id === resource.id) || false;
  const isCollection = options.isCollection || false;
  const isFavouritesList = options.isFavouritesList || false;

  clone.querySelector('.resource-img').src = resource.cover;
  clone.querySelector('.resource-img').alt = `Cover of ${resource.title}`;
  clone.querySelector('.read-indicator').textContent = isRead ? '✔ Read' : '';
  clone.querySelector('.resource-title').textContent = resource.title;
  clone.querySelector('.resource-type').textContent = `Type: ${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}`;
  clone.querySelector('.resource-authors').textContent = `Author(s): ${resource.authors}`;
  clone.querySelector('.resource-year').textContent = `Published: ${resource.year}`;
  clone.querySelector('.id-label').textContent = resource.type === 'book' ? 'ISBN: ' : 'DOI/URL: ';
  const link = clone.querySelector('.resource-link');
  link.href = resource.link;
  link.textContent = resource.id;
  clone.querySelector('.resource-abstract').textContent = resource.abstract;
  clone.querySelector('.card-resource').setAttribute('aria-label', `${resource.type}: ${resource.title}`);

  const buttonContainer = clone.querySelector('.button-container');
  if (!isFavouritesList && !isCollection) {
    buttonContainer.innerHTML = `
      <button class="btn btn-collection" data-resource='${JSON.stringify(resource)}'>
        Add to Collection
      </button>
      <button class="btn ${isFavourite ? 'btn-favourite-remove' : 'btn-favourite'}" data-resource='${JSON.stringify(resource)}'>
        ${isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
      </button>
      <button class="btn ${isRead ? 'btn-unread' : 'btn-read'}" data-id="${resource.id}">
        ${isRead ? 'Mark as Unread' : 'Mark as Read'}
      </button>
    `;
  } else if (isFavouritesList) {
    buttonContainer.innerHTML = `
      <button class="btn btn-favourite-remove" data-id="${resource.id}">
        Remove from Favourites
      </button>
      <button class="btn ${isRead ? 'btn-unread' : 'btn-read'}" data-id="${resource.id}">
        ${isRead ? 'Mark as Unread' : 'Mark as Read'}
      </button>
    `;
  } else if (isCollection) {
    buttonContainer.innerHTML = `
      <button class="btn btn-collection-remove" data-id="${resource.id}">
        Remove
      </button>
      <button class="btn ${isRead ? 'btn-unread' : 'btn-read'}" data-id="${resource.id}">
        ${isRead ? 'Mark as Unread' : 'Mark as Read'}
      </button>
    `;
  }

  return clone;
}

export function displayResources(resources, filterType = '') {
  const resourceList = document.getElementById('resourceList');
  resourceList.innerHTML = '';
  const sortBy = document.getElementById('sort-select')?.value || 'relevance';
  const filteredResources = filterType ? resources.filter(r => r.type === filterType) : resources;
  const sortedResources = sortResources([...filteredResources], sortBy);
  const readStatus = JSON.parse(localStorage.getItem('theologyResources') || '{}');
  const favourites = JSON.parse(localStorage.getItem('favorites') || '[]');

  if (sortedResources.length === 0) {
    resourceList.innerHTML = '<div class="no-resources-text">No resources found. Try a different search term or category.</div>';
    return;
  }

sortedResources.forEach(resource => {
    const card = renderResourceCard(resource, { readStatus, favourites });
    resourceList.appendChild(card);
 });
}

export function displayFavourites() {
  const favouritesList = document.getElementById('favouritesList');
  const favourites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const readStatus = JSON.parse(localStorage.getItem('Favorites') || '{}');
  favouritesList.innerHTML = '';

  if (favourites.length === 0) {
    favouritesList.innerHTML = '<div class="no-resources-text">Your favourites list is empty.</div>';
    return;
  }

  favourites.forEach(resource => {
    const card = renderResourceCard(resource, { readStatus, favourites, isFavouritesList: true });
    favouritesList.appendChild(card);
  });
}

export function displayCollection() {
  const collectionList = document.getElementById('collectionList');
  const resources = JSON.parse(localStorage.getItem('theologyResources') || '[]');
  const readStatus = JSON.parse(localStorage.getItem('favorites') || '{}');
  const favourites = JSON.parse(localStorage.getItem('favorites') || '[]');
  collectionList.innerHTML = '';

  if (resources.length === 0) {
    collectionList.innerHTML = '<div class="no-resources-text">Your collection is empty.</div>';
    return;
  }

  resources.forEach(resource => {
    const card = renderResourceCard(resource, { readStatus, favourites, isCollection: true });
    collectionList.appendChild(card);
  });
}
