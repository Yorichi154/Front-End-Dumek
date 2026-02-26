// assets/js/staf/staf.js
// - Kelola Surat, Pengaduan, dan Chat (localStorage)

(function () {
  const fmtDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (_) {
      return iso;
    }
  };

  const fmtDateTime = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      const tgl = d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return `${tgl} ${jam}`;
    } catch (_) {
      return iso;
    }
  };

  function makeId(seed) {
    const str = String(seed || "");
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return `id_${Math.abs(h).toString(36)}_${str.length.toString(36)}`;
  }

  function getArr(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function setArr(key, val) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(val) ? val : []));
  }

  function getObj(key, fallback = {}) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setObj(key, val) {
    localStorage.setItem(key, JSON.stringify(val || {}));
  }

  function ensureIds() {
    // Surat
    let surat = getArr("surat");
    let changed = false;
    surat.forEach((s, i) => {
      if (!s.id) {
        s.id = makeId(`surat|${s.tanggal || i}|${s.nama || ""}|${s.jenis || ""}|${s.keperluan || ""}`);
        changed = true;
      }
      if (!s.status) {
        s.status = "menunggu";
        changed = true;
      }
    });
    if (changed) setArr("surat", surat);

    // Pengaduan
    let pengaduan = getArr("pengaduan");
    changed = false;
    pengaduan.forEach((p, i) => {
      if (!p.id) {
        p.id = makeId(`pengaduan|${p.tanggal || i}|${p.nama || ""}|${p.judul || ""}`);
        changed = true;
      }
      if (!p.status) {
        p.status = "baru";
        changed = true;
      }
    });
    if (changed) setArr("pengaduan", pengaduan);

    // Chat threads berbasis pengaduan
    const threads = getObj("chatThreads", {});
    let tChanged = false;
    pengaduan.forEach((p) => {
      if (!threads[p.id]) {
        threads[p.id] = {
          id: p.id,
          pengaduanId: p.id,
          wargaName: p.nama || "Warga",
          title: p.judul || "Pengaduan",
          lastAt: p.tanggal || new Date().toISOString(),
          messages: [
            {
              from: "system",
              text: `Thread dibuat untuk pengaduan: \"${p.judul || "-"}\"`,
              ts: p.tanggal || new Date().toISOString(),
            },
          ],
        };
        tChanged = true;
      }
    });
    if (tChanged) setObj("chatThreads", threads);
  }

  function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    const map = {
      menunggu: { cls: "badge-wait", label: "menunggu" },
      baru: { cls: "badge-new", label: "baru" },
      diproses: { cls: "badge-proses", label: "diproses" },
      selesai: { cls: "badge-done", label: "selesai" },
      ditolak: { cls: "badge-reject", label: "ditolak" },
    };
    const it = map[s] || { cls: "badge-neutral", label: s || "-" };
    return `<span class="badge ${it.cls}">${it.label}</span>`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function staffLabel() {
    const name = sessionStorage.getItem("userName") || "Staf";
    const email = sessionStorage.getItem("userEmail") || "";
    return email ? `${name} (${email})` : name;
  }

  // file -> dataURL (frontend-only demo)
  const fileToDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("Gagal membaca file"));
      r.readAsDataURL(file);
    });

  const fmtSize = (n) => {
    const b = Number(n || 0);
    if (!b) return "-";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  // =========================
  // Mobile drawer (Staf)
  // =========================
  let _stafMobileMenuBound = false;

  function ensureStafMobileMenu() {
    if (_stafMobileMenuBound) return;
    _stafMobileMenuBound = true;

    if (!document.getElementById("stafMenuBackdrop")) {
      const bd = document.createElement("div");
      bd.id = "stafMenuBackdrop";
      document.body.appendChild(bd);
    }

    const close = () => document.body.classList.remove("staf-menu-open");
    const toggle = () => document.body.classList.toggle("staf-menu-open");

    document.addEventListener("click", (e) => {
      if (e.target.id === "stafMenuBackdrop") return close();
      if (e.target.closest?.("[data-action='toggleStafMenu']")) return toggle();
      if (e.target.closest?.(".staf-side a[data-page]")) return close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function mountStafMenuButton() {
    const actions = document.querySelector(".staf-top .top-actions");
    if (!actions) return;
    if (actions.querySelector("[data-action='toggleStafMenu']")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.setAttribute("data-action", "toggleStafMenu");
    btn.innerHTML = `<i class="fa-solid fa-bars"></i> Menu`;
    actions.prepend(btn);
  }

  // =========================
  // Dashboard
  // =========================
  function initDashboard() {
    const surat = getArr("surat");
    const pengaduan = getArr("pengaduan");

    const menunggu = surat.filter((x) => String(x.status).toLowerCase() === "menunggu").length;
    const aktif = pengaduan.filter((x) => ["baru", "diproses"].includes(String(x.status).toLowerCase())).length;
    const total = surat.length + pengaduan.length;

    const elA = document.getElementById("metricSuratMenunggu");
    const elB = document.getElementById("metricPengaduanAktif");
    const elC = document.getElementById("metricTotalPengajuan");
    if (elA) elA.textContent = String(menunggu);
    if (elB) elB.textContent = String(aktif);
    if (elC) elC.textContent = String(total);

    const listSurat = document.getElementById("listSuratMenunggu");
    if (listSurat) {
      const items = surat
        .filter((x) => String(x.status).toLowerCase() === "menunggu")
        .slice()
        .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
        .slice(0, 5);

      listSurat.innerHTML =
        items
          .map(
            (s) => `
            <div class="list-row">
              <div class="list-main">
                <div class="list-title">${s.jenis || "-"} — ${s.nama || "-"}</div>
                <div class="muted" style="font-size:12px">${fmtDate(s.tanggal)} • RT ${s.rt || "-"} / RW ${s.rw || "-"} • ${s.keperluan || ""}</div>
              </div>
              <div class="list-side">
                ${statusBadge(s.status)}
                <a class="btn btn-ghost nav-link" style="padding:8px 10px" data-page="staf/surat" href="#staf/surat">Kelola</a>
              </div>
            </div>`
          )
          .join("") || `<div class="muted">Tidak ada surat yang menunggu.</div>`;
    }

    const listPeng = document.getElementById("listPengaduanTerbaru");
    if (listPeng) {
      const items = pengaduan
        .slice()
        .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
        .slice(0, 5);

      listPeng.innerHTML =
        items
          .map(
            (p) => `
            <div class="list-row">
              <div class="list-main">
                <div class="list-title">${p.judul || "-"}</div>
                <div class="muted" style="font-size:12px">${p.nama || "-"} • RT ${p.rt || "-"} / RW ${p.rw || "-"} • ${fmtDate(p.tanggal)} • ${p.lokasi || ""}</div>
              </div>
              <div class="list-side">
                ${statusBadge(p.status)}
                <button class="btn btn-ghost" style="padding:8px 10px" data-action="openChat" data-id="${p.id}">Chat</button>
              </div>
            </div>`
          )
          .join("") || `<div class="muted">Belum ada pengaduan.</div>`;
    }
  }

  // =========================
  // Surat
  // =========================
  const SURAT_STATUS = ["Semua", "menunggu", "diproses", "selesai", "ditolak"];

  function initSurat() {
    const tbody = document.getElementById("suratTbody");
    const empty = document.getElementById("suratEmpty");
    const search = document.getElementById("suratSearch");
    const filterWrap = document.getElementById("suratFilter");

    if (!tbody || !empty || !filterWrap) return;

    let active = sessionStorage.getItem("stafSuratFilter") || "Semua";
    let q = "";

    filterWrap.innerHTML = SURAT_STATUS
      .map((s) => `<button class="tab ${s === active ? "active" : ""}" data-filter="${s}">${s}</button>`)
      .join("");

    function draw() {
      const items = getArr("surat").slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
      const query = (q || "").toLowerCase();
      const filtered = items.filter((x) => {
        const statusOk = active === "Semua" ? true : String(x.status).toLowerCase() === active;
        const text = `${x.nama || ""} ${x.jenis || ""} ${x.keperluan || ""}`.toLowerCase();
        const qOk = query ? text.includes(query) : true;
        return statusOk && qOk;
      });

      empty.style.display = filtered.length ? "none" : "block";
      tbody.innerHTML = filtered
        .map(
          (s) => `
          <tr>
            <td>${fmtDate(s.tanggal)}</td>
            <td><b>${s.nama || "-"}</b><div class="muted" style="font-size:12px">${s.nik ? "NIK: " + s.nik : ""}</div></td>
            <td>RT ${s.rt || "-"} / RW ${s.rw || "-"}</td>
            <td>${(s.jenis || "-").toString()}</td>
            <td>${s.keperluan || "-"}</td>
            <td>${statusBadge(s.status)}</td>
            <td>
              <div class="row-actions">
                <select class="input" data-action="suratStatus" data-id="${s.id}" style="height:38px;border-radius:12px">
                  ${["menunggu", "diproses", "selesai", "ditolak"]
              .map((opt) => `<option value="${opt}" ${String(s.status).toLowerCase() === opt ? "selected" : ""}>${opt}</option>`)
              .join("")}
                </select>
                <button class="btn btn-primary btn-sm" data-action="saveSurat" data-id="${s.id}"><i class="fa-solid fa-floppy-disk"></i> Update</button>
                <button class="btn btn-success btn-sm" data-action="openSendSurat" data-id="${s.id}"><i class="fa-solid fa-paper-plane"></i> Kirim</button>
                <button class="btn btn-info btn-sm" data-action="openSuratDetail" data-id="${s.id}"><i class="fa-solid fa-circle-info"></i> Detail</button>
              </div>
            </td>
          </tr>`
        )
        .join("");
    }

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab[data-filter]");
      if (!btn) return;
      active = btn.dataset.filter;
      sessionStorage.setItem("stafSuratFilter", active);
      filterWrap.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.filter === active));
      draw();
    });

    if (search) {
      search.addEventListener("input", () => {
        q = search.value || "";
        draw();
      });
    }

    draw();
  }

  // =========================
  // Surat Detail Modal
  // =========================
  function renderSuratDetail(s) {
    const titleEl = document.getElementById("suratDetailTitle");
    const subEl = document.getElementById("suratDetailSub");
    const bodyEl = document.getElementById("suratDetailBody");
    const modalEl = document.getElementById("suratDetailModal");
    if (!bodyEl || !modalEl) return;

    const jenis = s.jenis || s.layananNama || "Surat";
    const nama = s.nama || "-";
    const tanggal = s.tanggal || s.createdAt || "";
    const updatedAt = s.updatedAt || s.updated || "";

    if (titleEl) titleEl.textContent = `${jenis} — ${nama}`;
    if (subEl) {
      const idPart = s.id ? `ID: ${s.id}` : "";
      const tglPart = tanggal ? `Diajukan: ${fmtDateTime(tanggal)}` : "";
      const upPart = updatedAt ? `• Update: ${fmtDateTime(updatedAt)}` : "";
      subEl.textContent = [idPart, tglPart].filter(Boolean).join(" • ") + (upPart ? ` ${upPart}` : "");
    }

    // Extra fields
    const extraObj =
      (s.extra && typeof s.extra === "object" ? s.extra : null) ||
      (s.extraFields && typeof s.extraFields === "object" ? s.extraFields : null) ||
      null;

    const extraHtml = extraObj
      ? Object.entries(extraObj)
          .filter(([k, v]) => String(v ?? "").trim() !== "")
          .map(([k, v]) => `<li><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</li>`)
          .join("")
      : "";

    // Attachments
    const berkas = Array.isArray(s.berkas) ? s.berkas : Array.isArray(s.files) ? s.files : [];
    const filesHtml = berkas.length
      ? berkas
          .map((f, idx) => {
            const reqLabel = f.requirement || f.label || f.tipe || `Berkas ${idx + 1}`;
            const name = f.originalName || f.fileName || f.name || "(tanpa nama)";
            const url = f.dataUrl || f.url || f.downloadUrl || "";
            const link = url
              ? `<a class="btn btn-ghost" style="padding:8px 10px" href="${escapeHtml(url)}" target="_blank" rel="noopener"><i class="fa-solid fa-download"></i> Unduh</a>`
              : "";
            return `
              <div class="list-row" style="grid-template-columns:44px 1fr auto">
                <div class="idx">${idx + 1}</div>
                <div>
                  <div style="font-weight:900">${escapeHtml(reqLabel)}</div>
                  <div class="muted" style="font-size:12px">${escapeHtml(name)}</div>
                </div>
                <div>${link}</div>
              </div>
            `;
          })
          .join("")
      : `<div class="muted">Tidak ada berkas terlampir.</div>`;

    const hasil = s.hasilSurat && typeof s.hasilSurat === "object" ? s.hasilSurat : null;
    const hasilHtml = hasil
      ? `
        <div class="card" style="margin-top:10px">
          <div class="card-body" style="padding:14px">
            <div style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap">
              <div>
                <div style="font-weight:1000">Hasil Surat</div>
                <div class="muted" style="font-size:12px">${escapeHtml(hasil.fileName || "surat.pdf")} • ${escapeHtml(hasil.mime || "application/pdf")}${hasil.size ? ` • ${escapeHtml(fmtSize(hasil.size))}` : ""}</div>
                ${hasil.note ? `<div class="muted" style="margin-top:6px; font-size:12px">Catatan: ${escapeHtml(hasil.note)}</div>` : ""}
                ${hasil.sentAt ? `<div class="muted" style="margin-top:6px; font-size:12px">Dikirim: ${escapeHtml(fmtDateTime(hasil.sentAt))}</div>` : ""}
              </div>
              <div>
                ${hasil.dataUrl ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(hasil.dataUrl)}" target="_blank" rel="noopener"><i class="fa-regular fa-eye"></i> Buka</a>` : ""}
              </div>
            </div>
          </div>
        </div>
      `
      : `<div class="muted" style="margin-top:8px">Hasil surat belum dikirim.</div>`;

    bodyEl.innerHTML = `
      <div class="form-grid" style="margin-bottom:14px">
        <div class="field">
          <label>Status</label>
          <div>${statusBadge(s.status)}</div>
        </div>
        <div class="field">
          <label>Jenis Surat</label>
          <div>${escapeHtml(jenis)}</div>
        </div>
      </div>

      <h4 class="section-title-sm">Data Pemohon</h4>
      <div class="form-grid" style="margin-bottom:14px">
        <div class="field"><label>Nama</label><div>${escapeHtml(nama)}</div></div>
        <div class="field"><label>NIK</label><div>${escapeHtml(s.nik || "-")}</div></div>
        <div class="field"><label>No. Telepon</label><div>${escapeHtml(s.telp || s.telepon || "-")}</div></div>
        <div class="field"><label>RT / RW</label><div>RT ${escapeHtml(s.rt || "-")} / RW ${escapeHtml(s.rw || "-")}</div></div>
        <div class="field" style="grid-column:1/-1"><label>Alamat</label><div>${escapeHtml(s.alamat || "-")}</div></div>
      </div>

      <h4 class="section-title-sm">Rincian Pengajuan</h4>
      <div class="form-grid" style="margin-bottom:14px">
        <div class="field" style="grid-column:1/-1"><label>Keperluan</label><div>${escapeHtml(s.keperluan || "-")}</div></div>
        ${s.keterangan ? `<div class="field" style="grid-column:1/-1"><label>Keterangan</label><div>${escapeHtml(s.keterangan)}</div></div>` : ""}
        <div class="field"><label>Tanggal Pengajuan</label><div>${escapeHtml(fmtDateTime(tanggal))}</div></div>
        <div class="field"><label>Terakhir Update</label><div>${escapeHtml(updatedAt ? fmtDateTime(updatedAt) : "-")}</div></div>
      </div>

      ${extraHtml ? `
        <h4 class="section-title-sm">Data Tambahan</h4>
        <ul class="bullets" style="margin-bottom:14px">${extraHtml}</ul>
      ` : ""}

      <h4 class="section-title-sm">Berkas Persyaratan</h4>
      <div class="list-editor">${filesHtml}</div>

      <h4 class="section-title-sm" style="margin-top:14px">Pengiriman ke Warga</h4>
      ${hasilHtml}
      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap">
        <button class="btn btn-success btn-sm" type="button" data-action="openSendSurat" data-id="${escapeHtml(s.id)}">
          <i class="fa-solid fa-upload" aria-hidden="true"></i> Upload & Kirim ke Warga
        </button>
      </div>
    `;

    openModal(modalEl);
  }

  // =========================
  // Pengaduan
  // =========================
  const PENGADUAN_STATUS = ["Semua", "baru", "diproses", "selesai", "ditolak"];

  function initPengaduan() {
    const tbody = document.getElementById("pengaduanTbody");
    const empty = document.getElementById("pengaduanEmpty");
    const search = document.getElementById("pengaduanSearch");
    const filterWrap = document.getElementById("pengaduanFilter");
    if (!tbody || !empty || !filterWrap) return;

    let active = sessionStorage.getItem("stafPengaduanFilter") || "Semua";
    let q = "";

    filterWrap.innerHTML = PENGADUAN_STATUS
      .map((s) => `<button class="tab ${s === active ? "active" : ""}" data-filter="${s}">${s}</button>`)
      .join("");

    function draw() {
      const items = getArr("pengaduan").slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
      const query = (q || "").toLowerCase();
      const filtered = items.filter((x) => {
        const statusOk = active === "Semua" ? true : String(x.status).toLowerCase() === active;
        const text = `${x.judul || ""} ${x.nama || ""} ${x.lokasi || ""}`.toLowerCase();
        const qOk = query ? text.includes(query) : true;
        return statusOk && qOk;
      });

      empty.style.display = filtered.length ? "none" : "block";
      tbody.innerHTML = filtered
        .map(
          (p) => `
          <tr>
            <td>${fmtDate(p.tanggal)}</td>
            <td><b>${p.judul || "-"}</b><div class="muted" style="font-size:12px">${(p.isi || "").slice(0, 70)}${(p.isi || "").length > 70 ? "…" : ""}</div></td>
            <td>${p.nama || "-"}<div class="muted" style="font-size:12px">RT ${p.rt || "-"} / RW ${p.rw || "-"}</div></td>
            <td>${p.lokasi || "-"}</td>
            <td>${statusBadge(p.status)}</td>
            <td>
              <div class="row-actions">
                <select class="input" data-action="pengaduanStatus" data-id="${p.id}" style="height:38px;border-radius:12px">
                  ${["baru", "diproses", "selesai", "ditolak"]
              .map((opt) => `<option value="${opt}" ${String(p.status).toLowerCase() === opt ? "selected" : ""}>${opt}</option>`)
              .join("")}
                </select>
                <button class="btn btn-primary" style="padding:10px 12px" data-action="savePengaduan" data-id="${p.id}"><i class="fa-solid fa-floppy-disk"></i> Update</button>
                <button class="btn btn-ghost" style="padding:10px 12px" data-action="openChat" data-id="${p.id}"><i class="fa-solid fa-message"></i> Chat</button>
              </div>
            </td>
          </tr>`
        )
        .join("");
    }

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab[data-filter]");
      if (!btn) return;
      active = btn.dataset.filter;
      sessionStorage.setItem("stafPengaduanFilter", active);
      filterWrap.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.filter === active));
      draw();
    });

    if (search) {
      search.addEventListener("input", () => {
        q = search.value || "";
        draw();
      });
    }

    draw();
  }

  // =========================
  // Chat
  // =========================
  function initChat() {
    const listEl = document.getElementById("chatThreadList");
    const roomHead = document.getElementById("chatRoomHead");
    const msgEl = document.getElementById("chatMessages");
    const form = document.getElementById("chatSendForm");
    const input = document.getElementById("chatInput");

    if (!listEl || !roomHead || !msgEl || !form || !input) return;

    const renderThreads = () => {
      const threadsObj = getObj("chatThreads", {});
      const threads = Object.values(threadsObj).sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
      const activeId =
        sessionStorage.getItem("activeThreadId") ||
        sessionStorage.getItem("stafActiveThread") ||
        (threads[0] ? threads[0].id : "");

      listEl.innerHTML =
        threads
          .map(
            (t) => `
            <button class="chat-thread ${t.id === activeId ? "active" : ""}" data-thread-id="${t.id}">
              <div class="chat-thread-title">${t.wargaName || "Warga"}</div>
              <div class="chat-thread-sub muted">${t.title || "Pengaduan"}</div>
              <div class="chat-thread-time muted">${fmtDateTime(t.lastAt)}</div>
            </button>`
          )
          .join("") || `<div class="muted" style="padding:12px">Belum ada thread chat.</div>`;

      if (activeId) {
        sessionStorage.setItem("activeThreadId", activeId);
        sessionStorage.setItem("stafActiveThread", activeId);
        renderRoom(activeId);
      } else {
        msgEl.innerHTML = "";
        roomHead.innerHTML = `
          <div style="font-weight:1000">Pilih percakapan</div>
          <div class="muted" style="font-size:12px">Klik salah satu thread di kiri</div>`;
      }
    };

    const renderRoom = (id) => {
      const threadsObj = getObj("chatThreads", {});
      const t = threadsObj[id];
      if (!t) return;

      roomHead.innerHTML = `
        <div style="font-weight:1000">${t.wargaName || "Warga"}</div>
        <div class="muted" style="font-size:12px">${t.title || "Pengaduan"}</div>`;

      msgEl.innerHTML = (t.messages || [])
        .map((m) => {
          const who = m.from === "staf" ? "Saya (Staf)" : m.from === "warga" ? (t.wargaName || "Warga") : "System";
          const bubbleCls = m.from === "staf" ? "bubble bubble-me" : m.from === "warga" ? "bubble bubble-warga" : "bubble bubble-system";
          return `
            <div class="msg">
              <div class="${bubbleCls}">
                <div class="msg-meta">${who} • ${fmtDateTime(m.ts)}</div>
                <div>${(m.text || "").replace(/</g, "&lt;")}</div>
              </div>
            </div>`;
        })
        .join("");

      msgEl.scrollTop = msgEl.scrollHeight;
    };

    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".chat-thread[data-thread-id]");
      if (!btn) return;
      const id = btn.dataset.threadId;
      sessionStorage.setItem("activeThreadId", id);
      sessionStorage.setItem("stafActiveThread", id);
      renderThreads();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = (input.value || "").trim();
      if (!text) return;

      const id = sessionStorage.getItem("activeThreadId") || sessionStorage.getItem("stafActiveThread");
      if (!id) return;

      const threadsObj = getObj("chatThreads", {});
      const t = threadsObj[id];
      if (!t) return;

      const ts = new Date().toISOString();
      t.messages = Array.isArray(t.messages) ? t.messages : [];
      t.messages.push({ from: "staf", text, ts });
      t.lastAt = ts;
      threadsObj[id] = t;
      setObj("chatThreads", threadsObj);

      input.value = "";
      renderThreads();
    });

    renderThreads();
  }

  // =========================
  // Delegation & Page hook
  // =========================
  document.addEventListener("click", (e) => {
    // Close modal
    const btnClose = e.target.closest("[data-action='closeModal']");
    if (btnClose) {
      const modal = btnClose.closest(".modal");
      if (modal) closeModal(modal);
      return;
    }

    // Overlay click closes modal
    if (e.target && e.target.classList && e.target.classList.contains("modal")) {
      closeModal(e.target);
      return;
    }

    // Open detail surat
    const btnDetailSurat = e.target.closest("[data-action='openSuratDetail']");
    if (btnDetailSurat) {
      const id = btnDetailSurat.dataset.id;
      const items = getArr("surat");
      const s = items.find((x) => x.id === id);
      if (s) renderSuratDetail(s);
      return;
    }

    // Open modal kirim hasil surat
    const btnSend = e.target.closest("[data-action='openSendSurat']");
    if (btnSend) {
      const id = btnSend.dataset.id;
      const items = getArr("surat");
      const s = items.find((x) => x.id === id);
      if (!s) return;

      const modal = document.getElementById("kirimSuratModal");
      const title = document.getElementById("kirimSuratTitle");
      const sub = document.getElementById("kirimSuratSub");
      const hid = document.getElementById("kirimSuratId");
      const file = document.getElementById("kirimSuratFile");
      const note = document.getElementById("kirimSuratNote");

      if (hid) hid.value = id;
      if (file) file.value = "";
      if (note) note.value = "";
      if (title) title.textContent = "Upload Hasil Surat";
      if (sub) sub.textContent = `${(s.jenis || "Surat")} — ${s.nama || "Warga"} (format PDF)`;

      openModal(modal);
      return;
    }

    // Update status surat
    const btnSurat = e.target.closest("[data-action='saveSurat']");
    if (btnSurat) {
      const id = btnSurat.dataset.id;
      const sel = document.querySelector(`select[data-action='suratStatus'][data-id='${id}']`);
      if (!sel) return;
      const nextStatus = sel.value;

      const items = getArr("surat");
      const idx = items.findIndex((x) => x.id === id);
      if (idx < 0) return;

      items[idx].status = nextStatus;
      items[idx].updatedAt = new Date().toISOString();
      setArr("surat", items);

      // refresh UI jika sedang di halaman surat (re-render tanpa menumpuk event listener)
      if (document.querySelector("[data-staf-page='surat']") && typeof window.navigateTo === "function") {
        window.navigateTo("staf/surat", { replace: true });
      }
      return;
    }

    // Update status pengaduan
    const btnPeng = e.target.closest("[data-action='savePengaduan']");
    if (btnPeng) {
      const id = btnPeng.dataset.id;
      const sel = document.querySelector(`select[data-action='pengaduanStatus'][data-id='${id}']`);
      if (!sel) return;
      const nextStatus = sel.value;

      const items = getArr("pengaduan");
      const idx = items.findIndex((x) => x.id === id);
      if (idx < 0) return;

      items[idx].status = nextStatus;
      items[idx].updatedAt = new Date().toISOString();
      setArr("pengaduan", items);

      // sinkron lastAt thread agar thread naik
      const threads = getObj("chatThreads", {});
      if (threads[id]) {
        threads[id].lastAt = new Date().toISOString();
        setObj("chatThreads", threads);
      }

      if (document.querySelector("[data-staf-page='pengaduan']") && typeof window.navigateTo === "function") {
        window.navigateTo("staf/pengaduan", { replace: true });
      }
      return;
    }

    const openChat = e.target.closest("[data-action='openChat']");
    if (openChat) {
      const id = openChat.dataset.id;
      if (id) {
        sessionStorage.setItem("activeThreadId", id);
        sessionStorage.setItem("stafActiveThread", id);
      }
      if (typeof window.navigateTo === "function") window.navigateTo("staf/chat");
      else window.location.hash = "#staf/chat";
    }
  });

  // Submit kirim hasil surat (PDF)
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form || form.id !== "kirimSuratForm") return;
    e.preventDefault();

    const id = (document.getElementById("kirimSuratId")?.value || "").trim();
    const fileEl = document.getElementById("kirimSuratFile");
    const note = (document.getElementById("kirimSuratNote")?.value || "").trim();
    const modal = document.getElementById("kirimSuratModal");

    const f = fileEl?.files?.[0] || null;
    if (!id || !f) {
      alert("Mohon pilih file surat (PDF).");
      return;
    }
    if (String(f.type || "").toLowerCase() !== "application/pdf") {
      alert("Format file harus PDF.");
      return;
    }
    const max = 5 * 1024 * 1024; // 5MB
    if (f.size > max) {
      alert("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    let dataUrl = "";
    try {
      dataUrl = await fileToDataURL(f);
    } catch (err) {
      alert("Gagal membaca file.");
      return;
    }

    const items = getArr("surat");
    const idx = items.findIndex((x) => x.id === id);
    if (idx < 0) {
      alert("Data surat tidak ditemukan.");
      return;
    }

    const sentAt = new Date().toISOString();
    items[idx].hasilSurat = {
      fileName: f.name,
      mime: f.type,
      size: f.size,
      dataUrl,
      note,
      sentAt,
      sentBy: staffLabel(),
    };
    items[idx].status = "selesai";
    items[idx].updatedAt = sentAt;
    setArr("surat", items);

    alert("Surat berhasil dikirim ke warga.");
    closeModal(modal);
    // refresh staf/surat
    if (typeof window.navigateTo === "function") window.navigateTo("staf/surat", { replace: true });
  });

  window.addEventListener("page:loaded", (e) => {
    const name = e.detail?.name || "";
    const isStaf = name.startsWith("staf/");
    document.body.classList.toggle("is-staf", isStaf);
    if (!isStaf) {
      document.body.classList.remove("staf-menu-open");
      return;
    }

    ensureIds();

    // label user
    document.querySelectorAll("#stafUserLabel").forEach((el) => {
      el.textContent = staffLabel();
    });

    // mobile drawer
    ensureStafMobileMenu();
    mountStafMenuButton();

    if (name === "staf/dashboard") initDashboard();
    if (name === "staf/surat") initSurat();
    if (name === "staf/pengaduan") initPengaduan();
    if (name === "staf/chat") initChat();
  });
})();

// Staf: kelola pengumuman sederhana
window.addEventListener("page:loaded", (ev) => {
  if (ev.detail.name !== "staf/pengumuman") return;

  const tbody = document.getElementById("staf-pengumuman-table-body");
  const searchInput = document.getElementById("staf-pengumuman-search");
  const filterStatus = document.getElementById("staf-pengumuman-status-filter");

  const form = document.getElementById("staf-pengumuman-form");
  const formTitle = document.getElementById("staf-pengumuman-form-title");

  const idInput = document.getElementById("staf-pengumuman-id");
  const judulInput = document.getElementById("staf-pengumuman-judul");
  const tanggalInput = document.getElementById("staf-pengumuman-tanggal");
  const statusInput = document.getElementById("staf-pengumuman-status");
  const kategoriInput = document.getElementById("staf-pengumuman-kategori");
  const ringkasanInput = document.getElementById("staf-pengumuman-ringkasan");
  const isiInput = document.getElementById("staf-pengumuman-isi");
  const resetBtn = document.getElementById("staf-pengumuman-reset");

  let data = loadPengumuman();

  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const statusChip = (s) =>
    s === "published"
      ? '<span class="badge badge-published">Published</span>'
      : '<span class="badge badge-draft">Draft</span>';

  const kategoriChip = (k) => {
    const kk = String(k || "info").toLowerCase();
    const map = {
      info: "badge-cat-info",
      penting: "badge-cat-penting",
      darurat: "badge-cat-darurat",
    };
    const cls = map[kk] || "badge-neutral";
    return `<span class="badge ${cls}">${esc(kk.toUpperCase())}</span>`;
  };

  function resetForm() {
    idInput.value = "";
    formTitle.textContent = "Tambah Pengumuman";
    form.reset();
    statusInput.value = "published";
    kategoriInput.value = "info";
  }

  function renderTable() {
    if (!tbody) return;
    const q = (searchInput?.value || "").toLowerCase();
    const status = filterStatus?.value || "all";

    let items = [...data];

    if (status !== "all") {
      items = items.filter((item) => (item.status || "draft") === status);
    }
    if (q) {
      items = items.filter(
        (item) =>
          (item.judul || "").toLowerCase().includes(q) ||
          (item.isi || "").toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

    tbody.innerHTML = "";
    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${esc(item.judul || "-")}</b></td>
        <td><span style="font-variant-numeric:tabular-nums">${esc(item.tanggal || "-")}</span></td>
        <td>${statusChip(item.status)}</td>
        <td>${kategoriChip(item.kategori)}</td>
        <td>
          <button type="button" class="btn btn-warning btn-sm" data-action="edit" data-id="${esc(item.id)}">
            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Edit
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function upsertPengumuman(formData) {
    const id = formData.id || crypto.randomUUID();
    const existingIndex = data.findIndex((x) => x.id === id);

    const record = {
      id,
      judul: formData.judul,
      tanggal: formData.tanggal,
      status: formData.status,
      kategori: formData.kategori,
      ringkasan: formData.ringkasan,
      isi: formData.isi,
    };

    if (existingIndex >= 0) {
      data[existingIndex] = record;
    } else {
      data.push(record);
    }

    savePengumuman(data);
    renderTable();
  }

  // submit form
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    upsertPengumuman({
      id: idInput.value || null,
      judul: judulInput.value.trim(),
      tanggal: tanggalInput.value,
      status: statusInput.value,
      kategori: kategoriInput.value,
      ringkasan: ringkasanInput.value.trim(),
      isi: isiInput.value.trim(),
    });

    resetForm();
  });

  resetBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    resetForm();
  });

  // klik edit pada table
  tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='edit']");
    if (!btn) return;

    const id = btn.dataset.id;
    const item = data.find((x) => x.id === id);
    if (!item) return;

    idInput.value = item.id;
    judulInput.value = item.judul || "";
    tanggalInput.value = item.tanggal || "";
    statusInput.value = item.status || "draft";
    kategoriInput.value = item.kategori || "info";
    ringkasanInput.value = item.ringkasan || "";
    isiInput.value = item.isi || "";

    formTitle.textContent = "Edit Pengumuman";
  });

  searchInput?.addEventListener("input", renderTable);
  filterStatus?.addEventListener("change", renderTable);

  // init
  renderTable();
  resetForm();
});
