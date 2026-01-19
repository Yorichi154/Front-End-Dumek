/* =========================================================
   pelayanan.js
   - Data & render halaman Pelayanan Surat
   - Bisa diedit melalui Admin (admin/pelayanan)
========================================================= */

(function () {
    if (!window.KelurahanStore) return;

    const { Storage } = window.KelurahanStore;
    const Guard = window.KelurahanGuard || {};
    const KEY = "pelayananSurat";
    const SELECTED_KEY = "pelayananSelected";


    // ---------- DATA DASAR ----------
    function seedOnce() {
        const normalizeService = (s) => {
            const out = { ...s };
            // tambahan properti untuk kebutuhan pengajuan online & admin
            if (!out.estimasi) {
                out.estimasi = out.tipe === "online" ? "1 hari kerja" : "1-3 hari kerja";
            }
            if (!out.biaya) out.biaya = "Gratis";
            if (!Array.isArray(out.formFields)) out.formFields = [];
            return out;
        };

        const existing = Storage.get(KEY, null);
        if (Array.isArray(existing) && existing.length) {
            // migrasi ringan untuk data lama
            Storage.set(KEY, existing.map(normalizeService));
            return;
        }

        const langkahOnline = [
            {
                judul: "Isi Form Online",
                deskripsi: "Login ke sistem dan isi formulir permohonan dengan data lengkap."
            },
            {
                judul: "Unggah Dokumen",
                deskripsi: "Upload scan/foto dokumen persyaratan yang diminta."
            },
            {
                judul: "Verifikasi Petugas",
                deskripsi: "Petugas akan memverifikasi data dan dokumen Anda."
            },
            {
                judul: "Ambil Surat",
                deskripsi: "Setelah disetujui, datang ke kelurahan untuk mengambil surat fisik."
            }
        ];

        const langkahOfflineUmum = [
            {
                judul: "Datang ke Kantor Kelurahan",
                deskripsi: "Bawa semua dokumen persyaratan yang diminta."
            },
            {
                judul: "Pemeriksaan Dokumen",
                deskripsi: "Petugas memeriksa kelengkapan dan keaslian dokumen."
            },
            {
                judul: "Proses Pembuatan Surat",
                deskripsi: "Petugas menyusun dan mencetak surat keterangan."
            },
            {
                judul: "Tanda Tangan & Pengambilan",
                deskripsi: "Pemohon menandatangani jika perlu dan mengambil surat."
            }
        ];

        const jamPelayananDefault = "Senin - Jumat: 08.00 - 15.00 WIB\nSabtu - Minggu: Libur";
        const lokasiDefault = "Kantor Kelurahan Duren Mekar\nJl. Duren Mekar No. 59, Bojongsari, Kota Depok\nTelp: (021) 12345678";
        const catatanDefault = [
            "Pastikan semua dokumen dalam kondisi baik dan terbaca.",
            "Bawa dokumen asli untuk ditunjukkan saat pengambilan.",
            "Untuk percepatan proses, lengkapi semua persyaratan."
        ];

        const data = [
            // ==================== BISA ONLINE ====================

            {
                id: "domisili",
                page: "pelayanan-domisili",
                nama: "Surat Keterangan Domisili",
                tipe: "online",
                tombol: "Ajukan Surat Keterangan Domisili Online",
                syarat: [
                    "Fotokopi KTP/KK pemohon.",
                    "Surat pengantar dari RT/RW.",
                    "Bukti tinggal (foto rumah atau kontrak sewa)."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "kelahiran",
                page: "pelayanan-kelahiran",
                nama: "Surat Keterangan Kelahiran",
                tipe: "online",
                tombol: "Ajukan Surat Keterangan Kelahiran Online",
                syarat: [
                    "Akta/Surat keterangan lahir dari rumah sakit atau bidan.",
                    "KTP dan KK orang tua.",
                    "Surat pengantar dari RT."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "kematian",
                page: "pelayanan-kematian",
                nama: "Surat Keterangan Kematian",
                tipe: "online",
                tombol: "Ajukan Surat Keterangan Kematian Online",
                syarat: [
                    "Surat keterangan kematian dari dokter/rumah sakit.",
                    "KTP dan KK ahli waris atau keluarga.",
                    "Surat pengantar dari RT."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "nikah-talak-cerai",
                page: "pelayanan-nikah-talak-cerai",
                nama: "Surat Pengantar Nikah/Talak/Cerai",
                tipe: "online",
                tombol: "Ajukan Surat Pengantar Nikah/Talak/Cerai Online",
                syarat: [
                    "KTP dan KK kedua belah pihak.",
                    "Akta cerai (jika relevan).",
                    "Surat pengantar dari RT."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "sku",
                page: "pelayanan-sku",
                nama: "Surat Keterangan Usaha (SKU)",
                tipe: "online",
                tombol: "Ajukan Surat Keterangan Usaha (SKU) Online",
                syarat: [
                    "KTP dan KK pemilik usaha.",
                    "Surat pengantar dari RT/RW.",
                    "Foto lokasi usaha."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "sktm",
                page: "pelayanan-sktm",
                nama: "Surat Keterangan Tidak Mampu (SKTM)",
                tipe: "online",
                tombol: "Ajukan Surat Keterangan Tidak Mampu (SKTM) Online",
                syarat: [
                    "KTP dan KK pemohon.",
                    "Surat pengantar dari RT.",
                    "Bukti kondisi ekonomi rendah (misal: keterangan sekolah/puskesmas)."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "skck",
                page: "pelayanan-skck",
                nama: "Surat Pengantar SKCK",
                tipe: "online",
                tombol: "Ajukan Surat Pengantar SKCK Online",
                syarat: [
                    "KTP dan KK pemohon.",
                    "Surat pengantar dari RT.",
                    "Pas foto ukuran 3x4."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "bansos",
                page: "pelayanan-bansos",
                nama: "Surat Permohonan Bantuan Sosial",
                tipe: "online",
                tombol: "Ajukan Permohonan Bantuan Sosial Online",
                syarat: [
                    "KTP dan KK pemohon.",
                    "Surat pengantar dari RT/RW.",
                    "Bukti kebutuhan (misalnya surat keterangan dari sekolah/puskesmas/instansi terkait)."
                ],
                langkah: langkahOnline,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            // ==================== HARUS DATANG LANGSUNG ====================

            {
                id: "skb",
                page: "pelayanan-skb",
                nama: "Surat Keterangan Berkelakuan Baik (SKB)",
                tipe: "offline",
                tombol: "Info Lokasi Kantor",
                syarat: [
                    "Surat pengantar dari RT/RW.",
                    "KTP dan KK pemohon.",
                    "Keterangan dari tetangga (3 orang disertai fotokopi KTP).",
                    "Cap jempol pemohon di hadapan petugas."
                ],
                langkah: langkahOfflineUmum,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "kehilangan",
                page: "pelayanan-kehilangan",
                nama: "Surat Keterangan Kehilangan",
                tipe: "offline",
                tombol: "Info Lokasi Kantor",
                syarat: [
                    "Surat keterangan kehilangan dari kepolisian (asli).",
                    "KTP dan KK pemohon.",
                    "Saksi 2 orang disertai fotokopi KTP.",
                    "Cap jempol pemohon di hadapan petugas."
                ],
                langkah: langkahOfflineUmum,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "ahli-waris",
                page: "pelayanan-ahli-waris",
                nama: "Surat Keterangan Ahli Waris",
                tipe: "offline",
                tombol: "Info Lokasi Kantor",
                syarat: [
                    "KTP semua ahli waris.",
                    "Akta kematian pewaris.",
                    "Surat pengantar dari RT.",
                    "Dilakukan musyawarah keluarga di hadapan petugas kelurahan."
                ],
                langkah: [
                    {
                        judul: "Rapat Keluarga",
                        deskripsi: "Semua ahli waris datang ke kelurahan untuk rapat."
                    },
                    {
                        judul: "Musyawarah",
                        deskripsi: "Musyawarah pembagian warisan di hadapan petugas."
                    },
                    {
                        judul: "Hasil Tertulis",
                        deskripsi: "Petugas membuat berita acara hasil musyawarah."
                    },
                    {
                        judul: "Ambil Surat",
                        deskripsi: "Semua ahli waris menandatangani dan mengambil surat."
                    }
                ],
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: [
                    "Seluruh ahli waris wajib hadir atau diwakilkan dengan surat kuasa.",
                    "Bawa semua dokumen asli dan fotokopi.",
                    "Gunakan pakaian yang rapi dan sopan."
                ]
            },

            {
                id: "domisili-yayasan",
                page: "pelayanan-domisili-yayasan",
                nama: "Surat Domisili Yayasan",
                tipe: "offline",
                tombol: "Info Lokasi Kantor",
                syarat: [
                    "Akta notaris pendirian yayasan.",
                    "KTP pengurus yayasan.",
                    "Foto lokasi kantor yayasan.",
                    "Bersedia dilakukan inspeksi lapangan oleh petugas."
                ],
                langkah: langkahOfflineUmum,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "janda-duda",
                page: "pelayanan-janda-duda",
                nama: "Surat Keterangan Janda/Duda",
                tipe: "offline",
                tombol: "Info Lokasi Kantor",
                syarat: [
                    "KTP dan KK pemohon.",
                    "Akta cerai atau akta kematian pasangan.",
                    "Surat pengantar dari RT.",
                    "Saksi keluarga sesuai kebutuhan."
                ],
                langkah: langkahOfflineUmum,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: catatanDefault
            },

            {
                id: "izin-keramaian",
                page: "pelayanan-izin-keramaian",
                nama: "Izin Keramaian / Mengumpul Orang Banyak",
                tipe: "offline",
                tombol: "Info Lokasi Kantor",
                syarat: [
                    "Surat permohonan resmi.",
                    "KTP penanggung jawab acara.",
                    "Perkiraan jumlah dan daftar peserta.",
                    "Koordinasi dengan Polsek setempat."
                ],
                langkah: langkahOfflineUmum,
                jamPelayanan: jamPelayananDefault,
                lokasi: lokasiDefault,
                catatan: [
                    "Ajukan permohonan minimal beberapa hari sebelum acara.",
                    "Cantumkan waktu dan lokasi kegiatan dengan jelas.",
                    "Ikuti arahan keamanan dari pihak kepolisian."
                ]
            }
        ];

        Storage.set(KEY, data.map(normalizeService));
    }

    function getAll() {
        seedOnce();
        return Storage.get(KEY, []);
    }

    function saveAll(items) {
        Storage.set(KEY, items);
    }

    function findByPage(pageName) {
        return getAll().find((x) => x.page === pageName) || null;
    }

    // ---------- RENDER HALAMAN PUBLIK ----------
    function renderPublic(pageName) {
        const layanan = findByPage(pageName);
        if (!layanan) return;

        const el = (id) => document.getElementById(id);

        // judul
        const titleEl = document.querySelector("#srvTitle");
        if (titleEl) titleEl.textContent = layanan.nama || "-";

        // badge status
        const badge = el("srvStatusBadge");
        if (badge) {
            if (layanan.tipe === "online") {
                badge.textContent = "Bisa Online";
                badge.className = "badge badge-success";
            } else {
                badge.textContent = "Harus Datang Langsung";
                badge.className = "badge badge-warning";
            }
        }

        const action = el("srvActionButtons");
        const bottomCta = el("srvBottomCta");
        const bottomBtn = el("srvBottomButton");
        const bottomText = el("srvBottomButtonText");
        const offlineNotice = el("srvOfflineNotice");
        function updateServiceCTA(service) {
            // reset dulu
            action.innerHTML = "";
            offlineNotice.style.display = "none";
            bottomCta.style.display = "none";
            bottomBtn.classList.remove("btn-service-online", "btn-service-offline");

            // deteksi mode layanan
            const isOnline =
                service.mode === "online" || service.online === true; // sesuaikan dengan data-mu

            // ====== JIKA BISA ONLINE ======
            if (isOnline) {
                // badge status (Bisa Online)
                const badge = el("srvStatusBadge");
                if (badge) {
                    badge.textContent = "Bisa Online";
                    badge.className = "badge badge-online"; // opsional: kamu bisa style .badge-online di CSS
                }

                // tombol di HEADER
                const btnHeader = document.createElement("button");
                btnHeader.type = "button";
                btnHeader.className = "btn btn-solid btn-service-online";
                btnHeader.innerHTML = `
      <i class="fa-regular fa-file-lines"></i>
      Ajukan ${service.shortTitle || "Surat"} Online
    `;
                btnHeader.addEventListener("click", () => {
                    // pakai router SPA kamu
                    if (window.navigateTo) {
                        navigateTo("pengajuan-online");
                    } else {
                        location.hash = "#pengajuan-online";
                    }
                });
                action.appendChild(btnHeader);

                // CTA di BAGIAN BAWAH
                bottomCta.style.display = "block";
                bottomBtn.classList.add("btn-service-online");
                bottomText.textContent = `Ajukan ${service.shortTitle || "Surat"} Online`;
                bottomBtn.onclick = () => {
                    if (window.navigateTo) {
                        navigateTo("pengajuan-online");
                    } else {
                        location.hash = "#pengajuan-online";
                    }
                };
            }

            // ====== JIKA HARUS DATANG LANGSUNG ======
            else {
                // badge status (Harus Datang Langsung)
                const badge = el("srvStatusBadge");
                if (badge) {
                    badge.textContent = "Harus Datang Langsung";
                    badge.className = "badge badge-offline"; // opsional: style .badge-offline sendiri
                }

                // tampilkan notice offline
                offlineNotice.style.display = "block";

                // tombol di HEADER → Info Lokasi Kantor (hijau)
                const btnHeader = document.createElement("button");
                btnHeader.type = "button";
                btnHeader.className = "btn btn-solid btn-service-offline";
                btnHeader.innerHTML = `
      <i class="fa-solid fa-location-dot"></i>
      Info Lokasi Kantor
    `;
                btnHeader.addEventListener("click", () => {
                    if (window.navigateTo) {
                        navigateTo("kontak");      // arahkan ke pages kontak/alamat
                    } else {
                        location.hash = "#kontak";
                    }
                });
                action.appendChild(btnHeader);

                // CTA bawah juga mengarah ke kontak (kalau mau pakai, kalau tidak bisa di-hide)
                bottomCta.style.display = "block";
                bottomBtn.classList.add("btn-service-offline");
                bottomText.textContent = "Lihat Lokasi & Jam Pelayanan";
                bottomBtn.onclick = () => {
                    if (window.navigateTo) {
                        navigateTo("kontak");
                    } else {
                        location.hash = "#kontak";
                    }
                };
            }
        }

        // helper untuk pindah ke wizard
        // helper untuk pindah ke wizard
        // helper untuk pindah ke wizard pengajuan online
        const goWizard = () => {
            const role = (window.getRole && window.getRole()) || null;

            // ✅ kalau belum login sebagai warga, arahkan ke halaman login
            if (role !== "warga") {
                alert("Silakan login sebagai warga untuk mengajukan surat online.");
                if (window.navigateTo) {
                    window.navigateTo("login");
                } else {
                    window.location.hash = "#login";
                }
                return;
            }

            // sudah warga → boleh lanjut ke wizard
            Storage.set(SELECTED_KEY, layanan.id);
            if (window.navigateTo) {
                window.navigateTo("pengajuan-online");
            } else {
                window.location.hash = "#pengajuan-online";
            }
        };

        // ==============================
        // CTA ATAS & BAWAH (ONLINE / OFFLINE)
        // ==============================
        if (action) action.innerHTML = "";
        if (offlineNotice) offlineNotice.style.display = "none";
        if (bottomCta) bottomCta.style.display = "none";
        if (bottomBtn) bottomBtn.classList.remove("btn-service-online", "btn-service-offline");

        // ---------- LAYANAN ONLINE ----------
        if (layanan.tipe === "online") {
            // tombol di bawah judul
            if (action) {
                const btnTop = document.createElement("button");
                btnTop.type = "button";
                btnTop.id = "srvApplyTop";
                btnTop.className = "btn btn-solid btn-service-online";
                btnTop.innerHTML = `
          <i class="fa-regular fa-file-lines"></i>
          ${layanan.tombol || "Ajukan Surat Online"}
        `;
                btnTop.addEventListener("click", goWizard);
                action.appendChild(btnTop);
            }

            // CTA bawah
            if (bottomCta && bottomBtn && bottomText) {
                bottomCta.style.display = "block";
                bottomBtn.id = "srvApplyBottom";
                bottomBtn.classList.add("btn-service-online");
                bottomText.textContent = layanan.tombol || "Ajukan Surat Online";
                bottomBtn.onclick = goWizard;
            }

            if (offlineNotice) offlineNotice.style.display = "none";
        }

        // ---------- LAYANAN OFFLINE ----------
        else {
            // tombol di bawah judul → ke halaman kontak
            if (action) {
                const btnTop = document.createElement("button");
                btnTop.type = "button";
                btnTop.className = "btn btn-solid btn-service-offline";
                btnTop.innerHTML = `
          <i class="fa-solid fa-location-dot"></i>
          Info Lokasi Kantor
        `;
                btnTop.addEventListener("click", () => {
                    if (window.navigateTo) {
                        window.navigateTo("kontak");
                    } else {
                        window.location.hash = "#kontak";
                    }
                });
                action.appendChild(btnTop);
            }

            // CTA bawah → juga ke kontak (lokasi & jam pelayanan)
            if (bottomCta && bottomBtn && bottomText) {
                bottomCta.style.display = "block";
                bottomBtn.classList.add("btn-service-offline");
                bottomText.textContent = "Lihat Lokasi & Jam Pelayanan";
                bottomBtn.onclick = () => {
                    if (window.navigateTo) {
                        window.navigateTo("kontak");
                    } else {
                        window.location.hash = "#kontak";
                    }
                };
            }

            if (offlineNotice) offlineNotice.style.display = "block";
        }

        // pasang event listener ke tombol online
        const topBtn = document.getElementById("srvApplyTop");
        const bottomApply = document.getElementById("srvApplyBottom");
        [topBtn, bottomApply].forEach((b) => {
            if (b) b.addEventListener("click", goWizard);
        });

        // ---- sisanya sama seperti sebelumnya: syarat, langkah, info penting ----

        // persyaratan
        const syaratEl = el("srvSyaratList");
        if (syaratEl) {
            syaratEl.innerHTML =
                (layanan.syarat || [])
                    .map((s) => `<li>${s}</li>`)
                    .join("") || "<li>-</li>";
        }

        // langkah
        const stepsTitle = el("srvStepsTitle");
        if (stepsTitle) {
            stepsTitle.textContent =
                layanan.tipe === "online" ? "Proses Online" : "Proses Pengajuan";
        }

        const stepsEl = el("srvSteps");
        if (stepsEl) {
            stepsEl.innerHTML =
                (layanan.langkah || [])
                    .map(
                        (step, idx) => `
          <div class="timeline-item">
            <div class="timeline-badge">${idx + 1}</div>
            <div class="timeline-content">
              <h4>${step.judul || "-"}</h4>
              <p>${step.deskripsi || ""}</p>
            </div>
          </div>`
                    )
                    .join("") || "<p>-</p>";
        }

        // info penting
        const jamEl = el("srvJamPelayanan");
        if (jamEl) {
            jamEl.textContent = (layanan.jamPelayanan || "").replace(/\n/g, " | ");
        }

        const lokasiEl = el("srvLokasi");
        if (lokasiEl) {
            lokasiEl.innerHTML = (layanan.lokasi || "").replace(/\n/g, "<br>");
        }

        const catatanEl = el("srvCatatanList");
        if (catatanEl) {
            catatanEl.innerHTML =
                (layanan.catatan || [])
                    .map(
                        (c) => `
          <li>
            <i class="fa-solid fa-check" aria-hidden="true"></i>
            <span>${c}</span>
          </li>`
                    )
                    .join("") || "<li>-</li>";
        }
    }



    // ---------- ADMIN ----------
    function parseLines(str) {
        return (str || "")
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
    }

    function parseSteps(str) {
        // Format per baris: Judul - Deskripsi
        return parseLines(str).map((line) => {
            const [judul, ...rest] = line.split(" - ");
            return {
                judul: judul.trim(),
                deskripsi: rest.join(" - ").trim()
            };
        });
    }

    function stepsToText(steps) {
        return (steps || [])
            .map((s) =>
                s.deskripsi ? `${s.judul} - ${s.deskripsi}` : s.judul
            )
            .join("\n");
    }

    let adminInited = false;
    function initAdmin() {
        if (adminInited) return;
        adminInited = true;

        if (!Guard.requireAdmin || !Guard.requireAdmin()) return;

        const $ = (id) => document.getElementById(id);

        const tbody = $("srvAdmTbody");
        const btnAdd = $("btnAddSrv");
        const btnRefresh = $("srvRefreshBtn");
        const searchEl = $("srvSearch");
        const modal = $("srvModal");
        const form = $("srvForm");

        const titleEl = $("srvModalTitle");
        const syaratListEl = $("fSrvSyaratList");
        const stepListEl = $("fSrvStepList");
        const formListEl = $("fSrvFormList");
        const btnAddSyarat = $("btnAddSyarat");
        const btnAddStep = $("btnAddStep");
        const btnAddField = $("btnAddField");

        if (!tbody || !btnAdd || !modal || !form) return;

        let draftSyarat = [];
        let draftSteps = [];
        let draftFields = [];

        const escapeHtml = (str) =>
            String(str || "").replace(/[&<>"]/g, (ch) =>
                ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])
            );

        const slugify = (str) =>
            String(str || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

        function getFiltered() {
            const q = (searchEl?.value || "").toLowerCase().trim();
            const items = getAll();
            if (!q) return items;
            return items.filter((x) =>
                `${x.nama} ${x.id} ${x.page}`.toLowerCase().includes(q)
            );
        }

        function draw() {
            const items = getFiltered();
            tbody.innerHTML =
                items
                    .map(
                        (x) => `
        <tr>
          <td>${escapeHtml(x.nama || "-")}</td>
          <td>${escapeHtml(x.page || "-")}</td>
          <td>${x.tipe === "online" ? "Online" : "Datang Langsung"}</td>
          <td class="text-right">
            <button type="button" class="btn btn-ghost" data-action="edit" data-id="${escapeHtml(x.id)}">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
          </td>
        </tr>`
                    )
                    .join("") ||
                `<tr><td colspan="4" class="empty">Belum ada data layanan.</td></tr>`;
        }

        function renderSyarat() {
            if (!syaratListEl) return;
            const list = draftSyarat.length ? draftSyarat : [""];
            syaratListEl.innerHTML = list
                .map(
                    (val, idx) => `
          <div class="item" data-row="syarat" data-idx="${idx}">
            <span class="badge">${idx + 1}</span>
            <input class="input" data-input="syarat" value="${escapeHtml(val)}" placeholder="Tulis persyaratan..." />
            <button class="icon-btn" type="button" data-action="delSyarat" data-idx="${idx}" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`
                )
                .join("");
        }

        function renderSteps() {
            if (!stepListEl) return;
            const list = draftSteps.length ? draftSteps : [{ judul: "", deskripsi: "" }];
            stepListEl.innerHTML = list
                .map(
                    (st, idx) => `
          <div class="item" data-row="step" data-idx="${idx}" style="align-items:flex-start">
            <span class="badge" style="margin-top:8px">${idx + 1}</span>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px">
              <input class="input" data-input="step-title" value="${escapeHtml(st.judul)}" placeholder="Judul step" />
              <textarea class="input" data-input="step-desc" rows="2" placeholder="Deskripsi">${escapeHtml(st.deskripsi)}</textarea>
            </div>
            <button class="icon-btn" type="button" data-action="delStep" data-idx="${idx}" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`
                )
                .join("");
        }

        function renderFields() {
            if (!formListEl) return;
            const list = draftFields.length ? draftFields : [];
            if (!list.length) {
                formListEl.innerHTML = `<div class="help-box">Belum ada field tambahan.</div>`;
                return;
            }
            const typeOptions = [
                ["text", "Teks"],
                ["textarea", "Paragraf"],
                ["number", "Angka"],
                ["date", "Tanggal"],
                ["select", "Pilihan"],
            ];
            formListEl.innerHTML = list
                .map((f, idx) => {
                    const opt = typeOptions
                        .map(
                            ([val, label]) =>
                                `<option value="${val}" ${f.type === val ? "selected" : ""}>${label}</option>`
                        )
                        .join("");
                    const optionsStr = Array.isArray(f.options) ? f.options.join(", ") : (f.options || "");
                    return `
          <div class="item" data-row="field" data-idx="${idx}" style="align-items:flex-start">
            <span class="badge" style="margin-top:8px">${idx + 1}</span>
            <div style="flex:1;display:grid;grid-template-columns:1fr 160px;gap:10px">
              <div style="display:flex;flex-direction:column;gap:8px">
                <input class="input" data-input="field-label" value="${escapeHtml(f.label || "")}" placeholder="Label field (contoh: Nama Usaha)" />
                <input class="input" data-input="field-options" value="${escapeHtml(optionsStr)}" placeholder="Opsi (khusus tipe Pilihan), pisahkan dengan koma" />
              </div>
              <div style="display:flex;flex-direction:column;gap:10px">
                <select class="input" data-input="field-type">${opt}</select>
                <label style="display:flex;align-items:center;gap:10px;height:44px;font-weight:900">
                  <input type="checkbox" data-input="field-required" ${f.required ? "checked" : ""} />
                  Wajib
                </label>
              </div>
            </div>
            <button class="icon-btn" type="button" data-action="delField" data-idx="${idx}" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`;
                })
                .join("");

            // set selected type after render
            formListEl.querySelectorAll("[data-row='field']").forEach((row) => {
                const idx = Number(row.dataset.idx);
                const sel = row.querySelector("[data-input='field-type']");
                if (sel && draftFields[idx]) sel.value = draftFields[idx].type || "text";
            });
        }

        function openModal(item) {
            if (titleEl) titleEl.textContent = item ? "Edit Layanan" : "Tambah Layanan";
            modal.classList.add("open");

            const setVal = (id, val) => {
                const el = $(id);
                if (el) el.value = val ?? "";
            };
            const setChecked = (id, val) => {
                const el = $(id);
                if (el) el.checked = !!val;
            };

            setVal("fSrvId", item?.id || "");
            setVal("fSrvNama", item?.nama || "");
            setVal("fSrvPage", item?.page || "");
            setVal("fSrvEstimasi", item?.estimasi || "");
            setVal("fSrvBiaya", item?.biaya || "");
            setChecked("fSrvOnline", (item?.tipe || "online") === "online");
            setVal("fSrvTombol", item?.tombol || "");
            setVal("fSrvJam", item?.jamPelayanan || "");
            setVal("fSrvLokasi", item?.lokasi || "");
            setVal("fSrvCatatan", (item?.catatan || []).join("\n"));

            draftSyarat = [...(item?.syarat || [])];
            draftSteps = [...(item?.langkah || [])];
            draftFields = [...(item?.formFields || [])];

            renderSyarat();
            renderSteps();
            renderFields();

            // auto-generate slug when create
            const namaEl = $("fSrvNama");
            const pageEl = $("fSrvPage");
            if (!item && namaEl && pageEl) {
                namaEl.oninput = () => {
                    if (!pageEl.value.trim()) pageEl.value = `pelayanan-${slugify(namaEl.value)}`;
                };
            }
        }

        function closeModal() {
            modal.classList.remove("open");
            draftSyarat = [];
            draftSteps = [];
            draftFields = [];
        }

        btnAdd.addEventListener("click", () => openModal(null));
        btnRefresh?.addEventListener("click", draw);
        searchEl?.addEventListener("input", draw);

        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-action='edit']");
            if (!btn) return;
            const id = btn.dataset.id;
            const item = getAll().find((x) => x.id === id);
            openModal(item || null);
        });

        btnAddSyarat?.addEventListener("click", () => {
            draftSyarat.push("");
            renderSyarat();
        });
        btnAddStep?.addEventListener("click", () => {
            draftSteps.push({ judul: "", deskripsi: "" });
            renderSteps();
        });
        btnAddField?.addEventListener("click", () => {
            draftFields.push({ key: "", label: "", type: "text", required: false, options: [] });
            renderFields();
        });

        // event delegation untuk editor list
        modal.addEventListener("click", (e) => {
            const delS = e.target.closest("[data-action='delSyarat']");
            if (delS) {
                const idx = Number(delS.dataset.idx);
                draftSyarat.splice(idx, 1);
                renderSyarat();
                return;
            }
            const delStep = e.target.closest("[data-action='delStep']");
            if (delStep) {
                const idx = Number(delStep.dataset.idx);
                draftSteps.splice(idx, 1);
                renderSteps();
                return;
            }
            const delField = e.target.closest("[data-action='delField']");
            if (delField) {
                const idx = Number(delField.dataset.idx);
                draftFields.splice(idx, 1);
                renderFields();
                return;
            }
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const getVal = (id) => $(id)?.value?.trim() || "";
            const id = getVal("fSrvId") || getVal("fSrvPage") || "srv-" + Date.now();
            const page = getVal("fSrvPage") || `pelayanan-${id}`;
            const tipe = $("fSrvOnline")?.checked ? "online" : "offline";

            // sync draft from DOM before save
            if (syaratListEl) {
                draftSyarat = Array.from(syaratListEl.querySelectorAll("[data-input='syarat']"))
                    .map((el) => el.value.trim())
                    .filter(Boolean);
            }
            if (stepListEl) {
                draftSteps = Array.from(stepListEl.querySelectorAll("[data-row='step']"))
                    .map((row) => {
                        const judul = row.querySelector("[data-input='step-title']")?.value?.trim() || "";
                        const deskripsi = row.querySelector("[data-input='step-desc']")?.value?.trim() || "";
                        return { judul, deskripsi };
                    })
                    .filter((st) => st.judul || st.deskripsi);
            }
            if (formListEl && draftFields.length) {
                draftFields = Array.from(formListEl.querySelectorAll("[data-row='field']"))
                    .map((row) => {
                        const label = row.querySelector("[data-input='field-label']")?.value?.trim() || "";
                        const type = row.querySelector("[data-input='field-type']")?.value || "text";
                        const required = !!row.querySelector("[data-input='field-required']")?.checked;
                        const optText = row.querySelector("[data-input='field-options']")?.value || "";
                        const options = optText
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean);
                        const key = slugify(label) || "field-" + Math.random().toString(16).slice(2);
                        return { key, label, type, required, options };
                    })
                    .filter((f) => f.label);
            }

            const all = getAll();
            const idx = all.findIndex((x) => x.id === id);

            const updated = {
                id,
                page,
                nama: getVal("fSrvNama"),
                tipe,
                estimasi: getVal("fSrvEstimasi") || (tipe === "online" ? "1 hari kerja" : "1-3 hari kerja"),
                biaya: getVal("fSrvBiaya") || "Gratis",
                tombol: getVal("fSrvTombol"),
                syarat: draftSyarat,
                langkah: draftSteps,
                formFields: draftFields,
                jamPelayanan: getVal("fSrvJam"),
                lokasi: getVal("fSrvLokasi"),
                catatan: parseLines(getVal("fSrvCatatan")),
            };

            if (idx >= 0) all[idx] = updated;
            else all.push(updated);

            saveAll(all);
            draw();
            closeModal();
        });

        document.addEventListener("click", (e) => {
            if (e.target.closest("[data-action='closeSrvModal']")) closeModal();
            if (e.target === modal) closeModal();
        });

        draw();
    }

    // Expose API agar wizard/publik bisa akses data layanan dari file ini
    window.PelayananSurat = {
        KEY,
        SELECTED_KEY,
        Storage,
        getAll,
        saveAll,
    };

    // ---------- HOOK ROUTER ----------
    window.addEventListener("page:loaded", (e) => {
        const name = e.detail?.name || "";

        // Halaman detail layanan
        if (name.startsWith("pelayanan-")) {
            renderPublic(name);
        }

        // Halaman wizard pengajuan online
        if (name === "pengajuan-online") {
            initWizardPage();
        }

        // Halaman admin
        if (name === "admin/pelayanan") {
            initAdmin();
        }
    });


})();

function getOnlineServices() {
    const api = window.PelayananSurat;
    if (!api || !api.getAll) return [];
    return api.getAll().filter((x) => x.tipe === "online");
}

function initWizardPage() {
    const api = window.PelayananSurat;
    if (!api || !api.Storage) return;

    // hanya untuk warga
    if (window.KelurahanGuard?.requireWarga && !window.KelurahanGuard.requireWarga()) return;

    const online = getOnlineServices();
    if (!online.length) return;

    const $ = (id) => document.getElementById(id);
    const session = window.KelurahanGuard?.getSession?.();

    // ui elements
    const cardsWrap = $("wizServiceCards");
    const hiddenSelect = $("wizJenisSurat");
    const serviceNameEl = $("wizServiceName");
    const serviceMetaEl = $("wizServiceMeta");
    const syaratRingkas = $("wizSyaratRingkas");
    const syaratBox = $("wizSyaratBox");
    const uploadType = $("wizUploadType");
    const fileInput = $("wizFile");
    const addFileBtn = $("wizAddFile");
    const fileList = $("wizFileList");
    const fileListWrapper = $("wizFileListWrapper");
    const dropzone = document.querySelector(".upload-dropzone");
    const closeBtn = $("wizClose");

    const prevBtn = $("wizPrev");
    const nextBtn = $("wizNext");
    const submitBtn = $("wizSubmit");

    const panes = document.querySelectorAll(".wizard-pane");
    const steps = document.querySelectorAll(".wizard-step");
    const extraFieldsWrap = $("wizExtraFields");

    // inputs
    const inNama = $("wizNama");
    const inNik = $("wizNik");
    const inTelp = $("wizTelp");
    const inRtRw = $("wizRtRw");
    const inAlamat = $("wizAlamat");
    const inKeperluan = $("wizKeperluan");

    let selectedId = api.Storage.get(api.SELECTED_KEY, online[0].id);
    let currentStep = 1;
    const maxStep = 3;

    const uploadedItems = []; // { requirement, fileName, mime, size, dataUrl? }

    const escapeHtml = (str) =>
        String(str || "").replace(/[&<>\"]/g, (ch) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])
        );

    const parseRtRw = (val) => {
        const raw = String(val || "");
        const m = raw.match(/(\d{1,3})\s*\/?\s*(\d{1,3})/);
        if (!m) return { rt: (session?.rt || "").replace(/\D/g, ""), rw: (session?.rw || "").replace(/\D/g, "") };
        return { rt: m[1], rw: m[2] };
    };

    function getSelected() {
        let item = online.find((x) => x.id === selectedId);
        if (!item) {
            item = online[0];
            selectedId = item.id;
            api.Storage.set(api.SELECTED_KEY, selectedId);
        }
        return item;
    }

    function renderHiddenSelect() {
        if (!hiddenSelect) return;
        hiddenSelect.innerHTML = online.map((x) => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.nama)}</option>`).join("");
        hiddenSelect.value = selectedId;
    }

    function renderServiceCards() {
        if (!cardsWrap) return;
        cardsWrap.innerHTML = online
            .map((x) => {
                const isActive = x.id === selectedId;
                return `
          <div class="choice-card ${isActive ? "active" : ""}" role="button" tabindex="0" data-action="pickService" data-id="${escapeHtml(x.id)}">
            <div class="choice-text">
              <div class="choice-title">${escapeHtml(x.nama)}</div>
              <div class="choice-meta">Estimasi: ${escapeHtml(x.estimasi || "-")}</div>
            </div>
            <div class="choice-icon">
              <i class="fa-solid ${isActive ? "fa-circle-check" : "fa-circle"}"></i>
            </div>
          </div>`;
            })
            .join("");
    }

    function renderSyarat(layanan) {
        if (serviceNameEl) serviceNameEl.textContent = layanan.nama || "-";
        if (serviceMetaEl) {
            const parts = [];
            if (layanan.estimasi) parts.push(`Estimasi: ${layanan.estimasi}`);
            if (layanan.biaya) parts.push(`Biaya: ${layanan.biaya}`);
            serviceMetaEl.textContent = parts.join(" • ") || "";
        }

        if (syaratRingkas) {
            const list = (layanan.syarat || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
            syaratRingkas.innerHTML = list || "<li>-</li>";
        }
        if (syaratBox) {
            const list = (layanan.syarat || [])
                .map(
                    (s) => `
          <li>
            <i class="fa-solid fa-check"></i>
            <span>${escapeHtml(s)}</span>
          </li>`
                )
                .join("");
            syaratBox.innerHTML = list || "<li>-</li>";
        }
    }

    function renderUploadTypes(layanan) {
        if (!uploadType) return;
        const list = (layanan.syarat || [])
            .map((s, idx) => `<option value="${idx}">${escapeHtml(s)}</option>`)
            .join("");
        uploadType.innerHTML = list || '<option value="">Pilih tipe berkas</option>';
    }

    function renderExtraFields(layanan) {
        if (!extraFieldsWrap) return;
        const fields = Array.isArray(layanan.formFields) ? layanan.formFields : [];
        if (!fields.length) {
            extraFieldsWrap.innerHTML = "";
            return;
        }

        extraFieldsWrap.innerHTML = fields
            .map((f) => {
                const id = `wizExtra_${escapeHtml(f.key)}`;
                const label = escapeHtml(f.label || "");
                const req = f.required ? "required" : "";
                const mark = f.required ? " <span style=\"color:var(--danger)\">*</span>" : "";
                if (f.type === "textarea") {
                    return `
          <div class="field">
            <label for="${id}">${label}${mark}</label>
            <textarea id="${id}" class="input" rows="2" data-extra-key="${escapeHtml(f.key)}" ${req}></textarea>
          </div>`;
                }
                if (f.type === "select") {
                    const opts = (Array.isArray(f.options) ? f.options : [])
                        .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
                        .join("");
                    return `
          <div class="field">
            <label for="${id}">${label}${mark}</label>
            <select id="${id}" class="input" data-extra-key="${escapeHtml(f.key)}" ${req}>
              <option value="">Pilih...</option>
              ${opts}
            </select>
          </div>`;
                }
                const typeMap = { number: "number", date: "date" };
                const type = typeMap[f.type] || "text";
                return `
        <div class="field">
          <label for="${id}">${label}${mark}</label>
          <input id="${id}" class="input" type="${type}" data-extra-key="${escapeHtml(f.key)}" ${req} />
        </div>`;
            })
            .join("");
    }

    function refreshForSelected() {
        const layanan = getSelected();
        renderHiddenSelect();
        renderServiceCards();
        renderSyarat(layanan);
        renderUploadTypes(layanan);
        renderExtraFields(layanan);
    }

    function goStep(step) {
        currentStep = Math.min(Math.max(step, 1), maxStep);

        panes.forEach((pane) => {
            pane.classList.toggle("is-active", Number(pane.dataset.step) === currentStep);
        });
        steps.forEach((st) => {
            const s = Number(st.dataset.step);
            st.classList.toggle("is-active", s === currentStep);
            st.classList.toggle("is-done", s < currentStep);
        });

        if (prevBtn) prevBtn.disabled = currentStep === 1;
        if (nextBtn) nextBtn.style.display = currentStep === 3 ? "none" : "inline-flex";
        if (submitBtn) submitBtn.style.display = currentStep === 3 ? "inline-flex" : "none";
    }

    function redrawFileList() {
        if (!fileList || !fileListWrapper) return;
        if (!uploadedItems.length) {
            fileListWrapper.style.display = "none";
            fileList.innerHTML = "";
            return;
        }
        fileListWrapper.style.display = "block";
        fileList.innerHTML = uploadedItems
            .map(
                (item, idx) => `
        <li>
          <span class="file-type">${escapeHtml(item.requirement || "Berkas")}</span>
          <span class="file-name">${escapeHtml(item.fileName || "-")}</span>
          <button class="icon-btn" type="button" data-action="delUpload" data-idx="${idx}" title="Hapus" style="margin-left:auto">
            <i class="fa-solid fa-trash"></i>
          </button>
        </li>`
            )
            .join("");
    }

    function validateStep2() {
        const required = [
            { el: inNama, label: "Nama Lengkap" },
            { el: inNik, label: "NIK" },
            { el: inTelp, label: "No. Telepon" },
            { el: inRtRw, label: "RT / RW" },
            { el: inAlamat, label: "Alamat" },
            { el: inKeperluan, label: "Keperluan Surat" },
        ];
        for (const r of required) {
            if (r.el && !r.el.value.trim()) {
                alert(`${r.label} wajib diisi.`);
                r.el.focus();
                return false;
            }
        }
        // validasi extra fields yang wajib
        if (extraFieldsWrap) {
            const reqExtra = Array.from(extraFieldsWrap.querySelectorAll("[required]"));
            for (const el of reqExtra) {
                if (!String(el.value || "").trim()) {
                    alert("Ada field tambahan yang wajib diisi.");
                    el.focus();
                    return false;
                }
            }
        }
        return true;
    }

    function validateStep3() {
        if (!uploadedItems.length) {
            alert("Upload minimal 1 berkas persyaratan.");
            return false;
        }
        return true;
    }

    // ---------- INIT ----------
    // prefill
    if (inNama && session?.name) inNama.value = session.name;
    if (inRtRw && (session?.rt || session?.rw)) {
        const rt = String(session?.rt || "").replace(/\D/g, "");
        const rw = String(session?.rw || "").replace(/\D/g, "");
        if (rt || rw) inRtRw.value = `${rt || ""} / ${rw || ""}`.trim();
    }

    refreshForSelected();
    goStep(1);

    // choose service
    cardsWrap?.addEventListener("click", (e) => {
        const card = e.target.closest("[data-action='pickService']");
        if (!card) return;
        selectedId = card.dataset.id;
        api.Storage.set(api.SELECTED_KEY, selectedId);
        refreshForSelected();
    });

    // fallback: hidden select (kalau ada)
    hiddenSelect?.addEventListener("change", () => {
        selectedId = hiddenSelect.value;
        api.Storage.set(api.SELECTED_KEY, selectedId);
        refreshForSelected();
    });

    prevBtn?.addEventListener("click", () => goStep(currentStep - 1));
    nextBtn?.addEventListener("click", () => {
        if (currentStep === 1) {
            goStep(2);
            return;
        }
        if (currentStep === 2) {
            if (!validateStep2()) return;
            goStep(3);
        }
    });

    closeBtn?.addEventListener("click", () => {
        window.KelurahanApp?.navigateTo?.("warga/surat");
    });

    // upload
    if (dropzone && fileInput) dropzone.addEventListener("click", () => fileInput.click());

    addFileBtn?.addEventListener("click", async () => {
        if (!fileInput?.files || !fileInput.files.length) {
            alert("Pilih file terlebih dahulu.");
            return;
        }
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran file maksimal 5MB.");
            return;
        }
        const layanan = getSelected();
        const idx = uploadType?.value ?? "";
        const requirement = (layanan.syarat && layanan.syarat[idx]) || "Berkas Persyaratan";

        const item = {
            requirement,
            fileName: file.name,
            mime: file.type,
            size: file.size,
        };

        // Simpan dataUrl hanya untuk file kecil (demo)
        if (file.size <= 200 * 1024) {
            item.dataUrl = await new Promise((res) => {
                const reader = new FileReader();
                reader.onload = () => res(String(reader.result || ""));
                reader.onerror = () => res("");
                reader.readAsDataURL(file);
            });
        }

        uploadedItems.push(item);
        fileInput.value = "";
        redrawFileList();
    });

    fileListWrapper?.addEventListener("click", (e) => {
        const del = e.target.closest("[data-action='delUpload']");
        if (!del) return;
        const idx = Number(del.dataset.idx);
        uploadedItems.splice(idx, 1);
        redrawFileList();
    });

    submitBtn?.addEventListener("click", () => {
        if (!validateStep2()) {
            goStep(2);
            return;
        }
        if (!validateStep3()) return;

        const layanan = getSelected();
        const { rt, rw } = parseRtRw(inRtRw?.value);
        const extra = {};
        extraFieldsWrap?.querySelectorAll("[data-extra-key]").forEach((el) => {
            extra[el.dataset.extraKey] = String(el.value || "").trim();
        });

        const now = new Date();
        const record = {
            id: `SR-${now.getTime()}`,
            jenis: layanan.nama,
            layananId: layanan.id,
            page: layanan.page,
            estimasi: layanan.estimasi,
            biaya: layanan.biaya,
            tanggal: now.toISOString().slice(0, 10),
            status: "menunggu",

            email: session?.email || "",
            nama: inNama?.value?.trim() || session?.name || "",
            nik: inNik?.value?.trim() || "",
            telp: inTelp?.value?.trim() || "",
            rt,
            rw,
            alamat: inAlamat?.value?.trim() || "",
            keperluan: inKeperluan?.value?.trim() || "",

            extra,
            berkas: uploadedItems,
            berkasUrl: uploadedItems.length ? `${uploadedItems.length} berkas` : "-",
            catatan: "",
        };

        const key = "surat";
        const all = JSON.parse(localStorage.getItem(key) || "[]");
        all.unshift(record);
        localStorage.setItem(key, JSON.stringify(all));

        alert(`Pengajuan untuk "${layanan.nama}" berhasil dikirim.`);
        window.KelurahanApp?.navigateTo?.("warga/surat");
    });
}
