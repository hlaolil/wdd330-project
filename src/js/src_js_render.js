const appConfig = {
  header: {
    title: 'TheologyHub',
    tagline: 'Search and manage theology books, journals, and dissertations',
    navLinks: [
      { type: 'home', label: 'Home' },
      { type: 'book', label: 'Books' },
      { type: 'article', label: 'Journal Articles' },
      { type: 'dissertation', label: 'Dissertations' }
    ]
  },
  footer: {
    message: `© ${new Date().getFullYear()} TheologyHub. Not a real business.`,
  }
};

export function renderHeader() {
  const header = document.getElementById('dynamic-header');
  header.className = 'bg-blue-600 text-white p-4';
  header.innerHTML = `
    <div class="container mx-auto flex flex-col md:flex-row justify-between items-center">
      <div class="text-center md:text-left mb-4 md:mb-0">
        <h1 class="text-3xl font-bold">${appConfig.header.title}</h1>
        <p class="mt-2">${appConfig.header.tagline}</p>
      </div>
      <nav class="flex gap-4">
        ${appConfig.header.navLinks.map(link => `
          <a href="#${link.type}" class="nav-link text-white hover:text-blue-200" data-type="${link.type}">${link.label}</a>
        `).join('')}
      </nav>
    </div>
  `;
}

export function renderFooter() {
  const footer = document.getElementById('dynamic-footer');
  footer.className = 'bg-gray-800 text-white text-center p-4 mt-8';
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
  clone.querySelector('.card').setAttribute('aria-label', `${resource.type}: ${resource.title}`);

  const buttonContainer = clone.querySelector('.button-container');
  if (!isFavouritesList && !isCollection) {
    buttonContainer.innerHTML = `
      <button class="add-to-collection bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-resource='${JSON.stringify(resource)}'>
        Add to Collection
      </button>
      <button class="${isFavourite ? 'remove-from-favourites bg-yellow-600' : 'add-to-favourites bg-yellow-500'} text-white px-4 py-2 rounded-lg hover:bg-yellow-700" data-resource='${JSON.stringify(resource)}'>
        ${isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
      </button>
      <button class="${isRead ? 'mark-as-unread bg-gray-600' : 'mark-as-read bg-green-600'} text-white px-4 py-2 rounded-lg hover:bg-${isRead ? 'gray-700' : 'green-700'}" data-id="${resource.id}">
        ${isRead ? 'Mark as Unread' : 'Mark as Read'}
      </button>
    `;
  } else if (isFavouritesList) {
    buttonContainer.innerHTML = `
      <button class="remove-from-favourites bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700" data-id="${resource.id}">
        Remove from Favourites
      </button>
      <button class="${isRead ? 'mark-as-unread bg-gray-600' : 'mark-as-read bg-green-600'} text-white px-4 py-2 rounded-lg hover:bg-${isRead ? 'gray-700' : 'green-700'}" data-id="${resource.id}">
        ${isRead ? 'Mark as Unread' : 'Mark as Read'}
      </button>
    `;
  } else if (isCollection) {
    buttonContainer.innerHTML = `
      <button class="remove-from-collection bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700" data-id="${resource.id}">
        Remove
      </button>
      <button class="${isRead ? 'mark-as-unread bg-gray-600' : 'mark-as-read bg-green-600'} text-white px-4 py-2 rounded-lg hover:bg-${isRead ? 'gray-700' : 'green-700'}" data-id="${resource.id}">
        ${isRead ? 'Mark as Unread' : 'Mark as Read'}
      </button>
    `;
  }

  return clone;
}

export function displayResources(resources, filterType = null) {
  const resourceList = document.getElementById('resourceList');
  resourceList.innerHTML = '';
  const sortBy = document.getElementById('sort-select')?.value || 'relevance';
  const filteredResources = filterType ? resources.filter(r => r.type === filterType) : resources;
  const sortedResources = sortResources([...filteredResources], sortBy);
  const readStatus = JSON.parse(localStorage.getItem('theologyReadStatus') || '{}');
  const favourites = JSON.parse(localStorage.getItem('theologyFavourites') || '[]');

  if (sortedResources.length === 0) {
    resourceList.innerHTML = '<div class="text-center text-gray-600 col-span-full">No resources found. Try a different search term or category.</div>';
    return;
  }

  sortedResources.forEach(resource => {
    const card = renderResourceCard(resource, { readStatus, favourites });
    resourceList.appendChild(card);
  });
}

export function displayFavourites() {
  const favouritesList = document.getElementById('favouritesList');
  const favourites = JSON.parse(localStorage.getItem('theologyFavourites') || '[]');
  const readStatus = JSON.parse(localStorage.getItem('theologyReadStatus') || '{}');
  favouritesList.innerHTML = '';

  if (favourites.length === 0) {
    favouritesList.innerHTML = '<div class="text-center text-gray-600 col-span-full">Your favourites list is empty.</div>';
    return;
  }

  favourites.forEach(resource => {
    const card = renderResourceCard(resource, { readStatus, favourites, isFavouritesList: true });
    favouritesList.appendChild(card);
  });
}

export function displayCollection() {
  const collectionList = document.getElementById('collectionList');
  const resources = JSON.parse(localStorage.getItem('theologyCollection') || '[]');
  const readStatus = JSON.parse(localStorage.getItem('theologyReadStatus') || '{}');
  const favourites = JSON.parse(localStorage.getItem('theologyFavourites') || '[]');
  collectionList.innerHTML = '';

  if (resources.length === 0) {
    collectionList.innerHTML = '<div class="text-center text-gray-600 col-span-full">Your collection is empty.</div>';
    return;
  }

  resources.forEach(resource => {
    const card = renderResourceCard(resource, { readStatus, favourites, isCollection: true });
    collectionList.appendChild(card);
  });
}