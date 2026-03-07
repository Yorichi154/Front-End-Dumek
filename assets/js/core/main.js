// assets/js/core/main.js
const APP_BASE = (() => {
  const parts = location.pathname.split("/").filter(Boolean);
  if (!parts.length) return "/";
  if (parts[0].includes(".html")) return "/"; // Live Server root: /index.html
  return `/${parts[0]}/`; // XAMPP subfolder: /Project_Kelurahan/
})();

// ==============================
// SESSION HELPERS (dipakai guard)
// ==============================
function getRole() {
  return sessionStorage.getItem("role");
}
function getUserName() {
  return (
    sessionStorage.getItem("userName") || sessionStorage.getItem("name") || ""
  );
}

// ==============================
// HEADER AUTH BUTTON
// - Tombol "Login" berubah jadi nama user
// - Admin/Staf: Nama(role)
// - Warga: Nama
// ==============================
function formatUserLabel(name, role) {
  const n = String(name || "").trim();
  const r = String(role || "").trim().toLowerCase();
  if (!n || !r) return "";
  if (r === "warga") return n;
  if (r === "admin" || r === "staf") return `${n}(${r})`;
  return `${n}(${r})`;
}

function updateHeaderAuthButton() {
  const btn = document.querySelector("a.btn-login");
  if (!btn) return;

  const role = getRole();
  const name = getUserName();
  const span = btn.querySelector("span");
  const icon = btn.querySelector("i");

  if (role && name) {
    const label = formatUserLabel(name, role);
    if (span) span.textContent = label || name;
    if (icon) {
      icon.classList.remove("fa-right-to-bracket");
      icon.classList.add("fa-user");
    }

    // arahkan ke dashboard sesuai role
    const target = `${role}/dashboard`;
    btn.setAttribute("href", `#${target}`);
    btn.dataset.page = target;
    btn.setAttribute("aria-label", `Akun: ${label || name}`);
    btn.classList.add("is-auth");
  } else {
    if (span) span.textContent = "Login";
    if (icon) {
      icon.classList.remove("fa-user");
      icon.classList.add("fa-right-to-bracket");
    }

    btn.setAttribute("href", "#login");
    btn.dataset.page = "login";
    btn.setAttribute("aria-label", "Login");
    btn.classList.remove("is-auth");
  }
}



function updateGuestOnlySections(root = document) {
  const isLoggedIn = !!(getRole() && getUserName());
  const selectors = [
    ".hero-actions",
    "#heroGuestActions",
    ".home-cta",
    ".home-cta .cta-actions",
  ];

  const seen = new Set();
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => seen.add(el));
  });

  seen.forEach((el) => {
    if (el.classList.contains("home-cta")) {
      el.style.display = isLoggedIn ? "none" : "";
      el.toggleAttribute("hidden", isLoggedIn);
      el.setAttribute("aria-hidden", isLoggedIn ? "true" : "false");
      return;
    }

    el.style.display = isLoggedIn ? "none" : "";
    el.toggleAttribute("hidden", isLoggedIn);
    el.setAttribute("aria-hidden", isLoggedIn ? "true" : "false");
  });
}

// ==============================
// HELPERS
// ==============================
async function fetchFirstOk(urls) {
  for (let url of urls) {
    if (!url.startsWith("http") && !url.startsWith("/")) {
      url = APP_BASE + url;
    }

    const res = await fetch(url, { cache: "no-store" });
    console.log("➡️ fetch:", url, res.status);

    if (res.ok) return await res.text();
  }

  throw new Error("❌ Semua path gagal: " + urls.join(" | "));
}

