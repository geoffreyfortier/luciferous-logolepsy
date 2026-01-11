import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  const BASE_PATH = import.meta.env.BASE_URL || "/ll/";

  // --- DOM ---
  const searchInput = document.getElementById("search") as HTMLInputElement;
  const typeFilter = document.getElementById("typeFilter") as HTMLSelectElement;
  const pageSizeSelect = document.getElementById("pageSize") as HTMLSelectElement;
  const resultsDiv = document.getElementById("results") as HTMLDivElement;

  const randomTermBtn = document.getElementById("randomTermBtn") as HTMLButtonElement;
  const guessBtn = document.getElementById("recentTermsBtn") as HTMLButtonElement;
  const favoritesBtn = document.getElementById("favoritesBtn") as HTMLButtonElement;

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

  const appTitle = document.getElementById("appTitle") as HTMLHeadingElement;
  const scrollTopBtn = document.getElementById("scrollTopBtn") as HTMLButtonElement;

  // --- About modal ---
  const aboutLink = document.getElementById("aboutLink") as HTMLAnchorElement;
  const aboutModal = document.getElementById("aboutModal") as HTMLDivElement;
  const closeAbout = document.getElementById("closeAbout") as HTMLSpanElement;

  // --- Types ---
  type GlossaryEntry = { term: string; definition: string; type: string };

  // --- State ---
  let glossary: GlossaryEntry[] = [];
  let filteredGlossary: GlossaryEntry[] = [];
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.value, 10);
  let favorites: string[] = JSON.parse(localStorage.getItem("favorites") || "[]");

  let guessEntry: GlossaryEntry | null = null;
  let guessRevealed = false;

  const normalize = (t: string) =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  // --- Load glossary ---
  async function loadGlossary() {
    const res = await fetch(`${BASE_PATH}glossary.json`);
    glossary = await res.json();
    glossary.sort((a, b) => a.term.localeCompare(b.term));
    filteredGlossary = [...glossary];
    termCountSpan.textContent = `${glossary.length} terms`;
    displayResults();
  }

  // --- Display ---
  function displayResults() {
    if (guessEntry) {
      resultsDiv.innerHTML = `
        <div class="entry highlight-random">
          <div class="term">${guessEntry.term}</div>
          <div class="type">${guessEntry.type}</div>
          <div class="definition"
               style="filter:${guessRevealed ? "none" : "blur(6px)"};cursor:pointer;">
            ${guessEntry.definition}
          </div>
        </div>
      `;

      resultsDiv.querySelector(".definition")?.addEventListener("click", () => {
        guessRevealed = true;
        displayResults();
      });

      pageInfoSpan.textContent = "Guess the word!";
      pageInfoBottom.textContent = "Guess the word!";
      return;
    }

    pageSize = parseInt(pageSizeSelect.value, 10);
    const totalPages = Math.max(1, Math.ceil(filteredGlossary.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * pageSize;
    const items = filteredGlossary.slice(start, start + pageSize);

    let html = "";
    let letter = "";

    items.forEach(e => {
      const l = normalize(e.term)[0];
      if (l !== letter) {
        letter = l;
        html += `<h2>${letter}</h2>`;
      }

      const fav = favorites.includes(e.term);
      html += `
        <div class="entry">
          <div class="term">${e.term}</div>
          <div class="type">${e.type}</div>
          <div class="definition">${e.definition}</div>
          <span class="favorite-star"
                data-term="${e.term}"
                style="font-size:20px;color:${fav ? "gold" : "gray"};cursor:pointer;">
            ☆
          </span>
        </div>`;
    });

    resultsDiv.innerHTML = html;
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfoBottom.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  // --- App title reset ---
  appTitle.onclick = () => {
    guessEntry = null;
    searchInput.value = "";
    typeFilter.value = "";
    filteredGlossary = [...glossary];
    currentPage = 1;
    displayResults();
  };

  // --- Guess ---
  guessBtn.onclick = () => {
    guessEntry = glossary[Math.floor(Math.random() * glossary.length)];
    guessRevealed = false;
    displayResults();
  };

  // --- Random ---
  randomTermBtn.onclick = () => {
    guessEntry = null;

    const idx = Math.floor(Math.random() * glossary.length);
    const entry = glossary[idx];

    pageSize = parseInt(pageSizeSelect.value, 10);
    currentPage = Math.floor(idx / pageSize) + 1;
    filteredGlossary = [...glossary];
    displayResults();

    requestAnimationFrame(() => {
      const target = Array.from(
        resultsDiv.querySelectorAll<HTMLDivElement>(".entry")
      ).find(div =>
        div.querySelector(".term")?.textContent === entry.term
      );

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("highlight-random");
      }
    });
  };

  // --- Pagination ---
  const changePage = (d: number) => {
    guessEntry = null;
    const total = Math.ceil(filteredGlossary.length / pageSize) || 1;
    currentPage = ((currentPage - 1 + d + total) % total) + 1;
    displayResults();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  prevPageBtn.onclick = () => changePage(-1);
  nextPageBtn.onclick = () => changePage(1);
  prevPageBottom.onclick = prevPageBtn.onclick;
  nextPageBottom.onclick = nextPageBtn.onclick;

  // --- Search ---
  const filterGlossary = () => {
    guessEntry = null;

    const query = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value || "";

    filteredGlossary = glossary.filter(entry => {
      const term = entry.term.toLowerCase();
      const def = entry.definition.toLowerCase();

      const matchesQuery =
        query === "" || term.includes(query) || def.includes(query);

      const matchesType =
        selectedType === "" || entry.type === selectedType;

      return matchesQuery && matchesType;
    });

    currentPage = 1;
    displayResults();
  };

  searchInput.oninput = filterGlossary;
  typeFilter.onchange = filterGlossary;
  pageSizeSelect.onchange = () => { currentPage = 1; displayResults(); };

  // --- Favorites ---
  resultsDiv.onclick = e => {
    const star = (e.target as HTMLElement).closest(".favorite-star") as HTMLElement;
    if (!star) return;
    const t = star.dataset.term!;
    favorites = favorites.includes(t)
      ? favorites.filter(x => x !== t)
      : [...favorites, t];
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayResults();
  };

  favoritesBtn.onclick = () => {
    guessEntry = null;
    filteredGlossary = glossary.filter(e => favorites.includes(e.term));
    currentPage = 1;
    displayResults();
  };

  // --- A–Z ---
  azInner.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map(l => `<button data-l="${l}">${l}</button>`)
    .join("");

  azInner.onclick = e => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    guessEntry = null;
    filteredGlossary = glossary.filter(g =>
      normalize(g.term).startsWith(btn.dataset.l!)
    );
    currentPage = 1;
    displayResults();
    azDrawer.classList.remove("open");
  };

  azToggle.onclick = () => azDrawer.classList.toggle("open");

  // --- Scroll to Top Button ---
  window.addEventListener("scroll", () => {
    if (!scrollTopBtn) return;
    scrollTopBtn.style.display = window.scrollY > 200 ? "block" : "none";
  });

  scrollTopBtn.onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- About modal ---
  aboutLink.onclick = e => {
    e.preventDefault();
    aboutModal.style.display = "block";
  };
  closeAbout.onclick = () => aboutModal.style.display = "none";
  window.onclick = e => {
    if (e.target === aboutModal) aboutModal.style.display = "none";
  };

  // --- Dark mode ---
  darkModeToggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    darkModeToggle.textContent =
      document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  };

  // --- Online status ---
  const updateStatus = () =>
    (statusSpan.textContent = navigator.onLine ? "Online" : "Offline");
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  updateStatus();

  loadGlossary();
});
