// assets/js/core/auth.js
(function () {
  // ==============================
  // AUTH STORAGE (frontend demo)
  // - simpan akun di localStorage agar bisa dipakai oleh:
  //   login / register / forgot password / reset password
  // ==============================

  const DEFAULT_ACCOUNTS = [
    {
      role: "admin",
      username: "admin",
      email: "admin@kelurahan.id",
      password: "AdminKelurahan@2025!",
      name: "Admin Kelurahan",
    },
    {
      role: "staf",
      username: "staf",
      email: "staf@kelurahan.id",
      password: "Staf123!",
      name: "Staf Pelayanan",
    },
    {
      role: "warga",
      username: "warga",
      email: "warga@email.com",
      password: "Warga123!",
      name: "Budi Santoso",
      rt: "01",
      rw: "02",
    },
  ];

  const PREFIX = "kelurahan.";
  const KEY_USERS = "authUsers";
  const KEY_RESET = "resetTokens";

  const S = (() => {
    // pakai KelurahanStore kalau ada, fallback ke localStorage langsung
    if (window.KelurahanStore?.Storage) {
      return {
        get: (k, fb) => window.KelurahanStore.Storage.get(k, fb),
        set: (k, v) => window.KelurahanStore.Storage.set(k, v),
        del: (k) => window.KelurahanStore.Storage.del(k),
      };
    }
    return {
      get: (k, fb) => {
        try {
          const raw = localStorage.getItem(PREFIX + k);
          return raw ? JSON.parse(raw) : fb;
        } catch (_) {
          return fb;
        }
      },
      set: (k, v) => localStorage.setItem(PREFIX + k, JSON.stringify(v)),
      del: (k) => localStorage.removeItem(PREFIX + k),
    };
  })();

  const uid = () => {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  };

  function seedAuthUsersOnce() {
    const existing = S.get(KEY_USERS, null);
    if (Array.isArray(existing) && existing.length) return;
    S.set(KEY_USERS, DEFAULT_ACCOUNTS.map((u) => ({ id: uid(), ...u })));
  }

  function getAuthUsers() {
    seedAuthUsersOnce();
    return S.get(KEY_USERS, []);
  }

  function saveAuthUsers(users) {
    S.set(KEY_USERS, Array.isArray(users) ? users : []);
  }

  function findUser(loginText) {
    const t = String(loginText || "").trim().toLowerCase();
    if (!t) return null;
    const users = getAuthUsers();
    return (
      users.find((u) => String(u.email || "").toLowerCase() === t) ||
      users.find((u) => String(u.username || "").toLowerCase() === t)
    );
  }

  function setResetToken(email) {
    const token = ("" + uid()).replace(/-/g, "").slice(0, 10).toUpperCase();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const data = S.get(KEY_RESET, {});
    data[token] = { email: String(email || "").toLowerCase(), expiresAt };
    S.set(KEY_RESET, data);
    sessionStorage.setItem("resetToken", token);
    return token;
  }

  function consumeResetToken(token) {
    const t = String(token || "").trim().toUpperCase();
    if (!t) return null;
    const data = S.get(KEY_RESET, {});
    const rec = data[t];
    if (!rec) return null;
    if (rec.expiresAt && Date.now() > rec.expiresAt) {
      delete data[t];
      S.set(KEY_RESET, data);
      return null;
    }
    delete data[t];
    S.set(KEY_RESET, data);
    return rec;
  }

  function setSession(user) {
    sessionStorage.setItem("role", user.role);
    sessionStorage.setItem("userName", user.name || "");
    sessionStorage.setItem("userEmail", user.email || "");
    if (user.rt) sessionStorage.setItem("rt", user.rt);
    if (user.rw) sessionStorage.setItem("rw", user.rw);
  }

  function clearSession() {
    sessionStorage.clear();
  }

  // ==============================
  // LOGIN
  // ==============================
  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form || form.id !== "loginForm") return;

    e.preventDefault();

    const email = (document.getElementById("loginEmail")?.value || "").trim();
    const password = document.getElementById("loginPassword")?.value || "";

    const u = findUser(email);
    const user = u && u.password === password ? u : null;

    if (!user) {
      const err = document.getElementById("loginError");
      if (err) err.style.display = "block";
      else alert("Email / password salah.");
      return;
    }

    setSession(user);

    // redirect role
    if (typeof window.navigateTo === "function") {
      if (user.role === "admin") window.navigateTo("admin/dashboard");
      else if (user.role === "staf") window.navigateTo("staf/dashboard");
      else window.navigateTo("warga/dashboard");
    } else {
      // fallback kalau router belum ada
      if (user.role === "admin") window.location.hash = "#admin/dashboard";
      else if (user.role === "staf") window.location.hash = "#staf/dashboard";
      else window.location.hash = "#warga/dashboard";
    }
  });

  // ==============================
  // REGISTER (warga)
  // ==============================
  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form || form.id !== "registerForm") return;
    e.preventDefault();

    const name = (document.getElementById("regName")?.value || "").trim();
    const nik = (document.getElementById("regNik")?.value || "").trim();
    const email = (document.getElementById("regEmail")?.value || "").trim().toLowerCase();
    const telp = (document.getElementById("regTelp")?.value || "").trim();
    const alamat = (document.getElementById("regAlamat")?.value || "").trim();
    const rt = (document.getElementById("regRt")?.value || "").trim();
    const rw = (document.getElementById("regRw")?.value || "").trim();
    const pass = document.getElementById("regPass")?.value || "";
    const pass2 = document.getElementById("regPass2")?.value || "";

    if (!name || !nik || !email || !telp || !alamat || !rt || !rw || !pass) {
      alert("Mohon lengkapi seluruh data yang wajib diisi.");
      return;
    }
    if (String(nik).length !== 16) {
      alert("NIK harus 16 digit.");
      return;
    }
    if (pass.length < 8) {
      alert("Password minimal 8 karakter.");
      return;
    }
    if (pass !== pass2) {
      alert("Konfirmasi password tidak sesuai.");
      return;
    }

    const users = getAuthUsers();
    if (users.some((u) => String(u.email || "").toLowerCase() === email)) {
      alert("Email sudah terdaftar. Silakan gunakan email lain atau login.");
      return;
    }

    users.unshift({
      id: uid(),
      role: "warga",
      username: email.split("@")[0],
      email,
      password: pass,
      name,
      nik,
      telp,
      alamat,
      rt,
      rw,
    });

    saveAuthUsers(users);
    alert("Pendaftaran berhasil. Silakan login menggunakan email dan password Anda.");
    if (typeof window.navigateTo === "function") window.navigateTo("login");
    else window.location.hash = "#login";
  });

  // ==============================
  // FORGOT PASSWORD
  // ==============================
  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form || form.id !== "forgotPasswordForm") return;
    e.preventDefault();

    const email = (document.getElementById("forgotEmail")?.value || "").trim().toLowerCase();
    // Untuk keamanan, tetap tampilkan pesan yang sama walaupun email tidak terdaftar.
    const user = findUser(email);
    if (user) {
      setResetToken(email);
    } else {
      // tetap set token dummy agar demo bisa lanjut, tapi tidak mengubah user.
      setResetToken(email);
    }

    const box = document.getElementById("forgotInfo");
    if (box) box.style.display = "block";
    alert("Jika email terdaftar, tautan reset password telah dikirim. Silakan periksa kotak masuk Anda.");
  });

  // ==============================
  // RESET PASSWORD
  // ==============================
  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form || form.id !== "resetPasswordForm") return;
    e.preventDefault();

    const tokenInput = (document.getElementById("resetToken")?.value || "").trim().toUpperCase();
    const token = tokenInput || (sessionStorage.getItem("resetToken") || "").trim().toUpperCase();
    const pass = document.getElementById("newPassword")?.value || "";
    const pass2 = document.getElementById("confirmPassword")?.value || "";

    const err = document.getElementById("resetError");
    const ok = document.getElementById("resetOk");
    if (err) err.style.display = "none";
    if (ok) ok.style.display = "none";

    if (!token) {
      if (err) err.style.display = "block";
      else alert("Token reset tidak ditemukan.");
      return;
    }
    if (pass.length < 8) {
      alert("Password minimal 8 karakter.");
      return;
    }
    if (pass !== pass2) {
      alert("Konfirmasi password tidak sesuai.");
      return;
    }

    const rec = consumeResetToken(token);
    if (!rec || !rec.email) {
      if (err) err.style.display = "block";
      else alert("Token reset tidak valid atau sudah kedaluwarsa.");
      return;
    }

    const users = getAuthUsers();
    const idx = users.findIndex((u) => String(u.email || "").toLowerCase() === String(rec.email).toLowerCase());
    if (idx < 0) {
      // akun tidak ditemukan (demo) -> tetap tampilkan sukses agar UX rapi
      if (ok) ok.style.display = "block";
      alert("Password berhasil diperbarui. Silakan login kembali.");
      return;
    }

    users[idx].password = pass;
    saveAuthUsers(users);
    sessionStorage.removeItem("resetToken");
    if (ok) ok.style.display = "block";
    alert("Password berhasil diperbarui. Silakan login kembali.");
  });

  // logout (dukungan 2 atribut biar fleksibel)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action='logout'], [data-logout='true']");
    if (!btn) return;

    e.preventDefault();
    clearSession();

    if (typeof window.navigateTo === "function") window.navigateTo("home");
    else window.location.hash = "#home";
  });

  // Prefill token di halaman reset-password (UX)
  window.addEventListener("page:loaded", (ev) => {
    const name = ev?.detail?.name || "";
    if (name !== "reset-password") return;
    const token = sessionStorage.getItem("resetToken") || "";
    const input = document.getElementById("resetToken");
    if (input && token && !input.value) input.value = token;
  });

  window.__auth = { clearSession };
})();
