/* =========================================================
   store.js
   - wrapper localStorage (JSON)
   - seed data demo
   - CRUD helper
========================================================= */

(function () {
  const PREFIX = "kelurahan.";

  const Storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    },
    del(key) {
      localStorage.removeItem(PREFIX + key);
    },
  };

  const uid = () => {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  };

  const nowISO = () => new Date().toISOString().slice(0, 10);

  const Data = {
    list(type) {
      return Storage.get(type, []);
    },
    get(type, id) {
      return Data.list(type).find((x) => x.id === id) || null;
    },
    upsert(type, item) {
      const items = Data.list(type);
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.unshift(item);
      Storage.set(type, items);
      return item;
    },
    remove(type, id) {
      const items = Data.list(type).filter((x) => x.id !== id);
      Storage.set(type, items);
    },
    settings() {
      return Storage.get("settings", {
        siteName: "Kelurahan Duren Mekar",
        email: "info@kelurahandurenmekar.go.id",
        phone: "(021) 1234-5678",
        address: "Jl. Duren Mekar No.59, Bojongsari, Kota Depok",
        instagram: "@kelurahandurenmekar",
        note: "Website resmi Kelurahan Duren Mekar.",
        lurahName: "",
        kecamatan: "Bojongsari",
        kota: "Kota Depok",
        provinsi: "Jawa Barat",
        kodepos: "16517",
        profil: "",
        maps: "",
        jamPelayanan: "",

      });
    },
    saveSettings(s) {
      Storage.set("settings", s);
    },
  };

  // Seed demo data (hanya kalau kosong)
  function seedOnce() {
    const seeded = Storage.get("seeded", false);
    if (seeded) return;

    // Default users
    Storage.set("users", [
      {
        id: uid(),
        role: "admin",
        username: "admin",
        email: "admin@demo.local",
        password: "admin123",
        name: "Administrator",
      },
    ]);

    // Berita
    Storage.set("berita", [
      {
        id: uid(),
        title: "Peluncuran Aplikasi Pelayanan Online",
        category: "Layanan",
        date: nowISO(),
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60",
        excerpt:
          "Kelurahan meluncurkan layanan online untuk mempermudah warga mengurus administrasi.",
        content:
          "Mulai hari ini, warga dapat mengakses layanan administrasi melalui portal kelurahan. Silakan login dan pilih layanan yang dibutuhkan.",
        status: "published",
      },
      {
        id: uid(),
        title: "Gotong Royong Bersama Warga RT/RW",
        category: "Kegiatan",
        date: nowISO(),
        image:
          "https://images.unsplash.com/photo-1503418895522-46f9805280a7?auto=format&fit=crop&w=1200&q=60",
        excerpt: "Kegiatan gotong royong membersihkan lingkungan bersama warga.",
        content:
          "Kegiatan gotong royong dilaksanakan untuk menjaga kebersihan dan kenyamanan lingkungan.",
        status: "published",
      },
      {
        id: uid(),
        title: "Posyandu Balita Bulan Desember",
        category: "Kesehatan",
        date: nowISO(),
        image:
          "https://images.unsplash.com/photo-1580281658628-6f1b967c0d62?auto=format&fit=crop&w=1200&q=60",
        excerpt: "Jadwal posyandu balita bulan Desember di aula kelurahan.",
        content:
          "Warga diimbau membawa KMS dan mengikuti jadwal yang telah ditentukan untuk pelayanan kesehatan balita.",
        status: "published",
      },
    ]);

    // Agenda
    Storage.set("agenda", [
      {
        id: uid(),
        title: "Rapat Koordinasi RT/RW",
        date: nowISO(),
        time: "09:00",
        location: "Aula Kelurahan",
        content: "Pembahasan program kerja dan koordinasi kegiatan warga.",
      },
      {
        id: uid(),
        title: "Vaksinasi Lansia",
        date: nowISO(),
        time: "08:00",
        location: "Puskesmas",
        content: "Layanan vaksinasi untuk lansia, bawa KTP dan kartu BPJS.",
      },
      {
        id: uid(),
        title: "Pelatihan UMKM",
        date: nowISO(),
        time: "13:00",
        location: "Aula Kelurahan",
        content: "Pelatihan pemasaran digital untuk pelaku UMKM lokal.",
      },
    ]);

    // Galeri
    Storage.set("galeri", [
      {
        id: uid(),
        title: "Kegiatan Gotong Royong",
        category: "Kegiatan",
        date: nowISO(),
        image:
          "https://images.unsplash.com/photo-1520975922284-9a3f7c4d3f98?auto=format&fit=crop&w=1200&q=60",
        content: "Dokumentasi gotong royong membersihkan lingkungan.",
      },
      {
        id: uid(),
        title: "Pelayanan Warga",
        category: "Layanan",
        date: nowISO(),
        image:
          "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1200&q=60",
        content: "Pelayanan administrasi di kantor kelurahan.",
      },
      {
        id: uid(),
        title: "Kegiatan Posyandu",
        category: "Kesehatan",
        date: nowISO(),
        image:
          "https://images.unsplash.com/photo-1580281658628-6f1b967c0d62?auto=format&fit=crop&w=1200&q=60",
        content: "Pelayanan kesehatan ibu dan anak.",
      },
    ]);

    // Pengumuman
    Storage.set("pengumuman", [
      {
        id: uid(),
        title: "Jam Pelayanan Akhir Tahun",
        date: nowISO(),
        status: "info",
        content:
          "Jam pelayanan akan menyesuaikan pada periode akhir tahun. Silakan cek agenda untuk jadwal terbaru.",
      },
      {
        id: uid(),
        title: "Pemberitahuan Pemadaman Listrik",
        date: nowISO(),
        status: "urgent",
        content:
          "Akan ada pemadaman listrik terjadwal di beberapa wilayah. Mohon persiapkan kebutuhan seperlunya.",
      },
    ]);

    Storage.set("seeded", true);
  }

  seedOnce();

  // Expose global
  window.KelurahanStore = {
    Storage,
    Data,
    uid,
  };
})();
// ==== Helper data Pengumuman (sharing via localStorage) ====
const PENGUMUMAN_STORAGE_KEY = "kelurahan_pengumuman";

function loadPengumuman() {
  try {
    const raw = localStorage.getItem(PENGUMUMAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Gagal parse pengumuman:", e);
    return [];
  }
}

function savePengumuman(list) {
  localStorage.setItem(PENGUMUMAN_STORAGE_KEY, JSON.stringify(list));
}
