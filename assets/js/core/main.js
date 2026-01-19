// assets/js/core/main.js
const APP_BASE = (() => {
  const parts = location.pathname.split("/").filter(Boolean);
  if (!parts.length) return "/";
  if (parts[0].includes(".html")) return "/";     // Live Server root: /index.html
  return `/${parts[0]}/`;                        // XAMPP subfolder: /Project_Kelurahan/
})();

// ==============================
// SESSION HELPERS (dipakai guard)
// ==============================
function getRole() {
  return sessionStorage.getItem("role");
}
function getUserName() {
  return sessionStorage.getItem("userName") || sessionStorage.getItem("name") || "";
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

    // Notifikasi bahwa halaman sudah dirender (dipakai public.js / admin.js / staf.js)
    window.dispatchEvent(new CustomEvent("page:loaded", { detail: { name: page } }));

    // ✅ setiap kali pindah halaman, pastikan menu mobile tertutup
    const header = document.getElementById("site-header") || document.querySelector(".header");
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
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link[data-page]");
    if (!link) return;

    e.preventDefault();

    // kalau klik item dropdown, tutup dropdown
    const dd = link.closest(".dropdown");
    if (dd) dd.classList.remove("open");

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
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".dropdown > .nav-link");
    const insideDropdown = e.target.closest(".dropdown");

    if (trigger) {
      e.preventDefault();
      const dd = trigger.closest(".dropdown");

      document.querySelectorAll(".dropdown.open").forEach((x) => {
        if (x !== dd) x.classList.remove("open");
      });

      dd.classList.toggle("open");
      return;
    }

    if (!insideDropdown) {
      document.querySelectorAll(".dropdown.open").forEach((x) => x.classList.remove("open"));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".dropdown.open").forEach((x) => x.classList.remove("open"));
    }
  });
}

// ==============================
// STICKY HEADER
// ==============================
function setupStickyHeader() {
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
  const header = document.getElementById("site-header") || document.querySelector(".header");
  const toggle = header ? header.querySelector(".menu-toggle") : null;
  const nav = header ? header.querySelector(".navbar") : null;

  if (!header || !toggle || !nav) return;

  const icon = toggle.querySelector("i");

  function setOpen(open) {
    nav.classList.toggle("show", open);         // <- ini yang sudah di-handle CSS
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
    if (window.innerWidth <= 768) {
      setOpen(false);
    }
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
    if (window.innerWidth > 768 && nav.classList.contains("show")) {
      setOpen(false);
    }
  });

  setOpen(false);
}

// ==============================
// BACK/FORWARD + HASH CHANGE
// ==============================
window.addEventListener("popstate", () => navigateTo(getPageFromHash(), { replace: true }));
window.addEventListener("hashchange", () => navigateTo(getPageFromHash(), { replace: true }));

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", loadComponents);