function normalizePage(raw) {
  // dukung #home, #/home, #?home, #/?home
  return (raw || "")
    .replace(/^#/, "")
    .replace(/^[?/]+/, "")
    .trim();
}

function getPageFromHash() {
  return normalizePage(window.location.hash) || "home";
}

// ==============================
// UX HELPERS
// - Ubah placeholder 'Login untuk lihat' menjadi tombol Login
// ==============================
function upgradeLoginHints(root = document) {
  const cells = root.querySelectorAll("td");
  cells.forEach((td) => {
    const t = (td.textContent || "").trim().toLowerCase();
    if (!t) return;
    const match =
      t === "login untuk lihat" ||
      t === "login untuk melihat" ||
      t === "login untuk melihat data kontak." ||
      t === "login untuk melihat data kontak";
    if (!match) return;

    // Hindari double render
    if (td.querySelector("a[data-page='login']")) return;

    td.innerHTML = `
      <div class="muted" style="display:flex;align-items:center;gap:10px;justify-content:center;padding:10px 0">
        <span>Login untuk lihat</span>
        <a class="btn btn-primary btn-sm nav-link" href="#login" data-page="login">
          <i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Login
        </a>
      </div>`;
  });
}

// ==============================
// TABLE RESPONSIVE HELPERS
// - Isi data-label dari <th> supaya tabel bisa tampil rapih di HP
// ==============================
function syncResponsiveTables(root = document) {
  // Admin/Staf pakai .table, Warga pakai .warga-table
  const tables = root.querySelectorAll("table.table, table.warga-table");
  tables.forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) =>
      (th.textContent || "").trim(),
    );
    if (!heads.length) return;

    table.querySelectorAll("tbody tr").forEach((tr) => {
      const cells = Array.from(tr.children).filter((el) => el.tagName === "TD");
      cells.forEach((td, i) => {
        const label = heads[i] || "";
        if (label) td.dataset.label = label;
      });
    });
  });
}

function installTableObserver(containerEl) {
  try {
    // Bersihkan observer lama
    if (window.__TABLE_OBSERVER__) {
      window.__TABLE_OBSERVER__.disconnect();
      window.__TABLE_OBSERVER__ = null;
    }

    // Sync awal
    syncResponsiveTables(containerEl);

    let raf = 0;
    const obs = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        syncResponsiveTables(containerEl);
      });
    });

    obs.observe(containerEl, { childList: true, subtree: true });
    window.__TABLE_OBSERVER__ = obs;
  } catch (e) {
    console.warn("Table observer failed:", e);
  }
}

// expose (opsional, kalau modul lain mau panggil manual)
window.syncResponsiveTables = syncResponsiveTables;

