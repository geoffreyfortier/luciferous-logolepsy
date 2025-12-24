// Import CSS
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // --- Base path for deployment ---
  const BASE_PATH = import.meta.env.BASE_URL || "/ll/";

  // --- DOM Elements ---
  const searchInput = document.getElementById("search") as HTMLInputElement;
  const typeFilter = document.getElementById("typeFilter") as HTMLSelectElement;
  const pageSizeSelect = document.getElementById("pageSize") as HTMLSelectElement;
  const resultsDiv = document.getElementById("results") as HTMLDivElement;
  const randomTermBtn = document.getElementById("randomTermBtn") as HTMLButtonElement;
  
  const statusSpan = document.getElementById("status") as HTMLSpanElement;
  const termCountSpan = document.getElementById("termCount") as HTMLSpanElement;

  const prevPageBtn = document.getElementById("prevPage") as HTMLButtonElement;
  const nextPageBtn = document.getElementById("nextPage") as HTMLButtonElement;
  const pageInfoSpan = document.getElementById("pageInfo") as HTMLSpanElement;

  const prevPageBottom = document.getElementById("prevPageBottom") as HTMLButtonElement;
  const nextPageBottom = document.getElementById("nextPageBottom") as HTMLButtonElement;
  const pageInfoBottom = document.getElementById("pageInfoBottom") as HTMLSpanElement;

  const darkModeToggle = document.getElementById("darkModeToggle") as HTMLButtonElement;

  const azToggle = document.getElementById("azToggle") as HTMLButtonElement;
  const azDrawer = document.getElementById("azDrawer") as HTMLDivElement;
  const azInner = azDrawer.querySelector(".az-inner") as HTMLDivElement;

  // --- About modal elements ---
  const aboutLink = document.getElementById("aboutLink") as HTMLAnchorElement;
  const aboutModal = document.getElementById("aboutModal") as HTMLDivElement;
  const closeAbout = document.getElementById("closeAbout") as HTMLSpanElement;

  // --- Utility buttons ---
  const recentTermsBtn = document.getElementById("recentTermsBtn") as HTMLButtonElement;
  const favoritesBtn = document.getElementById("favoritesBtn") as HTMLButtonElement;

  // --- Types ---
  type GlossaryEntry = { term: string; definition: string; type: string };

  // --- State ---
  let glossary: GlossaryEntry[] = [];
  let rawGlossary: GlossaryEntry[] = [];
  let filteredGlossary: GlossaryEntry[] = [];
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.value, 10);

  let favorites: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');

  // --- Reload app on title click ---
  const appTitle = document.getElementById("appTitle") as HTMLHeadingElement;
  if (appTitle) {
    appTitle.addEventListener("click", () => {
      searchInput.value = "";
      typeFilter.value = "";
      currentPage = 1;
      filterGlossary();
    });
  }

  // --- Restore preferences ---
  searchInput.value = localStorage.getItem("search") ?? "";
  typeFilter.value = localStorage.getItem("typeFilter") ?? "";
  pageSizeSelect.value = localStorage.getItem("pageSize") ?? "10";

  if (!typeFilter.value || !Array.from(typeFilter.options).some(o => o.value === typeFilter.value)) {
    typeFilter.value = "";
  }

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  }

  // --- Helper: normalize terms ---
  function normalizeForIndexing(term: string): string {
    return term.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // --- Load glossary ---
  async function loadGlossary() {
    try {
      const res = await fetch(`${BASE_PATH}glossary.json`);
      if (!res.ok) throw new Error("HTTP error");

      rawGlossary = await res.json(); 
      glossary = [...rawGlossary].sort((a, b) => a.term.localeCompare(b.term));

      termCountSpan.textContent = `${glossary.length} terms`;

      filterGlossary();
    } catch (err) {
      console.error("Glossary load failed:", err);
      resultsDiv.innerHTML = "<p><strong>Unable to load glossary.</strong></p>";
    }
  }

  // --- Filtering ---
  function filterGlossary() {
    const prevHighlight = resultsDiv.querySelector(".highlight-random");
    if (prevHighlight) prevHighlight.classList.remove("highlight-random");

    const query = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value || "";

    localStorage.setItem("search", searchInput.value);
    localStorage.setItem("typeFilter", typeFilter.value);

    filteredGlossary = glossary.filter(entry => {
      const term = entry.term.toLowerCase();
      const def = entry.definition.toLowerCase();
      const matchesQuery = query === "" || term.includes(query) || def.includes(query);
      const matchesType = selectedType === "" || entry.type === selectedType;
      return matchesQuery && matchesType;
    });

    currentPage = 1;
    displayResults();
  }

  // --- Display results ---
  function displayResults() {
    pageSize = parseInt(pageSizeSelect.value, 10);
    localStorage.setItem("pageSize", pageSize.toString());

    const totalPages = Math.max(1, Math.ceil(filteredGlossary.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredGlossary.slice(start, start + pageSize);

    if (pageItems.length === 0) {
      if (filteredGlossary === glossary.filter(entry => favorites.includes(entry.term))) {
        resultsDiv.innerHTML = "<p>You have no favorites at this time. Choose some and they will appear here.</p>";
      } else {
        resultsDiv.innerHTML = "<p>No results found.</p>";
      }
      pageInfoSpan.textContent = "Page 0 of 0";
      pageInfoBottom.textContent = "Page 0 of 0";
      return;
    }

    let html = "";
    let currentLetter = "";

    pageItems.forEach(entry => {
      const normalized = normalizeForIndexing(entry.term);
      const letter = normalized.charAt(0).toUpperCase();
      if (letter !== currentLetter) {
        currentLetter = letter;
        html += `<h2>${currentLetter}</h2>`;
      }

      const isFavorite = favorites.includes(entry.term);
      html += `
        <div class="entry">
          <div class="term">${entry.term}</div>
          <div class="type">${entry.type}</div>
          <div class="definition">${entry.definition}</div>
          <span class="favorite-star" data-term="${entry.term}" style="cursor:pointer; font-size:20px; color:${isFavorite ? 'gold' : 'gray'}; margin-left:8px;">☆</span>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfoBottom.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  // --- Pagination ---
  const changePage = (d: number) => {
    const prevHighlight = resultsDiv.querySelector(".highlight-random");
    if (prevHighlight) prevHighlight.classList.remove("highlight-random");

    const totalPages = Math.ceil(filteredGlossary.length / pageSize) || 1;
    currentPage += d;

    if (currentPage < 1) currentPage = totalPages;
    else if (currentPage > totalPages) currentPage = 1;

    displayResults();

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  prevPageBtn.onclick = () => changePage(-1);
  nextPageBtn.onclick = () => changePage(1);
  prevPageBottom.onclick = () => changePage(-1);
  nextPageBottom.onclick = () => changePage(1);

  // --- Search / filter events ---
  searchInput.addEventListener("input", filterGlossary);
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      filterGlossary();
    }
  });
  typeFilter.addEventListener("change", filterGlossary);
  pageSizeSelect.addEventListener("change", () => {
    currentPage = 1;
    displayResults();
  });

  // --- AZ Drawer ---
  azInner.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => `<button data-letter="${l}">${l}</button>`).join("");
  azInner.onclick = e => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;

    const letter = btn.dataset.letter!;
    searchInput.value = "";
    typeFilter.value = "";

    filteredGlossary = glossary.filter(entry =>
      normalizeForIndexing(entry.term).toUpperCase().startsWith(letter)
    );

    currentPage = 1;
    displayResults();
    azDrawer.classList.remove("open");
  };
  azToggle.onclick = () => azDrawer.classList.toggle("open");

  document.addEventListener("click", e => {
    const target = e.target as HTMLElement;
    if (!azDrawer.contains(target) && !azToggle.contains(target)) {
      azDrawer.classList.remove("open");
    }
  });

  // --- Recent Terms ---
  recentTermsBtn.onclick = () => {
    if (!rawGlossary.length) return;

    const recent = rawGlossary.slice(-3);
    filteredGlossary = [...recent];
    currentPage = 1;
    displayResults();

    requestAnimationFrame(() => {
      const resultDivs = resultsDiv.querySelectorAll<HTMLDivElement>(".entry");
      resultDivs.forEach(div => div.classList.add("highlight-random"));
    });
  };

  // --- About modal ---
  if (aboutLink && aboutModal && closeAbout) {
    aboutLink.onclick = e => {
      e.preventDefault();
      aboutModal.style.display = "block";
    };
    closeAbout.onclick = () => {
      aboutModal.style.display = "none";
    };
    window.addEventListener("click", e => {
      if (e.target === aboutModal) aboutModal.style.display = "none";
    });
  }

  // --- Scroll to Top Button ---
  const scrollTopBtn = document.getElementById("scrollTopBtn") as HTMLButtonElement;

  window.addEventListener("scroll", () => {
    scrollTopBtn.style.display = window.scrollY > 200 ? "block" : "none";
  });

  scrollTopBtn.onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Random term ---
  randomTermBtn.onclick = () => {
    if (!glossary.length) return;

    const randomIndex = Math.floor(Math.random() * glossary.length);
    const entry = glossary[randomIndex];

    pageSize = parseInt(pageSizeSelect.value, 10);
    currentPage = Math.floor(randomIndex / pageSize) + 1;

    filteredGlossary = [...glossary];
    displayResults();

    requestAnimationFrame(() => {
      const prevHighlight = resultsDiv.querySelector(".highlight-random");
      if (prevHighlight) prevHighlight.classList.remove("highlight-random");

      const resultDivs = resultsDiv.querySelectorAll<HTMLDivElement>(".entry");
      const targetDiv = Array.from(resultDivs).find(d =>
        d.querySelector(".term")?.textContent === entry.term
      );
      if (targetDiv) {
        targetDiv.scrollIntoView({ behavior: "smooth", block: "center" });
        targetDiv.classList.add("highlight-random");
      }
    });
  };

  // --- Favorite star click handling ---
  resultsDiv.addEventListener('click', (e) => {
    const star = (e.target as HTMLElement).closest('.favorite-star') as HTMLElement;
    if (!star) return;

    const term = star.dataset.term!;
    const idx = favorites.indexOf(term);

    if (idx >= 0) favorites.splice(idx, 1);
    else favorites.push(term);

    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayResults();
  });

  // --- Favorites utility button ---
  favoritesBtn.onclick = () => {
    if (favorites.length === 0) {
      filteredGlossary = [];
      resultsDiv.innerHTML = "<p>You have no favorites at this time. Choose some and they will appear here.</p>";
      pageInfoSpan.textContent = "Page 0 of 0";
      pageInfoBottom.textContent = "Page 0 of 0";
    } else {
      filteredGlossary = glossary.filter(entry => favorites.includes(entry.term));
      currentPage = 1;
      displayResults();
    }
  };

  // --- Online status ---
  const updateStatus = () => {
    statusSpan.textContent = navigator.onLine ? "Online" : "Offline";
  };
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  updateStatus();

  // --- Dark mode ---
  darkModeToggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    const dark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", String(dark));
    darkModeToggle.textContent = dark ? "☀️" : "🌙";
  };

  // --- Init ---
  loadGlossary();
});
