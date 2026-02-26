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

  // file -> dataURL (frontend-only)
  const fileToDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("Gagal membaca file"));
      r.readAsDataURL(file);
    });

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

    const esc = (v) =>
      String(v ?? "").replace(/[&<>\"]/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      }[ch]));

    const fmtSize = (n) => {
      const b = Number(n || 0);
      if (!b) return "-";
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
      return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isRealUrl = (u) => /^(https?:\/\/|\/|assets\/|data:)/i.test(String(u || "").trim());

    function ensureBerkasModal() {
      let modal = document.getElementById("wargaBerkasModal");
      if (modal) {
        return {
          modal,
          meta: modal.querySelector("#wargaBerkasMeta"),
          body: modal.querySelector("#wargaBerkasBody"),
        };
      }

      modal = document.createElement("div");
      modal.className = "modal";
      modal.id = "wargaBerkasModal";
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-head">
              <div class="modal-title">
                <h3>Berkas Persyaratan</h3>
                <div class="muted" id="wargaBerkasMeta" style="font-size:12px"></div>
              </div>
              <button class="icon-btn" type="button" data-action="closeWargaBerkas" aria-label="Tutup">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
            <div class="modal-body">
              <div id="wargaBerkasBody"></div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-light" type="button" data-action="closeWargaBerkas">Tutup</button>
            </div>
          </div>
        </div>`;

      document.body.appendChild(modal);

      return {
        modal,
        meta: modal.querySelector("#wargaBerkasMeta"),
        body: modal.querySelector("#wargaBerkasBody"),
      };
    }

    const berkasUi = ensureBerkasModal();

    function openBerkasModal(item) {
      const files = Array.isArray(item?.berkas) ? item.berkas : [];
      const hasil = item?.hasilSurat && typeof item.hasilSurat === "object" ? item.hasilSurat : null;
      if (berkasUi.meta) {
        berkasUi.meta.innerHTML = `${esc(item?.jenis || "-")} • ${esc(fmtDate(item?.tanggal))} • ${pill(item?.status)}`;
      }

      if (!berkasUi.body) return;

      let html = "";

      // Hasil surat dari staf (jika sudah dikirim)
      if (hasil) {
        const hName = esc(hasil.fileName || "surat.pdf");
        const hMeta = `${esc(hasil.mime || "application/pdf")}${hasil.size ? ` • ${fmtSize(hasil.size)}` : ""}`;
        const hNote = hasil.note ? `<div class="muted" style="font-size:12px;margin-top:6px">Catatan: ${esc(hasil.note)}</div>` : "";
        const hSent = hasil.sentAt ? `<div class="muted" style="font-size:12px;margin-top:6px">Dikirim: ${esc(fmtDateTime(hasil.sentAt))}</div>` : "";
        const hBtn = hasil.dataUrl
          ? `<a class="btn btn-primary btn-sm" href="${hasil.dataUrl}" target="_blank" rel="noopener">
               <i class="fa-regular fa-eye" aria-hidden="true"></i> Buka Surat
             </a>`
          : `<span class="pill yellow">Tidak ada file</span>`;

        html += `
          <div class="card" style="margin-bottom:10px">
            <div class="card-body" style="padding:14px">
              <div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
                <div>
                  <div style="font-weight:1000">Hasil Surat</div>
                  <div class="muted" style="font-size:12px">${hName}${hMeta ? ` • ${hMeta}` : ""}</div>
                  ${hNote}
                  ${hSent}
                </div>
                <div>${hBtn}</div>
              </div>
            </div>
          </div>`;
      } else {
        html += `<div class="muted" style="margin-bottom:10px">Hasil surat belum tersedia. Silakan menunggu proses dari petugas.</div>`;
      }

      // Berkas persyaratan dari warga
      html += `<div style="font-weight:1000; margin:6px 0 10px">Berkas Persyaratan</div>`;

      if (!files.length) {
        html += `<div class="muted">Tidak ada berkas persyaratan yang diunggah.</div>`;
      } else {
        html += files
          .map((f) => {
            const req = esc(f?.requirement || "Berkas");
            const name = esc(f?.fileName || "-");
            const meta = `${esc(f?.mime || "")}${f?.size ? ` • ${fmtSize(f.size)}` : ""}`;
            const openBtn = f?.dataUrl
              ? `<a class="btn btn-primary btn-sm" href="${f.dataUrl}" target="_blank" rel="noopener">
                   <i class="fa-regular fa-eye" aria-hidden="true"></i> Buka
                 </a>`
              : `<span class="pill yellow">Tidak ada preview</span>`;

            const note = !f?.dataUrl
              ? `<div class="muted" style="font-size:12px;margin-top:6px">Catatan: file demo hanya menyimpan preview untuk berkas kecil (≤ 200KB).</div>`
              : "";

            return `
              <div class="card" style="margin-bottom:10px">
                <div class="card-body" style="padding:14px">
                  <div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
                    <div>
                      <div style="font-weight:1000">${req}</div>
                      <div class="muted" style="font-size:12px">${name}${meta ? ` • ${meta}` : ""}</div>
                      ${note}
                    </div>
                    <div>${openBtn}</div>
                  </div>
                </div>
              </div>`;
          })
          .join("");
      }

      berkasUi.body.innerHTML = html;

      berkasUi.modal.classList.add("open");
    }

    function closeBerkasModal() {
      berkasUi.modal.classList.remove("open");
    }

    const berkasCell = (s) => {
      const files = Array.isArray(s?.berkas) ? s.berkas : [];
      const count = files.length;
      const hasHasil = !!(s?.hasilSurat && typeof s.hasilSurat === "object");
      const raw = String(s?.berkasUrl || "").trim();
      if (count > 0 || hasHasil) {
        const label = count > 0 ? `Lihat (${count})` : "Lihat";
        return `<button type="button" class="btn btn-primary btn-sm" data-action="viewBerkas" data-id="${s.id}">
          <i class="fa-regular fa-eye" aria-hidden="true"></i> ${label}
        </button>`;
      }
      if (raw && raw !== "-" && isRealUrl(raw)) {
        return `<a class="btn btn-primary btn-sm" href="${esc(raw)}" target="_blank" rel="noopener">
          <i class="fa-regular fa-eye" aria-hidden="true"></i> Lihat
        </a>`;
      }
      // raw "1 berkas" (bukan URL) -> tetap tampil tombol biar tidak 404
      if (raw && raw !== "-" && /berkas/i.test(raw)) {
        return `<button type="button" class="btn btn-primary btn-sm" data-action="viewBerkas" data-id="${s.id}">
          <i class="fa-regular fa-eye" aria-hidden="true"></i> Lihat
        </button>`;
      }
      return "-";
    };

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
              <td>${berkasCell(s)}</td>
            </tr>`
          )
          .join("") || `<tr><td colspan="5" class="muted">Belum ada pengajuan surat.</td></tr>`;
    };

    search?.addEventListener("input", draw);
    filter?.addEventListener("change", draw);

    // buka modal berkas
    tbody?.addEventListener("click", (e) => {
      const btn = e.target.closest?.("[data-action='viewBerkas']");
      if (!btn) return;
      const id = btn.dataset.id;
      const item = getArr("surat").find((x) => String(x.id) === String(id));
      if (!item) return;
      openBerkasModal(item);
    });

    // close modal
    document.addEventListener("click", (e) => {
      if (e.target.closest?.("[data-action='closeWargaBerkas']")) {
        closeBerkasModal();
        return;
      }
      if (e.target === berkasUi.modal) {
        closeBerkasModal();
      }
    });

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
        const buktiInput = document.getElementById("wpBukti");
        const buktiFile = buktiInput?.files?.[0] || null;
        const deskripsi = (document.getElementById("wpDeskripsi")?.value || "").trim();

        if (!kategori || !judul || !lokasi || !deskripsi) {
          alert("Kategori, judul, lokasi, dan deskripsi wajib diisi.");
          return;
        }

        const now = new Date().toISOString();
        const id = makeId(`pengaduan|${now}|${s.email}|${judul}`);

        const run = async () => {
          let buktiData = "";
          let buktiName = "";
          if (buktiFile) {
            buktiData = await fileToDataURL(buktiFile);
            buktiName = buktiFile.name || "";
          }

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
            buktiData,
            buktiName,
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

          // arahkan ke halaman konfirmasi (lebih sopan daripada alert)
          sessionStorage.setItem("postSubmitType", "pengaduan");
          sessionStorage.setItem("postSubmitId", id);
          sessionStorage.setItem("postSubmitTitle", item.judul || "Pengaduan");
          if (typeof window.navigateTo === "function") window.navigateTo("warga/konfirmasi");
          else window.location.hash = "#warga/konfirmasi";
        };

        run().catch((err) => {
          console.error(err);
          alert("Gagal mengirim pengaduan. Coba lagi.");
        });
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
  // KONFIRMASI (Thank You)
  // =========================
  function initKonfirmasi() {
    const type = (sessionStorage.getItem("postSubmitType") || "").toLowerCase();
    const id = sessionStorage.getItem("postSubmitId") || "";

    const titleEl = document.getElementById("thanksMainTitle");
    const descEl = document.getElementById("thanksMainDesc");
    const refBox = document.getElementById("thanksRefBox");
    const refCode = document.getElementById("thanksRefCode");
    const trackLink = document.getElementById("thanksTrackLink");
    const trackHint = document.getElementById("thanksTrackHint");
    const btnSurat = document.getElementById("thanksBtnSurat");
    const btnPengaduan = document.getElementById("thanksBtnPengaduan");

    // tampilkan nomor referensi jika ada
    if (id && refBox && refCode) {
      refBox.hidden = false;
      refCode.textContent = id;
    }

    // teks baku + sopan, menyesuaikan jenis layanan
    if (type === "pengaduan") {
      if (titleEl) titleEl.textContent = "Terima kasih. Pelaporan Anda telah kami terima.";
      if (descEl) {
        descEl.textContent =
          "Laporan Anda telah berhasil dikirim. Mohon menunggu, petugas kami akan melakukan verifikasi dan tindak lanjut sesuai ketentuan.";
      }
      if (trackHint) trackHint.textContent = "Pengaduan Saya";
      if (trackLink) {
        trackLink.textContent = "Pengaduan Saya";
        trackLink.dataset.page = "warga/pengaduan";
        trackLink.setAttribute("href", "#warga/pengaduan");
      }

      // buat tombol pelaporan terlihat utama
      if (btnPengaduan) {
        btnPengaduan.classList.add("btn-primary");
        btnPengaduan.classList.remove("btn-ghost");
      }
      if (btnSurat) btnSurat.classList.add("btn-solid");
    } else {
      // default: surat
      if (titleEl) titleEl.textContent = "Terima kasih. Pengajuan surat Anda telah kami terima.";
      if (descEl) {
        descEl.textContent =
          "Permohonan Anda telah berhasil dikirim. Mohon menunggu, petugas kami akan melakukan verifikasi data dan berkas sebelum diproses lebih lanjut.";
      }
      if (trackHint) trackHint.textContent = "Surat Saya";
      if (trackLink) {
        trackLink.textContent = "Surat Saya";
        trackLink.dataset.page = "warga/surat";
        trackLink.setAttribute("href", "#warga/surat");
      }
    }
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
    if (name === "warga/konfirmasi") initKonfirmasi();
  });
})();
