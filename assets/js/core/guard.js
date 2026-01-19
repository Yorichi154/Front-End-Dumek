// assets/js/core/guard.js
// Guard & session helper untuk SPA Kelurahan

(function () {
  function getSession() {
    const role = sessionStorage.getItem("role") || "";
    const name = sessionStorage.getItem("userName") || sessionStorage.getItem("name") || "";
    const email = sessionStorage.getItem("userEmail") || "";
    const rt = sessionStorage.getItem("rt") || "";
    const rw = sessionStorage.getItem("rw") || "";

    if (!role) return null;
    return { role, name, email, rt, rw };
  }

  function isLoggedIn() {
    return !!sessionStorage.getItem("role");
  }

  function requireRole(role, redirectPage = "login") {
    const s = getSession();
    if (!s || s.role !== role) {
      if (typeof window.navigateTo === "function") window.navigateTo(redirectPage, { replace: true });
      else window.location.hash = `#${redirectPage}`;
      return false;
    }
    return true;
  }

  // helpers spesifik
  const requireAdmin = () => requireRole("admin");
  const requireStaf = () => requireRole("staf");
  const requireWarga = () => requireRole("warga");

  window.KelurahanGuard = {
    getSession,
    isLoggedIn,
    requireRole,
    requireAdmin,
    requireStaf,
    requireWarga,
  };
})();
