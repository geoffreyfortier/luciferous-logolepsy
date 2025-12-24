document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const searchInput = document.getElementById("search") as HTMLInputElement;
  const typeFilter = document.getElementById("typeFilter") as HTMLSelectElement;
  const pageSizeSelect = document.getElementById("pageSize") as HTMLSelectElement;
  const resultsDiv = document.getElementById("results") as HTMLDivElement;

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

  // --- Types ---
  type GlossaryEntry = { term: string; definition: string; type: string };

  // --- State ---
  let glossary: GlossaryEntry[] = [];
  let filteredGlossary: GlossaryEntry[] = [];
  let currentPage = 1;
  let pageSize = parseInt(pageSizeSelect.value, 10);

  // --- Restore preferences ---
  searchInput.value = localStorage.getItem("search") ?? "";
  typeFilter.value = localStorage.getItem("typeFilter") ?? "";
  pageSizeSelect.value = localStorage.getItem("pageSize") ?? "10";

  // Reset type filter if invalid
  if (!typeFilter.value || !Array.from(typeFilter.options).some(o => o.value === typeFilter.value)) {
    typeFilter.value = "";
  }

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️";
  }

  // --- Helper: normalize terms for grouping/filtering ---
  function normalizeForIndexing(term: string): string {
    return term
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // --- Load glossary ---
  async function loadGlossary() {
    try {
      const res = await fetch("/glossary.json?cachebust=" + Date.now());
      if (!res.ok) throw new Error("HTTP error");

      glossary = await res.json();
      glossary.sort((a, b) => a.term.localeCompare(b.term));

      termCountSpan.textContent = `${glossary.length} terms`;

      filterGlossary();
    } catch (err) {
      console.error("Glossary load failed:", err);
      resultsDiv.innerHTML = "<p><strong>Unable to load glossary.</strong></p>";
    }
  }

  // --- Filtering ---
  function filterGlossary() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value || "";

    localStorage.setItem("search", searchInput.value);
    localStorage.setItem("typeFilter", typeFilter.value);

  // Always filter from the full glossary
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
      resultsDiv.innerHTML = "<p>No results found.</p>";
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

      html += `
        <div class="entry">
          <div class="term">${entry.term}</div>
          <div class="type">${entry.type}</div>
          <div class="definition">${entry.definition}</div>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfoBottom.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  // --- Pagination ---
  const changePage = (d: number) => {
    currentPage += d;
    displayResults();
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

  // --- A-Z Drawer ---
  azInner.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map(l => `<button data-letter="${l}">${l}</button>`)
    .join("");

  azInner.onclick = e => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;

    const letter = btn.dataset.letter!;
    searchInput.value = "";
    typeFilter.value = "";

    // Filter from full glossary only for this letter
    filteredGlossary = glossary.filter(entry =>
      normalizeForIndexing(entry.term).toUpperCase().startsWith(letter)
    );

    currentPage = 1;
    displayResults();
    azDrawer.classList.remove("open");
  };

  azToggle.onclick = () => azDrawer.classList.toggle("open");

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