// ==============================
// LOAD HEADER & FOOTER
// ==============================
async function loadComponents() {
  try {
    const headerHTML = await fetchFirstOk([
      "pages/partials/header.html",
      "pages/header.html",
    ]);

    const footerHTML = await fetchFirstOk([
      "pages/partials/footer.html",
      "pages/footer.html",
    ]);

    const headerEl = document.getElementById("header");
    const footerEl = document.getElementById("footer");

    if (headerEl) headerEl.innerHTML = headerHTML;
    if (footerEl) footerEl.innerHTML = footerHTML;

    setupNavigation();
    setupDropdowns();
    setupStickyHeader();
    setupMobileMenu();

    // ✅ sinkron tombol login -> nama user/role
    updateHeaderAuthButton();
    updateGuestOnlySections(document);

    // render page pertama
    navigateTo(getPageFromHash(), { replace: true });
  } catch (err) {
    console.error("❌ Gagal memuat komponen:", err);
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div class="error" style="padding:24px;max-width:900px;margin:0 auto;">
        Gagal memuat komponen. Cek Console.
      </div>`;
    }
  }
}

// ==============================
// PAGE RESOLVER
// ==============================
// ==============================
// PAGE RESOLVER
// ==============================
// ==============================
// PAGE RESOLVER
// ==============================
// ==============================
// PAGE RESOLVER
// ==============================
async function loadPageHtml(page) {
  const lembagaPages = ["rt", "rw", "pkk", "karang-taruna", "lpmk"];

  let candidates = [];

  // 1) Unit Kerja
  if (!page.includes("/") && page.startsWith("unit-")) {
    candidates = [
      `pages/public/unit-kerja/${page}.html`,
      `pages/public/${page}.html`,
      `pages/auth/${page}.html`,
      `pages/${page}.html`,
    ];
  }

  // 2) Lembaga Kemasyarakatan
  else if (!page.includes("/") && lembagaPages.includes(page)) {
    candidates = [
      `pages/public/lembaga-kemasyarakatan/${page}.html`,
      `pages/public/${page}.html`,
      `pages/auth/${page}.html`,
      `pages/${page}.html`,
    ];
  }

  // 3) Pelayanan Surat (semua page 'pelayanan-xxx' pakai template detail yang sama)
  else if (!page.includes("/") && page.startsWith("pelayanan-")) {
    candidates = [
      `pages/public/pelayanan/detail.html`,
      `pages/public/${page}.html`,
      `pages/auth/${page}.html`,
      `pages/${page}.html`,
    ];
  }

  // 4) Halaman dengan slash (admin/dashboard, warga/chat, dst)
  else if (page.includes("/")) {
    candidates = [`pages/${page}.html`];
  }

  // 4.5) Wizard Pengajuan Surat Online
  else if (!page.includes("/") && page === "pengajuan-online") {
    candidates = [
      `pages/public/pelayanan/pengajuan-online.html`,
      `pages/public/${page}.html`,
      `pages/auth/${page}.html`,
      `pages/${page}.html`,
    ];
  }

  // 5) Halaman public biasa
  else {
    candidates = [
      `pages/public/${page}.html`,
      `pages/auth/${page}.html`,
      `pages/${page}.html`,
    ];
  }

  console.log("🔍 Mencari halaman:", page, "=>", candidates);
  return await fetchFirstOk(candidates);
}

// ==============================
// ROUTER + GUARD
// ==============================
async function navigateTo(page, opts = {}) {
  try {
    page = normalizePage(page) || "home";

    const role = getRole();

    // guard role
    if (page.startsWith("admin/") && role !== "admin") page = "login";
    if (page.startsWith("warga/") && role !== "warga") page = "login";
    if (page.startsWith("staf/") && role !== "staf") page = "login";

    // ✅ hanya warga yang boleh akses wizard pengajuan online
    if (page === "pengajuan-online" && role !== "warga") {
      page = "login";
    }
    const html = await loadPageHtml(page);

    const content = document.getElementById("content");
    if (!content) throw new Error("#content tidak ditemukan di index.html");

    content.innerHTML = html;

    // Pastikan tabel admin/staf punya data-label untuk mode HP
    installTableObserver(content);

    // Notifikasi bahwa halaman sudah dirender (dipakai public.js / admin.js / staf.js)
    window.dispatchEvent(
      new CustomEvent("page:loaded", { detail: { name: page } }),
    );

    // Upgrade placeholder login (kalau ada)
    upgradeLoginHints(content);

    // ✅ setiap kali pindah halaman, pastikan menu mobile tertutup
    const header =
      document.getElementById("site-header") ||
      document.querySelector(".header");
    if (header) {
      const nav = header.querySelector(".navbar");
      const toggle = header.querySelector(".menu-toggle");
      const icon = toggle ? toggle.querySelector("i") : null;

      if (nav) nav.classList.remove("show");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      header.classList.remove("menu-open");

      if (icon) {
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-xmark");
      }
    }

    // update hash
    const newHash = `#${page}`;

    if (opts.replace) {
      history.replaceState({}, "", newHash);
    } else {
      history.pushState({}, "", newHash);
    }

    // active menu
    document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
      link.classList.toggle("active", link.dataset.page === page);
    });

    // bind nama user (opsional)
    const nameEl = document.querySelector("[data-bind='userName']");
    if (nameEl) nameEl.textContent = getUserName();

    // ✅ sinkron tombol login -> nama user/role setiap pindah halaman
    updateHeaderAuthButton();
    updateGuestOnlySections(content);

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("❌ navigateTo error:", err);
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div class="error" style="padding:24px;max-width:900px;margin:0 auto;">
        ${err.message}<br><br>
        <small>Cek Network/Console untuk path yang 404.</small>
      </div>`;
    }
  }
}

// supaya auth.js bisa panggil navigateTo()
window.navigateTo = navigateTo;

// ==============================
// NAVIGATION (SPA)
// ==============================
function setupNavigation() {
  if (window.__NAVIGATION_BOUND__) return;
  window.__NAVIGATION_BOUND__ = true;

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-page]");
    if (!link) return;

    e.preventDefault();

    // kalau klik item dropdown, tutup dropdown
    const dd = link.closest(".dropdown");
    if (dd) dd.classList.remove("open");

    // preset untuk halaman layanan (biar dropdown langsung kebuka sesuai pilihan)
    if (link.dataset.layanan) {
      sessionStorage.setItem("layananPreset", link.dataset.layanan);
    }

    navigateTo(link.dataset.page);
  });

  // klik logo / brand (opsional) kalau kamu kasih data-page
  document.addEventListener("click", (e) => {
    const brand = e.target.closest("[data-go-home='true']");
    if (!brand) return;
    e.preventDefault();
    navigateTo("home");
  });
}

// ==============================
// DROPDOWN (klik untuk buka/tutup)
// ==============================
function setupDropdowns() {
  if (window.__DROPDOWNS_BOUND__) return;
  window.__DROPDOWNS_BOUND__ = true;

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".dropdown > .nav-link");
    const insideDropdown = e.target.closest(".dropdown");

    if (trigger) {
      e.preventDefault();
      const dd = trigger.closest(".dropdown");

      document.querySelectorAll(".dropdown.open").forEach((x) => {
        if (x !== dd) {
          x.classList.remove("open");
          const t = x.querySelector(":scope > .nav-link");
          if (t) t.setAttribute("aria-expanded", "false");
        }
      });

      dd.classList.toggle("open");

      // sync aria-expanded
      trigger.setAttribute(
        "aria-expanded",
        dd.classList.contains("open") ? "true" : "false",
      );
      return;
    }

    if (!insideDropdown) {
      document
        .querySelectorAll(".dropdown.open")
        .forEach((x) => {
          x.classList.remove("open");
          const t = x.querySelector(":scope > .nav-link");
          if (t) t.setAttribute("aria-expanded", "false");
        });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document
        .querySelectorAll(".dropdown.open")
        .forEach((x) => {
          x.classList.remove("open");
          const t = x.querySelector(":scope > .nav-link");
          if (t) t.setAttribute("aria-expanded", "false");
        });
    }
  });
}

// ==============================
// STICKY HEADER
// ==============================
function setupStickyHeader() {
  if (window.__STICKY_BOUND__) return;
  window.__STICKY_BOUND__ = true;

  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  });
}
// ==============================
// MOBILE MENU (HAMBURGER)
// ==============================
function setupMobileMenu() {
  if (window.__MOBILEMENU_BOUND__) return;
  window.__MOBILEMENU_BOUND__ = true;
  const header =
    document.getElementById("site-header") || document.querySelector(".header");
  const toggle = header ? header.querySelector(".menu-toggle") : null;
  const nav = header ? header.querySelector(".navbar") : null;

  if (!header || !toggle || !nav) return;

  const icon = toggle.querySelector("i");

  // sync tinggi header untuk posisi drawer mobile (dipakai CSS: var(--header-h))
  const syncHeaderHeight = () => {
    document.documentElement.style.setProperty(
      "--header-h",
      `${header.offsetHeight}px`,
    );
  };
  syncHeaderHeight();

  function setOpen(open) {
    nav.classList.toggle("show", open); // <- ini yang sudah di-handle CSS
    header.classList.toggle("menu-open", open); // kalau mau dipakai untuk styling tambahan
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");

    // ganti icon bars ↔ x
    if (icon) {
      icon.classList.toggle("fa-bars", !open);
      icon.classList.toggle("fa-xmark", open);
    }
  }

  // klik tombol hamburger
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.contains("show");
    setOpen(!isOpen);
  });

  // klik link di dalam nav → tutup menu
  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    // ✅ Jangan tutup menu kalau yang diklik adalah trigger dropdown (Profil/Layanan/Informasi Publik)
    // Trigger dropdown itu: .dropdown > .nav-link dan biasanya href="#" dan tidak punya data-page
    const isDropdownTrigger =
      link.classList.contains("nav-link") &&
      !!link.closest(".dropdown") &&
      (!link.dataset.page || link.getAttribute("href") === "#");

    if (isDropdownTrigger) return;

    // ✅ Tutup menu hanya saat klik link yang benar-benar navigasi (dropdown-item / link biasa)
    if (window.innerWidth <= 900) setOpen(false);
  });

  // klik di luar nav saat menu terbuka → tutup
  document.addEventListener("click", (e) => {
    const insideNav = e.target.closest("#site-nav");
    const onToggle = e.target.closest(".menu-toggle");
    if (!insideNav && !onToggle && nav.classList.contains("show")) {
      setOpen(false);
    }
  });

  // kalau di-resize ke desktop, pastikan menu ditutup
  window.addEventListener("resize", () => {
    syncHeaderHeight();
    if (window.innerWidth > 900 && nav.classList.contains("show")) {
      setOpen(false);
    }
  });

  setOpen(false);
}

// ==============================
// BACK/FORWARD + HASH CHANGE
// ==============================
if (!window.__ROUTER_EVENTS_BOUND__) {
  window.__ROUTER_EVENTS_BOUND__ = true;
  window.addEventListener("popstate", () =>
    navigateTo(getPageFromHash(), { replace: true }),
  );
  window.addEventListener("hashchange", () =>
    navigateTo(getPageFromHash(), { replace: true }),
  );
}

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Observer untuk konten dinamis (misal tabel kontak dirender setelah page:loaded)
  if (!window.__LOGIN_HINT_OBS__) {
    window.__LOGIN_HINT_OBS__ = true;
    const root = document.getElementById("content");
    if (root && window.MutationObserver) {
      const mo = new MutationObserver(() => upgradeLoginHints(root));
      mo.observe(root, { childList: true, subtree: true });
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.__COMPONENTS_LOADED__) return;
  window.__COMPONENTS_LOADED__ = true;
  loadComponents();
});
