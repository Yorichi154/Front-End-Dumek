// assets/js/core/auth.js
(function () {
  // DEMO akun (sementara)
  const ACCOUNTS = [
    { role: "admin", email: "admin@kelurahan.id", password: "AdminKelurahan@2025!", name: "Admin Kelurahan" },
    { role: "staf",  email: "staf@kelurahan.id",  password: "Staf123!",             name: "Staf Pelayanan" },
    { role: "warga", email: "warga@email.com",    password: "Warga123!",            name: "Budi Santoso", rt: "01", rw: "02" },
  ];

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

  // submit login (event delegation karena page login di-load dinamis)
  document.addEventListener("submit", function (e) {
    const form = e.target;
    if (!form || form.id !== "loginForm") return;

    e.preventDefault();

    const email = (document.getElementById("loginEmail")?.value || "").trim();
    const password = document.getElementById("loginPassword")?.value || "";

    const user = ACCOUNTS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      alert("Email / password salah.");
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

  // logout (dukungan 2 atribut biar fleksibel)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action='logout'], [data-logout='true']");
    if (!btn) return;

    e.preventDefault();
    clearSession();

    if (typeof window.navigateTo === "function") window.navigateTo("home");
    else window.location.hash = "#home";
  });

  window.__auth = { clearSession };
})();
