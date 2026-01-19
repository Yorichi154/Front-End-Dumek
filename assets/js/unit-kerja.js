/* =========================================================
   unit-kerja.js
   - data & render halaman Unit Kerja (public + admin)
   - menggunakan KelurahanStore (localStorage)
========================================================= */

(function () {
    if (!window.KelurahanStore) return;

    const { Storage } = window.KelurahanStore;
    const Guard = window.KelurahanGuard || {};
    const KEY = "unitKerja";

    // ---------------------------
    // DATA: seed awal
    // ---------------------------
    function seedOnce() {
        const existing = Storage.get(KEY, null);
        if (Array.isArray(existing) && existing.length) return;

        const data = [
            {
                id: "lurah",
                slug: "lurah",
                unitName: "Kantor Lurah",
                name: "Drs. Ahmad Suryanto, M.Si",
                position: "Lurah Duren Mekar",
                nip: "197503121998031001",
                email: "lurah@kelurahan.go.id",
                phone: "081234567890",
                photo: "assets/images/staf/lurah.jpg",
                pendidikan: "S2 Administrasi Publik",
                riwayat: [
                    "Lurah Duren Mekar (2020 - Sekarang)",
                    "Sekretaris Kelurahan (2015 - 2020)",
                    "Kasi Tata Pemerintahan (2010 - 2015)"
                ],
                tugas: [
                    "Melaksanakan kegiatan pemerintahan kelurahan.",
                    "Memberdayakan masyarakat kelurahan.",
                    "Melaksanakan pelayanan administrasi kelurahan.",
                    "Memelihara ketenteraman dan ketertiban umum.",
                    "Memelihara prasarana dan fasilitas pelayanan umum.",
                    "Melaksanakan upaya perlindungan masyarakat.",
                    "Menyusun perencanaan pembangunan kelurahan.",
                    "Mengkoordinasikan pembangunan secara partisipatif."
                ],
                kewenangan: [
                    "Mengkoordinasikan kegiatan pemberdayaan masyarakat.",
                    "Mengkoordinasikan penyelenggaraan ketenteraman dan ketertiban umum.",
                    "Mengkoordinasikan penerapan dan penegakan Peraturan Daerah dan Peraturan Wali Kota.",
                    "Mengkoordinasikan pemeliharaan prasarana dan fasilitas pelayanan umum.",
                    "Melaksanakan pelayanan administrasi pemerintahan kepada masyarakat."
                ],
            },
            {
                id: "sekretariat",
                slug: "sekretariat",
                unitName: "Sekretariat Kelurahan",
                name: "Sri Wahyuni, S.Sos, M.AP",
                position: "Sekretaris Kelurahan",
                nip: "198205101999032002",
                email: "sekretaris@kelurahan.go.id",
                phone: "081234567891",
                photo: "assets/images/staf/sekretaris.jpg",
                pendidikan: "S2 Administrasi Publik",
                riwayat: [
                    "Sekretaris Kelurahan (2018 - Sekarang)",
                    "Kasi Pemberdayaan Masyarakat (2013 - 2018)"
                ],
                tugas: [
                    "Melaksanakan urusan ketatausahaan.",
                    "Melaksanakan urusan kepegawaian.",
                    "Melaksanakan urusan keuangan.",
                    "Melaksanakan urusan perlengkapan.",
                    "Melaksanakan urusan rumah tangga kelurahan.",
                    "Menyusun rencana dan laporan."
                ],
                kewenangan: [
                    "Mengelola surat menyurat dan kearsipan.",
                    "Mengelola kepegawaian kelurahan.",
                    "Mengelola keuangan kelurahan.",
                    "Mengelola aset dan inventaris kelurahan."
                ],
            },
            {
                id: "tata-pemerintahan",
                slug: "tata-pemerintahan",
                unitName: "Seksi Tata Pemerintahan",
                name: "Budi Santoso, S.STP",
                position: "Kepala Seksi Tata Pemerintahan",
                nip: "198402101999031004",
                email: "tapem@kelurahan.go.id",
                phone: "081234567892",
                photo: "assets/images/staf/tapem.jpg",
                pendidikan: "S1 Ilmu Pemerintahan",
                riwayat: [
                    "Kasi Tata Pemerintahan (2019 - Sekarang)",
                    "Staf Tata Pemerintahan (2013 - 2019)"
                ],
                tugas: [
                    "Menyelenggarakan administrasi kependudukan dan catatan sipil.",
                    "Mengolah data pertanahan dan penataan wilayah.",
                    "Membina administrasi pemerintahan di tingkat RT/RW.",
                    "Menyiapkan bahan laporan penyelenggaraan pemerintahan kelurahan.",
                    "Melaksanakan pelayanan surat keterangan administrasi kependudukan."
                ],
                kewenangan: [
                    "Menerbitkan surat keterangan domisili dan keterangan lainnya sesuai kewenangan.",
                    "Mengelola data kependudukan dan profil wilayah kelurahan.",
                    "Mengkoordinasikan penataan batas wilayah dan administrasi RT/RW.",
                    "Melakukan verifikasi administrasi kependudukan untuk keperluan layanan publik."
                ],
            },
            {
                id: "pemberdayaan",
                slug: "pemberdayaan",
                unitName: "Seksi Pemberdayaan Masyarakat, Pemuda dan Budaya",
                name: "Rina Lestari, S.Sos",
                position: "Kepala Seksi Pemberdayaan Masyarakat, Pemuda dan Budaya",
                nip: "198703151999032006",
                email: "pemberdayaan@kelurahan.go.id",
                phone: "081234567893",
                photo: "assets/images/staf/pemberdayaan.jpg",
                pendidikan: "S1 Sosiologi",
                riwayat: [
                    "Kasi Pemberdayaan Masyarakat (2019 - Sekarang)",
                    "Staf Pemberdayaan Masyarakat (2012 - 2019)"
                ],
                tugas: [
                    "Mendorong partisipasi masyarakat dalam pembangunan kelurahan.",
                    "Membina lembaga kemasyarakatan seperti LPM, PKK, Karang Taruna, dan kelompok masyarakat lainnya.",
                    "Memfasilitasi program pemberdayaan ekonomi masyarakat dan UMKM.",
                    "Menyusun program pembinaan kepemudaan dan olahraga.",
                    "Mengembangkan kegiatan pelestarian adat, seni, dan budaya lokal."
                ],
                kewenangan: [
                    "Menetapkan prioritas kegiatan pemberdayaan masyarakat pada tingkat kelurahan.",
                    "Memfasilitasi penyaluran bantuan sosial dan program pemerintah kepada kelompok masyarakat.",
                    "Mengkoordinasikan kegiatan kepemudaan dan Karang Taruna.",
                    "Menginisiasi dan mempromosikan kegiatan budaya dan kebersamaan warga."
                ],
            },
            {
                id: "ketertiban",
                slug: "ketertiban",
                unitName: "Seksi Ketentraman dan Ketertiban Umum",
                name: "Agus Pratama, S.IP",
                position: "Kepala Seksi Ketentraman dan Ketertiban Umum",
                nip: "198305201999031007",
                email: "trantib@kelurahan.go.id",
                phone: "081234567894",
                photo: "assets/images/staf/trantib.jpg",
                pendidikan: "S1 Ilmu Politik",
                riwayat: [
                    "Kasi Ketentraman dan Ketertiban Umum (2018 - Sekarang)",
                    "Staf Penegakan Perda Kecamatan (2012 - 2018)"
                ],
                tugas: [
                    "Menjaga ketentraman dan ketertiban umum di wilayah kelurahan.",
                    "Membina dan mengkoordinasikan kegiatan keamanan lingkungan (Siskamling).",
                    "Menindaklanjuti laporan/pengaduan masyarakat terkait gangguan ketertiban.",
                    "Melakukan sosialisasi peraturan daerah kepada masyarakat.",
                    "Berkoordinasi dengan aparat terkait dalam penanganan ketertiban umum."
                ],
                kewenangan: [
                    "Melakukan penertiban terhadap kegiatan masyarakat yang berpotensi mengganggu ketertiban umum sesuai kewenangan kelurahan.",
                    "Menyusun rekomendasi penanganan pelanggaran Peraturan Daerah kepada instansi terkait.",
                    "Mengkoordinasikan pelaksanaan ronda malam dan kegiatan keamanan lingkungan.",
                    "Memfasilitasi mediasi konflik sosial berskala kelurahan."
                ],
            },
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

    function findBySlug(slug) {
        return getAll().find((u) => u.slug === slug) || null;
    }

    // ---------------------------
    // RENDER PUBLIC
    // ---------------------------
    function renderPublic(pageName) {
        const map = {
            "unit-lurah": "lurah",
            "unit-sekretariat": "sekretariat",
            "unit-tata-pemerintahan": "tata-pemerintahan",
            "unit-pemberdayaan": "pemberdayaan",
            "unit-ketertiban": "ketertiban",
        };

        const slug = map[pageName];
        if (!slug) return;

        const unit = findBySlug(slug);
        if (!unit) return;

        const profilEl = document.getElementById("unitProfil");
        const tugasEl = document.getElementById("unitTugas");
        const kewenanganEl = document.getElementById("unitKewenangan");
        const headerTitle = document.querySelector(".page-title");
        const headerLead = document.querySelector(".page-lead");

        if (headerTitle && unit.unitName) headerTitle.textContent = unit.unitName;
        if (headerLead && slug === "sekretariat") {
            headerLead.textContent =
                "Sekretariat Kelurahan bertugas memberikan pelayanan administratif dan teknis kepada seluruh perangkat kelurahan.";
        }

        if (profilEl) {
            profilEl.innerHTML = `
        <div class="card unit-card">
          <div class="card-body">
            <div class="unit-leader">
              <div class="unit-leader-photo">
                <img src="${unit.photo || "assets/images/avatar-placeholder.png"}" alt="${unit.name || ""}">
              </div>
              <div class="unit-leader-main">
                <h3 class="unit-leader-name">${unit.name || "-"}</h3>
                <p class="unit-leader-position">${unit.position || ""}</p>

                <div class="unit-leader-meta">
                  <div class="meta-item">
                    <i class="fa-regular fa-id-card" aria-hidden="true"></i>
                    <span>NIP: ${unit.nip || "-"}</span>
                  </div>
                  <div class="meta-item">
                    <i class="fa-regular fa-envelope" aria-hidden="true"></i>
                    <span>${unit.email || "-"}</span>
                  </div>
                </div>

                <div class="unit-leader-meta">
                  <div class="meta-item">
                    <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
                    <span>${unit.pendidikan || ""}</span>
                  </div>
                  <div class="meta-item">
                    <i class="fa-solid fa-phone" aria-hidden="true"></i>
                    <span>${unit.phone || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="unit-history">
              <h4>Riwayat Jabatan:</h4>
              <ul class="bullets">
                ${(unit.riwayat || [])
                    .map(
                        (r) => `
                  <li>
                    <i class="fa-solid fa-check" aria-hidden="true"></i>
                    <span>${r}</span>
                  </li>`
                    )
                    .join("")}
              </ul>
            </div>
          </div>
        </div>`;
        }

        if (tugasEl) {
            tugasEl.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h3 class="section-title-sm">Tugas Pokok dan Fungsi</h3>
            <ul class="bullets">
              ${(unit.tugas || [])
                    .map(
                        (t) => `
                <li>
                  <i class="fa-solid fa-check" aria-hidden="true"></i>
                  <span>${t}</span>
                </li>`
                    )
                    .join("")}
            </ul>
          </div>
        </div>`;
        }

        if (kewenanganEl) {
            kewenanganEl.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h3 class="section-title-sm">Kewenangan</h3>
            <ul class="bullets">
              ${(unit.kewenangan || [])
                    .map(
                        (k) => `
                <li>
                  <i class="fa-solid fa-check" aria-hidden="true"></i>
                  <span>${k}</span>
                </li>`
                    )
                    .join("")}
            </ul>
          </div>
        </div>`;
        }
    }

    // ---------------------------
    // ADMIN: daftar + edit data
    // ---------------------------
    function initAdminPage() {
        if (!Guard.requireAdmin || !Guard.requireAdmin()) return;

        const searchEl = document.getElementById("unitSearch");
        const tbody = document.getElementById("unitTbody");
        const form = document.getElementById("unitForm");
        const modal = document.getElementById("unitModal");

        if (!tbody || !form || !modal) return;

        let editingId = null;

        function draw() {
            const q = (searchEl && searchEl.value ? searchEl.value : "").toLowerCase();
            let items = getAll();

            if (q) {
                items = items.filter((u) =>
                    `${u.name} ${u.unitName} ${u.position}`.toLowerCase().includes(q)
                );
            }

            tbody.innerHTML =
                items
                    .map(
                        (u) => `
          <tr>
            <td>
              <b>${u.name || "-"}</b>
              <div class="muted" style="font-size:12px">${u.position || "-"}</div>
            </td>
            <td>${u.unitName || "-"}</td>
            <td>${u.nip || "-"}</td>
            <td>
              <div>${u.email || "-"}</div>
              <div class="muted" style="font-size:12px">${u.phone || ""}</div>
            </td>
            <td>
              <button class="btn btn-ghost" type="button" data-action="edit-unit" data-id="${u.id}">
                <i class="fa-solid fa-pen"></i> Edit
              </button>
            </td>
          </tr>`
                    )
                    .join("") || `<tr><td colspan="5" class="empty">Belum ada data unit kerja.</td></tr>`;
        }

        function openModal(id) {
            const items = getAll();
            const unit = items.find((u) => u.id === id) || null;
            editingId = unit ? unit.id : null;

            modal.classList.add("open");

            const setVal = (fieldId, value) => {
                const el = document.getElementById(fieldId);
                if (el) el.value = value || "";
            };

            setVal("fId", unit ? unit.id : "");
            setVal("fSlug", unit ? unit.slug : "");
            setVal("fUnitName", unit ? unit.unitName : "");
            setVal("fName", unit ? unit.name : "");
            setVal("fPosition", unit ? unit.position : "");
            setVal("fNip", unit ? unit.nip : "");
            setVal("fEmail", unit ? unit.email : "");
            setVal("fPhone", unit ? unit.phone : "");
            setVal("fPhoto", unit ? unit.photo : "");
            setVal("fPendidikan", unit ? unit.pendidikan : "");
        }

        function closeModal() {
            modal.classList.remove("open");
            editingId = null;
        }

        if (searchEl) {
            searchEl.addEventListener("input", draw);
        }

        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action='edit-unit']");
            if (!btn) return;
            const id = btn.dataset.id;
            openModal(id);
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const getVal = (id) => {
                const el = document.getElementById(id);
                return el && el.value ? el.value.trim() : "";
            };

            const slug = getVal("fSlug") || getVal("fId") || "unit-" + Date.now();
            const id = getVal("fId") || slug;

            const items = getAll();
            const idx = items.findIndex((u) => u.id === id);
            const base = idx >= 0 ? items[idx] : {};

            const updated = {
                ...base,
                id,
                slug,
                unitName: getVal("fUnitName"),
                name: getVal("fName"),
                position: getVal("fPosition"),
                nip: getVal("fNip"),
                email: getVal("fEmail"),
                phone: getVal("fPhone"),
                photo: getVal("fPhoto"),
                pendidikan: getVal("fPendidikan"),
            };

            if (idx >= 0) {
                items[idx] = updated;
            } else {
                items.push(updated);
            }

            saveAll(items);
            draw();
            closeModal();
        });

        document.addEventListener("click", (e) => {
            if (e.target.closest("[data-action='closeUnitModal']")) {
                closeModal();
            }
            if (e.target === modal) {
                closeModal();
            }
        });

        draw();
    }

    // ---------------------------
    // EVENT HOOK
    // ---------------------------
    window.addEventListener("page:loaded", (e) => {
        const name = e.detail && e.detail.name ? e.detail.name : "";

        if (name === "admin/unit-kerja") {
            initAdminPage();
            return;
        }

        if (name === "unit-lurah" ||
            name === "unit-sekretariat" ||
            name === "unit-tata-pemerintahan" ||
            name === "unit-pemberdayaan" ||
            name === "unit-ketertiban") {
            renderPublic(name);
        }
    });
})();
