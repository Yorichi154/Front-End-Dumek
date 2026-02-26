/* =========================================================
   admin.js
   - CRUD untuk berita, galeri, agenda, pengumuman (localStorage)
========================================================= */

(function () {
  const { Data, uid } = window.KelurahanStore;
  const Guard = window.KelurahanGuard;

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    } catch (_) {
      return iso || "";
    }
  };

  // Read file input -> dataURL (frontend-only)
  const fileToDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("Gagal membaca file"));
      r.readAsDataURL(file);
    });

  function setImagePreview(src) {
    const img = document.getElementById("fImagePreview");
    if (!img) return;
    if (src) {
      img.src = src;
      img.style.display = "block";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
    }
  }

  function setAdminMode(on) {
    document.body.classList.toggle("is-admin", !!on);
  }

  function setSidebarActive(hash) {
    document.querySelectorAll(".admin-side a").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === hash);
    });
  }


  // --------------------
  // Sidebar collapse groups
  // --------------------
  let _sidebarCollapseBound = false;

  function ensureSidebarCollapse() {
    if (_sidebarCollapseBound) return;
    _sidebarCollapseBound = true;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".group-toggle");
      if (!btn) return;
      const group = btn.closest?.(".menu-group");
      if (!group) return;

      const open = !group.classList.contains("open");
      group.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function syncSidebarGroups(hash) {
    const menu = document.getElementById("adminSideMenu");
    if (!menu) return;

    // open group that contains active link
    const active = menu.querySelector(`a[href="${hash}"]`);
    if (!active) return;
    const group = active.closest?.(".menu-group");
    if (group) {
      group.classList.add("open");
      const btn = group.querySelector(".group-toggle");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  }

  // --------------------
  // Mobile drawer (Admin)
  // --------------------
  let _adminMobileMenuBound = false;

  function ensureAdminMobileMenu() {
    if (_adminMobileMenuBound) return;
    _adminMobileMenuBound = true;

    // Backdrop
    if (!document.getElementById("adminMenuBackdrop")) {
      const bd = document.createElement("div");
      bd.id = "adminMenuBackdrop";
      document.body.appendChild(bd);
    }

    const close = () => document.body.classList.remove("admin-menu-open");
    const toggle = () => document.body.classList.toggle("admin-menu-open");

    document.addEventListener("click", (e) => {
      if (e.target.id === "adminMenuBackdrop") return close();
      if (e.target.closest?.("[data-action='toggleAdminMenu']")) return toggle();
      if (e.target.closest?.(".admin-side a[data-page]")) return close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function mountAdminMenuButton() {
    const actions = document.querySelector(".admin-top .top-actions");
    if (!actions) return;
    if (actions.querySelector("[data-action='toggleAdminMenu']")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.setAttribute("data-action", "toggleAdminMenu");
    btn.innerHTML = `<i class="fa-solid fa-bars"></i> Menu`;
    actions.prepend(btn);
  }

  function fillAdminUserLabel() {
    const el = document.getElementById("adminUserLabel");
    if (!el) return;
    const s = Guard.getSession();
    el.textContent = s ? `Login: ${s.name} (${s.role})` : "-";
  }

  // --------------------
  // Dashboard
  // --------------------
  function initDashboard() {
    document.getElementById("metricBerita").textContent = Data.list("berita").length;
    document.getElementById("metricGaleri").textContent = Data.list("galeri").length;
    document.getElementById("metricAgenda").textContent = Data.list("agenda").length;
    document.getElementById("metricPengumuman").textContent = Data.list("pengumuman").length;

    const recentBerita = Data.list("berita").slice(0, 5);
    const recentAgenda = Data.list("agenda").slice(0, 5);

    const rb = document.getElementById("recentBerita");
    const ra = document.getElementById("recentAgenda");

    if (rb) {
      rb.innerHTML =
        recentBerita
          .map(
            (b) => `
            <div class="agenda-item">
              <b>${b.title}</b><br/>
              <span class="muted">${b.category || ""} • ${fmtDate(b.date)} • ${b.status}</span>
            </div>`
          )
          .join("") || `<div class="muted">Belum ada berita.</div>`;
    }

    if (ra) {
      ra.innerHTML =
        recentAgenda
          .map(
            (a) => `
            <div class="agenda-item">
              <b>${a.title}</b><br/>
              <span class="muted">${fmtDate(a.date)}${a.time ? " • " + a.time : ""} • ${
                a.location || ""
              }</span>
            </div>`
          )
          .join("") || `<div class="muted">Belum ada agenda.</div>`;
    }

    // Quick create
    document.addEventListener("click", (e) => {
      const open = e.target.closest("[data-action='openQuickCreate']");
      if (open) {
        const modal = document.getElementById("quickCreateModal");
        if (modal) modal.classList.add("open");
      }
      const close = e.target.closest("[data-action='closeModal']");
      if (close) {
        const modal = close.closest(".modal");
        if (modal) modal.classList.remove("open");
      }
      const overlayClose = e.target.classList?.contains("modal");
      if (overlayClose) e.target.classList.remove("open");
    });
  }

  // --------------------
  // Generic list CRUD
  // --------------------
  function renderRow(type, item) {
    if (type === "berita") {
      const badge = `<span class="badge">${item.category || "Info"}</span>`;
      const status = `<span class="badge" style="${
        item.status === "published"
          ? "background:rgba(34,197,94,.12);color:#16a34a"
          : "background:rgba(148,163,184,.22);color:#334155"
      }">${item.status || "draft"}</span>`;

      return `
        <tr>
          <td><b>${item.title}</b><div class="muted" style="font-size:12px">${item.excerpt || ""}</div></td>
          <td>${badge}</td>
          <td>${fmtDate(item.date)}</td>
          <td>${status}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-warning btn-sm" data-action="edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    }

    if (type === "agenda") {
      return `
        <tr>
          <td><b>${item.title}</b><div class="muted" style="font-size:12px">${item.content || ""}</div></td>
          <td>${fmtDate(item.date)}${item.time ? " • " + item.time : ""}</td>
          <td>${item.location || "-"}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-warning btn-sm" data-action="edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    }

    if (type === "galeri") {
      return `
        <tr>
          <td><b>${item.title}</b><div class="muted" style="font-size:12px">${item.content || ""}</div></td>
          <td><span class="badge">${item.category || "-"}</span></td>
          <td>${fmtDate(item.date)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-warning btn-sm" data-action="edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    }

    if (type === "pengumuman") {
      const pr = item.status || "info";
      const badge =
        pr === "urgent"
          ? '<span class="badge badge-cat-darurat">URGENT</span>'
          : '<span class="badge badge-cat-info">INFO</span>';

      return `
        <tr>
          <td><b>${item.title}</b><div class="muted" style="font-size:12px">${item.content || ""}</div></td>
          <td>${fmtDate(item.date)}</td>
          <td>${badge}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-warning btn-sm" data-action="edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    }

    return "";
  }

  function openModal(type, item) {
    const modal = document.getElementById("adminModal");
    if (!modal) return;

    const title = document.getElementById("adminModalTitle");
    if (title) title.textContent = item ? "Edit" : "Tambah";

    // fill fields if exist
    const idEl = document.getElementById("itemId");
    if (idEl) idEl.value = item?.id || "";

    const map = {
      fTitle: item?.title || "",
      fCategory: item?.category || "",
      fDate: item?.date || "",
      fTime: item?.time || "",
      fLocation: item?.location || "",
      fExcerpt: item?.excerpt || "",
      fContent: item?.content || "",
      fStatus: item?.status || (type === "pengumuman" ? "info" : "published"),
    };

    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = val;
    });

    // file input (tidak bisa di-set value). Pakai hidden existing + preview.
    const existing = document.getElementById("fImageExisting");
    if (existing) existing.value = item?.image || "";
    const fileEl = document.getElementById("fImage");
    if (fileEl && fileEl.type === "file") fileEl.value = "";
    setImagePreview(item?.image || "");

    modal.classList.add("open");
  }

  function closeModal() {
    const modal = document.getElementById("adminModal");
    if (modal) modal.classList.remove("open");
  }

  function readForm(type) {
    const get = (id) => document.getElementById(id)?.value?.trim() || "";
    const id = get("itemId") || uid();

    const base = { id };

    if (type === "berita") {
      return {
        ...base,
        title: get("fTitle"),
        category: get("fCategory"),
        date: get("fDate"),
        image: "", // diisi dari file upload / existing
        excerpt: get("fExcerpt"),
        content: get("fContent"),
        status: get("fStatus") || "draft",
      };
    }

    if (type === "agenda") {
      return {
        ...base,
        title: get("fTitle"),
        date: get("fDate"),
        time: get("fTime"),
        location: get("fLocation"),
        content: get("fContent"),
      };
    }

    if (type === "galeri") {
      return {
        ...base,
        title: get("fTitle"),
        category: get("fCategory"),
        date: get("fDate"),
        image: "", // diisi dari file upload / existing
        content: get("fContent"),
      };
    }

    if (type === "pengumuman") {
      return {
        ...base,
        title: get("fTitle"),
        date: get("fDate"),
        status: get("fStatus") || "info",
        content: get("fContent"),
      };
    }

    return base;
  }

  function initListPage(type) {
    const tbody = document.getElementById("adminTbody");
    const search = document.getElementById("adminSearch");
    const filter = document.getElementById("adminFilterStatus");
    const form = document.getElementById("adminForm");

    const draw = () => {
      if (!tbody) return;
      const q = (search?.value || "").toLowerCase();
      const f = (filter?.value || "").toLowerCase();

      let items = Data.list(type);

      if (type === "berita" && f) items = items.filter((x) => (x.status || "").toLowerCase() === f);
      if (type === "pengumuman" && f) items = items.filter((x) => (x.status || "").toLowerCase() === f);

      if (q) {
        items = items.filter((x) => {
          const hay = `${x.title || ""} ${x.category || ""} ${x.location || ""}`.toLowerCase();
          return hay.includes(q);
        });
      }

      tbody.innerHTML =
        items.map((it) => renderRow(type, it)).join("") ||
        `<tr><td colspan="5" class="muted">Data belum ada.</td></tr>`;
    };

    draw();

    search?.addEventListener("input", draw);
    filter?.addEventListener("change", draw);

    // buttons
    document.addEventListener("click", (e) => {
      const create = e.target.closest("[data-action='create']");
      if (create) {
        openModal(type, null);
        return;
      }

      const edit = e.target.closest("[data-action='edit']");
      if (edit) {
        const id = edit.dataset.id;
        openModal(type, Data.get(type, id));
        return;
      }

      const del = e.target.closest("[data-action='delete']");
      if (del) {
        const id = del.dataset.id;
        if (confirm("Hapus data ini?")) {
          Data.remove(type, id);
          draw();
        }
        return;
      }

      const close = e.target.closest("[data-action='closeModal']");
      if (close) {
        closeModal();
        return;
      }

      if (e.target.classList?.contains("modal")) closeModal();
    });

    // submit form
    if (form) {
      // preview untuk file upload (berita/galeri)
      const fileEl = document.getElementById("fImage");
      if (fileEl && fileEl.type === "file" && !fileEl.__boundPreview) {
        fileEl.__boundPreview = true;
        fileEl.addEventListener("change", () => {
          const f = fileEl.files?.[0];
          if (!f) {
            // kembali ke existing bila ada
            const existing = document.getElementById("fImageExisting")?.value || "";
            setImagePreview(existing);
            return;
          }
          const url = URL.createObjectURL(f);
          setImagePreview(url);
        });
      }

      form.addEventListener("submit", (ev) => {
        ev.preventDefault();

        const run = async () => {
          const item = readForm(type);

          // Jika ada file upload (berita/galeri), simpan sebagai dataURL ke localStorage
          const imgInput = document.getElementById("fImage");
          const picked = imgInput?.files?.[0];
          if ((type === "berita" || type === "galeri") && picked) {
            item.image = await fileToDataURL(picked);
          } else if (type === "berita" || type === "galeri") {
            // pakai value lama jika tidak memilih file baru
            item.image = document.getElementById("fImageExisting")?.value || "";
          }

          // basic validation
          if (!item.title) {
            alert("Judul wajib diisi.");
            return;
          }

          Data.upsert(type, item);
          closeModal();
          draw();
          alert("Tersimpan.");
        };

        run().catch((err) => {
          console.error(err);
          alert("Gagal menyimpan. Coba lagi.");
        });
      });
    }
  }

  // Settings
  function initSettings() {
    const s = Data.settings();
    if (window.__adminSettingsBound) return;
    window.__adminSettingsBound = true;
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || "";
    };

    setVal("sSiteName", s.siteName);
    setVal("sEmail", s.email);
    setVal("sPhone", s.phone);
    setVal("sAddress", s.address);
    setVal("sInstagram", s.instagram);
    setVal("sNote", s.note);

    document.addEventListener("click", (e) => {
      const save = e.target.closest("[data-action='saveSettings']");
      if (!save) return;

      const get = (id) => document.getElementById(id)?.value?.trim() || "";
      const prev = Data.settings();
      Data.saveSettings({
        ...prev,
        siteName: get("sSiteName"),
        email: get("sEmail"),
        phone: get("sPhone"),
        address: get("sAddress"),
        instagram: get("sInstagram"),
        note: get("sNote"),
      });

      alert("Pengaturan tersimpan.");
      window.dispatchEvent(new CustomEvent("settings:changed"));
    });
  }


  // --------------------
  // Helpers (localStorage plain array) - for surat/pengaduan integration with staf/warga
  // --------------------
  function _getArr(key) {
    try {
      const raw = localStorage.getItem(key);
      const v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  function _setArr(key, arr) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
  }

  function _makeId(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  }

  function _fmtDate(input) {
    if (!input) return "-";
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return String(input);
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function _badge(status, kind = "pengaduan") {
    const s = (status || "").toLowerCase();
    let cls = "badge-neutral";
    if (kind === "pengaduan") {
      if (s === "baru") cls = "badge-new";
      if (s === "diproses") cls = "badge-proses";
      if (s === "selesai") cls = "badge-done";
      if (s === "ditolak") cls = "badge-reject";
    } else {
      if (s === "menunggu") cls = "badge-wait";
      if (s === "diproses") cls = "badge-proses";
      if (s === "selesai") cls = "badge-done";
      if (s === "ditolak") cls = "badge-reject";
    }
    // extra kinds
    if (kind === "umkm") {
      if (s === "aktif") cls = "badge-done";
      if (s === "nonaktif") cls = "badge-neutral";
    }
    if (kind === "faq") {
      if (s === "published") cls = "badge-done";
      if (s === "draft") cls = "badge-wait";
    }
    return `<span class="badge ${cls}">${status || "-"}</span>`;
  }

  function _openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
  }

  function _closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
  }

  // --------------------
  // Admin - Profil Kelurahan
  // --------------------
  let _profilBound = false;
  function initProfilKelurahan() {
    const s = Data.settings();

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || "";
    };

    setVal("pkSiteName", s.siteName);
    setVal("pkLurahName", s.lurahName);
    setVal("pkKecamatan", s.kecamatan);
    setVal("pkKota", s.kota);
    setVal("pkProvinsi", s.provinsi);
    setVal("pkKodepos", s.kodepos);
    setVal("pkDeskripsi", s.profil);

    setVal("pkEmail", s.email);
    setVal("pkPhone", s.phone);
    setVal("pkAddress", s.address);
    setVal("pkInstagram", s.instagram);
    setVal("pkMaps", s.maps);
    setVal("pkJam", s.jamPelayanan || s.note);

    if (_profilBound) return;
    _profilBound = true;

    document.addEventListener("click", (e) => {
      const save = e.target.closest("[data-action='saveProfil']");
      const reset = e.target.closest("[data-action='resetProfil']");

      if (reset) {
        // reload from current storage
        const cur = Data.settings();
        setVal("pkSiteName", cur.siteName);
        setVal("pkLurahName", cur.lurahName);
        setVal("pkKecamatan", cur.kecamatan);
        setVal("pkKota", cur.kota);
        setVal("pkProvinsi", cur.provinsi);
        setVal("pkKodepos", cur.kodepos);
        setVal("pkDeskripsi", cur.profil);
        setVal("pkEmail", cur.email);
        setVal("pkPhone", cur.phone);
        setVal("pkAddress", cur.address);
        setVal("pkInstagram", cur.instagram);
        setVal("pkMaps", cur.maps);
        setVal("pkJam", cur.jamPelayanan || cur.note);
        return;
      }

      if (!save) return;

      const get = (id) => document.getElementById(id)?.value?.trim() || "";
      const prev = Data.settings();

      Data.saveSettings({
        ...prev,
        siteName: get("pkSiteName"),
        lurahName: get("pkLurahName"),
        kecamatan: get("pkKecamatan"),
        kota: get("pkKota"),
        provinsi: get("pkProvinsi"),
        kodepos: get("pkKodepos"),
        profil: get("pkDeskripsi"),
        email: get("pkEmail"),
        phone: get("pkPhone"),
        address: get("pkAddress"),
        instagram: get("pkInstagram"),
        maps: get("pkMaps"),
        jamPelayanan: get("pkJam"),
        // keep note for older footer widgets
        note: get("pkJam") || prev.note,
      });

      alert("Profil kelurahan tersimpan.");
      window.dispatchEvent(new CustomEvent("settings:changed"));
    });
  }

  // --------------------
  // Admin - Pengaduan
  // --------------------
  let _pengaduanBound = false;
  function initAdminPengaduan() {
    const tbody = document.getElementById("adminPengaduanTbody");
    const empty = document.getElementById("adminPengaduanEmpty");
    const q = document.getElementById("adminPengaduanSearch");
    const f = document.getElementById("adminPengaduanFilter");

    if (!tbody) return;

    const ensure = () => {
      const arr = _getArr("pengaduan");
      let changed = false;
      for (const it of arr) {
        if (!it.id) {
          it.id = _makeId("pd");
          changed = true;
        }
        if (!it.status) {
          it.status = "baru";
          changed = true;
        }
      }
      if (changed) _setArr("pengaduan", arr);
    };

    const read = () => _getArr("pengaduan").slice().sort((a, b) => {
      const da = new Date(a.tanggal || a.createdAt || 0).getTime();
      const db = new Date(b.tanggal || b.createdAt || 0).getTime();
      return db - da;
    });

    const render = () => {
      const keyword = (q?.value || "").trim().toLowerCase();
      const status = (f?.value || "").trim().toLowerCase();

      let items = read();
      if (keyword) {
        items = items.filter((it) =>
          `${it.nama || ""} ${it.judul || ""} ${it.isi || ""}`.toLowerCase().includes(keyword)
        );
      }
      if (status) items = items.filter((it) => (it.status || "").toLowerCase() == status);

      tbody.innerHTML = items
        .map(
          (it) => `
          <tr>
            <td>${it.nama || "-"}</td>
            <td>${it.judul || "-"}</td>
            <td>${_fmtDate(it.tanggal || it.createdAt)}</td>
            <td>${_badge(it.status, "pengaduan")}</td>
            <td>
              <div class="row-actions">
                <button class="btn btn-ghost" data-action="pengaduanDetail" data-id="${it.id}"><i class="fa-regular fa-eye"></i> Detail</button>
                <button class="btn btn-ghost" data-action="pengaduanDelete" data-id="${it.id}"><i class="fa-regular fa-trash-can"></i> Hapus</button>
              </div>
            </td>
          </tr>
        `
        )
        .join("");

      if (empty) empty.style.display = items.length ? "none" : "block";
    };

    ensure();
    render();

    q?.addEventListener("input", render);
    f?.addEventListener("change", render);

    if (_pengaduanBound) return;
    _pengaduanBound = true;

    document.addEventListener("click", (e) => {
      const detail = e.target.closest("[data-action='pengaduanDetail']");
      const del = e.target.closest("[data-action='pengaduanDelete']");
      const close = e.target.closest("[data-action='closePengaduanModal']");
      const save = e.target.closest("[data-action='savePengaduanStatus']");

      if (close) {
        _closeModal("adminPengaduanModal");
        return;
      }

      if (del) {
        const id = del.dataset.id;
        if (!confirm("Hapus pengaduan ini?")) return;
        const arr = _getArr("pengaduan").filter((x) => x.id != id);
        _setArr("pengaduan", arr);
        render();
        return;
      }

      if (detail) {
        const id = detail.dataset.id;
        const arr = _getArr("pengaduan");
        const it = arr.find((x) => x.id == id);
        if (!it) return;

        document.getElementById("apdId").value = it.id;
        document.getElementById("apdNama").value = it.nama || "";
        document.getElementById("apdTanggal").value = _fmtDate(it.tanggal || it.createdAt);
        document.getElementById("apdJudul").value = it.judul || "";
        document.getElementById("apdIsi").value = it.isi || "";
        document.getElementById("apdStatus").value = (it.status || "baru").toLowerCase();
        document.getElementById("apdCatatan").value = it.catatanAdmin || "";

        const sub = document.getElementById("adminPengaduanModalSub");
        if (sub) sub.textContent = `ID: ${it.id}`;

        _openModal("adminPengaduanModal");
        return;
      }

      if (save) {
        const id = document.getElementById("apdId").value;
        const newStatus = document.getElementById("apdStatus").value;
        const cat = document.getElementById("apdCatatan").value?.trim() || "";
        const arr = _getArr("pengaduan");
        const it = arr.find((x) => x.id == id);
        if (!it) return;
        it.status = newStatus;
        it.catatanAdmin = cat;
        it.updatedAt = new Date().toISOString();
        _setArr("pengaduan", arr);
        _closeModal("adminPengaduanModal");
        render();
      }
    });
  }

  // --------------------
  // Admin - Surat
  // --------------------
  let _suratBound = false;
  function initAdminSurat() {
    const tbody = document.getElementById("adminSuratTbody");
    const empty = document.getElementById("adminSuratEmpty");
    const q = document.getElementById("adminSuratSearch");
    const f = document.getElementById("adminSuratFilter");

    if (!tbody) return;

    const ensure = () => {
      const arr = _getArr("surat");
      let changed = false;
      for (const it of arr) {
        if (!it.id) {
          it.id = _makeId("sr");
          changed = true;
        }
        if (!it.status) {
          it.status = "menunggu";
          changed = true;
        }
      }
      if (changed) _setArr("surat", arr);
    };

    const read = () => _getArr("surat").slice().sort((a, b) => {
      const da = new Date(a.tanggal || a.createdAt || 0).getTime();
      const db = new Date(b.tanggal || b.createdAt || 0).getTime();
      return db - da;
    });

    const render = () => {
      const keyword = (q?.value || "").trim().toLowerCase();
      const status = (f?.value || "").trim().toLowerCase();

      let items = read();
      if (keyword) {
        items = items.filter((it) =>
          `${it.nama || ""} ${it.jenis || it.jenisSurat || ""} ${it.keperluan || ""}`.toLowerCase().includes(keyword)
        );
      }
      if (status) items = items.filter((it) => (it.status || "").toLowerCase() == status);

      tbody.innerHTML = items
        .map(
          (it) => `
          <tr>
            <td>${it.jenis || it.jenisSurat || "-"}</td>
            <td>${it.nama || "-"}</td>
            <td>${_fmtDate(it.tanggal || it.createdAt)}</td>
            <td>${_badge(it.status, "surat")}</td>
            <td>
              <div class="row-actions">
                <button class="btn btn-ghost" data-action="suratDetail" data-id="${it.id}"><i class="fa-regular fa-eye"></i> Detail</button>
                <button class="btn btn-ghost" data-action="suratDelete" data-id="${it.id}"><i class="fa-regular fa-trash-can"></i> Hapus</button>
              </div>
            </td>
          </tr>
        `
        )
        .join("");

      if (empty) empty.style.display = items.length ? "none" : "block";
    };

    ensure();
    render();

    q?.addEventListener("input", render);
    f?.addEventListener("change", render);

    if (_suratBound) return;
    _suratBound = true;

    document.addEventListener("click", (e) => {
      const detail = e.target.closest("[data-action='suratDetail']");
      const del = e.target.closest("[data-action='suratDelete']");
      const close = e.target.closest("[data-action='closeSuratModal']");
      const save = e.target.closest("[data-action='saveSuratStatus']");

      if (close) {
        _closeModal("adminSuratModal");
        return;
      }

      if (del) {
        const id = del.dataset.id;
        if (!confirm("Hapus pengajuan surat ini?")) return;
        const arr = _getArr("surat").filter((x) => x.id != id);
        _setArr("surat", arr);
        render();
        return;
      }

      if (detail) {
        const id = detail.dataset.id;
        const arr = _getArr("surat");
        const it = arr.find((x) => x.id == id);
        if (!it) return;

        document.getElementById("asId").value = it.id;
        document.getElementById("asJenis").value = it.jenis || it.jenisSurat || "";
        document.getElementById("asTanggal").value = _fmtDate(it.tanggal || it.createdAt);
        document.getElementById("asNama").value = it.nama || "";
        document.getElementById("asNik").value = it.nik || it.NIK || "";
        document.getElementById("asKeperluan").value = it.keperluan || it.keterangan || "";
        document.getElementById("asStatus").value = (it.status || "menunggu").toLowerCase();
        document.getElementById("asCatatan").value = it.catatanAdmin || "";

        const sub = document.getElementById("adminSuratModalSub");
        if (sub) sub.textContent = `ID: ${it.id}`;

        _openModal("adminSuratModal");
        return;
      }

      if (save) {
        const id = document.getElementById("asId").value;
        const newStatus = document.getElementById("asStatus").value;
        const cat = document.getElementById("asCatatan").value?.trim() || "";
        const arr = _getArr("surat");
        const it = arr.find((x) => x.id == id);
        if (!it) return;
        it.status = newStatus;
        it.catatanAdmin = cat;
        it.updatedAt = new Date().toISOString();
        _setArr("surat", arr);
        _closeModal("adminSuratModal");
        render();
      }
    });
  }

  // --------------------
  // Admin - Simple CRUD (UMKM / RT-RW / FAQ) via KelurahanStore.Data
  // --------------------
  function _initSimpleCrud(cfg) {
    const {
      type,
      searchId,
      tbodyId,
      emptyId,
      modalId,
      formId,
      titleId,
      createAction,
      closeAction,
      buildItem,
      fillForm,
      row,
      editAction,
      deleteAction,
    } = cfg;

    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const empty = document.getElementById(emptyId);
    const q = document.getElementById(searchId);
    const modal = document.getElementById(modalId);
    const form = document.getElementById(formId);
    const title = document.getElementById(titleId);

    const render = () => {
      const keyword = (q?.value || "").trim().toLowerCase();
      let items = Data.list(type);
      if (keyword) items = items.filter((it) => JSON.stringify(it).toLowerCase().includes(keyword));

      tbody.innerHTML = items.map(row).join("");
      if (empty) empty.style.display = items.length ? "none" : "block";
    };

    const open = () => {
      if (!modal) return;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    };

    const close = () => {
      if (!modal) return;
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    };

    const reset = () => {
      if (!form) return;
      form.reset?.();
      const hidden = form.querySelector('input[type="hidden"]');
      if (hidden) hidden.value = "";
    };

    // bind once per type
    const flag = `__admin_simple_${type}`;
    if (!window[flag]) {
      window[flag] = true;

      q?.addEventListener("input", render);

      document.addEventListener("click", (e) => {
        const create = e.target.closest(`[data-action='${createAction}']`);
        const closeBtn = e.target.closest(`[data-action='${closeAction}']`);
        const edit = e.target.closest(`[data-action='${editAction}']`);
        const del = e.target.closest(`[data-action='${deleteAction}']`);

        if (create) {
          reset();
          if (title) title.textContent = title.dataset.createTitle || "Tambah Data";
          open();
          return;
        }

        if (closeBtn) {
          close();
          return;
        }

        if (edit) {
          const id = edit.dataset.id;
          const it = Data.get(type, id);
          if (!it) return;
          fillForm(it);
          if (title) title.textContent = title.dataset.editTitle || "Ubah Data";
          open();
          return;
        }

        if (del) {
          const id = del.dataset.id;
          if (!confirm("Hapus data ini?")) return;
          Data.remove(type, id);
          render();
          return;
        }
      });

      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const item = buildItem();
        if (!item.id) item.id = KelurahanStore.uid();
        Data.upsert(type, item);
        close();
        render();
      });
    }

    render();
  }

  function initAdminUmkm() {
    _initSimpleCrud({
      type: "umkm",
      searchId: "adminUmkmSearch",
      tbodyId: "adminUmkmTbody",
      emptyId: "adminUmkmEmpty",
      modalId: "adminUmkmModal",
      formId: "adminUmkmForm",
      titleId: "adminUmkmModalTitle",
      createAction: "umkmCreate",
      closeAction: "umkmClose",
      editAction: "umkmEdit",
      deleteAction: "umkmDelete",
      buildItem: () => ({
        id: document.getElementById("umkmId")?.value || "",
        nama: document.getElementById("umkmNama")?.value?.trim() || "",
        pemilik: document.getElementById("umkmPemilik")?.value?.trim() || "",
        kategori: document.getElementById("umkmKategori")?.value?.trim() || "",
        kontak: document.getElementById("umkmKontak")?.value?.trim() || "",
        status: document.getElementById("umkmStatus")?.value || "aktif",
        alamat: document.getElementById("umkmAlamat")?.value?.trim() || "",
        updatedAt: new Date().toISOString(),
      }),
      fillForm: (it) => {
        document.getElementById("umkmId").value = it.id || "";
        document.getElementById("umkmNama").value = it.nama || "";
        document.getElementById("umkmPemilik").value = it.pemilik || "";
        document.getElementById("umkmKategori").value = it.kategori || "";
        document.getElementById("umkmKontak").value = it.kontak || "";
        document.getElementById("umkmStatus").value = it.status || "aktif";
        document.getElementById("umkmAlamat").value = it.alamat || "";
      },
      row: (it) => `
        <tr>
          <td>${it.nama || "-"}</td>
          <td>${it.pemilik || "-"}</td>
          <td>${it.kategori || "-"}</td>
          <td>${_badge(it.status || "aktif", "umkm")}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost" data-action="umkmEdit" data-id="${it.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-ghost" data-action="umkmDelete" data-id="${it.id}"><i class="fa-regular fa-trash-can"></i> Hapus</button>
            </div>
          </td>
        </tr>
      `,
    });
  }

  function initAdminRtrw() {
    _initSimpleCrud({
      type: "rtrw",
      searchId: "adminRtrwSearch",
      tbodyId: "adminRtrwTbody",
      emptyId: "adminRtrwEmpty",
      modalId: "adminRtrwModal",
      formId: "adminRtrwForm",
      titleId: "adminRtrwModalTitle",
      createAction: "rtrwCreate",
      closeAction: "rtrwClose",
      editAction: "rtrwEdit",
      deleteAction: "rtrwDelete",
      buildItem: () => ({
        id: document.getElementById("rtrwId")?.value || "",
        rt: document.getElementById("rtrwRt")?.value?.trim() || "",
        rw: document.getElementById("rtrwRw")?.value?.trim() || "",
        ketua: document.getElementById("rtrwKetua")?.value?.trim() || "",
        kontak: document.getElementById("rtrwKontak")?.value?.trim() || "",
        updatedAt: new Date().toISOString(),
      }),
      fillForm: (it) => {
        document.getElementById("rtrwId").value = it.id || "";
        document.getElementById("rtrwRt").value = it.rt || "";
        document.getElementById("rtrwRw").value = it.rw || "";
        document.getElementById("rtrwKetua").value = it.ketua || "";
        document.getElementById("rtrwKontak").value = it.kontak || "";
      },
      row: (it) => `
        <tr>
          <td>RT ${it.rt || "-"} / RW ${it.rw || "-"}</td>
          <td>${it.ketua || "-"}</td>
          <td>${it.kontak || "-"}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost" data-action="rtrwEdit" data-id="${it.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-ghost" data-action="rtrwDelete" data-id="${it.id}"><i class="fa-regular fa-trash-can"></i> Hapus</button>
            </div>
          </td>
        </tr>
      `,
    });
  }

  function initAdminFaq() {
    _initSimpleCrud({
      type: "faq",
      searchId: "adminFaqSearch",
      tbodyId: "adminFaqTbody",
      emptyId: "adminFaqEmpty",
      modalId: "adminFaqModal",
      formId: "adminFaqForm",
      titleId: "adminFaqModalTitle",
      createAction: "faqCreate",
      closeAction: "faqClose",
      editAction: "faqEdit",
      deleteAction: "faqDelete",
      buildItem: () => ({
        id: document.getElementById("faqId")?.value || "",
        q: document.getElementById("faqQ")?.value?.trim() || "",
        a: document.getElementById("faqA")?.value?.trim() || "",
        cat: document.getElementById("faqCat")?.value?.trim() || "",
        status: document.getElementById("faqStatus")?.value || "published",
        updatedAt: new Date().toISOString(),
      }),
      fillForm: (it) => {
        document.getElementById("faqId").value = it.id || "";
        document.getElementById("faqQ").value = it.q || "";
        document.getElementById("faqA").value = it.a || "";
        document.getElementById("faqCat").value = it.cat || "";
        document.getElementById("faqStatus").value = it.status || "published";
      },
      row: (it) => `
        <tr>
          <td>${it.q || "-"}</td>
          <td>${it.cat || "-"}</td>
          <td>${_badge(it.status || "draft", "faq")}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost" data-action="faqEdit" data-id="${it.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-ghost" data-action="faqDelete" data-id="${it.id}"><i class="fa-regular fa-trash-can"></i> Hapus</button>
            </div>
          </td>
        </tr>
      `,
    });
  }

  // --------------------
  // Admin - Laporan
  // --------------------
  let _laporanBound = false;
  function initLaporan() {
    const refresh = () => {
      const surat = _getArr("surat");
      const pengaduan = _getArr("pengaduan");

      const setText = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(v);
      };

      setText("lapTotalSurat", surat.length);
      setText("lapTotalPengaduan", pengaduan.length);
      setText("lapTotalBerita", Data.list("berita").length);
      setText("lapTotalPengumuman", Data.list("pengumuman").length);

      const countBy = (arr, key) => {
        const m = new Map();
        for (const it of arr) {
          const k = (it[key] || "-").toString();
          m.set(k, (m.get(k) || 0) + 1);
        }
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
      };

      const suratRows = countBy(surat, "status");
      const pdRows = countBy(pengaduan, "status");

      const sT = document.getElementById("lapSuratTbody");
      const pT = document.getElementById("lapPengaduanTbody");

      if (sT) sT.innerHTML = suratRows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
      if (pT) pT.innerHTML = pdRows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
    };

    refresh();

    if (_laporanBound) return;
    _laporanBound = true;

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='refreshLaporan']")) {
        refresh();
        return;
      }

      if (e.target.closest("[data-action='exportLaporan']")) {
        const surat = _getArr("surat");
        const pengaduan = _getArr("pengaduan");

        const rows = [
          ["tipe", "id", "tanggal", "nama", "judul/jenis", "status"],
          ...surat.map((it) => ["surat", it.id || "", it.tanggal || it.createdAt || "", it.nama || "", it.jenis || it.jenisSurat || "", it.status || ""]),
          ...pengaduan.map((it) => ["pengaduan", it.id || "", it.tanggal || it.createdAt || "", it.nama || "", it.judul || "", it.status || ""]),
        ];

        const csv = rows
          .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
          .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laporan-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
    });
  }

  // --------------------
  // Hook on route load
  // --------------------
  window.addEventListener("page:loaded", (e) => {
    const name = e.detail?.name || "";
    const isAdminRoute = name.startsWith("admin/");
    setAdminMode(isAdminRoute);

    if (!isAdminRoute) {
      document.body.classList.remove("admin-menu-open");
      return;
    }

    if (!Guard.requireAdmin()) return;

    fillAdminUserLabel();
    setSidebarActive("#" + name);

    // ensure sidebar collapsible groups works on every admin page
    ensureSidebarCollapse();
    syncSidebarGroups("#" + name);

    // mobile drawer
    ensureAdminMobileMenu();
    mountAdminMenuButton();

    if (name === "admin/dashboard") initDashboard();
    if (name === "admin/berita") initListPage("berita");
    if (name === "admin/agenda") initListPage("agenda");
    if (name === "admin/galeri") initListPage("galeri");
    if (name === "admin/pengumuman") initListPage("pengumuman");
    if (name === "admin/pengaturan") initSettings();
    if (name === "admin/profil-kelurahan") initProfilKelurahan();
    if (name === "admin/pengaduan") initAdminPengaduan();
    if (name === "admin/surat") initAdminSurat();
    if (name === "admin/umkm") initAdminUmkm();
    if (name === "admin/rt-rw") initAdminRtrw();
    if (name === "admin/faq") initAdminFaq();
    if (name === "admin/laporan") initLaporan();
  });
})();
