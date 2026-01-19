/* =========================================================
   lembaga.js
   - Mengelola data lembaga kemasyarakatan (RT, RW, PKK,
     Karang Taruna, LPMK)
   - Bisa dirender di halaman publik dan diedit di admin
========================================================= */

(function () {
    if (!window.KelurahanStore) return;

    const { Storage } = window.KelurahanStore;
    const Guard = window.KelurahanGuard || {};
    const KEY = "lembagaKontak";

    // ---------- DATA DASAR / SEED ----------
    function seedOnce() {
        const existing = Storage.get(KEY, null);
        if (Array.isArray(existing) && existing.length) return;

        const data = [
            // RT
            {
                id: "rt-001",
                jenis: "rt",
                nama: "Ahmad Hidayat",
                jabatan: "Ketua RT 001 / RW 001",
                wilayah: "RT 001 / RW 001",
                kontak: "0812-3456-0001",
                keterangan: "Pelayanan surat pengantar & koordinasi lingkungan."
            },
            {
                id: "rt-002",
                jenis: "rt",
                nama: "Yusuf Maulana",
                jabatan: "Ketua RT 002 / RW 001",
                wilayah: "RT 002 / RW 001",
                kontak: "0812-3456-0003",
                keterangan: ""
            },

            // RW
            {
                id: "rw-001",
                jenis: "rw",
                nama: "Mulyono",
                jabatan: "Ketua RW 001",
                wilayah: "RW 001",
                kontak: "0812-8888-0001",
                keterangan: "Sekretariat: Jl. Duren Mekar I No.10"
            },
            {
                id: "rw-002",
                jenis: "rw",
                nama: "Sugeng Riyadi",
                jabatan: "Ketua RW 002",
                wilayah: "RW 002",
                kontak: "0812-8888-0003",
                keterangan: "Sekretariat: Jl. Duren Mekar II No.15"
            },

            // PKK
            {
                id: "pkk-001",
                jenis: "pkk",
                nama: "Ibu Hj. Siti Aminah",
                jabatan: "Ketua TP PKK Kelurahan",
                wilayah: "Kelurahan Duren Mekar",
                kontak: "0812-7000-0001",
                keterangan: "Koordinasi kegiatan PKK & Posyandu."
            },

            // Karang Taruna
            {
                id: "kt-001",
                jenis: "karang-taruna",
                nama: "Rizky Pratama",
                jabatan: "Ketua Karang Taruna",
                wilayah: "Kelurahan Duren Mekar",
                kontak: "0812-9000-0001",
                keterangan: "Koordinasi kegiatan kepemudaan & sosial."
            },

            // LPMK
            {
                id: "lpmk-001",
                jenis: "lpmk",
                nama: "H. Hasan Basri",
                jabatan: "Ketua LPMK",
                wilayah: "Kelurahan Duren Mekar",
                kontak: "0812-6000-0001",
                keterangan: "Perencanaan pembangunan kelurahan."
            }
        ];

        Storage.set(KEY, data);
    }

    function getAll() {
        seedOnce();
        return Storage.get(KEY, []);
    }

    function saveAll(items) {
        Storage.set(KEY, items);
    }

    // ---------- RENDER PUBLIC ----------
    function renderPublic(pageName) {
        const mapPageToJenis = {
            rt: "rt",
            rw: "rw",
            pkk: "pkk",
            "karang-taruna": "karang-taruna",
            lpmk: "lpmk"
        };

        const jenis = mapPageToJenis[pageName];
        if (!jenis) return;

        const data = getAll().filter((x) => x.jenis === jenis);

        const tbody = document.getElementById("lembagaTbody");
        const kontakUtama = document.getElementById("lembagaKontakUtama");

        if (tbody) {
            tbody.innerHTML =
                data
                    .map(
                        (item) => `
          <tr>
            <td>${item.nama || "-"}</td>
            <td>${item.jabatan || "-"}</td>
            <td>${item.wilayah || "-"}</td>
            <td>${item.kontak || "-"}</td>
          </tr>`
                    )
                    .join("") ||
                `<tr><td colspan="4" class="empty">Data belum tersedia.</td></tr>`;
        }

        if (kontakUtama) {
            const utama = data[0];
            if (!utama) {
                kontakUtama.innerHTML =
                    '<p class="muted">Data kontak belum tersedia.</p>';
            } else {
                kontakUtama.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h3 class="section-title-sm">Kontak Utama</h3>
              <p><b>${utama.nama}</b></p>
              <p class="muted">${utama.jabatan}</p>
              <p><i class="fa-solid fa-location-dot"></i> ${utama.wilayah}</p>
              <p><i class="fa-brands fa-whatsapp"></i> ${utama.kontak}</p>
              ${utama.keterangan
                        ? `<p class="muted" style="margin-top:8px;font-size:13px;">${utama.keterangan}</p>`
                        : ""
                    }
            </div>
          </div>`;
            }
        }
    }

    // ---------- ADMIN ----------
    let adminInited = false;

    function initAdmin() {
        if (adminInited) return;
        adminInited = true;

        if (!Guard.requireAdmin || !Guard.requireAdmin()) return;

        const jenisSelect = document.getElementById("jenisLembaga");
        const searchEl = document.getElementById("lembagaSearch");
        const tbody = document.getElementById("admLembagaTbody");
        const btnAdd = document.getElementById("btnAddLembaga");
        const modal = document.getElementById("lembagaModal");
        const form = document.getElementById("lembagaForm");

        if (!jenisSelect || !tbody || !btnAdd || !modal || !form) return;

        let currentJenis = jenisSelect.value || "rt";
        let editingId = null;

        function getFiltered() {
            const all = getAll().filter((x) => x.jenis === currentJenis);
            const q = (searchEl?.value || "").toLowerCase();
            if (!q) return all;
            return all.filter((item) =>
                `${item.nama} ${item.jabatan} ${item.wilayah} ${item.kontak}`
                    .toLowerCase()
                    .includes(q)
            );
        }

        function draw() {
            const items = getFiltered();
            tbody.innerHTML =
                items
                    .map(
                        (item) => `
        <tr>
          <td>${item.nama || "-"}</td>
          <td>${item.jabatan || "-"}</td>
          <td>${item.wilayah || "-"}</td>
          <td>${item.kontak || "-"}</td>
          <td>
            <button type="button" class="btn btn-ghost" data-action="edit" data-id="${item.id}">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
          </td>
        </tr>`
                    )
                    .join("") ||
                `<tr><td colspan="5" class="empty">Belum ada data untuk jenis lembaga ini.</td></tr>`;
        }

        function openModal(item) {
            editingId = item ? item.id : null;
            modal.classList.add("open");

            const set = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || "";
            };

            set("fLembagaId", item?.id || "");
            set("fLembagaJenis", item?.jenis || currentJenis);
            set("fLembagaNama", item?.nama || "");
            set("fLembagaJabatan", item?.jabatan || "");
            set("fLembagaWilayah", item?.wilayah || "");
            set("fLembagaKontak", item?.kontak || "");
            set("fLembagaKet", item?.keterangan || "");
        }

        function closeModal() {
            modal.classList.remove("open");
            editingId = null;
        }

        // events
        jenisSelect.addEventListener("change", () => {
            currentJenis = jenisSelect.value || "rt";
            draw();
        });

        if (searchEl) {
            searchEl.addEventListener("input", draw);
        }

        btnAdd.addEventListener("click", () => {
            openModal(null);
        });

        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action='edit']");
            if (!btn) return;
            const id = btn.dataset.id;
            const item = getAll().find((x) => x.id === id);
            if (item) openModal(item);
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const get = (id) =>
                document.getElementById(id)?.value?.trim() || "";

            const id =
                get("fLembagaId") ||
                `${get("fLembagaJenis")}-${Date.now().toString(36)}`;
            const jenis = get("fLembagaJenis") || currentJenis;

            const all = getAll();
            const idx = all.findIndex((x) => x.id === id);

            const payload = {
                id,
                jenis,
                nama: get("fLembagaNama"),
                jabatan: get("fLembagaJabatan"),
                wilayah: get("fLembagaWilayah"),
                kontak: get("fLembagaKontak"),
                keterangan: get("fLembagaKet")
            };

            if (idx >= 0) all[idx] = payload;
            else all.push(payload);

            saveAll(all);
            currentJenis = jenis;
            jenisSelect.value = jenis;
            draw();
            closeModal();
        });

        document.addEventListener("click", (e) => {
            if (e.target.closest("[data-action='closeLembagaModal']")) {
                closeModal();
            }
            if (e.target === modal) closeModal();
        });

        draw();
    }

    // ---------- HOOK KE ROUTER ----------
    window.addEventListener("page:loaded", (e) => {
        const name = e.detail?.name || "";

        if (
            name === "rt" ||
            name === "rw" ||
            name === "pkk" ||
            name === "karang-taruna" ||
            name === "lpmk"
        ) {
            renderPublic(name);
        }

        if (name === "admin/lembaga") {
            initAdmin();
        }
    });
})();
