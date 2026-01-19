/* =========================================================
   public.js
   - render public pages from KelurahanStore.Data
========================================================= */

(function () {
  const { Data } = window.KelurahanStore;

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    } catch (_) {
      return iso || "";
    }
  };

  function applySettings() {
    const s = Data.settings();

    // header
    const h1 = document.querySelector(".logo-text h1");
    const p = document.querySelector(".logo-text p");
    if (h1) h1.innerHTML = `<i class="fa-solid fa-landmark"></i> ${s.siteName || "Kelurahan"}`;
    if (p) p.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${s.address || ""}`;

    // footer
    const footer = document.querySelector(".footer");
    if (!footer) return;

    const footNews = document.getElementById("footerNews");
    if (footNews) {
      const berita = Data.list("berita").filter((b) => b.status === "published").slice(0, 3);
      footNews.innerHTML = berita.map((b) => `<li>${b.title}</li>`).join("") || footNews.innerHTML;
    }
  }

  function renderHome() {
    const newsGrid = document.getElementById("homeNewsGrid");
    const agendaList = document.getElementById("homeAgendaList");
    if (!newsGrid && !agendaList) return;

    const berita = Data.list("berita").filter((b) => b.status === "published").slice(0, 3);
    if (newsGrid) {
      newsGrid.innerHTML = berita
        .map(
          (b) => `
        <article class="news-mini">
          <img src="${b.image || ""}" alt="${b.title}" onerror="this.style.display='none'">
          <div class="news-body">
            <h4>${b.title}</h4>
            <p>${b.excerpt || ""}</p>
          </div>
        </article>`
        )
        .join("");
    }

    const agenda = Data.list("agenda").slice(0, 3);
    if (agendaList) {
      agendaList.innerHTML = agenda
        .map(
          (a) => `
        <div class="agenda-item">
          <b>${a.title}</b><br/>
          <span class="muted">${fmtDate(a.date)}${a.time ? " • " + a.time : ""} • ${a.location || ""}</span>
        </div>`
        )
        .join("");
    }
  }

  function renderBerita() {
    const grid = document.getElementById("beritaGrid");
    if (!grid) return;

    const search = document.getElementById("beritaSearch");
    const all = Data.list("berita").filter((b) => b.status === "published");

    const draw = (q) => {
      const query = (q || "").toLowerCase();
      const items = all.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          (b.category || "").toLowerCase().includes(query)
      );

      grid.innerHTML =
        items
          .map(
            (b) => `
          <article class="berita-card">
            <img src="${b.image || ""}" alt="${b.title}" onerror="this.style.display='none'">
            <div class="berita-body">
              <h3>${b.title}</h3>
              <p>${b.excerpt || ""}</p>
            </div>
            <div class="berita-meta">
              <span class="badge">${b.category || "Info"}</span>
              <span>${fmtDate(b.date)}</span>
            </div>
          </article>`
          )
          .join("") || `<div class="muted">Belum ada berita.</div>`;
    };

    draw("");

    if (search) {
      search.addEventListener("input", () => draw(search.value));
    }
  }

  function renderAgenda() {
    const listEl = document.getElementById("agendaList");
    if (!listEl) return;

    const agenda = Data.list("agenda").slice().sort((a, b) => (a.date > b.date ? 1 : -1));
    listEl.innerHTML =
      agenda
        .map(
          (a) => `
      <div class="agenda-item">
        <b>${a.title}</b><br/>
        <span class="muted">${fmtDate(a.date)}${a.time ? " • " + a.time : ""} • ${a.location || ""}</span>
        ${a.content ? `<div style="margin-top:6px">${a.content}</div>` : ""}
      </div>`
        )
        .join("") || `<div class="muted">Belum ada agenda.</div>`;
  }

  function renderGaleri() {
    const grid = document.getElementById("galleryGrid");
    const filterWrap = document.getElementById("galleryFilter");
    if (!grid || !filterWrap) return;

    const items = Data.list("galeri");
    const categories = Array.from(new Set(items.map((x) => x.category).filter(Boolean)));
    const filters = ["Semua", ...categories];

    let active = "Semua";

    const draw = () => {
      const filtered = active === "Semua" ? items : items.filter((x) => x.category === active);

      grid.innerHTML =
        filtered
          .map(
            (g) => `
        <article class="gallery-card">
          <img src="${g.image || ""}" alt="${g.title}" onerror="this.style.display='none'">
          <div class="gallery-body">
            <h3>${g.title}</h3>
            <p>${g.content || ""}</p>
            <div class="muted" style="font-size:12px;margin-top:8px">${g.category || ""} • ${fmtDate(
              g.date
            )}</div>
          </div>
        </article>`
          )
          .join("") || `<div class="muted">Belum ada foto.</div>`;

      filterWrap.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === active);
      });
    };

    filterWrap.innerHTML = filters
      .map(
        (f) =>
          `<button class="filter-btn ${f === active ? "active" : ""}" data-filter="${f}">${f}</button>`
      )
      .join("");

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      active = btn.dataset.filter;
      draw();
    });

    draw();
  }

  function initFAQ() {
    document.querySelectorAll(".faq-question").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ans = btn.nextElementSibling;
        if (!ans) return;
        ans.classList.toggle("show");
      });
    });
  }

  window.addEventListener("page:loaded", (e) => {
    applySettings();

    const name = e.detail?.name;
    if (name === "home") renderHome();
    if (name === "berita") renderBerita();
    if (name === "agenda") renderAgenda();
    if (name === "galeri") renderGaleri();
    if (name === "kontak") initFAQ();
  });

  document.addEventListener("DOMContentLoaded", applySettings);
})();
// Render Pengumuman di halaman public
window.addEventListener("page:loaded", (ev) => {
  if (ev.detail.name !== "pengumuman") return;

  const listEl = document.getElementById("pengumuman-list");
  const emptyEl = document.getElementById("pengumuman-empty");
  const filterKategori = document.getElementById("filter-pengumuman-kategori");
  const filterSearch = document.getElementById("filter-pengumuman-search");

  if (!listEl) return;

  let data = loadPengumuman();

  function render() {
    const kat = filterKategori ? filterKategori.value : "all";
    const q = (filterSearch ? filterSearch.value : "").toLowerCase();

    let items = [...data].filter((item) => {
      if (kat !== "all" && item.kategori !== kat) return false;
      if (!q) return true;
      return (
        (item.judul || "").toLowerCase().includes(q) ||
        (item.isi || "").toLowerCase().includes(q)
      );
    });

    // hanya tampilkan yang published
    items = items.filter((item) => item.status !== "draft");

    // urutkan terbaru dulu
    items.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

    listEl.innerHTML = "";

    if (!items.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "announcement-card";

      card.innerHTML = `
        <div class="announcement-meta">
          <span class="badge badge-${item.kategori || "info"}">
            ${(item.kategori || "Info").toUpperCase()}
          </span>
          <span class="announcement-date">
            ${item.tanggal || "-"}
          </span>
        </div>
        <h3 class="announcement-title">${item.judul || "(Tanpa judul)"}</h3>
        <p class="announcement-summary">
          ${(item.ringkasan || item.isi || "").slice(0, 160)}${(item.ringkasan || item.isi || "").length > 160 ? "..." : ""}
        </p>
      `;

      listEl.appendChild(card);
    });
  }

  if (filterKategori) filterKategori.addEventListener("change", render);
  if (filterSearch) filterSearch.addEventListener("input", render);

  render();
});
