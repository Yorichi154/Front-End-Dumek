/* =========================================================
   layanan.js
   - Halaman Layanan ringkas (Surat / Pelaporan / Kontak RT-RW)
   - Publik boleh lihat, untuk mengirim diperlukan login warga
========================================================= */

(function () {
  const Guard = window.KelurahanGuard;
  const Store = window.KelurahanStore;
  if (!Guard || !Store) return;

  const { Storage } = Store;

  function mySession() {
    const s = Guard.getSession && Guard.getSession();
    if (!s) return null;
    return s;
  }

  function requireWargaSoft() {
    const s = mySession();
    return !!(s && s.role === "warga");
  }

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
      const val = JSON.parse(raw || "[]");
      return Array.isArray(val) ? val : [];
    } catch (_) {
      return [];
    }
  }

  function setArr(key, arr) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
  }

  function gateHtml() {
    return `
      <div class="help-box" style="margin-top:10px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div style="font-size:18px"><i class="fa-solid fa-lock" aria-hidden="true"></i></div>
          <div>
            <b>Login diperlukan untuk mengirim.</b>
            <div class="muted" style="margin-top:4px">Publik tetap bisa melihat informasi, tapi untuk mengirim surat/pelaporan atau melihat kontak RT/RW, silakan login sebagai warga.</div>
            <div style="margin-top:10px">
              <a class="btn btn-primary nav-link" href="#login" data-page="login"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Login</a>
              <a class="btn btn-ghost nav-link" href="#register" data-page="register"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> Daftar</a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function init() {
    const layananSelect = document.getElementById("layananSelect");
    const gate = document.getElementById("layananGate");
    const panelSurat = document.getElementById("panelSurat");
    const panelPelaporan = document.getElementById("panelPelaporan");
    const panelKontak = document.getElementById("panelKontak");

    const jenisSel = document.getElementById("lsJenis");
    const formSurat = document.getElementById("formSurat");
    const formPelaporan = document.getElementById("formPelaporan");

    const lkJenis = document.getElementById("lkJenis");
    const lkSearch = document.getElementById("lkSearch");
    const lkTbody = document.getElementById("lkTbody");

    if (!layananSelect || !gate || !panelSurat || !panelPelaporan || !panelKontak) return;

    // --- populate jenis surat from pelayananSurat (kalau ada) ---
    const layananSurat = Storage.get("pelayananSurat", []) || [];
    const suratOnline = layananSurat
      .filter((x) => (x.tipe || "").toLowerCase() === "online")
      .map((x) => x.nama)
      .filter(Boolean);

    const fallbackJenis = [
      "Surat Keterangan Domisili",
      "Surat Keterangan Kelahiran",
      "Surat Keterangan Kematian",
      "Pengantar Nikah/Talak/Cerai",
      "Surat Keterangan Usaha (SKU)",
      "Surat Keterangan Tidak Mampu (SKTM)",
      "Surat Pengantar SKCK",
      "Permohonan Bantuan Sosial",
    ];

    const jenisList = (suratOnline.length ? suratOnline : fallbackJenis).sort();
    if (jenisSel) {
      jenisSel.innerHTML =
        `<option value="">Pilih jenis surat</option>` +
        jenisList.map((t) => `<option value="${String(t).replace(/"/g, "&quot;")}">${t}</option>`).join("");
    }

    const show = (mode) => {
      const isWarga = requireWargaSoft();
      gate.innerHTML = isWarga ? "" : gateHtml();

      panelSurat.style.display = mode === "surat" ? "block" : "none";
      panelPelaporan.style.display = mode === "pelaporan" ? "block" : "none";
      panelKontak.style.display = mode === "kontak" ? "block" : "none";

      // disable form jika belum login
      const disable = !isWarga;
      [formSurat, formPelaporan].forEach((f) => {
        if (!f) return;
        f.querySelectorAll("input,select,textarea,button").forEach((el) => {
          if (el.type === "button") return; // reset boleh
          el.disabled = disable;
        });
      });

      // kontak juga dikunci
      if (mode === "kontak") {
        if (!isWarga) {
          if (lkTbody) lkTbody.innerHTML = `
            <tr>
              <td colspan="4">
                <div class="muted" style="display:flex;align-items:center;gap:10px;justify-content:center;padding:10px 0">
                  <span>Login untuk melihat data kontak.</span>
                  <a class="btn btn-primary btn-sm nav-link" href="#login" data-page="login">Login</a>
                </div>
              </td>
            </tr>`;
        } else {
          renderKontak();
        }
      }
    };

    const preset = (sessionStorage.getItem("layananPreset") || "").toLowerCase();
    if (preset && ["surat", "pelaporan", "kontak"].includes(preset)) {
      layananSelect.value = preset;
    }
    sessionStorage.removeItem("layananPreset");

    layananSelect.addEventListener("change", () => show(layananSelect.value));
    show(layananSelect.value);

    // reset buttons
    document.addEventListener("click", (e) => {
      const rs = e.target.closest("[data-action='resetSurat']");
      if (rs) {
        formSurat?.reset();
      }
      const rp = e.target.closest("[data-action='resetPelaporan']");
      if (rp) {
        formPelaporan?.reset();
      }
    });

    // submit surat
    if (formSurat) {
      formSurat.addEventListener("submit", (ev) => {
        ev.preventDefault();
        if (!requireWargaSoft()) {
          alert("Silakan login sebagai warga untuk mengirim pengajuan surat.");
          if (typeof window.navigateTo === "function") window.navigateTo("login");
          else window.location.hash = "#login";
          return;
        }

        const s = mySession();
        const jenis = (document.getElementById("lsJenis")?.value || "").trim();
        const keperluan = (document.getElementById("lsKeperluan")?.value || "").trim();
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
          nik: (document.getElementById("lsNik")?.value || "").trim(),
          gender: (document.getElementById("lsGender")?.value || "").trim(),
          alamat: (document.getElementById("lsAlamat")?.value || "").trim(),
          catatan: (document.getElementById("lsCatatan")?.value || "").trim(),
          berkasUrl: (() => {
            const fi = document.getElementById("lsBerkas");
            const f = fi && fi.files && fi.files[0] ? fi.files[0] : null;
            return f ? f.name : "";
          })(),
          berkas: (() => {
            const fi = document.getElementById("lsBerkas");
            const f = fi && fi.files && fi.files[0] ? fi.files[0] : null;
            return f ? [{ label: "Lampiran", name: f.name, type: f.type || "", size: f.size || 0 }] : [];
          })(),
          status: "menunggu",
        };

        const all = getArr("surat");
        all.unshift(item);
        setArr("surat", all);

        alert("Pengajuan surat terkirim. Anda bisa pantau di Panel Warga > Surat Saya.");
        formSurat.reset();
      });
    }

    // submit pelaporan
    if (formPelaporan) {
      formPelaporan.addEventListener("submit", (ev) => {
        ev.preventDefault();
        if (!requireWargaSoft()) {
          alert("Silakan login sebagai warga untuk mengirim laporan.");
          if (typeof window.navigateTo === "function") window.navigateTo("login");
          else window.location.hash = "#login";
          return;
        }

        const s = mySession();
        const kategori = (document.getElementById("lpKategori")?.value || "").trim();
        const judul = (document.getElementById("lpJudul")?.value || "").trim();
        const lokasi = (document.getElementById("lpLokasi")?.value || "").trim();
        const deskripsi = (document.getElementById("lpDeskripsi")?.value || "").trim();
        const buktiFile = document.getElementById("lpBukti")?.files?.[0] || null;
        const buktiUrl = buktiFile ? buktiFile.name : "";
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
          deskripsi,
          buktiUrl,
          buktiMeta: buktiFile ? { name: buktiFile.name, type: buktiFile.type || "", size: buktiFile.size || 0 } : null,
          status: "baru",
        };

        const all = getArr("pengaduan");
        all.unshift(item);
        setArr("pengaduan", all);

        // buat thread chat untuk pengaduan (kompatibel dengan warga.js/staf.js)
        try {
          const threads = JSON.parse(localStorage.getItem("chatThreads") || "{}");
          if (!threads[id]) {
            threads[id] = {
              id,
              pengaduanId: id,
              wargaName: item.nama,
              wargaEmail: (item.wargaEmail || "").toLowerCase(),
              title: item.judul,
              lastAt: now,
              messages: [{ from: "system", text: `Thread dibuat untuk pengaduan: "${item.judul}"`, ts: now }],
            };
            localStorage.setItem("chatThreads", JSON.stringify(threads));
          }
        } catch (_) {}

        alert("Laporan terkirim. Anda bisa pantau di Panel Warga > Pengaduan Saya.");
        formPelaporan.reset();
      });
    }

    // kontak RT/RW
    function normalizeWaNumber(raw) {
      const digits = String(raw || "").replace(/\D/g, "");
      if (!digits) return "";
      // Indonesia: 08xx -> 628xx
      if (digits.startsWith("0")) return "62" + digits.slice(1);
      if (digits.startsWith("8")) return "62" + digits;
      return digits;
    }

    function makeWaUrl(number, wilayah, jenis) {
      const wa = normalizeWaNumber(number);
      if (!wa) return "";
      const msg = `Assalamualaikum, saya warga Duren Mekar. Ingin koordinasi terkait wilayah ${wilayah || "-"} (${String(jenis || "").toUpperCase()}).`;
      return `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
    }

    function renderKontak() {
      if (!lkTbody || !lkJenis) return;
      const jenis = (lkJenis.value || "rt").toLowerCase();
      const q = (lkSearch?.value || "").toLowerCase();
      const all = Storage.get("lembagaKontak", []) || [];
      let items = all.filter((x) => (x.jenis || "").toLowerCase() === jenis);
      if (q) {
        items = items.filter((x) => `${x.nama || ""} ${x.jabatan || ""} ${x.wilayah || ""} ${x.kontak || ""}`.toLowerCase().includes(q));
      }

      lkTbody.innerHTML =
        items
          .map((x) => {
            const wilayah = x.wilayah || "-";
            const rawKontak = x.kontak || "";
            const waUrl = rawKontak ? makeWaUrl(rawKontak, wilayah, jenis) : "";
            const label = rawKontak ? String(rawKontak) : "-";
            return `
            <tr>
              <td>${x.nama || "-"}</td>
              <td>${x.jabatan || "-"}</td>
              <td>${wilayah}</td>
              <td>
                ${waUrl
                  ? `<a class="btn btn-success btn-sm" href="${waUrl}" target="_blank" rel="noopener" title="Chat WhatsApp">
                      <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> ${label}
                    </a>`
                  : "-"}
              </td>
            </tr>`;
          })
          .join("") || `<tr><td colspan="4" class="muted">Data belum tersedia.</td></tr>`;
    }

    lkJenis?.addEventListener("change", () => requireWargaSoft() && renderKontak());
    lkSearch?.addEventListener("input", () => requireWargaSoft() && renderKontak());
  }

  window.addEventListener("page:loaded", (e) => {
    if (e.detail?.name !== "layanan") return;
    init();
  });
})();
