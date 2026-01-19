// assets/js/warga/warga.js
// - Ajukan surat & pengaduan
// - Pantau status
// - Chat dengan staf (shared threads via localStorage: chatThreads)

(function () {
  const Guard = window.KelurahanGuard;

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

  function pill(status) {
    const s = String(status || "").toLowerCase();
    const map = {
      menunggu: "yellow",
      ditinjau: "blue",
      diproses: "blue",
      selesai: "green",
      ditolak: "red",
      baru: "yellow",
    };
    const cls = map[s] || "";
    return `<span class="pill ${cls}">${s || "-"}</span>`;
  }

  function session() {
    return Guard?.getSession ? Guard.getSession() : null;
  }

  function wargaLabel() {
    const s = session();
    if (!s) return "-";
    const rtRw = s.rt || s.rw ? ` RT ${s.rt || "-"}/RW ${s.rw || "-"}` : "";
    return `${s.name || "Warga"}${rtRw}${s.email ? ` • ${s.email}` : ""}`;
  }

  function myEmail() {
    return (sessionStorage.getItem("userEmail") || "").toLowerCase();
  }

  function ensureIdsAndThreads() {
    const email = myEmail();
    if (!email) return;

    // Surat
    let surat = getArr("surat");
    let changed = false;
    surat.forEach((s, i) => {
      if (!s.id) {
        s.id = makeId(`surat|${s.tanggal || i}|${s.nama || ""}|${s.jenis || ""}`);
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

    // Pastikan chat thread ada untuk tiap pengaduan
    const threads = getObj("chatThreads", {});
    let tChanged = false;
    pengaduan.forEach((p) => {
      if (!threads[p.id]) {
        threads[p.id] = {
          id: p.id,
          pengaduanId: p.id,
          wargaName: p.nama || "Warga",
          wargaEmail: (p.wargaEmail || "").toLowerCase(),
          title: p.judul || "Pengaduan",
          lastAt: p.tanggal || new Date().toISOString(),
          messages: [
            {
              from: "system",
              text: `Thread dibuat untuk pengaduan: "${p.judul || "-"}"`,
              ts: p.tanggal || new Date().toISOString(),
            },
          ],
        };
        tChanged = true;
      }
    });
    if (tChanged) setObj("chatThreads", threads);
  }

  // =========================
  // DASHBOARD
  // =========================
  function initDashboard() {
    const email = myEmail();
    const surat = getArr("surat").filter((x) => (x.wargaEmail || "").toLowerCase() === email);
    const pengaduan = getArr("pengaduan").filter((x) => (x.wargaEmail || "").toLowerCase() === email);

    const cMenunggu = surat.filter((x) => String(x.status).toLowerCase() === "menunggu").length;
    const cDiproses = surat.filter((x) => String(x.status).toLowerCase() === "diproses" || String(x.status).toLowerCase() === "ditinjau").length;
    const cSelesai = surat.filter((x) => String(x.status).toLowerCase() === "selesai").length;
    const cAktif = pengaduan.filter((x) => ["baru", "ditinjau", "diproses"].includes(String(x.status).toLowerCase())).length;

    const setTxt = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };
    setTxt("metricWSuratMenunggu", cMenunggu);
    setTxt("metricWSuratDiproses", cDiproses);
    setTxt("metricWSuratSelesai", cSelesai);
    setTxt("metricWPengaduanAktif", cAktif);

    const sLatest = document.getElementById("wargaSuratLatest");
    if (sLatest) {
      const items = surat.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 5);
      sLatest.innerHTML =
        items
          .map(
            (s) => `
              <tr>
                <td><b>${s.jenis || "-"}</b></td>
                <td>${fmtDate(s.tanggal)}</td>
                <td>${pill(s.status)}</td>
              </tr>`
          )
          .join("") || `<tr><td colspan="3" class="muted">Belum ada pengajuan surat.</td></tr>`;
    }

    const pLatest = document.getElementById("wargaPengaduanLatest");
    if (pLatest) {
      const items = pengaduan.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 5);
      pLatest.innerHTML =
        items
          .map(
            (p) => `
              <tr>
                <td><b>${p.judul || "-"}</b><div class="muted" style="font-size:12px">${p.lokasi || ""}</div></td>
                <td>${fmtDate(p.tanggal)}</td>
                <td>${pill(p.status)}</td>
              </tr>`
          )
          .join("") || `<tr><td colspan="3" class="muted">Belum ada pengaduan.</td></tr>`;
    }
  }

  // =========================
  // SURAT
  // =========================
  function initSurat() {
    const email = myEmail();
    const tbody = document.getElementById("wargaSuratTbody");
    const search = document.getElementById("wargaSuratSearch");
    const filter = document.getElementById("wargaSuratFilter");
    const form = document.getElementById("wargaSuratForm");

    const draw = () => {
      if (!tbody) return;
      const q = (search?.value || "").toLowerCase();
      const f = (filter?.value || "").toLowerCase();
      let items = getArr("surat").filter((x) => (x.wargaEmail || "").toLowerCase() === email);
      if (f) items = items.filter((x) => String(x.status).toLowerCase() === f);
      if (q) {
        items = items.filter((x) => {
          const hay = `${x.jenis || ""} ${x.keperluan || ""} ${x.catatan || ""}`.toLowerCase();
          return hay.includes(q);
        });
      }
      items = items.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

      tbody.innerHTML =
        items
          .map(
            (s) => `
            <tr>
              <td><b>${s.jenis || "-"}</b></td>
              <td>${s.keperluan || "-"}<div class="muted" style="font-size:12px">${s.catatan || ""}</div></td>
              <td>${fmtDate(s.tanggal)}</td>
              <td>${pill(s.status)}</td>
              <td>${s.berkasUrl ? `<a href="${s.berkasUrl}" target="_blank" rel="noopener">Lihat</a>` : "-"}</td>
            </tr>`
          )
          .join("") || `<tr><td colspan="5" class="muted">Belum ada pengajuan surat.</td></tr>`;
    };

    search?.addEventListener("input", draw);
    filter?.addEventListener("change", draw);

    document.addEventListener("click", (e) => {
      const reset = e.target.closest("[data-action='resetSurat']");
      if (!reset) return;
      (document.getElementById("wsJenis") || {}).value = "";
      (document.getElementById("wsKeperluan") || {}).value = "";
      (document.getElementById("wsCatatan") || {}).value = "";
      (document.getElementById("wsBerkas") || {}).value = "";
    });

    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const s = session();
        if (!s) return;

        const jenis = (document.getElementById("wsJenis")?.value || "").trim();
        const keperluan = (document.getElementById("wsKeperluan")?.value || "").trim();
        const catatan = (document.getElementById("wsCatatan")?.value || "").trim();
        const berkasUrl = (document.getElementById("wsBerkas")?.value || "").trim();
        if (!jenis || !keperluan) {
          alert("Jenis surat dan keperluan wajib diisi.");
          return;
        }

        const now = new Date().toISOString();
        const item = {
          id: makeId(`surat|${now}|${s.email}|${jenis}|${keperluan}`),
          tanggal: now,
          nama: s.name || "Warga",
          rt: s.rt || "",
          rw: s.rw || "",
          wargaEmail: s.email || "",
          jenis,
          keperluan,
          catatan,
          berkasUrl,
          status: "menunggu",
        };

        const all = getArr("surat");
        all.unshift(item);
        setArr("surat", all);

        alert("Pengajuan surat terkirim. Silakan pantau statusnya.");
        form.reset();
        draw();
      });
    }

    draw();
  }

  // =========================
  // PENGADUAN
  // =========================
  function initPengaduan() {
    const email = myEmail();
    const tbody = document.getElementById("wargaPengaduanTbody");
    const search = document.getElementById("wargaPengaduanSearch");
    const filter = document.getElementById("wargaPengaduanFilter");
    const form = document.getElementById("wargaPengaduanForm");

    const draw = () => {
      if (!tbody) return;
      const q = (search?.value || "").toLowerCase();
      const f = (filter?.value || "").toLowerCase();

      let items = getArr("pengaduan").filter((x) => (x.wargaEmail || "").toLowerCase() === email);
      if (f) items = items.filter((x) => String(x.status).toLowerCase() === f);
      if (q) {
        items = items.filter((x) => {
          const hay = `${x.judul || ""} ${x.kategori || ""} ${x.lokasi || ""}`.toLowerCase();
          return hay.includes(q);
        });
      }
      items = items.slice().sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

      tbody.innerHTML =
        items
          .map(
            (p) => `
            <tr>
              <td><b>${p.judul || "-"}</b><div class="muted" style="font-size:12px">${p.deskripsi || ""}</div></td>
              <td>${p.kategori || "-"}<div class="muted" style="font-size:12px">${p.lokasi || ""}</div></td>
              <td>${fmtDate(p.tanggal)}</td>
              <td>${pill(p.status)}</td>
              <td>
                <button class="btn btn-ghost" data-action="openChat" data-id="${p.id}"><i class="fa-solid fa-message"></i> Chat</button>
              </td>
            </tr>`
          )
          .join("") || `<tr><td colspan="5" class="muted">Belum ada pengaduan.</td></tr>`;
    };

    search?.addEventListener("input", draw);
    filter?.addEventListener("change", draw);

    document.addEventListener("click", (e) => {
      const reset = e.target.closest("[data-action='resetPengaduan']");
      if (reset) {
        (document.getElementById("wpKategori") || {}).value = "";
        (document.getElementById("wpJudul") || {}).value = "";
        (document.getElementById("wpLokasi") || {}).value = "";
        (document.getElementById("wpBukti") || {}).value = "";
        (document.getElementById("wpDeskripsi") || {}).value = "";
      }

      const openChat = e.target.closest("[data-action='openChat']");
      if (openChat) {
        const id = openChat.dataset.id;
        if (id) {
          sessionStorage.setItem("activeThreadId", id);
          sessionStorage.setItem("wargaActiveThread", id);
          sessionStorage.setItem("stafActiveThread", id);
        }
        if (typeof window.navigateTo === "function") window.navigateTo("warga/chat");
        else window.location.hash = "#warga/chat";
      }
    });

    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const s = session();
        if (!s) return;

        const kategori = (document.getElementById("wpKategori")?.value || "").trim();
        const judul = (document.getElementById("wpJudul")?.value || "").trim();
        const lokasi = (document.getElementById("wpLokasi")?.value || "").trim();
        const buktiUrl = (document.getElementById("wpBukti")?.value || "").trim();
        const deskripsi = (document.getElementById("wpDeskripsi")?.value || "").trim();

        if (!kategori || !judul || !lokasi || !deskripsi) {
          alert("Kategori, judul, lokasi, dan deskripsi wajib diisi.");
          return;
        }

        const now = new Date().toISOString();
        const id = makeId(`pengaduan|${now}|${s.email}|${judul}`);

        const item = {
          id,
          tanggal: now,
          nama: s.name || "Warga",
          rt: s.rt || "",
          rw: s.rw || "",
          wargaEmail: s.email || "",
          kategori,
          judul,
          lokasi,
          buktiUrl,
          deskripsi,
          status: "baru",
        };

        const all = getArr("pengaduan");
        all.unshift(item);
        setArr("pengaduan", all);

        // buat thread chat langsung
        const threads = getObj("chatThreads", {});
        if (!threads[id]) {
          threads[id] = {
            id,
            pengaduanId: id,
            wargaName: item.nama,
            wargaEmail: (item.wargaEmail || "").toLowerCase(),
            title: item.judul,
            lastAt: now,
            messages: [
              { from: "system", text: `Thread dibuat untuk pengaduan: "${item.judul}"`, ts: now },
            ],
          };
          setObj("chatThreads", threads);
        }

        alert("Pengaduan terkirim. Anda bisa chat staf untuk tindak lanjut.");
        form.reset();
        draw();
      });
    }

    draw();
  }

  // =========================
  // CHAT
  // =========================
  function initChat() {
    const email = myEmail();
    const listEl = document.getElementById("wargaThreadList");
    const sub = document.getElementById("wargaChatSub");
    const msgEl = document.getElementById("wargaChatMessages");
    const input = document.getElementById("wargaChatInput");
    const sendBtn = document.getElementById("wargaChatSend");

    if (!listEl || !msgEl || !input || !sendBtn) return;

    const myPengaduan = getArr("pengaduan").filter((x) => (x.wargaEmail || "").toLowerCase() === email);
    const allowedIds = new Set(myPengaduan.map((x) => x.id));

    const renderThreads = () => {
      const threadsObj = getObj("chatThreads", {});
      const threads = Object.values(threadsObj)
        .filter((t) => allowedIds.has(t.id))
        .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

      const activeId =
        sessionStorage.getItem("activeThreadId") ||
        sessionStorage.getItem("wargaActiveThread") ||
        (threads[0] ? threads[0].id : "");

      listEl.innerHTML =
        threads
          .map(
            (t) => `
            <button class="chat-thread ${t.id === activeId ? "active" : ""}" data-thread-id="${t.id}">
              <div class="chat-thread-title">${t.title || "Pengaduan"}</div>
              <div class="chat-thread-sub muted">Update: ${fmtDateTime(t.lastAt)}</div>
            </button>`
          )
          .join("") || `<div class="muted" style="padding:12px">Belum ada thread. Buat pengaduan dulu.</div>`;

      if (activeId) {
        sessionStorage.setItem("activeThreadId", activeId);
        sessionStorage.setItem("wargaActiveThread", activeId);
        renderRoom(activeId);
      } else {
        msgEl.innerHTML = "";
        if (sub) sub.textContent = "Pilih pengaduan untuk mulai chat";
      }
    };

    const renderRoom = (id) => {
      const threadsObj = getObj("chatThreads", {});
      const t = threadsObj[id];
      if (!t) return;
      if (sub) sub.textContent = t.title || "Chat";

      msgEl.innerHTML = (t.messages || [])
        .map((m) => {
          const isMe = m.from === "warga";
          const who = m.from === "staf" ? "Staf" : m.from === "warga" ? "Saya" : "System";
          return `
            <div class="chat-row ${isMe ? "me" : ""}">
              <div class="chat-bubble">
                <div>${(m.text || "").replace(/</g, "&lt;")}</div>
                <div class="chat-meta">${who} • ${fmtDateTime(m.ts)}</div>
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
      sessionStorage.setItem("wargaActiveThread", id);
      renderThreads();
    });

    const send = () => {
      const text = (input.value || "").trim();
      if (!text) return;
      const id = sessionStorage.getItem("activeThreadId") || sessionStorage.getItem("wargaActiveThread");
      if (!id) return;

      const threadsObj = getObj("chatThreads", {});
      const t = threadsObj[id];
      if (!t) return;

      const ts = new Date().toISOString();
      t.messages = Array.isArray(t.messages) ? t.messages : [];
      t.messages.push({ from: "warga", text, ts });
      t.lastAt = ts;
      threadsObj[id] = t;
      setObj("chatThreads", threadsObj);

      input.value = "";
      renderThreads();
    };

    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      send();
    });

    input.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") send();
    });

    renderThreads();
  }

  // =========================
  // PROFIL
  // =========================
  function initProfil() {
    const s = session();
    if (!s) return;

    const key = `wargaProfile.${(s.email || "").toLowerCase()}`;
    const stored = getObj(key, null);

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || "";
    };

    setVal("wpNama", stored?.name || s.name || "");
    setVal("wpEmail", s.email || "");
    setVal("wpRT", stored?.rt || s.rt || "");
    setVal("wpRW", stored?.rw || s.rw || "");
    setVal("wpAlamat", stored?.alamat || "");

    const form = document.getElementById("wargaProfilForm");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (document.getElementById("wpNama")?.value || "").trim();
      const rt = (document.getElementById("wpRT")?.value || "").trim();
      const rw = (document.getElementById("wpRW")?.value || "").trim();
      const alamat = (document.getElementById("wpAlamat")?.value || "").trim();

      setObj(key, { name, rt, rw, alamat });

      // update session label biar sinkron
      if (name) sessionStorage.setItem("userName", name);
      if (rt) sessionStorage.setItem("rt", rt);
      if (rw) sessionStorage.setItem("rw", rw);

      alert("Profil tersimpan.");
      document.querySelectorAll("#wargaUserLabel").forEach((el) => (el.textContent = wargaLabel()));
    });

    document.addEventListener("click", (e) => {
      const reset = e.target.closest("[data-action='resetProfil']");
      if (!reset) return;
      setObj(key, { name: s.name || "", rt: s.rt || "", rw: s.rw || "", alamat: "" });
      setVal("wpNama", s.name || "");
      setVal("wpRT", s.rt || "");
      setVal("wpRW", s.rw || "");
      setVal("wpAlamat", "");
    });
  }

  // =========================
  // Hook on route load
  // =========================
  window.addEventListener("page:loaded", (e) => {
    const name = e.detail?.name || "";
    const isWarga = name.startsWith("warga/");
    document.body.classList.toggle("is-warga", isWarga);
    if (!isWarga) return;

    if (!Guard.requireWarga()) return;

    ensureIdsAndThreads();
    document.querySelectorAll("#wargaUserLabel").forEach((el) => (el.textContent = wargaLabel()));

    if (name === "warga/dashboard") initDashboard();
    if (name === "warga/surat") initSurat();
    if (name === "warga/pengaduan") initPengaduan();
    if (name === "warga/chat") initChat();
    if (name === "warga/profil") initProfil();
  });
})();
